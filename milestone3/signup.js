var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static('static_files'));

//Default user - so there is something in the database.
var database = [
{name: 'Jin', password: 'Ann'}];

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
});

//READ LIST OF USER
app.get('/users', function(req, res)
{
	var allUsers = [];
	for(var i=0; i<database.length; i++)
	{
		var e = database[i];
		allUsers.push(e.name);
	}

	res.send(allUsers);
});

//READ SPECIFIC USER
app.get('/users/*', function(req, res)
{
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
});

//UPDATE USER PROFILE
app.put('/users/*', function (req, res)
{
	var nameToLookup = req.params[0];
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

});

var server = app.listen(3000, function()
{	
	var port = server.address().port;
	console.log('Server started at http://localhost:%s/', port);
});

