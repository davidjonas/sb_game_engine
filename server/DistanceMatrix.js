var geojs = require('./'),
      players = [],
      targets = [],
      io_client = require( 'socket.io-client' );
      
    io_client.connect( "'http://localhost:7080'" );
    
    