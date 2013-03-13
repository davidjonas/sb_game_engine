var started = false;

$(function ()
{
    $('#button').click(start);
});

var start = function ()
{
    if (!started)
    {
        $("#button").addClass('active');
        game.registerPlayer("MobileClient" + Date.now());
        game.socket = io.connect(game.server);
        game.startTracking();
        started = true;
    }
    else
    {
        $("#button").removeClass('active');
        game.socket.disconnect();
        started=false;
    }
};