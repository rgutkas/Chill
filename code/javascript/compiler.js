/*	compiler.js
		The compiler implemented as Webworker
*/

importScripts('mode.js','parser.js','ast.js','symboltable.js','translator.js');


function Compiler () {
	var mode=new Mode();					// The mode of the compiler
	var parser=new Parser(mode);			// The Parser
	var translator=new Translator(mode);	// Translates and preforms semantic checks
    
    this.setMode=function(features){
    	// Set the Mode for the Compilation
    	mode.set(features);
    }
    
    this.reset=function() {
    	
    }
    
    this.checkItem=function(source) {
    	error.compileMode(mode);
    	try {
    		var parseResult=parser.parse(source,"library");	
  		} catch (err) {
  			debugMsg("compiler.checkItem(..) ... parsing failed : "+err.message+" at "+err.fileName+" line "+err.lineNumber);
  			postMessage({"type":"error","content":"Internal:" +err.message+" at "+err.fileName+" line "+err.lineNumber});
  			return false;
  		}
  		
    	if (parseResult) {  				
    		postMessage({"type":"sucess","content":"ok"});
    	} else postMessage({"type":"error","content":"parsing failed"});
    }
    
    this.library=function(source){
    	error.compileMode(mode);
    	return this.translate(source,"library");
    }
       
    this.translate=function(source,kind) {    	
    	error.compileMode(mode);
    		
 		 // Parse: Source -> {ast,symbolTable}
  		try {
  			var parseResult=parser.parse(source,kind);
  		} catch (err) {
  			debugMsg("compiler.translate(..) ... parsing failed : "+err.message+" at "+err.fileName+" line "+err.lineNumber);
  			postMessage({"type":"error","content":"Internal:" +err.message+" at "+err.fileName+" line "+err.lineNumber});
  			return false;
  		}
 
		// Syntax Error occured
  		if (!parseResult)	return false;		
  			 
  		debugMsg(parseResult);
  
  		// Translate: AST -> Source
  		try {
			var translation=translator.translate(parseResult,kind=="library");	 
  		} catch (err) {
 	 		debugMsg("compiler.translate(..) ... parsing failed : "+err.message+" at "+err.fileName+" line "+err.lineNumber);
 	 		postMessage({"type":"error","content":"Internal:" +err.message+" at "+err.fileName+" line "+err.lineNumber});
  			return false;
  		}
  		//if (translation && kind=="instruction") translation+="done();";
  		console.log("Translation:");
  		console.log(translation);
  		return translation;   	
    }
    
    function correctName(name) {
    	name=name.slice(2,name.length);
    	if (name=="any") return "";
    	else return name;
    }
    
    
}




