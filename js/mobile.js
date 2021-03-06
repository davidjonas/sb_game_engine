var started = false;
var tracking = false;
var nickname = ""

$(function ()
{
    $('#button').click(start);
});

var start = function ()
{
    if (!started)
    {
        $("#button").addClass('active');
        nickname = "MobileClient" + Date.now()
        game.registerPlayer(nickname);
        
        game.bind("playerInRange", function (data) {
            console.log("player in range");
            //$("#info").text( data.player.nickname + " - " + data.distance);
            var dist = Math.round(data.distance);
            var alarm = 0;
            if (dist < 10)
            {
                alarm = 100 - (dist * 10);
            }
            
            $("#button").css({"box-shadow":"inset 0px 0px " + alarm + "px #f00"});
        });
        
        
        if (!tracking)
        {
            game.startTracking();
            tracking = true;
        }
        started = true;
    }
    else
    {
        $("#button").removeClass('active');
        for (var p in game.players)
        {
            if (game.players[p].nickname == nickname)
            {
                game.killPlayer(game.players[p])
            }
        }
        started=false;
    }
};