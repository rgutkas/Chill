/* error.js
*	error handling
*/

function correctName(str) {
	return str.replace(/_/g,"").replace(/\$/g,"");
}

// An Error Object (one entry in the Error List) - Stores the Message, and Position of the Error
var error=new function() {
	
	// Did any error occure?
 	this.occured = false;
 	var enable=true;
 	var add;
 	var typeCheck=true;

	this.add=function(message,line) {
 		debugMsg("Error:add("+message+","+line+")");
 		
 		this.occured=true;
 		if (enable) postMessage({"type":"error","content":correctName(message),"line":line}); 
 	}
 	
 	this.isEnabled=function() {
 		return enable;
 	}
 	 	
 	this.enable=function() {
 		debugMsg("error.enable()");
 		enable=true;
 	}
 	
 	this.disable=function() {
 		debugMsg("error.disable()");
 		enable=false;
 	}
 	
 	this.reset=function() {
 		debugMsg("Resetting error");
 		this.occured=false;
 		enable=true;
 	}
 	
 	this.compileMode=function(mode){
 		add=semAdd(this);	
 		typeCheck=!mode.any;
 		this.reset(); 
 	}
 	
 	this.runtimeMode=function(){
 		add=runAdd(this);
 		typeCheck=true;
 		this.reset(); 
 	}
 	
 	
 	//Semantic Errors
 	function semAdd(errorHandler){
 		return function(msg,line) {
 			errorHandler.add(msg,line);
 		}
 	}
 	
 	this.expected=function(name,kind,what,line) {
 		debugMsg("Error.expected("+line+")");
 		add(kind+" "+name+" is not "+what,line);	
 	}
  	
 	this.variableExpected=function(name,kind,line) {
 		debugMsg("Error.variableExpected("+line+")");
 		this.expected(name,kind,"a variable",line);	
 	}
 	
 	this.functionExpected=function(name,kind,line) {
 		debugMsg("Error.functionExpected("+line+")");
 		this.expected(name,kind,"a function",line);	
 	}
 	
 	this.structureExpected=function(name,kind,line) {
 		debugMsg("Error.structureExpected("+line+")");
 		this.expected(name,kind,"a structure",line);	
 	}
 	
 	this.classExpected=function(name,kind,line) {
 		debugMsg("Error.structureExpected("+line+")");
 		this.expected(name,kind,"a class",line);	
 	}
 	
 	this.structOrClassExpected=function(name,kind,line){
 		debugMsg("Error.structOrClassExpected("+name+","+line+")");
 		this.expected(name,kind,"a structure or class",line);
 	}
 	
 	this.fieldExpected=function(fieldName,name,line){
 		debugMsg("Error.fieldExpected("+fieldName+","+name+","+line+")");
 		this.expected(fieldName,"","a field of "+name,line);
 	}
 	
 	this.arrayExpected=function(name,kind,line){
 		debugMsg("Error.arrayExpected("+name+","+line+")");
 		this.expected(name,kind,"an array",line);
 	}
 	
 	this.typeExpected=function(name,kind,line){
 		debugMsg("Error.builtInExpected("+name+","+line+")");
 		this.expected(name,kind,"a type",line);
 	}
 	
 	this.notDeclaredIdentifier=function(name,line) {
 		debugMsg("Error.notDeclaredIdentifier("+line+")");
 		add("Identifier "+name+" is not declared",line);
 	}
 		
 	this.wrongParameterCount=function(name,expeted,line) {
 		debugMsg("Error.wrongParameterCount("+line+")");
 		add("Function "+name+" expects "+expeted+" parameters",line);
 	}
 	
 	this.wrongAmountOfBounds=function(name,line){
 		debugMsg("Error.wrongAmountOfBounds("+name+","+line+")");
 		add("Wrong amount of bounds in "+name,line);
 	}
 	
 	this.doublicatedIdentifier=function(name,line) {
 		debugMsg("Error.doubleIdentifier("+name+")");
 		add("Doublicated Identifier " + name,line);
 	}
 	
 	this.redefinitionOfProperty=function(elem,childName,parentName) {
 		debugMsg("Error.redefinitionOfProperty("+elem+")");
 		add("Declaration of "+elem+" in "+childName+" must be identical to "+elem+" in "+parentName);	
 	}
 	
 	this.declareBeforeUse=function(name,kind,line) {
 		debugMsg("Error.declareBeforeUse("+name+","+kind+","+line+")");
 		if (kind!=undefined) {	
 			add(kind+" "+name+" must be declared before use",line);	
 		}
 	}
 	
 	// Type Missmatch can occure during compilation and runtime
 	this.typeMissMatch=function(op,lType,rType) {
 		debugMsg("Error.typeMissMatch("+lType+op+rType+");");
 		if (typeCheck) {
 			var statement;
 			if (rType==undefined) statement=op+" "+lType;
 			else statement=lType+" "+op+" "+rType;
 			add("Types don't match in ("+statement+")",line);
 		}
 	}
 	
 	
 	// % Calculations are only valid with integer values
 	this.modOnlyValidWithInteger=function() {
 		debugMsg("Error.modOnlyValidWithInteger();");
 		if (typeCheck) {
 			add("% may only be used with integer values",line);
 		}
 	}
 
 	// Runtime Errors
 	function runAdd(errorHandler){
 		return function(msg) {
 			errorHandler.add(msg,l);		
 			throw({"fileName":"Runtime","message":msg+", execution terminated!","lineNumber":l});
 		}
 	}	
 	
 	this.internalError=function(msg) {
 		add(msg);
 	};
 	
 	this.devisionByZero=function() {
 		debugMsg("Error.devisionByZero");
 		add("Devision by zero");	
 		
 	}
 	
 	this.arithmeticOverflow=function() {
 		debugMsg("Arithmetic Overflow");
 		add("Arithmetic overflow");	
 		
 	}
 	
 	this.paramTypeMissMatch=function(expectedType,receivedVar) {
 		debugMsg("Error.typeMissMatch()");
 		add("Type Miss Match - Parameter "+receivedVar.name+" is type of " + receivedVar.type.name + ", should be type of "+expectedType);
 	}
 	
 	this.arrayDimensionMissMatch=function(){
 		debugMsg("Error.arrayDimensionMissMatch()");
 		add("Array dimensions don't  match");
 	}
 	
 	this.indexOutOfBound=function(name){
 		debugMsg("Error.indexOutOfBound()");
 		add("Index out of bound");
 	}
 	
 	this.notAllowedOperator=function(name,operator) {
 		debugMsg("Error.notAllowedOperotr()");
 		add("Wrong parameter count in call of function "+name);
 	}	
 	
 	this.undefinedValue=function(name) { 		
 		var start;
 		
 		if (name==undefined) start="Value";						// No name is true for value's
 		else if (name.slice(0,6)=="object") start="Reference to Object "+name.slice(7,name.length);// Object Reference
 		else if (name.slice(0,3)=="ret") start="Return value";  // A Return Value's Name starts with ret
		else start="Value of Variable "+name; 			        // It's a variable

		add(start+" is not defined ");
 	}
 	
 	this.assignmentToConstant=function(name) {
 		 debugMsg("Error.assignmentToConstant("+name+");");
 		if (name==undefined) name="";
 		add("Assignment to constant "+name+" more than once");
 	}
 	
 	this.fieldNotFound=function(fieldName,objName) {
 		 debugMsg("Error.fieldNotFound("+fieldName+");");
 		if (objName==undefined) objName="";
 		add("Could not find property "+fieldName+" of object "+objName);
 	}	
 	
 	this.cannotAccess=function(type,fieldName){
 		if (typeof fieldName!="string") fieldName="[]";
 		debugMsg("Error.cannotAccess("+type+","+fieldName+");");
		add("Can't access "+fieldName+" of "+type);
 		
 	}
 	
 	this.methodNotFound=function(methodName,objName) {
 		 debugMsg("Error.methodNotFound("+methodName+");");
 		if (objName==undefined) objName="";
 		add("Could not find function "+methodName+" of object "+objName);
 	}	
 	
 	this.stackOverflow=function() {
 		debugMsg("Error.stackOverflow();");
 		add("Stackoverflow");
 	}	
 	
 	this.tooMuchRecursion=function() {
 		debugMsg("Error.stackOverflow();");
 		add("Too much recursion");
 	}
 	
 	this.msg=function(msg) {
 		add(msg);	
 	}
}

// List of Occured error during translation
function SynError(lexer) {
//	this.constructor();
	var error=this;
	
	// add a new error
	function add(message) {		
		debugMsg (lexer.errorDistance);
		if (lexer.errorDistance<=0) error.add(message,lexer.current.line/*,this.lexer.current.column*/);
		lexer.recover();
 	}
 	
 	this.reservedWord=function(token,line) {
 		error.add('Usage of keyword "'+token+'" is not permitted',line);
 	}
 		
 	this.eof = function() {
 		debugMsg("Error.eof()");
 		add("Unexpected end of input");
 	}
 	
 	this.unterminated=function(what,line) {
 		error.add("Unterminated "+what,line);
 	}
 			
 	this.expected= function(what,apostroph) {
 		if (apostroph==undefined) apostroph="'";
 		debugMsg("Error.expected("+what+")");
 		add(apostroph+what+apostroph+" expected, but '"+lexer.current.content+"' found");
 	};
 		
 	this.identifierExpected = function() {
 		debugMsg("Error.identifierExpected()");
 		this.expected("Identifier","");
 	};
 		
 	this.expressionExpected=function() {
 		debugMsg("Error.expressionExpected()");
 		this.expected("Expression","");
 	};
 	
 	this.assignmentExpected=function() {
 		debugMsg("Error.assignmentExpected()");
 		this.expected("Assignment","");
 	}
 		
 	this.factorExpected=function() {
 		debugMsg("Error.factorExpected()");
 		this.expected("Factor","");
 	};
 		
 	this.codeBlockExpected=function() {
 		debugMsg("Error.codeBlockExpected()");
 		this.expected("CodeBlock","");
 	};
 				
 	this.unknownType=function(type) {
 		debugMsg("Error.unknownType("+type+")");
 		add("Type "+type+"has not been declared yet");
 	};
 		
 	this.unknownSatement=function() {
 		debugMsg("Error.unknownStatement()");
 		add("Unknown statement");
 	};
 	
 	this.tooMuchInput=function() {
 		debugMsg("Error.tooMuchInput()");
 		add("Too Much Input");
 	}
 	
 	this.javascriptNotPermitted=function() {
 		debugMsg("Error.tooMuchInput()");
		add("Usage of javascript-code is not permitted");
 	}
 
 		 		
 }SynError.prototype=Object.create(error);
 SynError.prototype.constructor = SynError;
 
 
 