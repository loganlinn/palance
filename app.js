var app = require('http').createServer(serverHandler),
	io = require('socket.io').listen(app),
	mime = require('mime'),
	fs = require('fs'),
	_  = require('underscore'),
	pg = require('pg');



var url_whitelist = [
	'/css/style.css',
	'/js/palance.js',
	'/index.html',
];
var url_blacklist = [
	'/favicon.ico'
];
var default_url = '/index.html';

function serverHandler (req, res) {

	if (_.contains(url_blacklist, req.url)) {
		res.writeHead(404);
		return res.end('');
	}

	var file_name = _.include(url_whitelist, req.url) ? req.url : default_url;

	fs.readFile( __dirname + '/public' + file_name, function (err, data) {
		if (err) {
			res.writeHead(400);
			return res.end('Failed to load index');
		}

		res.writeHead(200, {
			'Content-Length': data.length,
			'Content-Type':   mime.lookup(file_name)
		});
		return res.end(data);
	});
}


io.sockets.on('connection', function (socket) {
	//var client;
	var client = new pg.Client("tcp://postgres:5432@higashi.huddlereast.com/logan_greenhome");
	client.connect();

	socket.on('dbconnect', function (data) {
		// end existing client if exists
		if (client) {
			client.end();
		}
		
		client = pg.Client(data);

		client.on('error', function (data) {
			socket.emit('connection-error', data);
		});

		client.on('notice', function (data) {
			socket.emit('connection-notice', data);
		});

		client.on('drain', function (data) {
			socket.emit('connection-drain', data);
		});

		socket.on('notification', function (data) {
			socket.emit('client-notification', data);
		});
	});

	socket.on('dbdisconnect', function (data) {
		if (client) {
			client.end();
			client = null;
		}
	});

	socket.on('disconnect', function () {
		client.end();
	});

	socket.on('query', function (data) {
		if (!data.query || !data.id) {
			return;
		}

		var query = client.query(data.query);

		query.on('row', function (row) {
			socket.emit('query-row', {id: data.id, row: row});
		});

		query.on('end', function () {
			socket.emit('query-end', {id: data.id});
		});

		query.on('error', function (error) {
			socket.emit('query-error', {id: data.id, error: error});
		});
	});

	socket.on('status', function (data) {
		socket.emit('status', {client: client});
	});
});

var app_port = 8080;
app.listen(app_port);
console.log("Started on port " + app_port);
