var CLIENTID = '4e7f292665474f8fae3820d7f336f164';
var markersArray = [];
var instaArray = [];

Meteor.startup(function(){
  Session.set('photoset', '');
  Session.set('zoomed', ''); 
  getTwitter();
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(successFunction, errorFunction);
  } else {
      alert('It appears that Geolocation, which is required for this web page application, is not enabled in your browser. Please use a browser which supports the Geolocation API.');
  }

  function successFunction(success) {
      var navLatLng = newLatLng(success);
      getNewPhotos({lat: success.coords.latitude, lng: success.coords.longitude, distance:'3000', client_id: CLIENTID});
      createMap(navLatLng);
      placeNavMarker(navLatLng);
      addClickListener();
      addAutocomplete();
  }

  function errorFunction(success) {
    // alert("You've disabled your geolocation... So here are some pretty pictures of the Golden Gate bridge... You can always click around on the map or use the search to see more photos");
    var latlng = new google.maps.LatLng(37.808631, -122.474470);
    getNewPhotos({lat: latlng.lat(), lng: latlng.lng(), distance:'3000', client_id: CLIENTID});
    createMap(latlng);
    placeClickMarker(latlng);
    addClickListener();
    addAutocomplete();
  }
});

Template.instagram.helpers({
  photoset: function(){
    return Session.get('photoset');
  },
});

Template.instagram.time = function () {
  return moment(this.created_time).fromNow();
}

Template.main.events({
  'click .photo': function(event){
    $('.photo').addClass('greyed');
    if (Session.equals('zoomed', '')) {
      $('<input type="submit" value="close" class="close">close').appendTo('#zoomed-image');
      $('<img id=".zoomed" src='+this.images.standard_resolution.url+' alt="">').appendTo('#zoomed-image');
      Session.set('zoomed', this.images.standard_resolution.url);
    } 
  },
  'click .popupPhoto': function(event){
    console.log(event.target);
    $('.photo').toggleClass('greyed');
    if (Session.equals('zoomed', '')) {
      $('<img src='+event.target.src+' alt="">').appendTo('#zoomed-image');
      $('<input type="submit" value="close" class="close">close').appendTo('#zoomed-image');
      Session.set('zoomed', event.target.src);
    } else{
      $('#zoomed-image').children().remove();
      Session.set('zoomed', '');
    }
  },
  'click #zoomed-image': function(event){
      $('#zoomed-image').children().remove();
      Session.set('zoomed', '');
      $('.photo').removeClass('greyed');
  },
  'mouseenter .photodiv': function(event){
    $(event.target.children[0]).addClass('greyed')
    for (var i =1; i < event.target.children.length; i++){
      $(event.target.children[i]).show("easing");
    }
  },
  'mouseleave .photodiv': function(event){
    $(event.target.children[0]).toggleClass('greyed')
    for (var i =1; i < event.target.children.length; i++){
      $(event.target.children[i]).hide("easing");
    }
  }
});

//GOOGLE MAPS HELPERS

function newLatLng(success) {
   return new google.maps.LatLng(success.coords.latitude, success.coords.longitude);
}

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

function addClickListener() {
  google.maps.event.addListener(map, 'click', function(event){
    var currentPos = {lat: event.latLng.lat(), lng: event.latLng.lng(), dist: '1000'};

    placeClickMarker(event.latLng);
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
    placeClickMarker(place.geometry.location);
    map.setCenter(place.geometry.location);
    map.setZoom(15);
  });
}

function placeNavMarker(latLng) {
  var image = "http://gmaps-samples.googlecode.com/svn/trunk/markers/blue/blank.png";
  var blueIcon = new google.maps.Marker({
      position: latLng,
      map: map,
      icon: image
  });
}
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

function addInfoWindow(data, instaMarker, i){
  var username = data[i].user.username;
  var caption;
  if ( !data[i].caption ) {
    caption = "No Comment.."
  } else {
    caption = data[i].caption.text 
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

function deleteInstaMarkers() {
  if (instaArray) {
    for (i in instaArray){
      instaArray[i].setMap(null)
    }
  }
  instaArray.length = 0;
}

function placeClickMarker(location) {
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

//INSTA HELPERS

function onJsonLoaded (json) {
  if (json.meta.code == 200) {
    var show = json.data;
    placeInstaMarkers(show, map);
    Session.set('photoset', show);
    $(event.target.children[1]).hide();
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


