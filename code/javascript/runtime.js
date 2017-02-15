/*	runtime.js
		The runtime enviroment
*/

importScripts('value.js','literal.js','variable.js','stackMaschine.js','javascript.js');

var undef="ø"						// Display Undefined Value
var obj;							// Object Handler for new Operator
var type;							// Type Handler for Struct and Class Creation
var runTime=this;					// Pointer to the Runtime system, which is actually this worker
var varReport;
var stackSize=5000;					// Max Stack entries
var recursionLimit=200000;			// Max Scopes that can be created
var stack=[];				       	// Stack

var global=[];						// Global Declarations
var vars=[];						// Variables
var funct=[];						// Functions
var lib=[];							// Library Functions
var x=[];							// Sections
var y=[];							// Library Sections (Predefined Items)
var nextStep;
var mask;							// Mask for javascript calls needs to be set at the end of webWorker with mask=generateMask();

this.library=function (code) {
	this.reset(false);
	try	{
		eval(code);
	} catch (err) {
		postMessage({"type":"error","content":"Error in predefined items :"+err.message.replace(/_\$/g,"")+" at line:"+err.lineNumber});
	}
	clean("l");
}


// Jump taking one step and stop
function jump(dest,line) {
	debugMsg("jump("+dest+","+line+")");
	nextStep=dest;
	reportPublicVariables();
	postMessage({"type":"step","line":line});
}

this.stepInto=function(code,kind) {
	error.runtimeMode();
	run(eval,code);
}

this.step=function(){
	run(nextStep);
}

this.stepThrough=function(){
	error.runtimeMode();
	run(nextStep);	
}

this.reset=function(report){
	while (s.count>0) s.exit(true);
	stack=[];
	vars=[];
	if (report) {
		reportPublicVariables();
		postMessage({"type":"sucess","content":"Ready","line":""});
	}
}

function run(dest,param1,param2){
	debugMsg("run");
	error.runtimeMode(); 
	setTimeout(function(){
  						try {
  							dest(param1,param2);
  						} catch(err) {
  							debugMsg(err.fileName+" : "+err.message+" at line:"+err.lineNumber);			
  							// If it's a javascripterror display it
  							if (!error.occured) postMessage({"type":"error","content":"Internal:"+err.message.replace(/_\$/g,"")+" at line:"+err.lineNumber});
  							
  							//Clean up
  							while (s.count>0 && !(s.exit() in {"i":true,"l":true})); 
							clean();
  							postMessage({"type":"finished"});
  							return;
  						}
  				},0);
}

function done(mode,line){
	debugMsg("done("+mode+");");
	reportPublicVariables(mode);
	var res=stack.pop();
  	if (res==undefined) postMessage({"type":"sucess","content":"ok","line":line});
  	else {
  		var value=toString(res);
  		if (typeof res.value=="string") value='"'+value+'"';
  		postMessage({"type":"sucess","content":value});
  	}
  	clean(mode);
  	for (var elem in this) if (elem=="u") {debugMsg(elem+":"); debugMsg(this[elem]);}
}  

function clean(mode){
	debugMsg("vars:");
  	console.log(vars);
  	debugMsg("funct:");
  	debugMsg(funct);
  	debugMsg("x:");
  	debugMsg(x);
  	debugMsg("y:");
  	debugMsg(y);
  	debugMsg("stack:");
  	debugMsg(stack);
	stack=[];
	switch (mode){
		case "i":
			funct=[];
			for (elem in lib) funct[elem]=lib[elem];
		break;
		case "l":
			for (elem in funct) lib[elem]=funct[elem];
		break;
	}
}

function reportPublicVariables(){
	var varList=[];
	var elem;
	var value;
	var type;
	for (var elem in vars) {
		if (typeof global[elem].value=="string") value='"'+global[elem].toString()+'"';
		else value=global[elem].toString();
		if (global[elem].untyped) type=false;
		else type=correctName(global[elem].type.name);
		varList.push({"type":type,"name":correctName(vars[elem].name),"value":value});
	}
     postMessage({"type":"variables","content":varList});
}




