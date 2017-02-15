/*  reloadFrames.js
*	reloades all frames of a window
*/    	

function reloadFrames () {
	for (var i=0; i<frames.length; i++)
  	{
  		frames[i].location.reload();
  	}
}