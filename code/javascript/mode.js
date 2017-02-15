/*	mode.js
		The Mode of the compiler
*/
function Mode(){
	
	this.any=true;						// Usage of type any
	this.decl=true;						// Declaraion is Possible
	this.auto=true;						// Auto Declaration
	this.terminator=true;				// Terminator at end of a Statement
	this.lexer=Features(true);			// Settings for the lexer
	this.reset=true;					// Reset the symbol Table???
	this.lib=false;						// Library compilation
	
	this.mode='p';	// Can be i(nstruction) or p(rogram)
	
	this.set=function(feature) {
 		this.lexer=features.user=feature;
 		typingLevel.user=stdTypingLevel[Number(feature.typing)];
	}	
	
	this.get=function(){
		return typingLevel[mode];
	}
	
	this.program=function() {
		this.mode="p";
		this.reset=true;
		this.terminator=true;
	}
	
	this.instruction=function() {
		this.mode="i";
		this.reset=false;
		this.terminator=false;
	}
	
	this.terminatorOn=function () {
		this.terminator=true;	
	}
	
	this.terminatorOff=function () {
		if (this.mode=='i') {
			this.terminator=false;	
		}
	}
	
	this.library=function() {
		this.lib=true;
		this.reset=true;
		for (var field in typingLevel.library) this[field]=typingLevel.library[field];
		this.lexer=features.library;
	}
	
	this.user=function() {
		this.lib=false;
		for (var field in typingLevel.user) this[field]=typingLevel.user[field];
		this.lexer=features.user;
	}
	
	
	// A Typing Level 
	function TypingLevel(any,decl,auto) {
		this.any=any;		// Usage of type any
		this.decl=decl;		// Declaraion is Possible
		this.auto=auto;		// Auto Declaration
	}
	
	var stdTypingLevel = [ 
							new TypingLevel(true,false,true),	// Untyped
							new TypingLevel(true,true,true),	// Optional Declaration
							new TypingLevel(true,true,false),	// Declaration with optional Type
							new TypingLevel(false,true,false)	// Strict Typing
						 ];
	
	var typingLevel= {
		"library" :stdTypingLevel[1],
		"user"	  :stdTypingLevel[1]
	}
	
	var features={
		"library" : Features(true),
		"user"	  : Features(false)
	}
	
 }
 
// Standard Language Features, all on (except javascript) and declaration optional with type any
 function Features(js) {
    return {	"if" 			: true,
    			"switch"		: true,
    			"do"			: true,
    			"while"			: true,
    			"for" 			: true,
    			"function"		: true,
    			"javascript"	: js,
    			"array"			: true,
    			"structure"		: true,
    			"object"		: true,
    			"typing"		: "1"
    	   };
 }	
