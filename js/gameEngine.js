//Geolocated Game Engine

//importing socket.io
var script = document.createElement('script');
script.src = 'http://mediawerf.dyndns.org/js/socket.io.js';
script.type = 'text/javascript';
script.defer = false;
$('head').prepend(script);

//indexOf fix for cross browser compatibility
Array.prototype.indexOf = function(obj, start) {
     for (var i = (start || 0), j = this.length; i < j; i++) {
         if (this[i] === obj) { return i; }
     }
     return -1;
}

//TODO: Add a job to check the current list of players regularly just in case it got out of date.y

var GameEngine = function () {
    this.server = 'http://mediawerf.dyndns.org:7080'
    this.socket = io.connect(this.server);
    this.players = [];
    this.targets = [];
    this.trips = [];
    this.acceptRecordingRequests = true;
    this.updateLocationCallbacks = [];
    this.playerJoinedCallbacks = [];
    this.playerDisconnectedCallbacks = [];
    this.onRegisterCallbacks = [];
    this.onRegisterErrorCallbacks = [];
    this.onRecordingStartCallbacks = [];
    this.onRecordingStopCallbacks = [];
    this.targetAddedCallbacks = [];
    this.targetRemovedCallbacks = [];
    this.targetInRangeCallbacks =[];
    this.playerInRangeCallbacks =[];
    this.listTripsCallbacks =[];
    this.textMessageCallbacks=[];
    
    
    //socketEvents
    this.socket.on('updateLocation', GameEvents.updatelocation);
    this.socket.on('playerJoined', GameEvents.playerJoined);
    this.socket.on('playerDisconnected', GameEvents.playerDisconnected);
    this.socket.on('registerError', GameEvents.registerError);
    this.socket.on('registerSuccess', GameEvents.onRegister);
    this.socket.on('recordTrip_success', GameEvents.onRecordStart);   
    this.socket.on('recordTrip_stop', GameEvents.onRecordStop);
    this.socket.on('players', GameEvents.listPlayers);
    this.socket.on('targetAdded', GameEvents.targetAdded);
    this.socket.on('targetRemoved', GameEvents.targetRemoved);
    this.socket.on('targetInRange', GameEvents.targetInRange);
    this.socket.on('playerInRange', GameEvents.playerInRange);
    this.socket.on('refresh',  function () {window.location.reload();});
    this.socket.on('listTrips', GameEvents.listTrips);
    this.socket.on('listTargets', GameEvents.listTargets);
    this.socket.on('requestRecording', GameEvents.requestRecording);
    this.socket.on('textMessage', GameEvents.textMessage);
    
    //get current players
    this.socket.emit("getPlayers");
    this.listTargets();
}

GameEngine.prototype.getPlayers = function ()
{
    return this.players;  
};

GameEngine.prototype.bind = function (eventName, callback)
{
    switch (eventName)
    {
        case 'updateLocation':
            this.updateLocationCallbacks.push(callback);
            break;
        
        case 'playerJoined':
            this.playerJoinedCallbacks.push(callback);
            break;
        
        case 'playerDisconnected':
            this.playerDisconnectedCallbacks.push(callback);
            break;
        
        case 'onRegisterError':
            this.onRegisterErrorCallbacks.push(callback);
            break;
        
        case 'onRegister':
            this.onRegisterCallbacks.push(callback);
            break;
        
        case 'onRecordingStart':
            this.onRecordingStartCallbacks.push(callback);
            break;
        
        case 'onRecordingStop':
            this.onRecordingStopCallbacks.push(callback);
            break;
        
        case 'targetAdded':
            this.targetAddedCallbacks.push(callback);
            break;
        
        case 'targetInRange':
            this.targetInRangeCallbacks.push(callback);
            break;
        
        case 'playerInRange':
            this.playerInRangeCallbacks.push(callback);
            break;
        
        case 'targetRemoved':
            this.targetRemovedCallbacks.push(callback);
            break;
        
        case 'listTrips':
            this.listTripsCallbacks.push(callback);
            break;

        case 'textMessage':
            this.textMessageCallbacks.push(callback);
        
        default:
            this.socket.on(eventName, callback)
            break;
    }
};

GameEngine.prototype.registerPlayer = function (nickname)
{
    this.socket.emit('register', {nickname: nickname});
};

GameEngine.prototype.recordTrip = function (name) {
    this.socket.emit('recordTrip', {tripId: name});
};

GameEngine.prototype.requestRecording = function(playerId, tripId){
    console.log("Requesting recording of " + tripId+ " for " + playerId);
    this.socket.emit('requestRecording', {tripId: tripId, playerId:playerId});
}

GameEngine.prototype.replayTrip = function(name, speed) {
    this.socket.emit("replayTrip", {tripId:name, speed:speed});
};

GameEngine.prototype.sendLocation = function (location)
{
    this.socket.emit('updateLocation', location);
}

GameEngine.prototype.killPlayer = function(player)
{
    console.log("killing " + player.nickname);
    this.socket.emit('killPlayer', player);
}

GameEngine.prototype.sendMessage = function(player, message)
{
    console.log("sending message to: " + player.nickname);
    this.socket.emit("sendTextMessageTo", {player: player, message: message});
}

GameEngine.prototype.broadcastMessage = function (message)
{
    console.log("sending broadcast message");
    this.socket.emit("sendBroadcastTextMessage", {message: message});
}

GameEngine.prototype.addTarget = function(lat, lng, value, range)
{
    console.log("Adding new target");
    this.socket.emit('addTarget', {location:{lat: lat, lng:lng}, value:value, range:range});
}

GameEngine.prototype.listTargets = function ()
{
    console.log("Asking for target listing.");
    this.socket.emit('listTargets');
}

GameEngine.prototype.removeTarget = function(target)
{
    console.log("Removing target " + target.value);
    this.socket.emit('removeTarget', {target: target});
}

GameEngine.prototype.startTracking = function ()
{
    //Gets browser geolocation and sends it down the socket
    var locationHandler = {lat: null, lng:null};
    
    locationHandler.init = function ()
    {
        if (navigator.geolocation)
        {
            locationHandler.posId = navigator.geolocation.watchPosition(locationHandler.handleLocation, locationHandler.posError ,{ maximumAge: 3000, timeout: 5000, enableHighAccuracy: true });
            console.log("Aquiring Location...");
        }
        else
        {
            console.log("Geolocation is not supported by this browser.");
        }
    };
    
    locationHandler.handleLocation = function (position)
    {
        console.log("new location: (" + position.coords.latitude + ", " + position.coords.longitude + ")");
        locationHandler.lat = position.coords.latitude;
        locationHandler.lon = position.coords.longitude;
        game.sendLocation({lat: locationHandler.lat, lng: locationHandler.lon});
    }
    
    console.log("initialiing geolocation");
    locationHandler.init();
}

GameEngine.prototype.requestRefreshAll = function ()
{
    console.log("Requesting mass refresh.");
    this.socket.emit("requestRefreshAll");
};

GameEngine.prototype.listTrips = function ()
{
    console.log("Asking for the list of trips.");
    this.socket.emit("listTrips");
}

//Socket events
GameEvents = {};

GameEvents.updatelocation = function (data)
{
    var p = game.players[game.players.indexOf(data['player'])];
    if (p) p.location = {lat:data['lat'], lng:data["lng"]};
    console.log(data)
    for (var i in game.updateLocationCallbacks)
    {
        game.updateLocationCallbacks[i](data['player'],  {lat:data['lat'], lng:data["lng"]});
    }
};

GameEvents.listPlayers = function (data)
{
        game.players = [];
        for(var p in data['players'])
        {
            game.players.push(data['players'][p]);
            for (var i in game.playerJoinedCallbacks)
            {
                game.playerJoinedCallbacks[i](data['players'][p]);
            }
        }
};

GameEvents.listTargets = function (data)
{
        game.targets = [];
        for(var t in data.targets)
        {
            game.targets.push(data.targets[t]);
            for (var i in game.targetAddedCallbacks)
            {
                game.targetAddedCallbacks[i](data.targets[t]);
            }
        }
};

GameEvents.listTrips = function (data)
{
        game.trips = data['trips'];

        for (var i in game.listTripsCallbacks)
        {
            game.listTripsCallbacks[i](game.trips);
        }
};

GameEvents.playerJoined = function (data)
{
    game.players.push(data);
    for (var i in game.playerJoinedCallbacks)
    {
        game.playerJoinedCallbacks[i](data);
    }
};

GameEvents.playerDisconnected = function (data)
{
    console.log("Player disconnected");
    for (player in game.players)
    {
        if (game.players[player].id == data.id)
        {
            console.log("Deleting player");
            game.players.splice(player, 1);
        }   
    }
    
    for (var i in game.playerDisconnectedCallbacks)
    {
        game.playerDisconnectedCallbacks[i](data);
    }
};

GameEvents.onRegister = function (data)
{
    for (var i in game.onRegisterCallbacks)
    {
        game.onRegisterCallbacks[i](data);
    }
}

GameEvents.registerError = function (data)
{
    for (var i in game.onRegisterErrorCallbacks)
    {
        game.onRegisterErrorCallbacks[i](data);
    }
}

GameEvents.onRecordStart = function (data)
{
    for (var i in game.onRecordingStartCallbacks)
    {
        game.onRecordingStartCallbacks[i](data);
    }
}

GameEvents.onRecordStop = function (data)
{
    for (var i in game.onRecordingStopCallbacks)
    {
        game.onRecordingStopCallbacks[i](data);
    }
}

GameEvents.targetAdded = function (data)
{
    game.targets.push(data);
    for (var i in game.targetAddedCallbacks)
    {
        game.targetAddedCallbacks[i](data);
    }
}

GameEvents.targetRemoved = function (data)
{   
    for (var t in game.targets)
    {
        if (game.targets[t]._id == data._id)
        {
            game.targets.splice(t,1);
        }
    }
    
    for (var i in game.targetRemovedCallbacks)
    {
        game.targetRemovedCallbacks[i](data);
    }
}

GameEvents.targetInRange = function (data)
{
    for (var i in game.targetInRangeCallbacks)
    {
        game.targetInRangeCallbacks[i](data);
    }
}

GameEvents.playerInRange = function (data)
{
    for (var i in game.playerInRangeCallbacks)
    {
        game.playerInRangeCallbacks[i](data);
    }
}

GameEvents.requestRecording = function (data)
{
    if (game.acceptRecordingRequests)
    {
        game.recordTrip(data.tripId);
    }
}

GameEvents.textMessage = function (data)
{
    for (var i in game.textMessageCallbacks)
    {
        game.textMessageCallbacks[i](data);
    }
}

var game = new GameEngine();