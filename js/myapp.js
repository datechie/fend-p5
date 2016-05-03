'use strict';
// global variable for the info window
var infoLoc;

// Define the ViewModel
function ViewModel (){
	var self = this;
	// 5 Default Thai Restaurant Details
	self.thaiRestaurants = [
		{
			name: "Banh Thai Restaurant",
			city: "Fremont",
			state: "CA",
			position: {lat: 37.560621, lng: -121.990357},
			marker: null
		},
		{
			name: "Le Moose Crepe Cafe",
			city: "Fremont",
			state: "CA",
			position: {lat:  37.536083, lng: -121.998373},
			marker: null
		},
		{
			name: "Green Champa Garden",
			city: "Fremont",
			state: "CA",
			position: {lat:  37.540918, lng: -121.990357},
			marker: null
		},
		{
			name: "Beyond Thai",
			city: "Fremont",
			state: "CA",
			position: {lat:  37.561213, lng: -121.999184},
			marker: null
		},
		{
			name: "Chef Chai Thai Cuisine",
			city: "Fremont",
			state: "CA",
			position: {lat:  37.526886, lng: -121.98499375},
			marker: null
		},
	]

	var map, marker;
  	self.restaurant = ko.observableArray(self.thaiRestaurants);

	// Initialize the Map
	function initMap() {
		// Latitude, Longitude for map center
		var myLatLng = {lat: 37.548606, lng: -121.988477};

		// Additional map options
		var mapOptions = {
			disableDefaultUI: true,
			center: myLatLng,
			scrollwheel: false,
			zoom: 14,
			zoomControl: true,
			zoomControlOptions: {
				position: google.maps.ControlPosition.RIGHT_BOTTOM
			}
		};

		// Create a new map object and specify the DOM element for display.
		map = new google.maps.Map(document.getElementById('map'), mapOptions);

		// We define the infoLoc to be used later with the infoWindow
		infoLoc = new google.maps.InfoWindow({
    		content: ""
		});

		var pointMarkers = []; //array to show the place Markers on the map

		// Create a marker and set its position.
		for (var i = 0;i < self.restaurant().length; i++) {
				var tempRes = self.restaurant()[i]; // Defining a temp variable to get each value and then use it below
				marker = new google.maps.Marker({
					map: map,
					position: new google.maps.LatLng(tempRes.position),
					title: tempRes.name,
					draggable: true,
					animation: google.maps.Animation.DROP,
					icon: 'images/thai.png' // icon gotten from https://mapicons.mapsmarker.com
				});
				// Add marker to our location
				tempRes.marker = marker;
				pointMarkers.push(marker);
		}

		// Display the markers
	  	for (var i = 0; i < pointMarkers.length; i++) {
	      	pointMarkers[i].setVisible(true);
	  	}

		// We use this function for the data binding in the html and will also call it below for the click listener
	    self.showPlace = function (loc) {
                toggleBounce(loc.marker); // bounce function call
                yelpInfo(loc, map); // yelp api call function
	    };

	    // Add a click listener to the marker
		self.restaurant().forEach(function (loc) {
			var marker = loc.marker;
            google.maps.event.addListener(marker, 'click', function () {
            	self.showPlace(loc);
            });
        })

		// Function to bounce the marker for 2 seconds on click
		function toggleBounce(marker) {
		  if (marker.getAnimation() !== null) {
		    marker.setAnimation(null);
		  } else {
		    marker.setAnimation(google.maps.Animation.BOUNCE);
		    setTimeout(function () {
		          marker.setAnimation(null);
		      }, 2000);
		  	}
		}

	}

	// We use a second array for search filtering with the knockout framework
	self.searchFilter = ko.observable('');
	var filter;
	self.filterPlaces = ko.computed(function () {
        return ko.utils.arrayFilter(self.restaurant(), function (place) {
        	filter = self.searchFilter().toLowerCase();
            var isDisplay = (place.name.toLowerCase().indexOf(filter)) >= 0 ? true : false;
            if (place.marker) {
                if (isDisplay) {
                    place.marker.setVisible(true);
                } else {
                    place.marker.setVisible(false);
                }
            }
            return isDisplay;
        });
    })

	google.maps.event.addDomListener(window, 'load', initMap);
}

// Function to get restaurant details via the yelp API
function yelpInfo (loc, map)
{
	// This is required with oauth
	function nonce_generate() {
		return (Math.floor(Math.random() * 1e12).toString());
	}

	var yelp_url = 'https://api.yelp.com/v2/search?';

	// Required parameters
	var parameters = {
		term: loc.name,
		location: loc.city,
		oauth_consumer_key: "_QrOLPgd8nGC-tuNJcxtUA",
		oauth_token: "c8U06Cl3cxLeNqHMvRsTalU6Q9NV8PXT",
		oauth_nonce: nonce_generate(),
		oauth_timestamp: Math.floor(Date.now()/1000),
		oauth_signature_method: 'HMAC-SHA1',
		callback: 'cb'
	};

	var consumer_secret = "ndJTUrL82MqEYBsKSd0Wa_oQyOw",
		token_secret = "Qcx4LmyTqaWZ8sUoZ1e10hqlqVs";

	var encodedSignature = oauthSignature.generate('GET',yelp_url, parameters, consumer_secret, token_secret);
	parameters.oauth_signature = encodedSignature;

	var contentString; // This variable will be used with the infoWindow function

	var settings = {
	    url: yelp_url,
	    data: parameters,
	    cache: true,
	    dataType: 'jsonp',
	    jsonpCallback: 'cb',
	    success: function(data) {
	      	// Now we create the content to display data in the info window using the results
	      	// console.log("SUCCCESS! %o", data); /* This is for debugging to look at the returned data */
			contentString =
            	'<div class="infoWindow"><h1 class="infoWindowTitle">' + data.businesses[0].name + '</h1>' +
            	'<h4><strong>Restaurant Details From Yelp:</strong></h4>' +
				'<ul><li><h4>Rating: ' +
            	'<img src="' + data.businesses[0].rating_img_url + '"</h4></li>' +
            	'<li><h4> Phone: <br/>' + data.businesses[0].display_phone + '</h4></li>' +
            	'<li><h4> Address: <br/>' + data.businesses[0].location.display_address.join('<br/>') +
    			'</h4></li></ul>' +
            	'</div>';
            // We now set the infoWindow content
  			infoLoc.setContent(contentString);
			infoLoc.open(map, loc.marker);
	    },
	    error: function(error) {
			// On error we will display the error message in the console
			console.log(error);
	    }
	};

	// Send AJAX query via jQuery library.
	$.ajax(settings);

}

function initialize() {
	ko.applyBindings(new ViewModel());
}