/*	javscript.js
		Handles included Javascript Code
*/

importScripts();

var mask;							// Mask for javascript calls needs to be set at the end of webWorker with mask=generateMask();
var usedVars={};


// Defines the elems of global scope that are allowed to use in js calls
function allowedGlobalObject(elem) {
	switch(elem) {
          // Allow:
          case "console":
          case "btoa":
		  case "atob": 	return true; 
		  break;           
          default:	  	return false;
     }
}

function generateMask(){	
	var mask = {m:undefined,l:undefined};	
    // mask global properties 
    for (var elem in this) {   	
        if (allowedGlobalObject(elem)) mask[elem] = this[elem];
        else 						   mask[elem] = undefined;
    }    
    return mask;
}

// Run a javascript sorce code
function runJS(src)
{
	try {
		// Run the code in secured enviroment
    	(new Function( "with(this) {function X(){" + src + "} new X();}")).call(mask);
	} catch (err) {
		error.msg(err.message+" in javascript");
	}
	
	console.log("useMask:");

	// Update Variables
    var elem;
	for (elem in usedVars) {
		console.log(elem+":"+mask[correctName(elem)]);
		vars[elem].fromJS(mask[correctName(elem)]);	
	}
	
    console.log("Mask:"); // Clean up mask
    for (elem in mask) if (mask[elem]!=undefined && !allowedGlobalObject(elem)) { 
    	console.log(elem+' '+mask[elem]);
    	mask[elem]=undefined;
    }
    
	console.log("GLOBAL:"); // Clean up Global declarations done in Javascript
	for (elem in this) if (!mask.hasOwnProperty(elem)) {
		console.log(elem+' '+this[elem]);
		delete(this[elem]);
	} 
}

// Use imports variables into javascript
function use() {
	console.log("use:"+arguments);
	usedVars={};
	for (var i=0;i<arguments.length;i++){
		var type=t[arguments[i].t];
		
		debugMsg ("USE-Type:"+type.name);
		usedVars[arguments[i].n]=type;
		mask[correctName(arguments[i].n)]=vars[arguments[i].n].toJS();
		debugMsg(correctName(arguments[i].n)+":"+vars[arguments[i].n].toJS());
		//mask[arguments[i].n]=v.type;	//Type	
	}

}

