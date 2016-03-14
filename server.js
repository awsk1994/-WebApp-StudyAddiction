
/*
================================
	EXPLANATION
================================
Upon running server.js, one will start a server on a specific port (default is port 3000). 
Client side can access server, and will be re-directed to signin.html (which is in the static_files directory).
Server-client side communication involves a sqlite database for account info, and 2 json files, each containing printer and table information.

PART A: CRUD (Create, Read, Update, Delete) -- Account Info.
Client side (html) will communicate with the server's CRUD to access/edit/delete account info. 

PART B: Socket Communication with Client -- Table and Printer Info.
When accessing map.html (the map interface of the table availability in the library), client and server communicate via the socket.

The client will send a message to the server in two situations:
	 - client changes a data in table and/or printer database
	 - client just connected (eg: a new client logs into map.html): 
	 		 * Since client will not have info of the updated database at this point, it will send a message containing '0', which basically informs the server new client connected. 
	 		 * Server will then emit a message to all client(s) of the most updated database. 

When a client detects a change in the table and/or printer database, it will send a message in the socket.
The server will receive the message from the client(s), and update two sources:
	 - local (table and/or printer) json file; done by overwriting the json file 
	 - other clients; done by sending a message to ALL clients of the new table/printer database.

Programmed by Alex Wong and Jin Chul Ann
*/

// ====== IMPORT node_modules ======
var express = require('express');		// minimal and flexible Node.js web application
var app = express();
var sql = require ('sql.js');			// sql 3-rd party plugin
var fs = require('fs');					// file system module
var http = require('http').Server(app); // start an http server
var io = require('socket.io')(http);
var jsonfile = require('jsonfile');		// read json file 3-rd party plugin


// ====== SETUP ======
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//Load files in directory: static files
app.use(express.static('static_files'));

//Automatically redirect webpage to signin.html.
app.get('/', function (req, res)
{
	res.sendFile(__dirname + '/static_files/signin.html');
});


// ====== PART A: CRUD (Create, Read, Update, Delete) -- Account Info ======
//TODO: Certain functionalities (such as read) may need to be disabled for security reasons.

// SETUP
// If data.sqlite exists, this is toggled on.
// If toggled off, it will create a sqlite database (data.sqlite)
// Reference the if-else statement a few lines below.
var sqliteExists = 1;

//Toggle sqliteExists off if there is no sqLite database. But this should be only done by the admin. 
if(sqliteExists == 0)
{
	//Create table and insert 2 accounts into it.
	var db = new sql.Database();
	sqlstr = "CREATE TABLE data (name char, password char, bday char, job char, email char)";
	db.run(sqlstr);
	db.run("INSERT INTO data VALUES ('alex', 'wong', '12', 'student', 'a@a.com')");
	db.run("INSERT INTO data VALUES ('jin', 'ann', '12', 'student', 'j@j.com')");

	//EXPORT (update) local SQLiteDatabase
	var data = db.export();
	var buffer = new Buffer(data);
	fs.writeFileSync("data.sqlite", buffer);
}
else
{
	//Read data
	var filebuffer = fs.readFileSync('data.sqlite');

	// Load the db
	var db = new sql.Database(filebuffer);
}

// Listen at port 3000.
var server = http.listen(3000, function()
{	
	var port = server.address().port;
	console.log('Server started at http://localhost:%s/', port);
});


// CREATE USER
app.post('/users', function(req, res)
{
	var postBody = req.body;
	var myName = postBody.name;

	if(!myName)
	{
		res.send('ERROR');
		return;
	}

	// In database, search for name = myName.
	var stmt = db.prepare("SELECT * FROM data WHERE name=:uname", {':uname':myName});
	if(!stmt.step())
	{
		//Insert data into the sqlite database (containing account info)
		db.run("INSERT INTO data VALUES (:name, :password, :bday, :job, :email)", 
		{':name':postBody.name, ':password':postBody.password, ':bday':postBody.bday,
			':job':postBody.job, ':email':postBody.email});

		//Export new data (update local sqlite)
		var data = db.export();
		var buffer = new Buffer(data);
		fs.writeFileSync("data.sqlite", buffer);
		res.send('OK');
	}
	else
	{
		//Send Error message.
		res.send('ERROR_Username');
		return;
	}
});

// READ LIST OF USER
app.get('/users', function(req, res)
{
	var allUsers = [];
	var stmt = db.prepare("SELECT * FROM data");
	//Loop through all stmt, and push into allUsers list.
	while (stmt.step())
		allUsers.push(stmt.getAsObject().name);
	res.send(allUsers);
});

// READ SPECIFIC USER
app.get('/users/*', function(req, res)
{
	var stmt = db.prepare("SELECT * FROM data WHERE name=:user");
	var result = stmt.getAsObject({':user':req.params[0]});
	res.send(result);
	return;
});

//UPDATE USER PROFILE
app.put('/users/*', function (req, res)
{
	var nameToLookup = req.params[0];
	var postBody = req.body;

	//Update database.
	for(key in postBody)
	{
		db.run("UPDATE data SET '" + key + "'='" + postBody[key] + "' WHERE name='" + nameToLookup + "'");
	}

	//Export new data
	var data = db.export();
	var buffer = new Buffer(data);
	fs.writeFileSync("data.sqlite", buffer);
	res.send('OK');
	return;
});

// DELETE USER PROFILE
app.delete('/users/*', function (req, res)
{
	var myName = req.params[0];
	db.run("DELETE from data WHERE name=:uname", {':uname':myName});
	
	//Export new data
	var data = db.export();
	var buffer = new Buffer(data);
	fs.writeFileSync("data.sqlite", buffer);
	res.send('OK');
});


// ===== PART B: Socket Communication with Client -- Table and Printer Info =====
/*
	Clients do not talk to each other. Thus, this server receives information from 
	many individual clients, and emits the messages to update the rest of the clients. 
	At the same time, the server has a local copy of the data, and updates the local
	copy as well.
*/

//Read json file synchrously 
//TODO: is this fs redundant?
var fs = require('fs');		// this is used ot read json file

//Read json file (local files)
var table_data = JSON.parse(fs.readFileSync(__dirname + '/data_table.json'));
var printer_data = JSON.parse(fs.readFileSync(__dirname + '/data_printer.json'));

//Socket IO connection to client: Printer and Table message.
io.on('connection', function(socket)
{
  // When any user sends a 'table' to the server, run the inner function below ...
  // (note that this inner function runs only when someone sends a message to
  // the server. if nobody is sending messages, this function never runs)

	//Listen in socket for printer messages.
  socket.on('printer', function(msg)
  {
  	console.log("receive printer message: " + msg);

  	//if msg == 0, then this is the initial message when a new client is initialized.
  	//When this happens, emit a message to all clients to update the data (since the new client will need the update; as it's initial database might be empty). 
  	if(msg == 0)
  	{
  		console.log("Send message out");
  		io.emit('printer', JSON.stringify(printer_data));	//JSON.stringify converts JSON object to a string.
  	}
  	else
  	{
  		// The format of msg is a '+' or '-', followed by the printer id.
  		// +<printer_id> indicates an increment in the printer queue; vice versa for -<printer_id>
  		if(msg.charAt(0) == '+' || msg.charAt(0) == '-')
  		{
  			//TODO: Now, printer_num is only limited to one digit.
  			var printer_num = msg.charAt(1);

  			//TOOD: need to loop through all even after found the table_id?
  			//Loop through printer_data, and find the printer_id. Then change the data (increment/decrement queue).
  			for( var i = 0; i < printer_data.features.length; i++)
			{
				var e = printer_data.features[i];
				if (e.id.toString() == printer_num) 
				{
					console.log("Printer to increment: " + printer_num + ": Queue: " + e.queue);

					if(e.queue == 0 && msg.charAt(0) == '-')
						console.log("ERROR. Queue already at 0. Cannot decrease");
					else if(msg.charAt(0) == '+')
						e.queue++;
					else if(msg.charAt(0) == '-')
						e.queue--;
					else
						console.log("Cannot understand input.")

					console.log("Printer Queue changed: " + e.id.toString() + ": Queue: " + e.queue);

					// Send 'printer' message in socket to notify ALL clients.
				    io.emit('printer', JSON.stringify(printer_data));

				    // Update the file on the server-side; local printer message.
				    var file = __dirname + "/data_printer.json";
				    jsonfile.writeFile(file, printer_data, {spaces:2}, function(err)
			    	{
			    		console.error(err);
			    	});
				}
			}
		}
  		else
  		{
  			//DO NOTHING.
  		}
  	}
  });

	// Listen in socket for 'table' messages.
  socket.on('table', function(msg)
  {
    console.log("Receive table message: " + msg)

	var tableToLookup = msg;
	console.log("input: " + msg);

  	//if msg == 0, then this is the initial message when a new client is initialized.
  	//When this happens, emit a message to all clients to update the data (since the new client will need the update; as it's initial database might be empty). 
	if(tableToLookup == 0)
	{
		io.emit('table', JSON.stringify(table_data));
	}
	else
	{
		//Loop through JSON to find a match in table_id (in our local json file). Then update client and local file.
		for( var i = 0; i < table_data.features.length; i++) 
		{
			var e = table_data.features[i];
			if (e.id.toString() == tableToLookup) 
			{
				console.log("table to change: " + tableToLookup + ": Stat: " + e.occupied);

				if (e.occupied == 1) {
					table_data.features[i].occupied = 0;
				} 
				else 
				{
					table_data.features[i].occupied = 1;
				}

				console.log("table changed: " + e.id.toString() + ": Stat: " + e.occupied);

				// Send table socket message to ALL client to update their table database.
			    io.emit('table', JSON.stringify(table_data));

			    // Update the local json file.
			    var file = __dirname + "/data_table.json";
			    jsonfile.writeFile(file, table_data, {spaces:2}, function(err)
		    	{
		    		console.error(err);
		    	});
			}
		}
	}
  });
});


