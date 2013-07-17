  
/**    
 * Module dependencies.
 */

  var express = require('express');
  var app = express();
  var server = require('http').createServer(app);
  var io = require('socket.io').listen(server, { log: false });
  var stylus = require('stylus');


  server.listen(80);

  var Geocoder = require('./geocoder/geocoder');
  var winston = require('winston');
  var logger = new (winston.Logger)({
      transports: [new (winston.transports.Console)({ level: 'debug' })]
  })
  var geocoder = new Geocoder();
  var interactionCounter = 0;


  /* Stylus compile */
  function compile(str, path) {
     return stylus(str)
    .set('filename', path)
    .use(nib())
  }
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({secret: 'sea-animal'}));
  app.use(express.static(__dirname + '/public'))
  app.use(stylus.middleware(
    { src: __dirname + '/public'
      , compile: compile
    }
  ))
  app.set('views', __dirname + '/views')
  app.set('view engine', 'jade')


  app.get('/', function(req , res){
	  var user = req.session.user || {};
	  res.render('tweets', {title: 'Tweets'});
  }); 
 
  var websocket = null;
  io.sockets.on('connection', function (socket) {
        websocket = socket;
  });
  
  var failedLookUps = 0;
  
  var positive = 0;
  var negative = 0;

 
// Datasift Push consumer endpoint
app.post('/data', function (req, res) {	

  try {
    var body = req.body;

 	// Each interaction
  	for(i in body) {
  		
		logger.debug('Processing interaction..');	 
	 	var tweet = body[i].twitter;
	 
	  	++interactionCounter;

		// Interaction properties
		var userName = '';
		var avatar = '';
		if(body[i].interaction.author !== undefined){ // Not present for Bitly data
			userName = body[i].interaction.author.name; 
			avatar = body[i].interaction.author.avatar; 
		}
			
			
		var content = body[i].interaction.content;
		
		var interactionType = body[i].interaction.type;

		// Sentiment
		if(body[i].salience !== undefined && body[i].salience.content !== undefined && body[i].salience.content.sentiment !== undefined){
			
			var sentiment = body[i].salience.content.sentiment;
			
			if(sentiment > 0 ) {
                positive++;
            } 
            if (sentiment < 0){
                negative++;
            }
			
		}

        score = calculateRG(positive, negative);
        console.log('Positive - ' + score.positive + ' Negative ' + score.negative);

		
		// GEO Enabled?
		if(body[i].interaction !== undefined && body[i].interaction.geo !== undefined && body[i].interaction.latitude !== undefined && body[i].interaction.longitude !== undefined){
			if(websocket !== null) {
            	websocket.emit('interaction', { 
            		user : userName , 
            		text: content, 
            		lat: body[i].interaction.latitude ,
            		lon: body[i].interaction.longitude ,
                    profileImage : avatar,
					count : interactionCounter, 
                    failedLookUps: failedLookUps,
	                positive: score.positive,
	                negative: score.negative,
	                type: interactionType
				});
        	}   
		
		// No GEO - Attempt location lookup	
		} else {
			
			// Supported data types
			if(interactionType !== 'twitter' && interactionType !== 'bitly')
				continue;
			
			// Pick a location field based the data type
			var locationProp = null;
			
			if(interactionType === 'twitter' && body[i].twitter.user !== undefined && body[i].twitter.user.location !== undefined){
				locationProp = body[i].twitter.user.location;
			}
			
			if(interactionType === 'bitly' && body[i].bitly.geo_city){
				locationProp = body[i].bitly.geo_city;
			}
			
			
						
	        geocoder.geocode(locationProp, function(err, geodata) {
	            if(!err) {
	                logger.debug('Interaction [' + interactionCounter +  '] received from ' + userName + ',' + 
	                                 locationProp +  
	                                 ' Lat :' + geodata.lat + 
	                                 ' Lon :' + geodata.lon);
	                                 
		        	if(websocket !== null) {
		            	websocket.emit('interaction', { 
		            		user : userName , 
		            		text: content, 
		            		lat: geodata.lat ,
		            		lon: geodata.lon ,
		                    profileImage : avatar,
							count : interactionCounter, 
		                    failedLookUps: failedLookUps,
			                positive: score.positive,
			                negative: score.negative,
			                type: interactionType
						});
		        	} 
 
	            } else {
	                logger.debug('Could not resolve location for ' + tweet.user.location 
	                                           + ' error was this %j', err);
	                failedLookUps++;
	        	}
	       });
	 
	 	}

	}

  } catch (e){
	logger.debug(e);
  }
  res.send({"success":true});
});


           
  function calculateRG(positive, negative) {
    var total  = positive + negative;
    var green = Math.round( (positive / total) * 255 );
    var red = Math.round( (negative / total ) * 255 );
    return {
        'positive' : green,
        'negative' : red
    }
  }