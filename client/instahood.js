var CLIENTID = '115c041ed2674786a9b047417174c1bc';
var markersArray = [];
var instaArray = [];
var initPos = {lat: '37.7750', lng: '-122.4183', distance:'5000', client_id: CLIENTID}

Meteor.startup(function(){
  Session.set('photoset', '');
  Session.set('zoomed', ''); 
  getNewPhotos(initPos);
  getTwitter();
  navigator.geolocation.getCurrentPosition(function(success){
    createMap(success);
    addClickListener(success);
    placeNavMarker(success);
  });
  addAutocomplete();
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
    $('#photos-container').toggleClass('greyed');
    if (Session.equals('zoomed', '')) {
      $('<button class="close btn">close</button>').appendTo('#zoomed-image');
      $('<img src='+this.images.standard_resolution.url+' alt="">').appendTo('#zoomed-image');
      Session.set('zoomed', this.images.standard_resolution.url);
    } else{
      // $('#container').removeClass('greyed');
      $('#zoomed-image').children().remove();
      Session.set('zoomed', '');
    }
  },
  'click .popupPhoto': function(event){
    console.log(event.target);
    $('#photos-container').toggleClass('greyed');
    if (Session.equals('zoomed', '')) {
      $('<img src='+event.target.src+' alt="">').appendTo('#zoomed-image');
      Session.set('zoomed', event.target.src);
    } else{
      // $('#container').removeClass('greyed');
      $('#zoomed-image').children().remove();
      Session.set('zoomed', '');
    }
  }
  // 'mouseenter .photo': function(event){
  //   $(event.target).addClass('greyed');
  //   var parent = $(event.target).parent();
  //   parent.append('<h2><span>'+ this.user.username +'<br />'+this.likes.count+'</span></h2>')
  // },
  // 'mouseleave .photo': function(event){
  //   $(event.target).removeClass('greyed');
  //   var parent = $(event.target).parent();
  //   parent.remove('<h2><span>'+ this.user.username +'<br />'+this.likes.count+'</span></h2>');
  // }
});

//GOOGLE MAPS HELPERS

function createMap(success) {
  var latLng = new google.maps.LatLng(success.coords.latitude, success.coords.longitude);
  var mapOptions = {
    // mapTypeControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM},
    streetViewControl: false,
    // navigationControlOptions: {
    //   position: google.maps.ControlPosition.LEFT_BOTTOM
    // },
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
    console.log(searchPos)
    getNewPhotos(searchPos);
    placeClickMarker(place.geometry.location);
    map.setCenter(place.geometry.location);
    map.setZoom(15);
  });
}

function placeNavMarker(success) {
  var latLng = new google.maps.LatLng(success.coords.latitude, success.coords.longitude);
  var image = "http://gmaps-samples.googlecode.com/svn/trunk/markers/blue/blank.png";
  var blueIcon = new google.maps.Marker({
      position: latLng,
      map: map,
      icon: image
  });
}
function placeInstaMarkers(data) {
  for (var i = 0; i < data.length; i++) {
    var latLng = new google.maps.LatLng(data[i].location.latitude, data[i].location.longitude); 
    var image = '/instagram-shadow.png';
    var instaMarker = new google.maps.Marker({
        // setAnimation: google.maps.Animation.DROP,
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
    // deleteInstaMarkers(this);
    infowindow.open(map, this);
    instaArray.push(instaMarker);
  });
}

// function deleteInstaMarkers() {
//   if (instaArray) {
//     for (i in instaArray){
//       instaArray[i].close(map)
//     }
//   }
//   instaArray.length = 0;
// }

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

function onJsonLoaded (json) {
  if (json.meta.code == 200) {
    var show = json.data;
    placeInstaMarkers(show);
    Session.set('photoset', show);
    // momentizePhotoset();
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

function momentizePhotoset(){
  var photos = Session.get('photoset')
  for ( i in photos ){
    // debugger;
    photos[i].created_time_human = function(){
      return moment(photos[i].created_time).fromNow();
    }
  }
  console.log(photos[0].created_time_human());
}

