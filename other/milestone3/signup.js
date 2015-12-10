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
	sqlstr = "CREATE TABLE data (name char, password char, bday char, job char, email char)";
	db.run(sqlstr);
	db.run("INSERT INTO data VALUES ('alex', 'wong', '12', 'student', 'a@a.com')");
	db.run("INSERT INTO data VALUES ('jin', 'ann', '12', 'student', 'j@j.com')");

	//EXPORT
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

app.use(express.static('static_files'));

//Default user - so there is something in the data.
//var data = [
//{name: 'Jin', password: 'Ann'}];

app.get('/', function (req, res)
{
	res.sendFile(__dirname + '/static_files/signup.html');
});

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

var server = app.listen(3000, function()
{	
	var port = server.address().port;
	console.log('Server started at http://localhost:%s/', port);
});

