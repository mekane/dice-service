#! /usr/local/bin/node

var http = require('http');
var url = require('url');
var dice = require('./lib/dice');

var port = 8787;
var jasonContentTypeHeader = {'Content-Type': 'application/json'};

var server = http.createServer(function (request, response) {
    var requestInfo = url.parse(request.url, true);
    var params = requestInfo.query;

    var ip = request.connection.remoteAddress;
    console.log(new Date().toISOString() + ' request from ' + ip + ' for ', params);

    if (params.dice) {
        if (params.target)
            sendOddsForTarget(params.dice, params.target, params.modifier, params.precision);
        else
            sendDiceStats(params.dice, params.modifier, params.precision);
    }
    else {
        sendUsage();
    }

    function sendDiceStats(diceParam, modifierParam, precisionParam) {
        var stats = getDiceStatsFromParams(diceParam, modifierParam, precisionParam);
        sendResponse(stats);
    }

    function sendOddsForTarget(diceParam, targetParam, modifierParam, precisionParam) {
        var precision = precisionParam || 1;
        var stats = getDiceStatsFromParams(diceParam, modifierParam, 9);
        var targetConfig = dice.parseTargetFromCommandLine(targetParam);

        var targetRoll = targetConfig.target;

        var message = '';
        var odds = 0;

        if (targetConfig.direction === 'greater') {
            message = 'Odds of rolling higher than ' + targetRoll;
            odds = dice.sumPercentagesGreaterThanRoll(stats, targetRoll).toFixed(precision);
        }
        else if (targetConfig.direction === 'less') {
            message = 'Odds of rolling less than ' + targetRoll;
            odds = dice.sumPercentagesLessThanRoll(stats, targetRoll).toFixed(precision);
        }

        sendResponse({message: message, odds: odds});
    }

    function parseDiceConfigFromParams(diceParam) {
        return diceParam.split(' ').map(parseArg).filter(isDiceArg);
    }

    function getDiceStatsFromParams(diceParam, modifierParam, precisionParam) {
        var diceConfig = parseDiceConfigFromParams(diceParam);
        var modifier = modifierParam || 0;
        var precision = precisionParam || 0;
        return dice.getStatsForDice(diceConfig, modifier, precision);
    }

    function sendResponse(json) {
        response.writeHead(200, jasonContentTypeHeader);
        response.write(JSON.stringify(json));
        response.end();
    }

    function sendUsage() {
        response.writeHead(400, jasonContentTypeHeader);
        response.write(JSON.stringify({
            "error": "query param named dice is required",
            "exampleQueries": [
                "?dice=1d6%201d8",
                "?dice=2d6&modifier=2",
                "?dice=2d6&precision=5",
                "?dice=2d6&target=8"
            ]
        }));
        response.end();
    }
});
server.listen(port);
console.log('dice service listening on 127.0.0.1:' + port);


function parseArg(arg) {
    var diceSpec = dice.parseDiceFromCommandLine(arg);
    return isDiceArg(diceSpec) ? diceSpec : dice.parseTargetFromCommandLine(arg);
}

function isDiceArg(parsedObject) {
    return !!parsedObject.number;
}
