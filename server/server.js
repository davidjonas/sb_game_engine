var express = require('express'),
        server = require('http').createServer(),
        io = require('socket.io').listen(server),
        DAL = require('./DAL.js'),
        Player = require('./Player.js'),
        process = require('process'),
        geoutils = require('./GeoUtils.js'),
        players = [],
        drones = [],
        targets = [];
        
var gutils = new geoutils.GeoUtils();
var range = 100; //detection range in meters

var db = new DAL.DAL();
db.getTargets(function (err, targs) {
    if (err || !targs)
    {
        console.log("Error fetching targets from DB.");
    }
    targets = targs;
    log("list of targets aquired: " + targets);
});

//port to listen can be set through command line argument by running 'node server.js [port]' (it defaults to 7080)
var port = (process.argv.length >= 3) ? process.argv[2] : 7080;

//Debugging toggle can also be read on the command line by running node server.js [port] debug
var debug = process.argv.length >= 4 && process.argv[3] == "debug";
function log(str){
    if(debug === true){
        console.log(str);
        if (io.sockets.clients().length > 0)
        {
            io.sockets.emit("debug", {message: str});
        }
    }
};
log("Debug mode activated.");

//Server starting
server.listen(port);
console.log("Server listening on port " + port);

(debug === true) ? io.set('log level', 2) : io.set('log level', 0);

io.sockets.on('connection', function(socket) {
    //User connected through socket
    log("Incomming connection...");
    
    var player = null;
    var registered = false;
    var trip = null;
    
    function register(nickname)
    {
        player = new Player.Player(nickname);
        player.setSocket(socket.id);
        log("Created player: " + player.nickname);
        db.storePlayer(player, function (err, saved)
                        {
                            if (err || !saved)
                            {
                                socket.emit('registerError', err);
                                console.log("Error saving player to database: "+err);
                            }
                            else
                            {
                                player.setId(saved["_id"]);
                                socket.emit('registerSuccess', formatPlayer(player));
                                log("Assigned player id: " + player.getId());
                                players.push(player);
                                registered = true;
                                log("registered new player. Players are: " + players.toString());
                                io.sockets.emit("playerJoined", formatPlayer(player));
                            }
                        });       
    }
    
    socket.on('register', function(data) {
        if (data)
        {
            register(data["nickname"]);
        }
        else
        {
            register("Guest"+players.length);
        }
    });
    
    socket.on('listTargets', function ()
    {
                    socket.emit('listTargets', {targets: targets});
    });
    
    socket.on('addTarget', function(data) {
                    var target=data;
                    targets.push(data);
                    db.addTarget(data);
                    io.sockets.emit("targetAdded", data);
    });
    
    socket.on('removeTarget', function (data) {
        log("removing target "+ data.target.value)
        db.removeTarget(data.target);
        for (var i in targets)
        {
            if (targets[i].value == data.target.value && targets[i].location.lat == data.target.location.lat && targets[i].location.lng == data.target.location.lng)
            {
                log("found the target on the list. deleting.")
                targets.splice(i, 1);
            }
        }
        log("Emitting remove broadcast");
        io.sockets.emit('targetRemoved', data.target);
    });
    
    socket.on('recordTrip', function(data){
        if (data.hasOwnProperty("tripId"))
        {
            log("Recording trip" + data["tripId"]);
            db.getTrip(data["tripId"], function (err, steps) {
                //Checking if the trip already exists. only record if it doesn't
                if(!err && steps.length === 0)
                {
                    trip = data["tripId"];
                    socket.emit('recordTrip_success');
                    log("Recording trip: " + trip);
                }
                else
                {
                    socket.emit('recordTrip_error');
                    log("Error checking if tripId is unique. Check the database access.")
                }
            });
        }
        else
        {
            socket.emit('recordTrip_error');
        }
    });
    
    socket.on("replayTrip",function (data){
        var tripId = data["tripId"];
        var speed = data.hasOwnProperty('speed') ? data['speed'] : 1;
        db.getTrip(tripId, function (err, steps){
            if (err || steps.length == 0)
            {
                log("Unknown trip " + tripId +" or no steps recorded");
                socket.emit('replayTrip_error');
            }
            else
            {
                socket.emit('replayTrip_success');
                replayTrip(steps, speed);
            }
        });
    });
    
    socket.on("listTrips", function(data){
        log("List trips request arrived.");
        var trips = db.listTrips(function (err, trips) {
            log("Sending list of trips: " + trips);
            socket.emit("listTrips", {trips: trips});
        });  
    });
    
    socket.on('getPlayers', function(data){
        log('Request for player listing came in.');
        list = []
        for(var p in players)
        {
            fp = formatPlayer(players[p]);
            list.push(players[p]);
            log(players[p].toString());   
        }
        socket.emit('players', {players: list});
    });
    
    socket.on('sendTextMessageTo', function(data){
        log('Sending message to player: ' + data.player.id);
        for(p in players)
        {
            if (players[p].id == data.player.id )
            {
                var socks = io.sockets.clients();
                for (var i in socks)
                {
                    if  (socks[i].id == players[p].getSocket())
                    {
                        socks[i].emit('textMessage', {message:data.message});
                    }
                }
            }
        }
    });
    
    socket.on('sendBroadcastTextMessage', function(data){
        log('Sending broadcast message');
        io.sockets.emit('textMessage', {message:data.message});
    });
    
    socket.on('requestRecording', function (data) {
            log("received request to record a trip for another player.");
            var playerId = data.playerId;
            var tripId = data.tripId;
            if (playerId != null && tripId != null)
            {
                for (var p in players)
                {
                    if (players[p].id == playerId && players[p].socket != null)
                    {
                        var socks = io.sockets.clients();
                        for (var i in socks)
                        {
                            log("Socket id requested: " + players[p].getSocket()  + " compared to: " + socks[i].id)
                            if  (socks[i].id == players[p].getSocket())
                            {
                                socks[i].emit("requestRecording", {tripId:tripId});
                            }
                        }
                    
                    }
                }
            }
        });
    
    socket.on('updateLocation', function(data){
        if(registered === false || player === null)
        {
            //NOTE: This code registers a new player if the one sending the location is not registered yet. Commented because we do no want to allow this to happen
            //register("Guest"+players.length);
        }
        else
        {
            updateLocationHandler(player, {lat: data['lat'],lng:data['lng']}, socket, trip);
            log("Got location of player " + player.getNickname() + " at Lat:" + data['lat'] + " Lng:" + data['lng']);
        }
    });
    
    socket.on('killPlayer', function(data){
        for(p in players)
        {
            if (players[p].id == data.id)
            {
                removePlayer(players[p]);
            }
        }
        io.sockets.emit('playerDisconnected', data);
    });
    
    socket.on('memoryUsage', function(){
        socket.emit('memoryUsage', process.memoryUsage());  
    });
    
    socket.on("requestRefreshAll", function () {
        log("Mass refresh request came in. Broadcasting...");
        io.sockets.emit("refresh");
    });
    
    socket.on('disconnect', function () {
        if(player)
        {
            socket.broadcast.emit('playerDisconnected', formatPlayer(player));
            removePlayer(player);
        }
    });
});

function removePlayer(player)
{
    players.splice(players.indexOf(player), 1);
    log("Player " + player.getNickname() + " exited. Players still online: " + players.toString());
}

function replayTrip(steps, speed)
{
    var firstStep = steps[0];
    log("firstStep: " + firstStep["playerId"]);
    db.getPlayerById(firstStep["playerId"], function (err, player) {
        if (err || !player)
        {
            log("Error fetching the player for the requested trip");
        }
        else
        {
            players.push(player);
            io.sockets.emit("playerJoined", formatPlayer(player));
            log("Added replay player: " + player.nickname + "with id: " + player.getId());
            runStep(player, steps, 0, speed);
        }
    });  
};

function runStep(player, steps, count, speed)
{
    if(count <= steps.length)
    {
        log("running step " + count + " with speed " + speed);
        updateLocationHandler(player, steps[count]['location'], null, null);
        player.setLocation(steps[count]['location']);
        if(count+1 < steps.length)
        {
            count++;
            var interval = steps[count].timestamp - steps[count-1].timestamp;
            setTimeout(function(){runStep(player, steps, count, speed);}, interval / parseInt(speed));
        }
    }
};

function updateLocationHandler(player, location, socket, recordTrip)
{
    if (socket)
    {
        socket.broadcast.emit('updateLocation', {lat: location['lat'], lng: location['lng'], player: formatPlayer(player)});
    }
    else
    {
        io.sockets.emit('updateLocation', {lat: location['lat'], lng: location['lng'], player: formatPlayer(player)});
    }
    
    player.setLocation(location);
    
    for (var t in targets)
    {
        var distance = calculateDistance(player.getLocation(), targets[t].location, 'm');
        log("target at " + distance + " meters.");
        
        if (distance < range)
        {
            log("found a target in range")
            var socks = io.sockets.clients();
            for (var s in socks)
            {
                if (socks[s].id == player.getSocket())
                {
                    log("emitting in range event.")
                    socks[s].emit("targetInRange", {target: targets[t], distance:distance});
                }
            }
        }
    }
    
    for (var p in players)
    {
        if(players[p] != player)
        {
            var distance = calculateDistance(player.getLocation(), players[p].getLocation(), 'm');
            log("player at " + distance + " meters.");
           
            if (distance < range)
            {
                log("found a player in range")
                var socks = io.sockets.clients();
                for (var s in socks)
                {
                    if (socks[s].id == player.getSocket())
                    {
                        log("emitting in range event.")
                        socks[s].emit("playerInRange", {player: players[p], distance:distance});
                    }
                }
            }   
        }
    }
    
    if (recordTrip !== null)
    {
        db.addStep({tripId:recordTrip , playerId:player.getId() ,location:location, timestamp:Date.now()});
    }
};

function calculateDistance (location1, location2, unit)
{
    var p1 = new geoutils.GeoPoint(location1.lat, location1.lng);
    var p2 = new geoutils.GeoPoint(location2.lat, location2.lng);
    log(location1);
    log(location2);
    log(p1);
    log(p2);
    return gutils.distanceBetween(p1,p2)[unit];
}

function formatPlayer(player)
{
    return {id:player.getId(), nickname:player.getNickname(), location:player.getLocation(), score:player.getScore(), color:player.getColor(), drone: player.drone};
};
