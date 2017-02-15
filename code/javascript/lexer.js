/*	lexer.js 
		parses the input and provides a Sequence of Symbols for the lexer
*/


/************************************************************************************** 
Constants 
***************************************************************************************/
var _location="lexer.js: ";
	
function Lexer() {
	var line=0;
	var column=-1;
	var curChr;
	var error;
	var ready;
	var comment;
	var lookAhead;
	var eof=false;
	var code=[];
	
	this.current;
	this.errorDistance=0;
	
	this.errorHandler=function(errorHandler){
		error=errorHandler;
	}
	
	this.init=function(input,mode) {
		debugMsg("lexer.init("+input+")");
		debugMsg(mode);
		setMode(mode);
		line=0;
		column=-1;
		curChr=undefined;
		ready=false;
		comment ="";
 		lookAhead=undefined;
		this.current=undefined;
		eof=false;
		this.errorDistance=0;
		code=input.split("\n");	
		
		nextChr();
		this.next();
		this.next();
	}
	 		
	this.recover=function() { 		
	 		while (!eof && !(this.current.content in recoverSymbols)) this.next();
	 		this.errorDistance=2;
 	}
 	
	this.next=function() {
		this.current=lookAhead;			
		ready=false;
		if (this.current!=undefined) debugMsg("lexer.next() ==>"+this.current.type+":"+this.current.content);	
		
		try {	
			scan();
		} catch (err) {
			debugMsg(err);
			if (!ready) {
				if (lookAhead!=undefined) {
					switch (lookAhead.type) {
						case "javascript":
						case "comment": 
						case "_$character":
						case "_$string": 	error.unterminated(lookAhead.type,lookAhead.line); 
						break;
						case "ident": 		checkTokenNBool();
						break;							
						default: 
					}
				}
			}
		}
		this.errorDistance--;
	}
	
	
   this.clearComment=function(){
   		debugMsg("lexer.clearComment()");

   		comment="";
   }
   
   this.getComment=function(){
   		debugMsg("lexer.getComment()");
   		return comment;
   }
   
   	this.lookAhead=function(){
   		debugMsg("lexer.lookAhead("+lookAhead.content+")");

		return lookAhead;
	}
	
	//Lookahead.. skipContent is an array of symbols to skip, skipType is an array of symbol types to skip
 	this.skipLookAhead = function(){
 		debugMsg("lexer.skipLookAhead()");
		var backup=	{	"la"	 :lookAhead,
					  	"line"	 :line,
					  	"column" :column,
					  	"curChr" :curChr,
					  	"eof"	 :eof,
					 };
		
		while (lookAhead.content != "=" &&  !(lookAhead.content in recoverSymbols) && !eof) {
			try {
				scan();
			} catch (err) {}
		}
		
		var ret=lookAhead;
		
		lookAhead=backup.la;
		line=backup.line;
		column=backup.column;
		curChr=backup.curChr;
		eof=backup.eof;
		
		debugMsg("lexer.skipLookAhead("+ret.content+")");
		
		return ret;
	}
	
	this.anyLiteral=function(){
		return {"type":"ident","content":"_$any","line":this.current.line,"column":this.current.column};
	};
	
	function symbol(type) {

		lookAhead={
			"type"		:type,
 			"content"	:curChr,
 			"line"		:line+1,
 			"column"	:column+1
		};
		debugMsg(lookAhead);
		nextChr();
	}
	
	function addChr(chr){
		if (chr==undefined) { 
			lookAhead.content+=curChr;
		} else { 
			lookAhead.content+=chr;
		}
	}
	
	function clear() {
		lookAhead.content+="";
	}
		
	function setType(type){
		 debugMsg("lexer.setType("+type+")");

		lookAhead.type=type;
	}
	
	function nextChr(){
		if (!eof) {
			column++;
			if (column>=code[line].length) {
				line++;
				column=-1;
			} 
			if (line>=code.length) {
					curChr="end of input";
					eof=true;
			} else curChr=code[line][column];
			if (curChr==undefined) curChr=" "
		} 
	}

	function scan() {
		if 		(eof) 					symbol("eof");
		else if (curChr in braces) 		symbol("brace");
		else if (curChr in terminator) 	symbol ("terminator");
		else if (curChr in op) 			operator();	 //contains comments
		else if (curChr == "'")			character();
		else if (curChr == '"')	    	string();
		else if (curChr in digit) 		number();	// number & integer
		else if (curChr in letter) 		ident();	// covers also tokens, bool values && types
		else if (curChr == "#")			scanJS();   // Javascript Include
		else if (curChr in space)		{
			while 	(curChr in space && !eof) nextChr();
			scan();
		} else symbol("?");
		ready=true;
	}
	
	function scanJS() {
		// Correct Single Quotes, so they can be used in Javascript includes
		function sq(chr) {
			if (chr=="'") return "\'";
			else return chr;	
		}
		debugMsg("lexer.scanJS()");
		nextChr();
		symbol("javascript");
		while (!eof) {
			curChr=sq(curChr);
			if (curChr=="#") {
				var tmp=sq(curChr);
				nextChr();
				if (curChr=="e") {
					tmp+=sq(curChr);
					nextChr();
					if (curChr=="n") {
						tmp+=sq(curChr);
						nextChr();
						if (curChr=="d") {	
							ready=true;
							nextChr();
							return;			
						} else addChr(tmp); 
					} else addChr(tmp);				
				} else addChr(tmp);				
			} else addChr();
			nextChr();
		}
		throw("eof");
	}

	function operator() {
		if (curChr=="/") {
			symbol("operator");

			// Braced Comment
			if (curChr=="*") {
				setType("comment");
				clear();
				nextChr();
				
				var depth=1;
				while (depth>0 && !eof){
					switch (curChr) {
						case "/":
						  nextChr();
						  if (curChr=="*") {
						  	depth ++;
						  	nextChr();
						  } else addChr("/");
						break;
						case "*":
							nextChr();
							if (curChr=="/") {
								depth--;
								nextChr();
							} else addChr("*");
						break;
						default:addChr();
								nextChr();
						break;
					}
				}
				if (eof && depth>0) throw(eof);
				comment=lookAhead.content;
				lookAhead=undefined;
				scan();	
			}
			
			// Line Comment
			else if (curChr=="/") {
				setType("comment");
				clear();
				for(var thisLine=line;line==thisLine;nextChr()) addChr();
				comment=lookAhead.content;
				lookAhead=undefined;
				scan();	
			}
			
		// Operators
		} else if (curChr in twoChrOpStart) {
		
			symbol("operator");
			if (curChr=="=") {
				addChr();
				nextChr();
			} else if (lookAhead.content=="=") setType("assignmentOperator");   /*****************/
		} else symbol("operator");		
	}
	
	function character (){
		symbol("_$character");
		addChr();
		if (curChr=="'") return;
		else if (curChr=="\\") {
					debugMsg(curChr);

			nextChr(); 
			addChr();
			if (curChr=="'") return;
		}
		nextChr(); 
		addChr();
		if (curChr!="'") error.unterminated("Character",line);
		nextChr();
	}
	
	function string() {
		for (symbol("_$string"); (curChr !='"' && !eof); nextChr()) addChr();
		if (eof && curChr!='"') throw ("eof");
		addChr();
		nextChr();
	}
	
	function number () {		
		for (symbol("_$integer"); (curChr in digit); nextChr()) addChr();
		if (curChr==".") {
			setType("_$number");
			addChr();
			nextChr();
			for (; (curChr in digit) ; nextChr()) addChr();
		} 
	}
	
	function checkTokenNBool() {
		function cutOffNameSpace() {
			lookAhead.content=lookAhead.content.slice(2,lookAhead.content.length);
		}
		
		if (lookAhead.content == "_$null") {
			setType("null");
			cutOffNameSpace();
		} else if (lookAhead.content in bool) {
			setType("_$boolean");
			cutOffNameSpace();
		} else if (lookAhead.content in token) {
			setType("token");	
			if (!token[lookAhead.content]) error.reservedWord(lookAhead.content,lookAhead.line);
			cutOffNameSpace();	
		}
	}	
	
	function ident() {
		curChr="_$"+curChr;
		for (symbol("ident"); (curChr in letter) || (curChr in digit) ; nextChr()) addChr();
		checkTokenNBool();
	}
	
	function setMode(mode) {
		token = {
    		"_$javascript"	: mode.javascript, 
			"_$function"	: mode.function,
			"_$array"		: mode.array,
			"_$contains"    : mode.array,
			"_$each" 		: mode.array,
			"_$in" 		    : mode.array,
			"_$variable"	: (mode.typing != "0"),
			"_$constant"	: (mode.typing != "0"),
			"_$structure"	: mode.structure,
			"_$class"		: mode.object,
			"_$extends"		: mode.object,
			"_$constructor"	: mode.object,
			"_$super" 		: mode.object,
			"_$this"		: mode.object,
			"_$new" 		: mode.object,
			"_$if" 			: mode.if,
			"_$else" 		: mode.if,
			"_$do"	 		: mode.do,
			"_$while"		: mode.while || mode.do,
			"_$for" 		: mode.for,
			"_$switch"	 	: mode.switch,
			"_$default" 	: mode.switch,
			"_$case"		: mode.switch,
			"_$return"		: true,			
    	};
	}
		 
	var defaultToken = {
	/*	"_$javascript"	: true, */
		"_$function"	: true,
		"_$array"		: true,
		"_$contains"    : true,
		"_$each" 		: true,
		"_$in" 		    : true,
		"_$variable"	: true,
		"_$constant"	: true,
		"_$structure"	: true,
		"_$class"		: true,
		"_$extends"		: true,
		"_$constructor"	: true,
		"_$super" 		: true,
		"_$this"		: true,
		"_$new" 		: true,
		"_$if" 			: true,
		"_$else" 		: true,
		"_$do"	 		: true,
		"_$while"		: true,
		"_$for" 		: true,
		"_$switch"	 	: true,
		"_$default" 	: true,
		"_$case"		: true,
		"_$return"		: true
	};	 
	
	var token=defaultToken;
	
	var bool = {
		"_$true"	:true,
		"_$false"	:true
	};
		 
	var space= {
		" "	 		: true,
		"\t" 		: true,
		"undefined"	: true
	};
		
	var op={
		"<"	:true,
		">"	:true,
		"+" :true,
		"-" :true,
		"*"	:true,
		"/" :true,	
		"%" :true,	
		"&" :true,	
		"|" :true,	
		"!" :true,
		"=" :true
	};
	
	var twoChrOpStart={
		"=":true,
		"!"	:true,
		"<" :true,
		">" :true,
	};
	
	var terminator = {
		"."	:true,
		","	:true,
		";" :true
	};
	
	var braces = {
		"("	:true,
		")"	:true,
		"[" :true,
		"]" :true,
		"{"	:true,
		"}" :true,	
	};
	
	var digit = {
		"0"	:true,
		"1"	:true,
		"2" :true,
		"3" :true,
		"4"	:true,
		"5" :true,
		"6" :true,
		"7" :true,
		"8" :true,
		"9" :true
	};
	
	var	letter = {
		"a"	:true,
		"b"	:true,
		"c" :true,
		"d" :true,
		"e"	:true,
		"f" :true,
		"g" :true,
		"h" :true,
		"i" :true,
		"j" :true,
		"k"	:true,
		"l"	:true,
		"m" :true,
		"n"	:true,
		"o" :true,
		"p" :true,
		"q" :true,
		"r" :true,
		"s" :true,
		"t"	:true,
		"u"	:true,
		"v" :true,
		"w" :true,
		"x"	:true,
		"y" :true,
		"z" :true,
		"A"	:true,
		"B"	:true,
		"C" :true,
		"D" :true,
		"E"	:true,
		"F" :true,
		"G" :true,
		"H" :true,
		"I" :true,
		"J" :true,
		"K"	:true,
		"L"	:true,
		"M" :true,
		"N" :true,
		"O"	:true,
		"P" :true,
		"Q" :true,
		"R" :true,
		"S" :true,
		"T" :true,
		"U"	:true,
		"V"	:true,
		"W" :true,
		"X" :true,
		"Y"	:true,
		"Z" :true,
	};
	
	var recoverSymbols={
		 "}"			:true,
		"if" 			:true,
		"do" 			:true,
		"while" 		:true,
		"for"			:true,
		"switch"		:true,
		"case"			:true,
		"javascript"	:true,
		"structure"		:true,
		"array"			:true,
		";"				:true
	};
}
