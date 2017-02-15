/*	compiler.js
		The compiler implemented as Webworker
*/

importScripts('wwOnError.js','error.js','type.js','compiler.js','runtime.js');


var compiler=new Compiler();		// The Compiler
var line=1;							// Line Number 
var varReport;		
var predefinedItems="";			  
var speed=0;  
    
onmessage = function(msg) {
  debugMsg("webWorker.onmessage("+msg.data.type+","+msg.data.kind+")");
  
  switch (msg.data.type) {
  	 	
  	case "features":
  		debugMsg(msg.data.features);
  		compiler.setMode(msg.data.features);
  	break;
  	
  	case "reset":
  		compiler.reset();
  		runTime.reset(true);
  	break;
  	
  	case "library":
  		
		var source="";
		for (index in msg.data.source) source+="\n"+msg.data.source[index];
  		debugMsg("item source: \n"+source);

  		var translation=compiler.library(source);
  		if (translation) runTime.library(translation);
  		else postMessage({"type":"error","content":"In Predefined Items, please inform you're teacher","line":""});
  	break;
  	
  	// Compile a given source
  	case "execute":

  		var translation=compiler.translate(msg.data.source,msg.data.kind);
  		
  		if (!translation) postMessage({"type":"finished"});
  		else {  
  			postMessage({"type":"executing"});
  			runTime.stepInto(translation);
  		}
 	 break;
 	 
 	 // Enter a source to debug
 	 case "debug":
 	 	var translation=compiler.translate(msg.data.source,msg.data.kind);
 	 	if (!translation) postMessage({"type":"finished"});
 	 	else runTime.stepInto(translation);
 	 break;
 	 
 	 // Make a step
 	 case "step":
 	 	runTime.step();
 	 break;
 	 
 	 // Run through
 	 case "run":
 	 	postMessage({"type":"executing"});
 	 	runTime.stepThrough();
 	 break;
 	 
 	 case "item":
 	 	debugMsg("msg.data.source:"+msg.data.source);
 	 	compiler.checkItem(msg.data.source);
 	 break;
 	 
 	 default:
 	 	console.log("Unknown Message received in webWorker.js : "+msg.data.type);
 	 break;
  }
};


mask=generateMask(); // The general Mask for js-calls of the system





