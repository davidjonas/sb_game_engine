var Maps = function ()
{
    this.apiKey='AIzaSyDNagyAhQrvwWWKiKN0XnXqENj2u5e7lwM';
    this.defaultCenter = {lat: 51.884967, lng: 4.496065};
    this.maps = [];
    this.markers = [];
    this.map_style = [{
      stylers: [{ saturation: -65 }, { gamma: 1.52 }] }, {
      featureType: "administrative", stylers: [{ saturation: -95 }, { gamma: 2.26 }] }, {
      featureType: "water", elementType: "labels", stylers: [{ visibility: "off" }] }, {
      featureType: "administrative.locality", stylers: [{ visibility: 'off' }] }, {
      featureType: "road", stylers: [{ visibility: "simplified" }, { saturation: -99 }, { gamma: 2.22 }] }, {
      featureType: "poi", elementType: "labels", stylers: [{ visibility: "on" }] }, {
      featureType: "road.arterial", stylers: [{ visibility: 'off' }] }, {
      featureType: "road.local", elementType: "labels", stylers: [{ visibility: 'off' }] }, {
      featureType: "transit", stylers: [{ visibility: 'off' }] }, {
      featureType: "road", elementType: "labels", stylers: [{ visibility: 'off' }] }, {
      featureType: "poi", stylers: [{ saturation: -55 }]
    }];
}

Maps.prototype.addMarker = function (name, location, map, icon)
{
    var marker = new google.maps.Marker({
      position: new google.maps.LatLng(location.lat , location.lng),
      map: map,
      title: name,
      icon: icon,
    });
    this.markers.push(marker);
    return marker;
}

Maps.prototype.initializeMap = function(center, id) {
        var mapOptions = {
          center: new google.maps.LatLng(center.lat , center.lng),
          zoom: 18,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        
        var mapObject = new google.maps.Map(document.getElementById(id), mapOptions);
        mapObject.setOptions({ styles: this.map_style });
        
        var overlay = new google.maps.OverlayView();
        overlay.draw = function() {};
        overlay.setMap(mapObject);
        
        this.maps.push({id: id, map:mapObject, overlay:overlay});
};

Maps.prototype.getLatLng = function (map, x, y)
{
    var proj = map.overlay.getProjection();
    var point = new google.maps.Point(x,y);
    return proj.fromDivPixelToLatLng(point);
}

Maps.prototype.getMapById = function (){
    
};

var gmaps = new Maps();



