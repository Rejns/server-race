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

  console.log(client_req.query.a);

  var options = {
    hostname: client_req.query.a,
    port: 80,
    path: client_req.url,
    method: 'GET'
  };

  var proxy = http.request(options, function (res) {
    res.pipe(client_res, {
      end: true
    });
  });

  client_req.pipe(proxy, {
    end: true
  });
})




