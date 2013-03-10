var CLIENTID = '115c041ed2674786a9b047417174c1bc';
var markersArray = [];
var initPos = {lat: '37.7750', lng: '-122.4183', distance:'5000', client_id: CLIENTID}

Meteor.startup(function(){
  Session.set('photoset', '');
  Session.set('zoomed', ''); 
  getNewPhotos(initPos);
  getTwitter();
  navigator.geolocation.getCurrentPosition(function(success){
    createMap(success);
    addClickListener(success);
    placeBlueMarker(success);
  });
  addAutocomplete();
});

Template.instagram.helpers({
  photoset: function(){
    return Session.get('photoset');
  }
});

Template.main.events({
  'click .photo': function(event){
    $('#container').addClass('greyed');
    if (Session.equals('zoomed', '')) {
      $('<button class="btn close">close</button>').appendTo('#zoomed-image');
      $('<img src='+this.images.standard_resolution.url+' alt="">').appendTo('#zoomed-image');
      Session.set('zoomed', this.images.standard_resolution.url);
    } else{
      $('#container').removeClass('greyed');
      $('#zoomed-image').children().remove();
      Session.set('zoomed', '');
    }
  },
  'click .close': function(){
    $('#container').removeClass('greyed');
    $('#zoomed-image').children().remove();
    Session.set('zoomed', '');
  }
});

//GOOGLE MAPS HELPERS

function createMap(success) {
      var latLng = new google.maps.LatLng(success.coords.latitude, success.coords.longitude);
      var mapOptions = {
        mapTypeControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM},
        streetViewControl: false,
        navigationControlOptions: {
          position: google.maps.ControlPosition.LEFT_BOTTOM
        },
        scrollwheel: false,
        zoom: 14,
        center: latLng,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };
      map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
}

function addClickListener(success) {
      var latLng = new google.maps.LatLng(success.coords.latitude, success.coords.longitude);
      google.maps.event.addListener(map, 'click', function(event){
        var currentPos = {lat: event.latLng.lat(), lng: event.latLng.lng(), dist: '1000'};

        placeMarker(event.latLng);
        getNewPhotos(currentPos);
      });
}

function addAutocomplete() {
      var input = document.getElementById('searchTextField');
      autocomplete = new google.maps.places.Autocomplete(input);
      google.maps.event.addListener(autocomplete, 'place_changed', function() {
        var place = autocomplete.getPlace();
        var searchPos = {lat: place.geometry.location.lat(), lng: place.geometry.location.lng(), dist: '3000'};
        getNewPhotos(searchPos);
        placeMarker(place.geometry.location);
        map.setCenter(place.geometry.location);
        map.setZoom(15);
      });
}

function placeBlueMarker(success) {
      var latLng = new google.maps.LatLng(success.coords.latitude, success.coords.longitude);
      var image = "http://gmaps-samples.googlecode.com/svn/trunk/markers/blue/blank.png";
      var blueIcon = new google.maps.Marker({
          position: latLng,
          map: map,
          icon: image
      });
}

function placeMarker(location) {
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

//INSTAGRAM HELPERS

function placeInstaMarkers(data) {
  for (var i = 0; i < data.length; i++) {
    var latLng = new google.maps.LatLng(data[i].location.latitude, data[i].location.longitude); 
    var image = '/instagram-shadow.png';
    var instagram = new google.maps.Marker({
        // setAnimation: google.maps.Animation.DROP,
        position: latLng,
        map: map,
        icon: image
    });
    instagram.setAnimation(google.maps.Animation.DROP);
  };
}

function onJsonLoaded (json) {
  if (json.meta.code == 200) {
    var show = json.data;
    placeInstaMarkers(show);
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

//GENERAL HELPERS
function getTwitter() {
  !function(d,s,id){
    var js,fjs=d.getElementsByTagName(s)[0];
    if(!d.getElementById(id)){
      js=d.createElement(s);js.id=id;
      js.src="https://platform.twitter.com/widgets.js";
      fjs.parentNode.insertBefore(js,fjs);
    }
  }(document,"script","twitter-wjs");
}