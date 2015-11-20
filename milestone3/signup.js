var express = require('express');
var app = express();
<<<<<<< HEAD
var sql = require ('sql.js');
var fs = require('fs');
=======
>>>>>>> origin/master

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
<<<<<<< HEAD
app.use(express.static('static_files'));

var sqliteExists = 1;

if(sqliteExists == 0)
{
	var db = new sql.Database();
	sqlstr = "CREATE TABLE database (name char, password char, bday char, job char, email char);";
	db.run(sqlstr);

	//EXPORT
	var data = db.export();
	var buffer = new Buffer(data);
	fs.writeFileSync("database.sqlite", buffer);
}
else
{
	//Read database
	var filebuffer = fs.readFileSync('database.sqlite');
	// Load the db
	var db = new sql.Database(filebuffer);
}
=======

app.use(express.static('static_files'));

//Default user - so there is something in the database.
var database = [
{name: 'Jin', password: 'Ann'}];

app.get('/', function (req, res)
{
	res.sendFile(__dirname + '/static_files/signup.html');
});
>>>>>>> origin/master

/*
GET list of users:
curl -X GET http://localhost:3000/users

GET user info: (if alex is username)
curl -X GET http://localhost:3000/users/alex

//CREATE user:
curl -X POST --data "name=alex&password="wong"" http://localhost:3000/users

*/

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

<<<<<<< HEAD
	var stmt = db.prepare("SELECT * FROM database WHERE name=:uname", {':uname':myName});
	if(!stmt.step())
	{
		db.run("INSERT INTO database VALUES (:name, :password, :bday, :job, :email)", 
		{':name':postBody.name, ':password':postBody.password, ':bday':postBody.bday,
			':job':postBody.job, ':email':postBody.email});
		//export new database
		var data = db.export();
		var buffer = new Buffer(data);
		fs.writeFileSync("database.sqlite", buffer);

		res.send('OK');
	}
	else
	{
		res.send('ERROR_Username');
		return;
	}
=======
	for(var i=0; i<database.length; i++)
	{
		var e = database[i];
		if(e.name == myName)
		{
			res.send('ERROR_Username');
			return;
		}
	}

	database.push(postBody);
	res.send('OK');
>>>>>>> origin/master
});

//READ LIST OF USER
app.get('/users', function(req, res)
{
	var allUsers = [];
<<<<<<< HEAD
	
	var stmt = db.prepare("SELECT * FROM database");
	while (stmt.step())
		allUsers.push(stmt.getAsObject().name);
=======
	for(var i=0; i<database.length; i++)
	{
		var e = database[i];
		allUsers.push(e.name);
	}

>>>>>>> origin/master
	res.send(allUsers);
});

//READ SPECIFIC USER
app.get('/users/*', function(req, res)
{
<<<<<<< HEAD
	var stmt = db.prepare("SELECT * FROM database WHERE name=:user");
	var result = stmt.getAsObject({':user':req.params[0]});
	res.send(result);
	return;
=======
	var nameToLookup = req.params[0]; //matches '*' part of /users/*
	for(var i=0; i<database.length; i++)
	{
		var e = database[i];
		if(e.name == nameToLookup)
		{
			res.send(e);
			return;
		}
	}
	res.send('{}');	//failed, so return empty JSON object
>>>>>>> origin/master
});

//UPDATE USER PROFILE
app.put('/users/*', function (req, res)
{
	var nameToLookup = req.params[0];
<<<<<<< HEAD
	var postBody = req.body;
	for(key in postBody)
	{
		db.run("UPDATE database SET '" + key + "'='" + postBody[key] + "' WHERE name='"+nameToLookup + "'");
	}
	//export new database
	var data = db.export();
	var buffer = new Buffer(data);
	fs.writeFileSync("database.sqlite", buffer);

	res.send('OK');
	return;
});

//DELETE USER PROFILE
app.delete('/users/*', function (req, res)
{
	var myName = req.params[0];
	db.run("DELETE from database WHERE name=:uname", {':uname':myName});
	res.send('OK');
=======
	for(var i=0; i<database.length; i++)
	{
		var e = database[i];
		if(e.name == nameToLookup)
		{
			var postBody = req.body;
			for(key in postBody)
			{
				var value = postBody[key];
				e[key] = value;
			}
			res.send('OK');
			return;
		}
	}

	res.send('ERROR');
});


//DELETE USER PROFILE
app.delete('/users/*', function (req, res)
{
	var nameToLookup = req.params[0];
	for (var i=0; i<database.length; i++)
	{
		var e = database[i];
		if (e.name = nameToLookup)
		{
			database.splice(i, 1);
			res.send('OK');
			return;
		}
	}
	res.send('ERROR');

>>>>>>> origin/master
});

var server = app.listen(3000, function()
{	
	var port = server.address().port;
	console.log('Server started at http://localhost:%s/', port);
});

