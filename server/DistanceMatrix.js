log("Debug mode activated.");

var players = [],
    targets = [],
    io_client = require( 'socket.io-client' ),
    process = require('process');


var debug = process.argv.length >= 2 && process.argv[1] == "debug";

function log(str){
    if(debug === true){
        console.log(str);
        if (io.sockets.clients().length > 0)
        {
            io.sockets.emit("debug", {message: str});
        }
    }
};

io_client.connect("'http://localhost:7080'");
    
socket.on('connect', function () {log("socket connected"); });
