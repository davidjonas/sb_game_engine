//Data access layer, takes care of all the communication to the DB
var Player = require('./Player.js');
function _convertToPlayer(player){
    var p = new Player.Player(player.nickname);
    p.setId(player._id);
    p.setScore(player.score);
    p.setColor(player.color);
    p.setSound(player.sound);
    return p;
}

function DAL()
{
    this.databaseUrl = "game";
    this.collections = ["players", "trips", "targets"];
    this.db = require("mongojs").connect(this.databaseUrl, this.collections);
}

//player is a Player object, calbeck is a function to run once the player is saved
DAL.prototype.storePlayer = function (player, callback)
{
    var db = this.db;
    this.db.players.find({nickname:player.nickname}, function (err, players) {
        if (players.length === 0)
        {
            db.players.save({nickname:player.nickname, score:player.score, color:player.color, sound:player.sound}, function(err, saved) {
                if (callback) callback(err, saved);
            });
        }
        else
        {
            if (callback) callback(err, players[0]);
        }
    });
}

//Updates a player.
DAL.prototype.updatePlayer = function (player)
{
    var db = this.db;
    this.db.players.find({nickname:player.nickname}, function (err, players) {
        if (players.length > 0)
        {
            players[0].score = player.score;
            players[0].color = player.color;
            players[0].sound = player.sound;
            
            db.players.update({nickname:player.nickname}, players[0], function (err, players) {
                if (!err)
                {
                    console.log("Updated player.");
                }
                else
                {
                    console.log("Error updating player.");
                }
            });
        }
    });
}

//step is a object of the type {tripId, playerId ,location, timestamp}
DAL.prototype.addStep = function(step, callback)
{
    this.db.trips.save(step, function(err, saved) {
        if (callback) callback(err, saved);
    });
}

DAL.prototype.getPlayerById = function (id, callback)
{
    this.db.players.find({_id:id}, function(err, players){
        if(err || players.length === 0)
        {
            callback(err, null)
        }
        else
        {
            callback(err, _convertToPlayer(players[0]));
        }
    });   
}

DAL.prototype.addTarget = function (target)
{
    this.db.targets.save(target, function (err, saved)
                      {
                        if (err || !saved)
                        {
                            console.log("Error occured while trying to save the target");
                        }
                      });
}

DAL.prototype.removeTarget = function (target)
{
    this.db.targets.remove({value: target.value, location: target.location, range: target.range}, function (err, status)
                      {
                        if (err)
                        {
                            console.log("Error occured while trying to save the target");
                        }
                      });
}

DAL.prototype.updateTarget = function (target)
{
    var db = this.db;
    this.db.targets.find({_id:new db.ObjectId(target._id)}, function (err, targets) {
        if (targets.length > 0)
        {
            targets[0].type = target.type;
            targets[0].range = target.range;
            targets[0].value = target.value;
            
            db.targets.update({_id:new db.ObjectId(target._id)}, targets[0], function (err, targetsUpdated) {
                if (!err)
                {
                    console.log("Updated target.");
                }
                else
                {
                    console.log("Error updating target.");
                }
            });
        }
        else
        {
            console.log("did not find the target to update");
        }
    });
}

DAL.prototype.getTargets = function(callback) {
    this.db.targets.find(callback);
}

DAL.prototype.getTrip = function (tripId, callback)
{
    this.db.trips.find({tripId:tripId}).sort({timestamp:1}, callback);
};

DAL.prototype.listTrips = function (callback)
{
    this.db.trips.distinct('tripId', callback);
}

DAL.prototype.getPlayerByNickname = function (nickname, callback)
{
    this.db.players.find({nickname:nickname}, function(err, players){
        if(err || !players)
        {
            callback(err, null)
        }
        else
        {
            callback(err, _convertToPlayer(players[0]));
        }
    });
}

exports.DAL = DAL;
