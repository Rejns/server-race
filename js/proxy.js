var express = require('express');
var app = require('express')();
var http = require('http');
var server = http.createServer(app);

app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
});

app.use(express.static(__dirname+'/../'));

app.get('/', function(req, res) {
	res.sendFile(__dirname+'/../index.html');
});

app.get('/proxy', function (client_req, client_res) {
  var now = Date.now();
  var options = { method: 'GET', host: client_req.query.addr, port: 80, path: '/' };
  var req = http.request(options, function(res) {
    var then = Date.now();
    var time = then - now;
    res.on('data', function() {
      res.destroy();
    });
    client_res.send({ time : time });
  });

  req.on('error', function (e) {
    // General error, i.e.
    //  - ECONNRESET - server closed the socket unexpectedly
    //  - ECONNREFUSED - server did not listen
    //  - HPE_INVALID_VERSION
    //  - HPE_INVALID_STATUS
    //  - ... (other HPE_* codes) - server returned garbage
    console.log(e);
    client_res.sendStatus(500);
  });

  req.on('timeout', function () {
    // Timeout happend. Server received request, but not handled it
    // (i.e. doesn't send any response or it took to long).
    // You don't know what happend.
    // It will emit 'error' message as well (with ECONNRESET code).

    console.log('timeout');
    req.abort();
  });

  //set timeout when waiting for response
  req.setTimeout(20000); 
  req.end();
});

server.listen(4000);




