#! /usr/local/bin/node

var http = require('http');
var  url = require('url');
var dice = require('./lib/dice');

var port = 8787;
var contentTypeHeader = {'Content-Type': 'application/json'};

var server = http.createServer(function(request, response) {
    var requestInfo = url.parse(request.url, true);
    var params = requestInfo.query;

    if ( params.dice ){
        var queryArgs = params.dice.split(' ');
        var parsedArgs = queryArgs.map(parseArg).filter(isUsefulArgument);
        var diceArgs = parsedArgs.filter(isDiceArg);
        var stats = dice.getStatsForDice(diceArgs, 0, 1);
        response.writeHead(200, contentTypeHeader);
        response.write( JSON.stringify(stats) );
        response.end();
    }
    else {
        response.writeHead(400, contentTypeHeader);
        response.write( JSON.stringify({"error":"dice query parameter is required"}) );
        response.end();
    }
});
server.listen(port);
console.log('dice service listening on 127.0.0.1:'+port);


function parseArg(arg) {
    var diceSpec = dice.parseDiceFromCommandLine(arg);
    return isDiceArg(diceSpec) ? diceSpec : dice.parseTargetFromCommandLine(arg);
}

function isUsefulArgument(parsedObject) {
    return parsedObject && (isTargetArg(parsedObject) || isDiceArg(parsedObject));
}

function isTargetArg(parsedObject) {
    return !!parsedObject.target;
}

function isDiceArg(parsedObject) {
    return !!parsedObject.number;
}