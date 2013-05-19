var INSTAID = 'c28bc8730c734259aba3fd5c1946f073';
var markersArray = [];
var instaArray = [];

Meteor.startup(function(){
  //Get the users geolocation
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(successFunction, errorFunction);
  } else {
    alert('It appears that Geolocation, which is required for this web page application, is not enabled in your browser. Please use a browser which supports the Geolocation API.');
  }

  //If the user has a geolocation, get photos near location and set map center to location.
  function successFunction(success) {
    var navLatLng = newLatLng(success);
    getNewPhotos({lat: success.coords.latitude, lng: success.coords.longitude, distance:'3000', client_id: INSTAID});
    createMap(navLatLng);
    placeNavMarker(navLatLng);
    addClickListener();
    addAutocomplete();
  }

  //If the user did not enable geolocation, get photos and set map near Golden Gate Bridge.
  function errorFunction(success) {
    var latlng = new google.maps.LatLng(37.808631, -122.474470);
    getNewPhotos({lat: latlng.lat(), lng: latlng.lng(), distance:'3000', client_id: INSTAID});
    createMap(latlng);
    placeClickMarker(latlng);
    addClickListener();
    addAutocomplete();
  }

  //initialize state of zoomed image
  $('#zoomed-image').hide();
  Session.set('zoomed', '');

  //Hack Reactor Banner
  $('body').append('<a href="http://hackreactor.com"><img style="position: absolute; top: 0; right: 0; border: 0;" src="http://i.imgur.com/x86kKmF.png alt="Built at Hack Reactor"></a>');
  getTwitter();
});


//Helper function to push photos to template scope
Template.instagram.photoset = function(){
  return Session.get('photoset');
}

//Event Handlers for click and mouseover events
Template.content.events({
  'click .photo': function(event){
    $(event.target).addClass('greyed');
    if (Session.equals('zoomed', '')) {
      $('<input type="submit" value="close" class="close">').appendTo('#zoomed-image');
      $('<img src='+this.images.standard_resolution.url+' alt="">').appendTo('#zoomed-image');
      Session.set('zoomed', 'zoomed');
    }
    $('#zoomed-image').toggle('');
  },
  'click .popupPhoto': function(event){
    $('.photo').toggleClass('greyed');
    if (Session.equals('zoomed', '')) {
      $('#zoomed-image').toggle('');
      $('<img src='+event.target.src+' alt="">').appendTo('#zoomed-image');
      $('<input type="submit" value="close" class="close">').appendTo('#zoomed-image');
      Session.set('zoomed', 'zoomed');
    } else {
      $('#zoomed-image').hide();
      $('#zoomed-image').children().remove();
      Session.set('zoomed', '');
    }
  },
  'click #zoomed-image': function(event){
      $(event.currentTarget).hide();
      $(event.currentTarget).children().remove();
      Session.set('zoomed', '');
      $('.photo').removeClass('greyed');
  },
  'mouseenter .photodiv': function(event){
    $(event.target.children[0]).addClass('greyed');
    for (var i =1; i < event.target.children.length; i++){
      $(event.target.children[i]).show("easing");
    }
  },
  'mouseleave .photodiv': function(event){
    $(event.target.children[0]).toggleClass('greyed');
    for (var i =1; i < event.target.children.length; i++){
      $(event.target.children[i]).hide("easing");
    }
  }
});

//GOOGLE MAPS HELPERS

//Converts HTML5 geolocation data into a google maps location object
var newLatLng = function (success) {
   return new google.maps.LatLng(success.coords.latitude, success.coords.longitude);
}

//Takes a google maps location object (latLng), creates the map and centers it at latLng.
function createMap(latLng) {
  var mapOptions = {
    streetViewControl: false,
    scrollwheel: false,
    zoom: 14,
    center: latLng,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
}

/* The click listener watches for clicks on the map, extracts the Lat & Lng and calls
   getNewPhotos with the new latLng object. */
function addClickListener() {
  google.maps.event.addListener(map, 'click', function(event){
    var currentPos = {lat: event.latLng.lat(), lng: event.latLng.lng(), dist: '1000'};

    placeClickMarker(event.latLng);
    getNewPhotos(currentPos);
  });
}

/* addAutocomplete uses the Google Maps API to create a search field, process the input to get
   the Lat & Lng for the selected location.  It passes the new latLng to getNewPhotos and 
   set map center and place new marker */
function addAutocomplete() {
  var input = document.getElementById('searchTextField');
  autocomplete = new google.maps.places.Autocomplete(input);
  google.maps.event.addListener(autocomplete, 'place_changed', function() {
    var place = autocomplete.getPlace();
    var searchPos = {lat: place.geometry.location.lat(), lng: place.geometry.location.lng(), dist: '3000'};
    getNewPhotos(searchPos);
    placeClickMarker(place.geometry.location);
    map.setCenter(place.geometry.location);
    map.setZoom(15);
  });
}

//Nav marker is placed only once, at the users location (if it is avaliable)
function placeNavMarker(latLng) {
  var image = "http://gmaps-samples.googlecode.com/svn/trunk/markers/blue/blank.png";
  var blueIcon = new google.maps.Marker({
      position: latLng,
      map: map,
      icon: image
  });
}

//Instagram markers are placed for every photo, using the Lat & Lng information for the photo
function placeInstaMarkers(data, map) {
  for (var i = 0; i < data.length; i++) {
    var latLng = new google.maps.LatLng(data[i].location.latitude, data[i].location.longitude);
    var image = '/instagram-shadow.png';
    var instaMarker = new google.maps.Marker({
        position: latLng,
        map: map,
        icon: image
    });
    instaMarker.setAnimation(google.maps.Animation.DROP);
    addInfoWindow(data, instaMarker, i);
  };
}

//Google Maps API has built in InfoWindows.  This funciton creates new InfoWindows for each photo.
function addInfoWindow(data, instaMarker, i){
  var username = data[i].user.username;
  var caption;
  if ( !data[i].caption ) {
    caption = "No Comment.."
  } else {
    caption = data[i].caption.text;
  }
  var infowindow = new google.maps.InfoWindow({
    // backgroundColor: 'rgb(57,57,57)',
    // backgroundClassName: 'phoney',
    content:
    '<img class="popupPhoto" src="'+ data[i].images.standard_resolution.url +'"/><br/>'+
    '<div class="userInfo">'+
      '<a href="http://instagram.com/'+ username +'" target="_blank">'+
        '<img class="profilePicture" src="'+ data[i].user.profile_picture +'"/>'+
        '<span class="popupText">@'+ username +'</span>'+
      '</a>' +
      '<p class="caption">'+ caption + '</p>' +
    '</div>'
  });
  infowindow.setOptions({maxWidth:250});
  infowindow.setOptions({maxHeight:300})

  google.maps.event.addListener(instaMarker, 'click', function() {
    deleteInstaMarkers(this);
    infowindow.open(map, this);
    instaArray.push(instaMarker);
  });
}

// Ensures only one Instagram marker is open on the map at a time.

function deleteInstaMarkers() {
  if (instaArray) {
    for (i in instaArray){
      instaArray[i].setMap(null)
    }
  }
  instaArray.length = 0;
}

// Places a single red marker when the user clicks anywhere on the map.

function placeClickMarker(location) {
  deleteOverlays();
  var marker = new google.maps.Marker({
    position: location,
    map: map
  });
  markersArray.push(marker);
}

// Ensures only one click marker is on the screen at a time, called by placeClickMarker

function deleteOverlays() {
  if (markersArray) {
    for (i in markersArray) {
      markersArray[i].setMap(null);
    }
  markersArray.length = 0;
  }
}

//INSTA HELPERS

//processses the json data on ajax success
function jsonLoad (json) {
  if (json.meta.code == 200) {
    var show = json.data;
    placeInstaMarkers(show, map);
    Session.set('photoset', show);
    $(event.target.children[1]).hide();
  } else{
    alert(json.meta.error_message);
  };
}

//basic ajax call to instagram API, searching for photos within specified distance of passed in place
var getNewPhotos = function (place) {
  $.ajax({
    url: 'https://api.instagram.com/v1/media/search?callback=?',
    dataType: 'json',
    data: {'order': '-createdAt', lat: place.lat, lng: place.lng, distance:place.dist, client_id: INSTAID},
    success: jsonLoad,
    statusCode: {
      500: function () {
        alert('Sorry, service is temporarily down.');
      }
    }
  });
};

//GENERAL HELPERS

//required by the tweet button in the top right of the nav bar
var getTwitter = function() {
  !function(d,s,id){
    var js,fjs=d.getElementsByTagName(s)[0];
    if(!d.getElementById(id)){
      js=d.createElement(s);js.id=id;
      js.src="https://platform.twitter.com/widgets.js";
      fjs.parentNode.insertBefore(js,fjs);
    }
  }(document,"script","twitter-wjs");
}

// Template.instagram.time = function () {
//   return moment(this.created_time).fromNow();
// }

// TO-DO:
//Create Template for Zoom View
//Use events to trigger Session state of zoom
//Create Helper Events to handle logic of zoom photo
