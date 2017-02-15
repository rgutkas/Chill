/* literl.js
*  Provides Literals for built in Types and Null
*/

// The Literal Implementation is an attempt to save Objects created
function Literal(){
	this.value=[];
	var failCnt=0;
		
	this.create=function(value) {
		return new _$optional(value);
	}
	
	this.get=function(value){
		if (this.value[value]==undefined) this.value[value]=this.create(value);
		return this.value[value];
	}
	
	this.lookUp=function(value){
		if (this.value[value]==undefined) {
			if (failCnt<2 && this.value.length<1000) {
				this.value[value]=this.create(value);
				failCnt++;
			} else return this.create(value);
		} else failCnt=0;
		return this.value[value];
	}
}
		
function IntegerLiteral(){
	this.constructor();
	this.create=function(value) {
		return new _$integer(value);
	}	
}IntegerLiteral.prototype=new Literal();
var integerLiteral=new IntegerLiteral();
	
function NumberLiteral(){
	this.constructor();
	this.create=function(value) {
		return new _$number(value);
	}	
}NumberLiteral.prototype=new Literal();
var numberLiteral=new NumberLiteral();
	
function CharacterLiteral(){
	this.constructor();
	this.create=function(value) {
		return new _$character(value);
	}	
}CharacterLiteral.prototype=new Literal();
var characterLiteral=new CharacterLiteral();
	
function StringLiteral(){
	this.constructor();
	this.create=function(value) {
		return new _$string(value);
	}	
}StringLiteral.prototype=new Literal();
var stringLiteral=new StringLiteral();
		
var lit = {
	"_$boolean"		: new function(){ // Boolean is an exception, its got its own literal implementation, because boolean only got two values
						var TRUE=new _$boolean(true);
						var FALSE=new _$boolean(false);

						this.get=function(value) {
							if (value) return TRUE;
							else return FALSE;
						}
		
						this.lookUp=function(value){
							if (value) return TRUE;
							else return FALSE;
						}
					},
	"_$integer"		: new IntegerLiteral(),
	"_$number" 		: new NumberLiteral(),
	"_$character"	: new CharacterLiteral(),
	"_$string"		: new StringLiteral(),
	"_$any"			: new function(){ 
						this.get=function(value) {
							return new _$any(value);
						}
		
						this.lookUp=function(value){
							return new _$any(value);
						}
					},
	"null"			: new function(){ // nullis an exception, its got its own literal implementation, because boolean only got one value
					  var NULL = new Value("null",null,objectReference);				  
					 
					  this.get=function() {
						return NULL;
					  }
		
					  this.lookUp=function(value){
						return NULL;
					  }
					}
}
	

