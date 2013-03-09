var markersArray = [];
var userLocation = "";

Template.map.rendered = function(position) {
    var lat, lng, latLng;
    navigator.geolocation.getCurrentPosition(function(success){
      lat = success.coords.latitude;
      lng = success.coords.longitude;
      latLng = new google.maps.LatLng(lat, lng);
      console.log(latLng);
      var mapOptions = {
        navigationControlOptions: {style: google.maps.NavigationControlStyle.SMALL},
        scrollwheel: false,
        zoom: 13,
        center: latLng,
        // center: new google.maps.LatLng(37.755401, -122.446806),
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };

      map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

      // var blueIcon = new GIcon(G_DEFAULT_ICON);

      var image = "http://gmaps-samples.googlecode.com/svn/trunk/markers/blue/blank.png";
      var blueIcon = new google.maps.Marker({
          position: latLng,
          map: map,
          icon: image
      });

      google.maps.event.addListener(map, 'click', function(event){
        placeMarker(event.latLng);
        var currentPos = {name: 'N/A', lat: event.latLng.lat(), lng: event.latLng.lng(), dist: '1000'};
        getNewPhotos(currentPos);
      });

    });    
};

function placeMarker(location){
  deleteOverlays();
  var marker = new google.maps.Marker({
    position: location,
    map: map
  });
  markersArray.push(marker);
}

function deleteOverlays() {
    if (markersArray) {
        for (i in markersArray) {
            markersArray[i].setMap(null);
        }
    markersArray.length = 0;
    }
}

//INSTAGRAM

var CLIENTID = '115c041ed2674786a9b047417174c1bc';

function onJsonLoaded (json){
  if (json.meta.code == 200) {
    var show = json.data;
    Session.set('photoset', show);
  } else{
    alert(json.meta.error_message);
  };
}

var getNewPhotos = function (place) {
  $.ajax({
  url: 'https://api.instagram.com/v1/media/search?callback=?',
  dataType: 'json',
  data: {lat: place.lat, lng: place.lng, distance:place.dist, client_id: CLIENTID},
  success: onJsonLoaded,
  statusCode: {
    500: function () {
      alert('Sorry, service is temporarily down.');
    }
  }
  });
};

Meteor.startup(function(){
  Session.set('photoset', '');
  Session.set('zoomed', ''); 
  
  $.ajax({
  url: 'https://api.instagram.com/v1/media/search?callback=?',
  dataType: 'json',
  data: {lat: '37.7750', lng: '-122.4183', distance:'5000', client_id: CLIENTID}, 
  success: onJsonLoaded,
  statusCode: {
    500: function () {
      alert('Sorry, service is temporarily down.');
    }
  }
  });
});


Template.instagram.helpers({
  photoset: function(){
    return Session.get('photoset');
  }
});


Template.main.events({

  'click .photo': function(event){
    $('#container').toggleClass('greyed');
    if (Session.equals('zoomed', '')) {
      $('<img src='+this.images.standard_resolution.url+' alt="">').appendTo('#zoomed-image');
      Session.set('zoomed', this.images.standard_resolution.url);
    } else{
      $('#zoomed-image').children().remove();
      Session.set('zoomed', '');
    };
  }
});