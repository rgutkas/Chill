/* wwOnError.js
*	On Error Method for the web workers
*/

var _debug=false;


if (_debug) {
	// Output a message for debugging
	debugMsg = function (location) {
 			console.log(location);
	}
} else {
	debugMsg = function(location){}
}

onerror = function(msg,location,line) {
	console.log("Runtime Error in "+location+" at line "+line+" : "+msg);
}

