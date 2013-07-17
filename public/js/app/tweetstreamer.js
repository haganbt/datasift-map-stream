    
    
     var map;
     function initialize() {
            var myLatlng = new google.maps.LatLng(-25.363882,131.044922);
            var mapOptions = {
              center: new google.maps.LatLng(-34.397, 150.644),
              zoom: 2,
              mapTypeId: google.maps.MapTypeId.ROADMAP
            };
            map = new google.maps.Map(document.getElementById("map-canvas"),mapOptions);
     }
    
    $(document).ready(function() {
        var socket = io.connect('http://ec2-54-216-159-184.eu-west-1.compute.amazonaws.com/');
        socket.on('tweet', function (tweet) {

            var tweetLatLon = new google.maps.LatLng(tweet.lat, tweet.lon);     
            
            var infoWindowText = '<div id="content">' + 
                                 '<div id="bodyContent">' + 
                                 '<img src=' +  tweet.profileImage + ' /><br />' + 
                                 tweet.text + '<br />[ ' + tweet.type +   
                                 ' ]</div>' + 
                                 '</div>';
            
            var infowindow = new google.maps.InfoWindow({
                     content: infoWindowText,
                     maxWidth: 200
            });


            var marker = new google.maps.Marker({
                            position: tweetLatLon,
                            map: map,
                            title: '@' + tweet.user,
                            animation: google.maps.Animation.DROP
            });
            
            google.maps.event.addListener(marker, 'click', function() {
                    infowindow.open(map,marker);
            });
            
            $('#positive').html(Math.round((tweet.positive / 255) * 100) + ' % ');             
            $('#negative').html(Math.round((tweet.negative / 255) * 100) + ' % ');             
            $('#tweetcount').html(tweet.count);             
            $('#failed-lookups').html(tweet.failedLookUps);         
	        
            emotion = 'rgb(' + tweet.negative + ', ' + tweet.positive + ', ' + '0)'; 
            //console.log('emotion is ' + emotion);
             
            $('#page-body').css({'background-color': emotion});

        });
            google.maps.event.addDomListener(window, 'load', initialize);
   });    
        
