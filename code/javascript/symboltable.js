/*	symboltable.js
		The symbol table for type checking
*/

 	
function SymbolTable() {
	
	var currentScope; // The current scope
 	var universe,libraryUniverse;
	this.library=false;
	
//	var typeNames;
	 	
// 	var error=new SemError(); // Error Handler	
 	
 	
 	this.init=function(reset,library) { 		
 		if (libraryUniverse==undefined ||
 			(reset && library) 				) libraryUniverse=new Scope(0,null,
 					  									 					{
 														 						"_$boolean" 		: new Entry("type","_$boolean"),
 																				"_$integer" 		: new Entry("type","_$integer"),
 																				"_$number"  		: new Entry("type","_$number"),
 																				"_$character"		: new Entry("type","_$character"),
 																				"_$string"			: new Entry("type","_$string"),
 																				"_$any"				: new Entry("type","_$any")
 														  					}
 										  								);
 		if (library) universe=libraryUniverse;	
 		else if (universe==undefined || reset || universe==libraryUniverse) universe=new Scope(0,null,clone(libraryUniverse.tab));	
 		
 		currentScope=universe;
 	}
 	
 		
 	this.openScope=function() {
 		currentScope=new Scope(currentScope.level+1,currentScope);
 		debugMsg("SymbolTable Enter Level "+currentScope.level);
 		return currentScope;
 	}
 	
 	this.closeScope=function() {
 		currentScope=currentScope.prevScope;
 		debugMsg("SymbolTable Enter Level "+currentScope.level);
 	}
 	
 	this.get=function(name) {
 		return currentScope.get(name);
 	}
 	
 	this.addArray=function(name,type,bounds) {
 		currentScope.add(name,new ArrayEntry(type,bounds));
 		t.addArray(name,type,bounds);

 	}
 	
 	
 	this.addClass=function(name,extend,scope) {
 		if (currentScope.add(name,new ClassEntry(name,scope))) {
 			t.addClass(name,"class",extend);
 	//		typeNames.push(name);
 			return true;
 		} else {
 			return false;
 		}
 	}
 	
 	this.addStruct=function(name,scope) {
 		if (currentScope.add(name,new StructEntry(name,scope))) {
 			t.addClass(name,"struct");
 			//typeNames.push(name);
 			return true;
 		} else {
 			return false;
 		}
 	}
 	
 	this.addVar=function(name,type,constant) {
 		return currentScope.addVar(name,type,constant);
 	}
 	
 	
 	this.addFunction=function(name,retType,paramType) {
 		return currentScope.add(name,new FunctEntry(retType,paramType));
 	}
 	
 	this.getUniverse=function(){
 		return universe;
 	}
	
	function Scope(level,prevScope,tab) {
		if (tab!=undefined) this.tab=tab;
		else this.tab=[];
		this.level=level;
		this.prevScope=prevScope;	//The Previous Scope;
	
		this.add=function(name,entry) {
 			debugMsg("Scope."+this.level+".add("+entry.kind+" "+name+")")
 			if (this.isAvailable(name)) {
 				this.tab[name]=entry;
 				return entry;
 			} else {
 				error.doublicatedIdentifier(name);
 				return false;
 			}
 		}
 		
 		this.addVar=function(name,type,constant) {
 			if (constant) return this.add(name,new ConstantEntry(type));
 			else return this.add(name,new VariableEntry(type));
 		}
 		
 		this.get=function(name,subLevel) {
 			var ret=this.tab[name]; // Retive the entry according to name
 			if (ret) return ret;	// If sucessfull return it
 			if (this.prevScope) return this.prevScope.get(name,true); //Look in the previous scope
 			return false;	//Not found previous scope & not Top Level ==> flase
 		}
 		
 		this.addObjectElements=function(thisTypeName,parentTypeName){
 			this.add("_$this",new ConstantEntry(thisTypeName));
 			this.declare("_$this");
 			if (parentTypeName!=undefined) { this.add("_$super",new ConstantEntry(parentTypeName));
 											 this.declare("_$super");
 											}
 		}
 		
 		// Find all entires with matching names in two scopes
 		this.extend=function(childName,parentName,parentScope){		
 						
 			for (elem in parentScope.tab) {			
 					
 				if (this.tab[elem]==undefined) {
 					this.tab[elem]=parentScope.tab[elem]; // Make Parent properties visible in the child scope
 				}
				else { // If Property is redefined		
					// Check if the elements do match
					var child=this.tab[elem];
					var parent=parentScope.tab[elem];
					
					if (child.kind!=parent.kind 
					|| (child.kind=="variable" && child.name!="_$this" && child.name!="_$super")
					|| (child.kind=="array" && child.bounds.toString()!=parent.bounds.toString())  
					|| (child.kind=="function" && elem!="construct" && child.paramType.toString()!=parent.paramType.toString())) 
					   error.redefinitionOfProperty(elem,childName,parentName);										
				} 
 			} 			
 		}
 		
 		/* Is the given name still available - Is the given name not stored in the name list
 		 * Genrates an Error if the name isn't available any more
 		*/
 		this.isAvailable=function(name){
 			if ((name in this.tab /*|| typeNames.indexOf(name)!=-1*/) && name!="construct" ) return false;
 			else return true;
 		}; 		
 		
 		/* Checks if the given name is declared
 		* Doesn't generate an Error
 		*/
 		this.inThisScope=function(name){
 			if (name in this.tab) return true;
 			return false;
 		} 
 		
 		this.isNotDeclared=function(name) {
 			var entry=this.get(name);
			 if (!entry) return true;
			 if (entry.isDeclared==undefined) return false; // is Declared not set ==> no declare before use strategy return true
		     return !entry.isDeclared;

 			 
 		}
 		
 		this.declare=function(name){
 			 var entry=this.get(name);
			 if (!entry) return false;
			 if (entry.isDeclared==undefined) return false; // Not found  or declared not set ==> return false 
			 entry.isDeclared=true;
 		}
	}	
	
	//Clones a scope
	function clone(array) {
    
  		var newArr = []; 
    	for (var key in array) newArr[key] = array[key];
 		return newArr;
	}
	
	
	
	
	function Entry(kind,type,isDeclared) {
 		this.kind=kind;				// The kind of the entry (class,struct,variable,constant,array,function)
 		this.type=type;				// Name of the type of the entry
 		this.isDeclared=isDeclared;	// Has been declared allready only needed for elements with declare before use strategy;
 	}
 
	function ClassEntry(name,scope) {
	 	this.constructor("class",name);
 		this.scope=scope;
 	}ClassEntry.prototype=new Entry();

	function StructEntry(name,scope) {
	 	this.constructor("struct",name);
 		this.scope=scope;
 	}StructEntry.prototype=new Entry();

	function VariableEntry(type) {
 		this.constructor("variable",type,false)
	}VariableEntry.prototype=new Entry();
 	
 	function ConstantEntry(type) {
 		this.constructor("constant",type,false);
	}ConstantEntry.prototype=new Entry();
 
 	function ArrayEntry(type,bounds) {
 		this.constructor("array",type,false);
		this.bounds=bounds; 	
	 }ArrayEntry.prototype=new Entry();

 	function FunctEntry(retType,paramType) {
 		this.constructor("function",retType);
	 	this.paramType=paramType;
 	}FunctEntry.prototype=new Entry();
	
 }
 


