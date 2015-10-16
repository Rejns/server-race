var express = require('express');
var app = require('express')();
var http = require('http');
var server = http.createServer(app);

app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost');
    next();
});

server.listen(3000);

app.get('/', function (client_req, client_res) {
  http.get("http://"+client_req.query.addr, function(res) {
    res.pipe(client_res);
  });
});




