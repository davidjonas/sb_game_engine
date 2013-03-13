var socket = io.connect('http://mediawerf.dyndns.org:7080');

socket.emit("replayTrip", {tripId:'testTrip', speed:2});