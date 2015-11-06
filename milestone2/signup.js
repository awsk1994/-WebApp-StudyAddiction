var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static('static_files'));

var database = [
{name: 'Philip', password: 'philip'}];

app.get('/', function (req, res)
{
	res.sendFile(__dirname + '/static_files/signup.html');
});

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
			res.send('ERROR');
			return;
		}
	}

	database.push(postBody);
	res.send('OK');
});

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


var server = app.listen(3000, function()
{
	var port = server.address().port;
	console.log('Server started at http://localhost:%s/', port);
});

