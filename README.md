datasift-map-stream
===================

A port of https://github.com/amithn/tweet-plotter for DataSift.
	

**Description**

Plot DataSift data and sentiment to a Goolge map in real-time using a DataSift HTTP POST Push endpoint.

Currently supports Twitter and Bit.ly data.


**Install and Usage**
 * ```NPM install```
 * Edit public/js/app/tweetstreamer.js and set the websockets host
 * Start: ```node app.js```
 * Configure a DataSift HTTP POST push destination
   * Push to the /data endpoint - http://[myhost]/data
   * Data format set to "JSON Array"
 * Start DataSift recording or historic
	
	
**Todo**
*  Config file for server host and port
*  Data type icons - bitly and twitter
*  Refactor socket emit as a reusable method
*  add support for Instagram photos
	
