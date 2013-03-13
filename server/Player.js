function Player (nickname) { 
	this.id = null;
	this.nickname = nickname,
	this.lng = 4.49549;
	this.lat = 51.806428;
	this.score = 0;
	this.state = 0;
	this.socket = null;
	this.color = Math.floor((Math.random()*360)+0);
	//Is this player real or a automated drone?
	this.drone = false;
	//Limit to where the drone should walk around
	this.lowerLimit = {lat: 0, lng:0};
	this.upperLimit = {lat: 0, lng:0};
	//How often should this drone update it's position by default 1 second
	this.frequency = 1000;
}

Player.prototype.toString = function(){return this.nickname};

Player.prototype.playerStates 		= {NOTREADY : 0, READY : 1, PLAYING : 2};

Player.prototype.addScore 		= function addScore(value){this.score += value;};
Player.prototype.drainScore 		= function drainScore(value){ this.score -= value; };

Player.prototype.getLocation		= function () {return {lat: this.lat, lng: this.lng}; };
Player.prototype.setLocation 		= function updateLocation(location){ this.lng = location.lng; this.lat = location.lat;};

Player.prototype.getId 			= function (){ return this.id; };
Player.prototype.setId			= function (id){this.id = id};

Player.prototype.getColor			= function () {return this.color};
Player.prototype.setColor			= function (color) {this.color = color};

Player.prototype.getSocket 		= function (){ return this.socket; };
Player.prototype.setSocket		= function (socket){this.socket = socket};

Player.prototype.getScore 		= function (){ return this.score; };
Player.prototype.setScore		= function (score){this.score = score};

Player.prototype.getNickname 		= function (){ return this.nickname;	 };
Player.prototype.setNickname 		= function (value){ this.nickname = value; };

Player.prototype.markAsDrone 		= function (lowerLimit, upperLimit)
{
	this.drone = true;
	this.lowerLimit = lowerLimit;
	this.upperLimit = upperLimit;
};

Player.prototype.step = function (size)
{
	var newLat = 0;
	var newLng = 0;
	
	if(this.drone === true)
	{
		if(this.lowerLimit["lat"] == 0 || this.upperLimit["lat"] == 0 || this.lowerLimit["lng"] == 0 || this.upperLimit["lng"] == 0)
		{
			newLat = this.lowerLimit["lat"] + (this.upperLimit["lat"]-this.lowerLimit["lat"])*Math.random()
			newLng = this.lowerLimit["lng"] + (this.upperLimit["lng"]-this.lowerLimit["lng"])*Math.random()
		}
		else
		{
			
		}
	}
	this.setLocation({lat:newLat, lng:newLng});
};

Player.prototype.setDroneFrequency 	= function (value){this.frequency = value};

exports.Player = Player;