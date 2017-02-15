/*class.js
*  Contains the specific variable objects
*/

var noSuperClass=null;

function Class(name,super) {
	this.name=name;
	this.super=super;
	this._$super=super;	
	this._$this=this;
	this.objectDesc=undefined;
	this.methods=[];
	this.fields=[];
	
	this.newObject=function(name){
		return new this.objectDesc(this);			
	}
		
	this.findMethod=function(name){
		if (name in methods) return methods[name];
		if (this.super) return this.super.findMethod(name);
		error.methodNotFound(name,this.name);
	}
}

function Obj(classDesc){
	 this.classDesc=classDesc;
	 this.fields=[];
		
	 this.call=function(name,classDesc,retPoint) {
		var method=classDesc.findMethod(name);	
		method(retPoint);	
	 }
		
	this.copy=function(){
		var copy=classDesc.newObject();
		for(var elem in this.fields) {
			copy.fields[elem].assign(this.fields[elem]);
		}
		push(copy);
	}
}

function ObjReference (classDesc) {
	this.obj=undefined;
	this.classDesc=classDesc;
	
	// Generate a reference for all methods und unitialized fields
	do {
		for (var method in classDesc.methods) this[method]=function(retPoint){this.obj.call(method,this.classDesc,retPoint);}
		for (var field in classDesc.fields) this[field]=undefined;
		classDesc=classDesc.super;
	} while (classDesc);
	
	this.assign=function(r) {
		this.obj=r.obj;
		var classDesc=this.classDesc;

	 	// Generate a reference for all methods
		do {		
			for (var field in classDesc.fields) this[field]=this.obj.fields[field];
			classDesc=classDesc.super;
		} while (classDesc);
	}
	
	this.copy=function(name) {
		if (this.obj) this.obj.copy();
		else error.undefinedValue(name);
	}
	
	this.toString=function(){
		if (this.value==undefined) return "&Phi;";
		var str='{';
		var prev=false;
		for(var elem in this) {
			if (this[elem] instanceof Field) {
				if (prev) str+=",";
	 			else prev=true;
				str+=correctName(this[elem].name+":"+this[elem].toString());
	 		}  
	 	}
	 	str+='}'; 
    	return str;
	}	
}













