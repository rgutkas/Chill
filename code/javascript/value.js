/* value.js
*  Contains the specific value objects
*  Provides Basic Operations on Values
*  Provides Literals
*/

importScripts("third-party/is_int.js");

var ok={};				//Special Value for ok
var initComplete={};	// Special Value for initialisation Completed

/*
* Built in	types
*/
function Value(type,value) {
	this.type=t[type];
	this.value=value;
}
				
var jsValue= new function() {					
	this.create=function(typeName,value) {
		debugMsg ("Value.create("+value+")");
		return lit[typeName].lookUp(value);
	}
	
	this.assign=function(thisValue,r) {
		thisValue.value=r.value;
	}
	
	this.access=function(thisValue,index) {
		if (index!=undefined) {
			if (typeof index!="string") index="[..]";
			error.cannotAccess(thisValue.type.name,index);
		} else return thisValue.value;
	}
	
	this.toString=function(thisValue,propQuote){	
		if (thisValue.value==undefined) return undef;
		if (propQuote!=undefined && typeof thisValue.value=="string") return propQuote+thisValue.value.toString()+propQuote;
		return thisValue.value.toString();
	}
	
	this.equal=function(l,r) {
		if(l.type.eq(r.type)) {
		   var tmp;
	 	   switch (l.type.kind) {
	 	 	  	case "array":   tmp=arrayValue.equal(l,r);
	   		 	break;
	   		 	case "struct":  tmp=structValue.equal(l,r);
	   		 	break;
	   		 	case "class": 	
				default: 		tmp=l.value==r.value;
			}
			return tmp;
		}
	}
	
	this.toJS=function(thisValue){
		console.log(thisValue.name+":"+thisValue.type.name+":"+typeof thisValue.value);
		return thisValue.value;
	}
	
	this.fromJS=function(thisValue,jsValue){
		var type=typeof jsValue;
		console.log(type);
		switch (type) {
			//JS - Standard
		 	case "string": if (jsValue.length<2) type="character";
		 	break;
			case "number": if (is_int(jsValue)) type="integer";
			break;
			case "boolean":
			break;	
			case "undefined": type="any";
			break;
			default: 
		}
		thisValue.assign({type:t["_$"+type],value:jsValue});
	}
}	

/*
 * Value Constructors for Built In Types
 */
function _$any(value) {
	this.constructor('_$any',value);	
}_$any.prototype=new Value();
	
function _$boolean(value) {
	this.constructor('_$boolean',value);
}_$boolean.prototype=new Value();
		
function _$integer(value) {
	this.constructor('_$integer',Number(value));
}_$integer.prototype=new Value();
	
function _$number(value) {
	this.constructor('_$number',Number(value));
}_$number.prototype=new Value();
	
function _$character(value) {
	this.constructor('_$character',value);
}_$character.prototype=new Value();

function _$string(value) {
	this.constructor('_$string',value);
}_$string.prototype=new Value();
			
/*
 *  Array's
 */
function ArrayValue(type,bound) {
	this.arr=[];
	this.iterat=[];
	this.key=undefined;
	this.bound=bound;
	this.type=type;
		
	this.access=function (index) {
		debugMsg("accsess")
		return arrayValue.access(this,index);
	}
	
	this._$length=function () {
				debugMsg("length")

		return arrayValue.length(this);
	}	
	
	this._$keys=function () {
		
				debugMsg("keys")

		return arrayValue.keys(this);
	}
	
	this.first=function () {
				debugMsg("first")

		return arrayValue.first(this);
	}
	
	this.next=function () {
				debugMsg("next")

		return arrayValue.next(this);
	}
}

var arrayValue = new function() {		
	function create(value,index) {
		if (value.arr[index.value]==undefined) {
	//		if (value.bounds.length) value.arr[indexValue]=a.create(value.type.name,undefined,false,value.bounds);
			value.arr[index.value]=a.create(value.type.type.name,undefined,false);
			if (value.key==undefined) value.key={"type":t["keys"+value.type.name],"value":new ArrayValue(t["keys"+value.type.name],t["keys"+value.type.name].bound)};
			var tmp=a.create(index.type.name,undefined,true);
			tmp.assign(index);
			value.key.value.arr.push(tmp);
		}
	}
	
	this.assign=function(thisValue,r) {
		thisValue.value.key=undefined;
		thisValue.value.type=r.value.type;
		thisValue.value.bound=r.value.bound;
		if (r.value.key!=undefined) {
			for(var elem in r.value.key.value.arr) {
				var index=r.value.key.value.arr[elem];
				this.access(thisValue,index).assign(this.access(r,index));			
			}
		} else {
			thisValue.value.arr=[];	
			thisValue.value.iterator=[];
		}
	}	
	
	this.access=function(thisValue,index) {
		if (typeof index == "string") {
			switch (index) {
				case "_$length": return lit['_$integer'].get(thisValue.value.arr.length);
				break;
				case "_$keys": return thisValue.value.key;
				break;
				default: error.cannotAccess("an array",index);
				break;
			}
		} 
		thisValue.value.bound.assign(index.type);
		create(thisValue.value,index);
		return thisValue.value.arr[index.value];
	}
	
	this.toString=function(thisValue,propQuote) {
		var prev=false;
		var str;
		if (propQuote==undefined){
			str='[';
			
			for (var elem in thisValue.value.arr) {
				if (prev) str+=",";
			 	else prev=true;
			 	str+=thisValue.value.arr[elem].toString(); 
		 	}
	 		str+=']';
    		
    	} else {
    		str='{';		
			for (var elem in thisValue.value.arr) {
				if (prev) str+=",";
			 	else prev=true;
			 	str+=propQuote+elem+propQuote+":"+thisValue.value.arr[elem].toString(propQuote); 
		 	}
	 		str+='}';
    	}
    	return str;
	}
    
    this.length=function(value) {
    	return lit['_$integer'].get(value.arr.length);
    }	
    
    this.equal=function(l,r) {
		if (l.value.arr.length != r.value.arr.length) return false;
	
 		for (var elem in thisValue.value.arr) if (!value.equal(l.value.arr[elem],r.value.arr[elem])) return false;
		return true;
	}
	
	this.keys=function(value) {
		return value.key;
	}
	
	this.first=function(value) {
		value.iterat=[];
		for (var elem in value.arr) value.iterat.push(value.arr[elem]);	// Create the iterator array
		this.next(value);
	}
	
	this.next=function(value) {
		var next=value.iterat.shift();								// Get the next Element
		if (next==undefined) push(lit["_$boolean"].get(false)); 	// No more Element in the array
		else {														// Return next Element in the array
			push (next);												
		//	push(new Value(value.bound.name,next));
			push(lit["_$boolean"].get(true));
		}											
	}
	
	this.toJS=function(thisValue){
		var newArr=[];
		Object.defineProperty(newArr, "_$type", {
    		enumerable: false,
    		writable: true
		});
		newArr._$type=correctName(thisValue.type.name);
		var keys=thisValue.value.key.value.arr;
		var arr=thisValue.value.arr;
		for (elem in keys) {
			var key=keys[elem].value;
			newArr[key]=arr[key].toJS();
		}
		return newArr;
	}
	
	this.fromJS=function(thisValue,jsValue){
		if (t["_$"+jsValue._$type]==undefined) error.msg("_$type not specified in javascript array");
		thisValue.type.assign(t["_$"+jsValue._$type]);	
		thisValue.value=a.initValue("_$"+jsValue._$type);
		var index=a.create(thisValue.value.type.bound.name,undefined,false);
		var value=a.create(thisValue.value.type.type.name,undefined,false);
		jsValue.forEach(function (v,i,a) {
			index.fromJS(i);
			value.fromJS(v);
			thisValue.access(index).assign(value);	
		});
		/*for (elem in jsValue) {
			console.log(typeof elem+" "+elem+":"+typeof jsValue[elem]+" "+jsValue[elem]);

			
		}	*/
	}
}


/*
 *  Structures
 */
/*function StructValue () {
	this.toString=function(){
		return structValue.valueToString(this);
	}
}*/

var structValue = new function() {
	function create(thisValue){
		if (thisValue.value==undefined){
			thisValue.value={};
			for (var elem in thisValue.type.fields) thisValue.value[elem]=a.create(thisValue.type.fields[elem].typeName,thisValue.type.fields[elem].name,thisValue.type.fields[elem].constant);	
		}
	}
	
	this.assign=function(thisValue,r) {
		if (r.value!=undefined) {
			create(thisValue);
			for(var elem in thisValue.value) {
				if (thisValue.value[elem].a!=undefined) thisValue.value[elem].assign(r.value[elem]);
			}
		}
	}

	this.access=function(thisValue,field) {
		if (typeof field!="string") error.cannotAccess("a structure","[..]");
		create(thisValue);
		if (field in thisValue.value) return thisValue.value[field];
		else error.cannotAccess("a structure",field);
	}
	
	this.toString=function(thisValue,propQuote) {
		if (propQuote==undefined) propQuote="";
		create(thisValue);
		var str='{';
		var prev=false;
		for(var elem in thisValue.value) {
			if (thisValue.value[elem].a!=undefined) {
				if (prev) str+=",";
	 			else prev=true;
	 			str+=propQuote+correctName(thisValue.value[elem].name)+propQuote+":";
	 			if (thisValue.value[elem].value==undefined) str+=undef;
	 			else str+=thisValue.value[elem].toString(propQuote);
	 		}  
	 	}
	 	str+='}'; 
    	return str;
	}	
	
	this.equal=function(l,r) {
		if (l.value==undefined && r.value == undefined) return true;
		if (l.value==undefined) return false;
		if (r.value==undefined) return false; 
		
		for (var elem in l.value) {
			if (l.value[elem].a!=undefined) {
				if (!value.equal(l.value[elem],r.value[elem])) return false;
			}
		}
		return true;
	}
	
	this.toJS=function(thisValue){
		if (thisValue.value==undefined) return undefined;
		var jsValue={};
		Object.defineProperty(jsValue, "_$type", {
    		enumerable: false,
    		writable: true
		});
		jsValue._$type=correctName(thisValue.type.name);
		var fields=thisValue.type.fields;
		for (var elem in fields) {
			jsValue[correctName(elem)]=thisValue.value[elem].toJS();
		}
		return jsValue;
	}
	
	this.fromJS=function(thisValue,jsValue){
		thisValue.value=undefined;
		for (elem in jsValue)thisValue.access("_$"+elem).fromJS(jsValue[elem]);
	}
	
}


/*
 *  Object References
 */


var objectReference=new function () {
	this.assign=function(a,r) {
		a.value=r.value; 
	}
	
	this.access=function(thisValue,name) {
		if (typeof name!="string") error.cannotAccess("an object","[..]");

		if (thisValue.value==null) error.undefinedValue(thisValue.name);
		var method=o.call(thisValue.value,name);
		if (method) return method;
		else return o.findField(thisValue.value,name);
	}
	
	/*this.copy=function(thisValue,name) {
		if (thisValue.obj) this.assign(o.copy(thisValue.obj));
		else error.undefinedValue("object"+name);
	}*/
	
	this.toString=function(thisValue,propQuote) {
		if (thisValue.value==null) return "null";
		if (propQuote==undefined) propQuote="";
		var str='{';
		var prev=false;
		for (var obj=thisValue.value; obj; obj=obj.parent)
			for(var elem in obj.fields) {
				if (obj.fields[elem].a!=undefined) {
				if (prev) str+=",";
	 			else prev=true;
				str+=propQuote+correctName(obj.fields[elem].name)+propQuote+":"+obj.fields[elem].toString(propQuote);
	 		}  
	 	}
	 	str+='}'; 
    	return str;
	}	
	
	this.toJS=function(thisValue){
		if (thisValue.value==null) return null;
		var jsValue={};
		Object.defineProperty(jsValue, "_$type", {
    		enumerable: false,
    		writable: true
		});
		jsValue._$type=correctName(thisValue.type.name);
		var fields=thisValue.type.fields;
		for (var elem in fields) {
			jsValue[correctName(elem)]=thisValue.value.fields[elem].toJS();
		}
		return jsValue;
	}
	
	this.fromJS=function(thisValue,jsValue){
		if (jsValue==null) thisValue.value=null;
		for (elem in jsValue) thisValue.access("_$"+elem).fromJS(jsValue[elem]);	
	}
}

var anyValue= new function() {					
/*	this.create=function(typeName,value) {
		debugMsg ("Value.create("+value+")");
		return type.handle().create(type.);
	}*/
	
	this.assign=function(thisValue,r) {
		debugMsg("anyValue.assign("+thisValue.type.name+","+r.type.name+")");
		if (thisValue.type!=r.type) {
			thisValue.type=r.type;
			thisValue.value=a.initValue(r.type.name);
			thisValue.type.handle().assign(thisValue,r);				
		} else {
			if (thisValue.type.name=="_$any") thisValue.value=r.value; /*******/
			else thisValue.type.handle().assign(thisValue,r);
		}		
	}
	
	this.access=function(thisValue,index) {
		/* if (thisValue.type.name!="_$any") */return thisValue.type.handle().access(thisValue,index);
		/* else {
		 	switch (typeof thisValue.value){
		 		case "undefined":
		 		case "string":
		 		case "number":
		 		case "boolean": return jsValue.access(thisValue,index);
		 		break;
		 		case "null":    return objectReference.access(thisValue,index);
		 		break;
		 		case "object":  if (thisValue.value==undefined) return structValue.access(thisValue,index);
		 						else if (thisValue.value==null) return objectReference.access(thisValue,index);
		 						else if (thisValue.value.arr!=undefined) return arrayValue.access(thisValue,index);
		 						else if (thisValue.value.fields!=undefined) return objectReference.access(thisValue,index);
		 						else return structValue.access(thisValue,index);
		 		break;
		 	}
		 }*/
	}
	
	this.toString=function(thisValue){	
		if (thisValue.value==undefined) return undef;
		if(thisValue.type.name!="_$any") {
			thisValue.type.handle().toString(thisValue);
		} else {
			switch(thisValue.value) {
				case ok				: return "ok";
				case initComplete	: return "Ready";
				default				: return String(thisValue.value);
			}
		}
	}
	
	this.equal=function(l,r) {
		l.type.handle().equal(l,r);
	}
		
		
	this.toJS=function(thisValue){
		if (thisValue.type.name!="_$any") return thisValue.type.handle().toJS(thisValue);
		else return undefined;
	}	
	
	this.fromJS=function(thisValue,jValue){
		if (jValue._$type==undefined) jsValue.fromJS(thisValue,jValue);
		else {
			var type=t["_$"+jValue._$type];
			if (type==undefined) error.msg("Unknow type specified in javascript variable");
			switch (t["_$"+jValue._$type].kind) {
				case "array": arrayValue.fromJS(thisValue,jValue);
				break;
				case "class": objectReference.fromJS(thisValue,jValue);
				break;
				case "struct": structValue.fromJS(thisValue,jValue);
				break;
				default: error.msg("Can't convert javascript variable of kind "+t["_$"+jValue._$type].kind);
			}
		}
	
	}
}



