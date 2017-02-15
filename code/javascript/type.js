/* type.js
*  For Type Checking
*/


var t={
	// Descriptor of all Types 
	
	reset				: 	function(){
								this.classes=init();
								this.arrayDescriptor=initArray();
								this.untypedDescriptor=initUnTyped();
							 },	
	
	addClass			: 	function(name,kind,extend) {
								// Create Class Descriptor
								this[name] = new ClassType(name,kind,extend);
							},
	addArray			 : 	function(name,typeName,bounds) {
								//Create Array Descriptor
								this[name]=new ArrayType(name,typeName,bounds);
								this["keys"+name]=new ArrayType("keys"+name,bounds,"_$integer");
							}
							
};
	
// Type for Null Value  
t["null"]	= new ClassType("null","null");
	
function ClassType(name,kind,extend) {
		debugMsg("ClassType("+name+","+kind+","+extend+")");

		this.name=name; 		// The name of a class (Used types start with an _$)
		this.kind=kind;			// Class, Struct, ...
		
		this.children=[]; 		// The Classes that extend the current class
		this.parent=null;   	// The Parent Class
		
		this.fields=[]			// Properties
		this.methods=[];		// Methods
				
		if (extend==undefined || extend=='null') {
			if (this.name!="_$any") this.parent=t["_$any"]; 	// By default extend _$any
		} else {
			this.parent=t[extend];    	  // Extend the given class
		}
		
		this.handle=function() {
			switch (this.kind) {
				case "any"		:   return anyValue;
				break;
				case "array"	: 	return arrayValue;
				break;
		
				case "struct"	: 	return structValue;
				break;
		
				case "class"	: 	return objectReference;
				break;
		
				default			: 	return jsValue;
				break;
			}
		}
		
		//Add a subclass
		this.addChild=function (child) {
			this.children.push(child);	
		}
		
	
		if (this.parent!=undefined && this.name!=undefined && this.name!="_$any") {
			this.parent.addChild(this);		  // Tell the class that this class extends it
		}
		
	
		// Checks for type equality
		// returns child
		this.check=function(r) {
			
			// For Null Value
			if (this.kind=="class" &&  r.kind=="null") return this;
			
			// Check asymetric equality
			if (this.name==r.name) return r;
			for (var i=0; i<this.children.length; i++) {
				var child=this.children[i].check(r);
				if (child) return child;
			}
			return false;
		}
			
		// Check if r can be assigned to this
		this.assign=function(r) {
			if(this.check(r)) return r;
			error.typeMissMatch("=",this.name,r.name);	
			return false;		
		}
	
		// Check if !this is allowed
		this.not=function() {
			 error.typeMissMatch("!",this.name);			 
			 return false;
		}
	
		// Check if this | r is allowed
		this.or=function(r)	{
			 error.typeMissMatch("|",this.name,r.name);			 
			 return false;	
		}
	
		// Check if this & r is allowed
		this.and=function(r)	{
			error.typeMissMatch("&",this.name,r.name);			 
			return false;
		}
	
		// Check if this == r is allowed
		this.eq=function(r) {
			if (this.check(r) || r.check(this)) return t._$boolean;
			error.typeMissMatch("==",this.name,r.name);
			return false;
		}
	
		// Check if this != r is allowed
		this.ne=function(r) {
			if (this.check(r) || r.check(this)) return t._$boolean;
			error.typeMissMatch("!=",this.name,r.name);
			return false;
		}
	
		// Check if this > r is allowed
		this.gt=function(r) {
			error.typeMissMatch(">",this.name,r.name);
			return false;
		}
	
		// Check if this < r is allowed
		this.lt=function(r) {
			error.typeMissMatch("<",this.name,r.name);
			return false;
		}
	
		// Check if this >= r is allowed
		this.ge=function(r) {
			error.typeMissMatch(">=",this.name,r.name);
			return false;
		}
	
		// Check if this <= r is allowed
		this.le=function(r) {
			error.typeMissMatch("<=",this.name,r.name);
			return false;
		}
		
		// Check if this in r is allowed
		this.inArray=function(r) {
			if (r.kind=="array") return this.eq(r.bound);
			error.arrayExpected(r.name,r.kind,line);
	 		return false;
		}
	
		// Check if +this is allowed
		this.plus=function() {
			error.typeMissMatch("+",this.name);
			 return false;
		}
	
		// Check if -this is allowed
		this.minus=function() {
			error.typeMissMatch("-",this.name);
			 return false;
		}
	
		// Check if this + r is allowed, by default everything turns into a sting with that opeartor occuring
		this.add=function(r) {
			 return t._$string;
		}
	
	    // Check if this - r is allowed
		this.sub=function(r) {
			 error.typeMissMatch("-",this.name,r.name);
			 return false;
		}
	
		// Check if this * r is allowed
		this.mul=function(r) {
			 error.typeMissMatch("*",this.name,r.name);
			 return false;
		}
	
		// Check if this / r is allowed
		this.div=function(r) {
			 error.typeMissMatch("/",this.name,r.name);
			 return false;
		}
	
		// Check if this % r is allowed
		this.mod=function(r) {
			 error.typeMissMatch("%",this.name,r.name);
			 return false;
		}
		
		// to String function, which every Object has got
		this._$toString=function() {
			return t._$string;
		}
	} 
	
/*	function ObjectType() {
		this.constructor("object","");
   } 
	ObjectType.prototype=new ClassType();
	t._$object	= new ObjectType(); */
	

	
	function AnyType() {
		this.constructor("_$any","any");
		
		// Check if !this is allowed
		this.not=function() {
			 if (this.type)	return this.type.not();
			 return t._$boolean;
		}
	
		// Check if this | r is allowed
		this.or=function(r)	{
			 if (this.type)	return this.type.or(r);
			 return t._$boolean;
		}
	
		// Check if this & r is allowed
		this.and=function(r)	{
			 if (this.type)	return this.type.and(r);
			 return t._$boolean;
		}
	
		// Check if this == r is allowed
		this.eq=function(r) {
			 if (this.type)	return this.type.eq(r);
			return t._$boolean;
		}
	
		// Check if this != r is allowed
		this.ne=function(r) {
			if (this.type)	return this.type.ne(r);
			return t._$boolean;
		}
	
		// Check if this > r is allowed
		this.gt=function(r) {
			if (this.type)	return this.type.gt(r);
			return t._$boolean;
		}
	
		// Check if this < r is allowed
		this.lt=function(r) {
			if (this.type)	return this.type.lt(r);
			return t._$boolean;
		}
	
		// Check if this >= r is allowed
		this.ge=function(r) {
			if (this.type)	return this.type.ge(r);
			return t._$boolean;
		}
	
		// Check if this <= r is allowed
		this.le=function(r) {
			if (this.type)	return this.type.le(r);
			return t._$boolean;
		}
	
		// Check if +this is allowed
		this.plus=function() {
			 if (this.type)	return this.type.plus(r);
			 return t._$any;
		}
	
		// Check if -this is allowed
		this.minus=function() {
			 if (this.type)	return this.type.minus(r);
			 return t._$any;
		}
	
		// Check if this + r is allowed, by default everything turns into a sting with that opeartor occuring
		this.add=function(r) {
			 if (this.type)	return this.type.add(r);
			 return t._$any;
		}
	
	    // Check if this - r is allowed
		this.sub=function(r) {
			 if (this.type)	return this.type.sub(r);
			 return t._$any;
		}
	
		// Check if this * r is allowed
		this.mul=function(r) {
			 if (this.type)	return this.type.mul(r);
			 return t._$any;
		}
	
		// Check if this / r is allowed
		this.div=function(r) {
			 if (this.type)	return this.type.div(r);
			 return t._$any;
		}
	
		// Check if this % r is allowed
		this.mod=function(r) {
			 if (this.type)	return this.type.mod(r);
			 return t._$any;
		}
			
	}AnyType.prototype=new ClassType();
	t._$any = new AnyType();
	
		// A Layer in between, because all built in Types can becompared
	function BuiltInType(name,extend) {
		this.constructor(name,"builtIn",extend);
		
//		this.constructor(name,extend);
		
		// Check if both are comparable
		this.gt=function(r) {
			if (this.check(r) || r.check(this)) return t._$boolean;
			error.typeMissMatch(">",this.name,r.name);
			return false;
		}
	
		this.lt=function(r) {
			if (this.check(r) || r.check(this)) return t._$boolean;
			error.typeMissMatch("<",this.name,r.name);
			return false;
		}
	
		this.ge=function(r) {
			if (this.check(r) || r.check(this)) return t._$boolean;
			error.typeMissMatch(">=",this.name,r.name);
			return false;
		}
	
		this.le=function(r) {
			if (this.check(r) || r.check(this)) return t._$boolean;
			error.typeMissMatch("<=",this.name,r.name);
			return false;
		}
	} BuiltInType.prototype=new ClassType();
	
	function BooleanType() {
		this.name="_$boolean";
		this.parent=t._$any;
		t._$any.addChild(this);
		this.children=[];
			
		this.not=function() {
			return t._$boolean;	
		}
	
		this.or=function(r)	{
			if (this.check(r) || r.check(this)) return t._$boolean;
			error.typeMissMatch("|",this.name,r.name);
			return false;
		}
	
		this.and=function(r)	{
			if (this.check(r) || r.check(this)) return t._$boolean;
			error.typeMissMatch("&",this.name,r.name);
			return false;
		}
	}BooleanType.prototype=new BuiltInType();
	t._$boolean	= 	new BooleanType();

	function NumericType(name,extend) {
		// For Numbers the logic has to be flipped around so number=int is and int=number is not possible
		this.assign=function(r) {
			if (r.check(this)) return this;	
			error.typeMissMatch("=",this.name,r.name);
			return false;
		}
		
		this.plus=function() {
			return this;
		}
	
		this.minus=function() {
			return this;
		}
		
		// Checks wether both are Numeric types and returns the resulting type of an operation
		this.checkNumeric=function (r) {
			var checka=this.check(r);
			var checkb=r.check(this);
			
			// If both are sucessfull they must be the same type
			if (checka && checkb) {
				return this;
			}
			
			// return the subclass that was found
			if (checka) return checka;
			if (checkb) return checkb;
			
			// No Subclass sorry
			return false;
		} 
	
		this.add=function(r) {
			var check=this.checkNumeric(r);
			if (check) return check;
			
			// If not numeric it becomes a string
			return t._$string;
		}
	
		this.sub=function(r) {
			var check=this.checkNumeric(r);
			if (check) return check;
			error.typeMissMatch("-",this.name,r.name);
			return false;
			
		}
	
		this.mul=function(r) {
			var check=this.checkNumeric(r);
			if (check) return check;
			error.typeMissMatch("*",this.name,r.name);
			return false;
		}
	
		this.div=function(r) {
			var check=this.checkNumeric(r);
			if (check) return check;
			error.typeMissMatch("/",this.name,r.name);
			return false;
		}
	
		this.mod=function(r) {
/*			var check=this.checkNumeric(r);
			if (check) return check;*/
			if (this.name=="_$integer" && r.name=="_$integer") return this;
			error.modOnlyValidWithInteger();
			return false;	
		}	
	} NumericType.prototype=new BuiltInType();

	function IntegerType() {
		this.name="_$integer";
		this.parent=t._$any;
		t._$any.addChild(this);
		this.children=[];
	}IntegerType.prototype=new NumericType();
	t._$integer	= new IntegerType();


	function NumberType() {
		this.name="_$number";
		this.parent=t._$integer;
		t._$integer.addChild(this);
		this.children=[]
	}NumberType.prototype=new NumericType();
	t._$number	= new NumberType();

	
	function CharacterType() {
		this.name="_$character";
		this.parent=t._$any;
		t._$any.addChild(this);
		this.children=[];
	}CharacterType.prototype=new BuiltInType();
	t._$character = new CharacterType();


	function StringType() {
		this.name="_$string";
		this.parent=t._$character;
		t._$character.addChild(this);
		this.children=[];
	}StringType.prototype=new BuiltInType();
	t._$string	= new StringType();


	
	function ArrayType(name,typeName,bound) {
		this.constructor(name,"array");
		this.parent=t._$any;
		t._$any.addChild(this);
		
		this.type=t[typeName];
		this.bound=t[bound];
		
		// Checks array for type equality
		this.check=function(r) {
			if (this.name!=r.name) return false;  
			debugMsg(this);
			return this.type.check(r.type); // Check Type Compatibility of the elements
		}
		
/*		this.getName=function() {
			return this.type.getName() + " " + this.name;	
		}*/
	}ArrayType.prototype=new ClassType();
	
	
/*	// Initialize array types for built in Types
	t._$boolean$array	 = new ArrayType(t._$boolean);
	t._$number$array	 = new ArrayType(t._$number);
	t._$integer$array	 = new ArrayType(t._$integer);
	t._$character$array = new ArrayType(t._$character);
	t._$string$array	 = new ArrayType(t._$string);
	t._$any$array	 = new ArrayType(t._$any); */
	





	

	
