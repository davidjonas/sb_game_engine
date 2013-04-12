var started = false;
var tracking = false;
var nickname = "";
var sounds = [];

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
        
        game.bind("targetInRange", function (data) {
            var dist = Math.round(data.distance);
            var volume = 0;
            if (dist < 20)
            {
                volume = 100  - dist*5;
            }
            $("#info").text( data.target.value + " - " + volume);
            updateSound(data.target.value, volume);
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