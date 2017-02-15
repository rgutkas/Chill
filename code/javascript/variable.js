/*variable.js
*  Contains the specific variable objects
*/

// Program
var p= new function() {
	this.enter=function(mode){
	debugMsg (line+":p.enter()");
		if (mode=="l" && s.count>0) return; // Don't create another Instruction Scope
		if (mode=="i" && s.count>1) return; // Don't create another Instruction Scope
		s.enter(mode);
	}
	
	this.exit=function(mode) {
		debugMsg("p.exit"+mode)
		if (mode=="l") var retVal={"type":t._$any,"value":initComplete};
		else if (stack.length>0) var retVal=pop();
		else var retVal={"type":t._$any,"value":ok};
		debugMsg(stack);
		f.exit(retVal.type.name,retVal);
		if (mode=="p") while (s.count>1) s.exit();
	}
}

// Scope Organize Scoping -- Creating and restoring variables,functions in their scopes
var s = new function() {			
	var cur=[];		  				 	// The current s
	var prev=[];						// Backup declared Variables of the previous Scopes...
	
	function Scope(name,elements) {
		this.name=name;
		this.elements=elements;
	}
	
	this.count=function() {
		return prev.length;
	}
	
	this.enter=function(name){
		debugMsg (line+":s.enter("+name+")");
		prev.push(new Scope(name,cur));
		cur=[];
		if (prev.length>recursionLimit) error.tooMuchRecursion(); 
	}
	
	this.add=function(name){
		debugMsg (line+":s.add("+name+")");
		cur[name]=true;
	}
	
	this.exit=function(reset){
		debugMsg (line+":s.exit()");	
		
		if (prev.length==0) {
			debugMsg("s.exit(): Nothing more to exit");
			return "p";
		}
		
		if (reset==undefined) {
			// Leave Instruction & Library Scope untouched
			switch(prev[prev.length-1].name) {
				case "i": return "i";
				break;
				case "l":     return "l";
				break;
			};
		}
		
		
		
		// for each variable in the scope
		for (var elem in cur) g.free(elem);
		
		// Restore the previous Scope
		var tmp=prev.pop();
		if (tmp) {
			cur=tmp.elements;
			return tmp.name;
		}
	}
}

// Globals -- Create and Free Functions and Variables in the Global Scope
var g=new function() {	
	var prevScopes=[];
	
	this.create=function(name,elem){
		debugMsg (line+":g.create("+name+")");

		//Backup a previously existing variable with the same name;
		if (!backup(name)) eval(name+"=undefined;");
		s.add(name);
		return global[name]=elem;
	}
	
	this.assign=function(name) {
		debugMsg (line+":g.assign("+name+")");
		global[name].assign();
	}
	
	this.get=function(name) {
		debugMsg (line+":g.get("+name+")");
		return global[name];
	}
	
	this.free=function(name) {
		debugMsg (line+":g.free("+name+")");
		global[name]=restore(name);
		if (global[name]==undefined) {
			if (name in vars) delete(vars[name]);
			if (name in funct) delete(funct[name]);
			delete (global[name]);
		}
	}
	
	function backup(name) {
		debugMsg (line+":g.backup("+name+")");
		if (prevScopes[name]==undefined) prevScopes[name]=[];
		if (global[name]==undefined) return false;
		prevScopes[name].push(global[name]);
		return true;
	}
	
	function restore(name) {
		debugMsg (line+":g.restore("+name+")");
		return prevScopes[name].pop();
	}
}

// Create an Element that can be assigned to (such as Variable, Array, Field,...)
var a=new function () {
	
	this.create=function(typeName,name,constant) {
		debugMsg("a.create("+typeName+","+name+","+constant+")");
		if (name==undefined) name=""; 
		
		// Initialize the bluePrint for an Object to be assigned to
		var bluePrint= {	"name"			:   name,
							"value"			: 	this.initValue(typeName),
							"type"			: 	t[typeName],
							"untyped"		:   false, 
							"assign"		: 	function(r) {
													if (r==undefined) r=pop();
													if (this.untyped) anyValue.assign(this,r);
													else if (this.type.assign(r.type)) this.type.handle().assign(this,r);
												},
							"access"		: 	function(elem){
													return this.type.handle().access(this,elem);
												},						
							"toString"  	:   function() {
													return this.type.handle().toString(this);
												},
							"toJS"			:   function() {
													return this.type.handle().toJS(this);
												}, 
							"fromJS"		: 	function(jsValue) {
													if (constant==undefined || constant == false) this.type.handle().fromJS(this,jsValue);
												},					
							"a" 			:  	true
						};
		
		if (bluePrint.type.kind=="any")	bluePrint.untyped=true;
		
	
		// If Constant Assignment function changes to error after first assignment
		if (constant!=undefined) if (constant){
				bluePrint["assignOnce"]=bluePrint.assign;
				bluePrint.assign=function(r){
					this.assignOnce(r);
					this.assign=function(r) {error.assignmentToConstant(this.name)};
				}
			
		}
		return bluePrint;
	}
	
	// Set Value Properties for Array, Struct & Class and change assign function for Javascript default types					
	this.initValue=function(typeName){
		debugMsg("initValue("+typeName+")");
		switch (t[typeName].kind) {
			case "array"	: 	return new ArrayValue(t[typeName],t[typeName].bound);
			break;
		
			case "class"	: 	return null;
			break;
		
			default			:   return undefined;	
			break;
		}
	}
}

// Variables
var v= new function() {	
	this.create=function(name,typeName) {
		debugMsg (line+":v.create("+name+","+typeName+")");
		vars[name]=g.create(name,a.create(typeName,name));
	}
}

/*var array=new function() {
	this.create=function(name,typeName,bounds) {
		debugMsg (line+":array.create("+name+","+typeName+","+bounds+")");
		g.create(name,a.create(typeName,name,undefined,bounds));
	}	
}*/

// Constants
var c=new function() {
	this.create=function(name,typeName) {
		debugMsg (line+":c.create("+name+","+typeName+")");
		vars[name]=g.create(name,a.create(typeName,name,true));
	}
}

// Function --- Entering and exiting Functions
var f = new function() {
	
	this.create=function(name,reference){
		funct[name]=g.create(name,reference);	
	}
	
	this.enter=function(functBody,param){	
		var body="{debugMsg (line+':f.enter('+retPoint+')'); s.enter(retPoint);"; 
					
		// Generate Globals for Object Properties
		body+="if (fields!=undefined) for (var elem in fields) {vars[elem]=g.create(elem,fields[elem]);}";
		
		// Generate Globals for Object Methods
		body+="if (methods!=undefined) for (var elem in methods) g.create(elem,methods[elem]);";
		
		body+="s.enter();";
		
		//Create and Assign the parameters	
	 	for (var i=param.length-1;i>=0;i--) {
	 		body+="vars['"+param[i].n+"']=g.create('"+param[i].n+"',a.create('"+param[i].t+"','"+param[i].n+"',"+param[i].c+",'"+param[i].b+"'));";
	 		body+="g.assign('"+param[i].n+"');";
	 	}
	 	
	 	// Jump to Funktion Body			
	 	body+="run("+functBody+");"; 
		body+="}";
		return new Function ("retPoint","fields","methods",body);
	}
	
	this.exit=function(retTypeName,retVal,lineInCode){	
		for (var retPoint=undefined; retPoint==undefined; retPoint=s.exit()); // Restore scopes until function scope is reached 
		debugMsg (line+":f.exit("+retPoint+","+retVal+")");
		
		// Return Value
		if (retTypeName==undefined) retTypeName="_$any";
		if (retVal!=undefined) t[retTypeName].assign(retVal.type);
		else retVal={"type":t[retTypeName],"value":undef};

		push(retVal);
		
		// Return
		switch (retPoint) {
			case "p": 		        if (lineInCode==undefined) lineInCode=l;
									jump(done,lineInCode);
			break;
			case "l":
			case "i":     run(done,retPoint)// Exit
			break;
			default:				run(eval,retPoint+"()");    // Jump to the Return Point
		}				   
	}
}

// Objects
var o= new function() {
	function createBluePrint(type) {
		var obj={	"type"		: 	type,
					"parent"    :   null,
					"_$this"    :   null,
					"_$super"	:   null,
					"fields"	:  	{},					
				};	// Create Empty Object
		
		
		// Add Fields
		for (var elem in type.fields) obj.fields[elem]=a.create(type.fields[elem].typeName,type.fields[elem].name,type.fields[elem].constant,type.fields[elem].bounds);
		
		// Create Parents
		if (type.parent.name!="_$any") obj.parent=createBluePrint(type.parent);
		return obj;
	}
	
	
	this.create=function(className){
		debugMsg("o.create("+className+");");
		var obj=createBluePrint(t[className]); //Create Object
		obj.value=obj;
		
		//Add this and super pointer
		// Create this field
		obj._$this=a.create(obj.type.name,'_$this','constant',undefined);

		// Create super layers
		for (var current=obj; current.parent; current=current.parent) {
			current._$super=a.create(current.parent.type.name,'_$super','constant',undefined);
			current._$super.assign({'value':current.parent,'type':current.parent.type}); //Set super for each layer
			current.parent._$this=obj._$this; // Set this for parent
		}

		// Set this Property
		obj._$this.assign({'value':obj,'type':obj.type}); // Set this

		return obj;			
	}
	 
/*	 this.copy=function(obj){
	 	debugMsg("o.copy("+obj+")");

	 	if (obj==undefined) error.undefinedValue("object");
		var copy=this.create(obj.className);
		for (var tmp=copy;tmp;tmp=tmp.parent) {
			for(var elem in tmp.fields) tmp.fields[elem].assign(findField(obj,elem.name));
		}
		return copy;
	}*/
	
	this.findField=function(obj,fieldName){
		debugMsg("o.findField("+fieldName+")");
		debugMsg(obj);
		if (obj==null) error.undefinedValue("object");
		if (fieldName=="_$this") return obj._$this;
		if (fieldName=="_$super") return obj._$super;
		
		if (fieldName in obj.fields) return obj.fields[fieldName];
		if (obj.parent) return this.findField(obj.parent,fieldName);
		 error.fieldNotFound(fieldName,obj.name);
	}
	
	this.call=function(obj,methodName) {
		var method=findMethod(obj.type,methodName);
		if (method==undefined) return undefined;
		
		var fields=getFields(obj);
		var methods=getMethods(obj);		
		return function (retPoint) {
						debugMsg("o.call("+obj+","+methodName+","+retPoint+")");
						method(retPoint,fields,methods);	
		}
	 }
	
	function getFields(obj) {
		debugMsg("o : getFields("+obj+")");
		var fields=[];
		fields["_$this"]=obj._$this;
		if (obj._$super) fields["_$super"]=obj._$super;
		for(;obj;obj=obj.parent) {
			for (var elem in obj.fields) if (fields[elem]==undefined) fields[elem]=obj.fields[elem];
		}
		return fields;
	}
	
	function getMethods(obj) {
		debugMsg("o : getMethods("+obj+")");
		var methods=[];
		for(var current=obj.type;current;current=current.parent) {
			for (var elem in current.methods) if (methods[elem]==undefined) methods[elem]=current.methods[elem];
		}
		return methods;
	}
		
	function findMethod (type,methodName){
		debugMsg("o : findMethod("+obj+","+methodName+")");
		if (methodName in type.methods) return type.methods[methodName];
		if (type.parent) return findMethod(type.parent,methodName);
		return undefined;
	}
}








