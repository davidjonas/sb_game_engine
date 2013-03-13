var socket = io.connect('http://mediawerf.dyndns.org:7080');

socket.on('updateLocation', function(data)
{
        //var msg = "<p>"+data['player']['nickname']+" is at ("+data['lat']+", "+data['lng']+")</p>";
        //$('body').append(msg);
        if (!Client.gotPosition)
        {
                Client.gotPosition = true;
                Client.showMap();
        }
        
        Client.lat = data['lat'];
        Client.lon = data['lng'];
        Client.marker.setMap(null);
        var latlon = new google.maps.LatLng(Client.lat, Client.lon);
        Client.marker = new google.maps.Marker({position:latlon,map:Client.map,title:data['player']['nickname'] + " is here"});
        Client.marker.setIcon('geomarker.png');
        Client.map.setCenter(latlon);
});

var Client = {};

//Your CartoDB username
Client.CartoDbUserName = "davidjonas";
Client.lat = 0;
Client.lon = 0;
Client.gotPosition = false;

Client.showMap = function ()
{
    var user  = Client.CartoDbUserName;
    var lat   = Client.lat;
    var lng   = Client.lon;
    var table = "media_points";
    var zoom  = 18;
    var mapdiv = $('<div id="map"></div>').css({'width':'100%', 'height':$(document).height()});
    $('body').append(mapdiv);
    
    // Define the initial options
    var cartodbMapOptions = {
      zoom: zoom,
      center: new google.maps.LatLng( lat, lng ),
      disableDefaultUI: true,
      mapTypeId: google.maps.MapTypeId.ROADMAP
}
    
    // Initialize the map
    Client.map = new google.maps.Map(document.getElementById("map"),cartodbMapOptions);
    
    // Define the map styles
    var map_style = [{
      stylers: [{ saturation: -65 }, { gamma: 1.52 }] }, {
      featureType: "administrative", stylers: [{ saturation: -95 }, { gamma: 2.26 }] }, {
      featureType: "water", elementType: "labels", stylers: [{ visibility: "off" }] }, {
      featureType: "administrative.locality", stylers: [{ visibility: 'off' }] }, {
      featureType: "road", stylers: [{ visibility: "simplified" }, { saturation: -99 }, { gamma: 2.22 }] }, {
      featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }, {
      featureType: "road.arterial", stylers: [{ visibility: 'off' }] }, {
      featureType: "road.local", elementType: "labels", stylers: [{ visibility: 'off' }] }, {
      featureType: "transit", stylers: [{ visibility: 'off' }] }, {
      featureType: "road", elementType: "labels", stylers: [{ visibility: 'off' }] }, {
      featureType: "poi", stylers: [{ saturation: -55 }]
    }];
    
    // Set the style
    Client.map.setOptions({ styles: map_style });
    
    // Define the layer
    var cartoDBLayer = {
      tileSize: new google.maps.Size(256, 256)
    };
    
    // Add the CartoDB tiles
    Client.map.overlayMapTypes.insertAt(0, new google.maps.ImageMapType(cartoDBLayer));
    
    var latlon = new google.maps.LatLng(lat, lng);
    Client.marker = new google.maps.Marker({position:latlon,map:Client.map,title:"You are here."});
    Client.marker.setIcon('geomarker.png');
}


$(document).ready(function () {

});