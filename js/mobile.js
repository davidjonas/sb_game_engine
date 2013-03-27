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