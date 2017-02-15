/* stackMaschine.js
*  Provides Basic Operations on Values in assambler style with operating on a stack
*/
	
function push (v) {
	if (v==undefined) error.undefinedValue("");
	if (v.type==undefined || v.value==undefined) {
		error.undefinedValue("");
	}
	debugMsg (l+":push("+v.name+":"+v.type.name+":"+v.value+");");
	if (v.value==Infinity || v.value==-Infinity) error.arithmeticOverflow();
	
	stack.push({"value":v.value,"type":v.type});
	if (stack.length>stackSize) error.stackOverflow();
	//console.log("stack:"+stack.length);
}
	
function pop () {
	var v=stack.pop();
	if (v==undefined) error.internalError("stackMaschine.js : pop() : v is undefined");
	
	if (v.value==undefined && v.type.kind!="struct" && v.type.kind!="class" && v.type.kind!="null") { // Variable has not been initialized
		debugMsg (l+":pop("+v.name+":"+v.type.name+":"+v.value+");");
		error.undefinedValue(v.name);
	}
	return v;
}

// Check if !this is allowed
function not() {
	debugMsg ("not()");
	var l=pop();
	if(l.type.not()) {
		push(jsValue.create("_$boolean",!l.value));
	} 
}
	
// Check if this | r is allowed
function or()	{
	debugMsg (l+":or()");
	var r=pop();
	var l=stack.pop();
		 	  
	if(l.type.or(r.type)) {
		push(jsValue.create("_$boolean",l.value || r.value));
	}
}
	
// Check if this & r is allowed
function and()	{	
	debugMsg (l+":and()");
	var r=pop();
	var l=pop();
			 	 
	if(l.type.and(r.type)) {
		push(jsValue.create("_$boolean",l.value && r.value));
	}
}
	
// Check if this == r is allowed
function eq() {
	debugMsg (l+":eq()");
	var r=pop();
	var l=pop();
		 
	push(jsValue.create("_$boolean",l.type.handle().equal(l,r)));		 
}

// Check if this != r is allowed
function ne() {
	debugMsg (l+":ne()");
	var r=pop();
	var l=pop();
		
	push(jsValue.create("_$boolean",!l.type.handle().equal(l,r)));		
}
	
// Check if this > r is allowed
function gt() {
	debugMsg (l+":gt()");
	var r=pop();
	var l=pop();
			
	if(l.type.gt(r.type)) {
		push(jsValue.create("_$boolean",l.value>r.value));
	}
}
	
// Check if this < r is allowed
function lt() {
	debugMsg (l+":lt()");
	var r=pop();
	var l=pop();
			
	if(l.type.lt(r.type)) {
		push(jsValue.create("_$boolean",l.value<r.value));
	}
}
	
// Check if this >= r is allowed
function ge() {
	debugMsg (l+":ge()");
	var r=pop();
	var l=pop();
	if(l.type.ge(r.type)) {
		push(jsValue.create("_$boolean",l.value>=r.value));
	}
}
	
// Check if this <= r is allowed
function le() {
	debugMsg (l+":le()");
	var r=pop();
	var l=pop();
	if(l.type.le(r.type)) {
		push(jsValue.create("_$boolean",l.value<=r.value));
	}
}

//
function inArray() {
	debugMsg (l+":le()");
	var r=pop();
	var l=pop();
	if(l.type.inArray(r.type)) {
		for (var elem in r.value.arr) if (l.value == elem) {
			push(jsValue.create("_$boolean",true));
			return;	
		}
		push(jsValue.create("_$boolean",false));		
	}
}
	
// Check if +this is allowed
function plus() {
	debugMsg (l+":plus()");
	var l=pop();
	var type=l.type.plus();
	if(type) {
		push(jsValue.create(type.name,l.value));
	} 
}
	
// Check if -this is allowed
function minus() {
	debugMsg (l+":minus()");
	var l=pop();
	var type=l.type.minus();
	if(type) {
		push(jsValue.create(type.name,-l.value));
	}
}
	
// Check if this + r is allowed, by default everything turns into a sting with that opeartor occuring
function add() {
	var r=pop();
	var l=pop();
	debugMsg ("add("+l.value+","+r.value+")");
	var type=l.type.add(r.type);
	if(type) {
		var res;
		if (type.name=="_$integer" || type.name=="_$number" || 
		((typeof r.value)=="number" && (typeof l.value)=="number")) res=Number(l.value)+Number(r.value);
		else res=toString(l)+toString(r);
		push(jsValue.create(type.name,res));
	}
}

// Convert a value to String
function toString(value) {
	return value.type.handle().toString(value);
}
	
// Check if this - r is allowed
function sub(l,r) {
 	debugMsg (l+":sub()");
  	var r=pop();
	var l=pop();
	var type=l.type.sub(r.type);
	if(type) {
		push(jsValue.create(type.name,l.value-r.value));
	} 
}
	
// Check if this * r is allowed
function mul() {
	debugMsg (l+":mul()");
	var r=pop();
	var l=pop();
	var type=l.type.mul(r.type);
	if(type) {
		push(jsValue.create(type.name,l.value*r.value));
	}
}
	
// Check if this / r is allowed
function div() {
	debugMsg (l+":div()");
	var r=pop();
	var l=pop();
	var type=l.type.div(r.type);
	if(type) {
		var result=l.value/r.value;
		if (result==Number.POSITIVE_INFINITY || result==Number.NEGATIVE_INFINITY) error.devisionByZero();
		 	
		//Result of the devision is a floating point number
		if (type.name!="_$number" && Math.floor(result)!=result) {
			if (this instanceof _$any || r instanceof _$any) type.name=="_$number"; // One of the two operands is untyped, so result gets a number
		 	if (type.name=="_$integer") result=Math.floor(result);  // Round pure integers to the floor of
		}	 	
		push(jsValue.create(type.name,result));
	}
}
	
// Check if this % r is allowed
function mod() {
	debugMsg ("l+:mod()");
	var r=pop();
	var l=pop();
	var type=l.type.mod(r.type);
	if(type) {
		var result=l.value%r.value;
		if (isNaN(result)) error.devisionByZero();
		 	
		push(jsValue.create(type.name,result));
	}
}

		
