var express = require('express');
var app = express();
var sql = require ('sql.js');
var fs = require('fs');
var http = require('http').Server(app); // start an http server
var io = require('socket.io')(http);
var jsonfile = require('jsonfile');

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', function (req, res)
{
	res.sendFile(__dirname + '/static_files/signin.html');
});

app.use(express.static('static_files'));

var sqliteExists = 1;

//Toggle sqliteExists off if there is no sqLite database. But this should be only done by the admin. 
if(sqliteExists == 0)
{
	var db = new sql.Database();
	sqlstr = "CREATE TABLE data (name char, password char, bday char, job char, email char)";
	db.run(sqlstr);
	db.run("INSERT INTO data VALUES ('alex', 'wong', '12', 'student', 'a@a.com')");
	db.run("INSERT INTO data VALUES ('jin', 'ann', '12', 'student', 'j@j.com')");

	//EXPORT SQLiteDatabase
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

var fs = require('fs');
var obj = JSON.parse(fs.readFileSync(__dirname + '/data.json'));
var printer_data = JSON.parse(fs.readFileSync(__dirname + '/printer.json'));

//Socket IO connection to client: Printer and Table message.
io.on('connection', function(socket)
{
  // when *any* user sends a 'table' to the server, run the inner
  // function below ...
  // (note that this inner function runs only when someone sends a message to
  // the server. if nobody is sending messages, this function never runs)
  socket.on('printer', function(msg)
  {
  	console.log("receive printer message: " + msg);
  	if(msg == 0)
  	{
  		console.log("send message out");
  		io.emit('printer', JSON.stringify(printer_data));
  	}
  	else
  	{
  		if(msg.charAt(0) == '+' || msg.charAt(0) == '-')
  		{
  			//TODO: Now, printer_num is only limited to one digit.
  			var printer_num = msg.charAt(1);
  			for( var i = 0; i < printer_data.features.length; i++) 
			{
				var e = printer_data.features[i];
				if (e.id.toString() == printer_num) 
				{
					console.log("printer to increment: " + printer_num + ": Queue: " + e.queue);

					if(e.queue == 0 && msg.charAt(0) == '-')
						console.log("ERROR. Queue already at 0. Cannot decrease");
					else if(msg.charAt(0) == '+')
						e.queue++;
					else if(msg.charAt(0) == '-')
						e.queue--;
					else
						console.log("Cannot understand input.")

					console.log("Printer Queue changed: " + e.id.toString() + ": Queue: " + e.queue);

				    io.emit('printer', JSON.stringify(printer_data));

				    //Plugin to write file in json format (more neat)
				    var file = __dirname + "/printer.json";
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
  socket.on('table', function(msg)
  {
    // emit (send) the message msg verbatim to ALL BROWSERS
    // that are currently connected to the server at this moment
    console.log("receive table message: " + msg)

	var tableToLookup = msg;
	console.log("input: " + msg);
	if(tableToLookup == 0)
	{
		io.emit('table', JSON.stringify(obj));
	}
	else
	{
		for( var i = 0; i < obj.features.length; i++) 
		{
			var e = obj.features[i];
			if (e.id.toString() == tableToLookup) 
			{
				console.log("table to change: " + tableToLookup + ": Stat: " + e.occupied);

				if (e.occupied == 1) {
					// e.occupied = 0;
					obj.features[i].occupied = 0;
				} 
				else 
				{
					// e.occupied = 1;
					obj.features[i].occupied = 1;
				}

				console.log("table changed: " + e.id.toString() + ": Stat: " + e.occupied);

				//res.send(obj);
			    io.emit('table', JSON.stringify(obj));

			    //Plugin to write file in json format (more neat)
			    var file = __dirname + "/data.json";
			    jsonfile.writeFile(file, obj, {spaces:2}, function(err)
		    	{
		    		console.error(err);
		    	});
			}
		}
	}
  });
});

//CREATE USER
app.post('/users', function(req, res)
{
	var postBody = req.body;
	var myName = postBody.name;

	if(!myName)
	{
		res.send('ERROR');
		return;
	}

	var stmt = db.prepare("SELECT * FROM data WHERE name=:uname", {':uname':myName});
	if(!stmt.step())
	{
		db.run("INSERT INTO data VALUES (:name, :password, :bday, :job, :email)", 
		{':name':postBody.name, ':password':postBody.password, ':bday':postBody.bday,
			':job':postBody.job, ':email':postBody.email});
		//export new data
		var data = db.export();
		var buffer = new Buffer(data);
		fs.writeFileSync("data.sqlite", buffer);

		res.send('OK');
	}
	else
	{
		res.send('ERROR_Username');
		return;
	}
});

//READ LIST OF USER
app.get('/users', function(req, res)
{
	var allUsers = [];
	console.log("1");
	var stmt = db.prepare("SELECT * FROM data");
	console.log("2");
	while (stmt.step())
		allUsers.push(stmt.getAsObject().name);

	res.send(allUsers);
});

//READ SPECIFIC USER
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
	for(key in postBody)
		{
		db.run("UPDATE data SET '" + key + "'='" + postBody[key] + "' WHERE name='"+nameToLookup + "'");
	}
	//export new data
	var data = db.export();
	var buffer = new Buffer(data);
	fs.writeFileSync("data.sqlite", buffer);

	res.send('OK');
	return;
});

//DELETE USER PROFILE
app.delete('/users/*', function (req, res)
{
	var myName = req.params[0];
	db.run("DELETE from data WHERE name=:uname", {':uname':myName});
	//EXPORT
	var data = db.export();
	var buffer = new Buffer(data);
	fs.writeFileSync("data.sqlite", buffer);
	res.send('OK');
});

var server = http.listen(3000, function()
{	
	var port = server.address().port;
	console.log('Server started at http://localhost:%s/', port);
});
