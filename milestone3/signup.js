var express = require('express');
var app = express();
var sql = require ('sql.js');
var fs = require('fs');

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
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
});

//READ LIST OF USER
app.get('/users', function(req, res)
{
	var allUsers = [];
	
	var stmt = db.prepare("SELECT * FROM database");
	while (stmt.step())
		allUsers.push(stmt.getAsObject().name);
	res.send(allUsers);
});

//READ SPECIFIC USER
app.get('/users/*', function(req, res)
{
	var stmt = db.prepare("SELECT * FROM database WHERE name=:user");
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
});

var server = app.listen(3000, function()
{	
	var port = server.address().port;
	console.log('Server started at http://localhost:%s/', port);
});

