/*	parser.js
		parses and executes the statements entered
*/

importScripts('lexer.js');

/************************************************************************************** 
Constants 
***************************************************************************************/
var _location="parser.js: ";
var _debug=true;	
	
		
/************************************************************************************** 
Objects
***************************************************************************************/	
function ParseResult(symbolTable,ast){
	this.symbolTable=symbolTable;
	this.ast=ast;
}


function Parser(mode) {
		 		 	
 	/* The lexer */
 	var lexer= new Lexer();
 	
 	/* Error Handler */
    var error= new SynError(lexer);	 
    lexer.errorHandler(error);
    
    /* Stores for Declarations needed for type-checking */
    var symbolTable=new SymbolTable(error);
 	
   	var programParser=new ProgramParser();
	var expressionParser=new ExpressionParser();
		
	var preventWhile=false; // If do is allowed and while forbitten gotta check usage of while in the parser

	// A Symbol, as it is returned by the lexer
	function Symbol (symbol,content,line,column) {
		this.type=symbol;
 		this.content=content;
 		this.line=line;
 		this.column=column;
 	}
 	
 	// If no identifier is given, system fakes ID's so checking of the code can Continuie, this variable is used to  the id's
 	var systemId=0;
 	function SystemIdentifier() {
 		return {"content":"$sys"+systemId++};
 	}
 		
 	// tests if a the current symbol is a given one
 	function test(symbol) {
 		if (lexer.current.content == symbol) return true;
 		else return false;
 	}
 	
 	// tests if the type of a symbol is a given one
 	function testType(type) {
 		if (lexer.current.type == type) return true;
 		else return false;
 	}
 	
 	// checks a symbol if it is the one gets the next symbol from the lexer
 	// else generate an error message
 	function check(symbol) {
 				
 		if (!mode.terminator && symbol==";") {  // For single instruction do as if ";" was specified 
 			if (test(symbol)) lexer.next();
 			return true;
 		} else {								// Normal operation
 			if (symbol=="{") mode.terminatorOn;			// Turn Termination on of on entering a block in Instruction Mode
 			else if (symbol=="}") mode.terminatorOff;
 		
 			if (test(symbol)) {
 				lexer.next();
 				return true;
 			} else {
 				error.expected(symbol);
 				return false;
 			}
 		}
 	}
 	
 	// checks a type of a symbol if it is the one gets the next symbol from the lexer
 	// else generate an error message	
 	function checkType(type) {
 		if (testType(type)) {
 			lexer.next();
 			return true;
 		} else {
 			error.expected(type);
 		}
 	}
 	
 	function eof() {
 		return lexer.current.type=="eof";
 	}
 	
	/* 
	 * Program Parser handles programs, supports classes, structures, arrays, satement sequences,...
	 */
 	function ProgramParser() {
 		
 		 this.parse = function(kind) {
 		 	switch (kind) { 	
 		 		case "declaration": return Declaration();
 		 		break;
	 			default: return Program();
	 		}
	 	}
 		
 		// Import Methods from the expression Parser
 		function Assignment() {return expressionParser.Assignment();}
 		function Expr() {return expressionParser.Expr();}
 		function IdentSequence() {return expressionParser.IdentSequence();}
 		function Ident(forced) {return expressionParser.Ident(forced);}		
 		function EPStatement() {return expressionParser.Statement();}


		function whatNext() {
 			switch (lexer.current.content) {
 				case "class"		: 
 				case "function"	 	: 
 				case "structure"	:
 				case "constant" 	:
 				case "variable" 	:
 				case "array"		: 	return lexer.current.content;	
 				break;
 					
 				default				:	return lexer.lookAhead().content;
 			}
		}

// 		Declaration	:= {Class | Function | VarDecl | Statement} 
		function Declaration() {
			switch (whatNext()) {
 					
 					case "class"	: return Class();
 					break;
 					
 					case "function" : return Function();
 					break;
 				
 					case "structure" : return StructDecl();
 					break;
 					
 					case "array"	: return  ArrayDecl();
 					break;
 				
 					case "constant" :
 					case "variable" : return  VarDecl();
 					break;
 					default			: return false;
 			 }
		}

// 		Program	:= {Class | Function | VarDecl | Structure | Array | Statement}                 
//		AST: "program": l:  {"function" | "variable" ... | Statement} indexed from 0...x
		this.Program=function() {return Program()};
 		function Program() {
 			debugMsg("ProgramParser : Program");
 			var current;
 			var ast=new ASTListNode("program");
 			
 			for (;!eof();) {
 				
 				if (!(current=Declaration())) current=Statement();
 				
 				if (!current) break;
 				
 				ast.add(current);	
 			}  			
 			return ast;
 		}
 		
 //		Class:= "class" Ident ["extends" Ident] "{" ["constructor" "(" Ident Ident ")"] CodeBlock {VarDecl | Function}"}"
//		AST: "class" : l: name:Identifier,extends: ( undefined | Identifier),fields:VarDecl[0..i], methods:Function[0...i]
		function Class() {
			debugMsg("ProgramParser : Class");
			lexer.next();

			var name=Ident(true);			
			
			var extend={"content":undefined};
			if(test("extends")) {
				lexer.next();
				extend=Ident(true);
			}
			
			check ("{");
			var scope=symbolTable.openScope();
			
			var methods=[];
			var fields=[];
			
			if (test("constructor")) {
				lexer.next();
		 		//var retType={"type":"ident","content":"_$any","line":lexer.current.line,"column":lexer.current.column};
				var constructName={"type":"ident","content":"construct","line":lexer.current.line,"column":lexer.current.column};
				methods.push(FunctionBody(name,constructName));
			}
			
			var current=true;
			while(!test("}") && current && !eof()) {
				 	
		    	switch (whatNext()) {
 					
 					case "function"	: methods.push(Function()); 
 					break;
 					
 					case "constant":
 					case "variable" : fields.push(VarDecl(true));
 					break;
 					default			: current=false;
 				}
			}
			
			check("}");
			
			mode.terminatorOff();

			symbolTable.closeScope();
			symbolTable.addClass(name.content,extend.content,scope);
			
			return new ASTUnaryNode("class",{"name":name,"extends":extend,"scope":scope,"methods":methods,"fields":fields});
		}
		
 //		StructDecl := "structure" Ident "{" VarDecl {VarDecl} "}"
 //		AST: "structure" : l: "name":Ident, "decl":[VarDecl], "scope":symbolTable
 		function StructDecl() {
 			debugMsg("ProgramParser : StructDecl");
 			
 			lexer.next(); 
 			
 			var name=Ident(true); 
 			
 			check("{");
 			mode.terminatorOn();
 			
 			var decl=[];
 			
 			var scope=symbolTable.openScope();	
 			do {				
 				decl.push(VarDecl(true));
 			} while(!test("}") && !eof());
 			
 			mode.terminatorOff();
 			check ("}");
 			
 			symbolTable.closeScope();
 			symbolTable.addStruct(name.content,scope);
 			
 			return new ASTUnaryNode("structure",{"name":name,"decl":decl,"scope":scope});
 		} 
 		
  //	arrayDecl := "array" Ident "["Ident"]" "contains" Ident
 //		AST: "array" : l: "name":Ident, "elemType":Ident, "indexTypes":[Ident]
 		function ArrayDecl() {
 			debugMsg("ProgramParser : ArrayDecl");
 			
 			lexer.next(); 
 			
 			var name=Ident(true);
 			
 			check("[");
 				
 			var ident=Ident(!mode.any);
 			if (!ident) ident=lexer.anyLiteral();
 				
 			var indexType=ident;
 				
 			var bound=ident.content;
 				
 			check("]");
 				
 			var elemType; 	
 			if (mode.any) {
 				if (test("contains")) {
 					lexer.next();
 					elemType=Ident(true);
 				}
 				else elemType=lexer.anyLiteral();
 			} else {
 				check("contains");
 				elemType=Ident(true);
 			}
 			
 			check (";");
 			symbolTable.addArray(name.content,elemType.content,bound);
 			
 			return new ASTUnaryNode("array",{"name":name,"elemType":elemType,"indexType":indexType});
 		} 
 		
//		Function := Ident "function" Ident "(" [Ident Ident {"[""]"} {"," Ident Ident {"[""]"}) } ")" CodeBlock
//		AST: "function":	l: returnType: (Ident | "_$"), name:name, scope:SymbolTable, param:{name:Ident,type:Ident}0..x, code:CodeBlock   
		this.Function=function() {return Function();}
 		function Function() {
 			debugMsg("ProgramParser : Function");
 		
 			var retType;
 			if (mode.decl) retType=Ident(!(mode.any));
 			if (!retType) retType=lexer.anyLiteral();
 			
 			check("function");
 			
 			var name=Ident(true);
 			
 			return FunctionBody(retType,name);
 		}
 		
 
 		// The Body of a function, so it is consistent with constructor
 		function FunctionBody(retType,name)	{
 			var scope=symbolTable.openScope();
 			
 			if (!test("(")) error.expected("(");
 		
            var paramList=[];
            var paramType=[];
            var paramExpected=false; //Indicates wether a parameter is expected (false in the first loop, then true)
            do {
      			lexer.next();
      			
      			/* Parameter */
      			var pName,type;
      			var ident=Ident(paramExpected);	// Get an Identifier
      			paramExpected= true;
      			
      			// An Identifier is found
      			if (ident) {
      				
      				// When declaration is possible
      				if (mode.decl) {
      					
      					// One Identifier found ==> No Type specified ==> indent specifies Param Name
      					if (!(pName=Ident(!(mode.any)))) {
      						type=lexer.anyLiteral();
      						pName=ident;
      					} else type=ident; // 2 Identifier found
      				} else {	// Declaration not possible
      					type=lexer.anyLiteral();
      					pName=ident;
      				}	

					// Store Parameter
					paramType.push(type);                  
              		paramList.push({"name":pName,"type":type});
              		 
         		  	symbolTable.addVar(pName.content,type.content);
          		} 
       		} while (test(",") && !eof());

         	check(")");
 			 			
 			var code=CodeBlock();
 			
 			symbolTable.closeScope();
 			
 			symbolTable.addFunction(name.content,retType.content,paramType);
 			return new ASTUnaryNode("function",{"name":name,"scope":scope,"param":paramList,"returnType":retType,"code":code});
 		}
 			
		
 //		VarDecl := Ident ("variable" | "constant") Ident ["=" Expr] ";" 
 //		AST: "variable"|"constant": l : type:type, name:name, expr:[expr]
 		this.VarDecl = function() {return VarDecl();}
 		function VarDecl(noInit) {
 			debugMsg("ProgramParser : VariableDeclaration");
 			var line=lexer.current.line;
 			var type=Ident(!mode.any);
 			if (!type) type=lexer.anyLiteral();
 			
 			var constant=false;
 			var nodeName="variable";
 			if (test("constant")) {
 				constant=true; 
 				nodeName="constant";
 				lexer.next();
 			}
 			else check("variable"); 
 			 			
 			var name=Ident(true);
 			symbolTable.addVar(name.content,type.content,constant);

			var expr=null;
			if(noInit==undefined){
				if (test("=")) {
					lexer.next();
					expr=Expr();
					if (!expr) expr=null;
				}
			} 
	
			check(";");
			var ast=new ASTUnaryNode(nodeName,{"type":type,"name":name,"expr":expr});
			ast.line=line;
			return ast;
 		}
 				
//		CodeBlock := "{" {VarDecl | Statement} "}"   
//		Codeblock can take a newSymbolTable as argument, this is needed for functions that they can create an scope
//		containing the parameters.
//		If newSymbolTable is not specified it will be generated automatical
//      At the End of Codeblock the scope newSymbolTable will be closed again		
//		AST: "codeBlock" : l: "scope":symbolTable,"code": code:[0..x] {code}
 		function CodeBlock() {
 			debugMsg("ProgramParser : CodeBlock");
			
			var scope=symbolTable.openScope();
			var begin=lexer.current.line;
			check("{");
 			
 			var code=[];
 			var current;

 			while(!test("}") && !eof()) {
 				switch (whatNext()) {
 					case "constant":
 					case "variable": current=VarDecl();
 					break;
 					default: current=Statement();					
 				}

 				if(current) {
 					code.push(current);
 				} else {
 					error.expected("VarDecl or Statement"); break;
 				}
 			}	
 			
 			var end=lexer.current.line;
 			check("}");
 			symbolTable.closeScope();
 			return new ASTUnaryNode("codeBlock",{"scope":scope,"code":code,"begin":begin,"end":end});
 		}
 		
//		Statement	:= If | For | Do | While | Switch | JavaScript | (Return | Expr | Assignment) ";"
 		function Statement() {
 			debugMsg("ProgramParser : Statement");
 			var ast;
 			var line=lexer.current.line;
 			
 			switch (lexer.current.content) {
 				case "if"	 		: ast=If(); 
	 			break;
 				case "do"	 		: ast=Do(); 
 				break;
 				case "while" 		: ast=While(); 		
 				break;
 				case "for"			: ast=For();
 				break;
 				case "switch"		: ast=Switch(); 	
 				break;
 				case "javascript"	: ast=JavaScript(); 
 				break;
 				case "return"		: ast=Return();  
 										  check(";");
 				break;
 				default				: ast=EPStatement();  
 					                      check(";");
 			}
 			ast.line=line;
 			ast.comment=lexer.getComment();
 			lexer.clearComment(); 			
 			return ast;	
 		}
 		
//		If := "if" "(" Expr ")" CodeBlock ["else" CodeBlock]
//		AST : "if": l: cond:Expr, code:codeBlock, elseBlock:(null | codeBlock)
 		function If() {
 			debugMsg("ProgramParser : If");
 			
 			lexer.next();
 			check("(");
 			
 			var expr=Expr();
 		
 			check(")");
 			
 			var code=CodeBlock();
 			
 			var elseCode;
 			if (test("else")) {
 				lexer.next();
 				elseCode=CodeBlock();
 			}
 			return new ASTUnaryNode("if",{"cond":expr,"code":code,"elseBlock":elseCode});
 		}
 		
// 		Do := "do" CodeBlock "while" "(" Expr ")" 
//		AST: "do": l:Expr, r:CodeBlock 
 		function Do() {	
 			debugMsg("ProgramParser : Do");
 			
 			lexer.next();
 			var code=CodeBlock();
 			
 			check("while");
 			
 			check("(");
 			
 			var expr=Expr();
 			check(")");
 			
 			
 			check(";");

 			return new ASTBinaryNode("do",expr,code);
 		}
 		
// 		While := "while" "(" Expr ")" "{" {Statement} "}" 
//		AST: "while": l:Expr, r:codeBlock
 		function While(){ 			
 			debugMsg("ProgramParser : While");
 			
 			//if do is allowed, but while isn't allowed gotta check keyword in parser
 			if (preventWhile) error.reservedWord("while",lexer.current.line);
 			
 			lexer.next();
 			check("(");
 			
 			var expr=Expr();
 	
 			check(")");
 			
 			var code = CodeBlock();
 				 			
 			return new ASTBinaryNode("while",expr,code);
 		}
 		
//		For := "for" "("("each" Ident "in" Ident | Ident Assignment ";" Expr ";" Assignment )")"CodeBlock
//		AST: "foreach": l: elem:Ident, array:Ident, code:CodeBlock 
//		AST: "for": l: init:Assignment, cond:Expr,inc:Assignment, code:CodeBlock
 		function For() { 			
 			debugMsg("ProgramParser : For");
 			
 			lexer.next();
 			
 			check("(");
 			
 			if (test("each")) {
 				lexer.next();
 				var elem=IdentSequence();
 				check("in");
 				var arr=IdentSequence();
 				
 				check(")");
 				
 				var code=CodeBlock();
 				
 				return new ASTUnaryNode("foreach",{"elem":elem,"array":arr,"code":code});
 				
 			} else {
 				var init=Assignment();
 				if (!init) error.assignmentExpected();
 				
 				check(";");
 				
 				var cond=Expr();
 			
 			
 				check(";");
 			
 				var increment=Assignment();
 				if (!increment) error.assignmentExpected();
 			 
 				check(")");
 				var code=CodeBlock();	
 			
 				return new ASTUnaryNode("for",{"init":init,"cond":cond,"inc":increment,"code":code});
 			}	
 		}
 		
//		Switch := "switch" "(" Ident ")" "{" {Option} ["default" ":" CodeBlock] "}"	
//      AST: "switch" : l "ident":IdentSequence,option:[0..x]{Option}, default:CodeBlock
 		function Switch() {			
 			debugMsg("ProgramParser : Switch");
 			
 			lexer.next();
 			
 			check("(");

 			var ident=IdentSequence();
 			if (!ident) error.identifierExpected();
 			
 			check(")");
 			
 			check("{");
 			
 			var option=[];
 			var current=true;
 			for (var i=0;current && !eof();i++) {
 				current=Option();
 				if (current) {
 					option[i]=current;
 				}
 			}
 			check("default");
 			
 			check(":");
 			
 			var defBlock=CodeBlock();
 		 			
 			check("}");
 			
 			return new ASTUnaryNode("switch", {"ident":ident,"option":option,"defBlock":defBlock});
 		}
 		
//		Option := "case" Expr {"," Expr} ":" CodeBlock
//      AST: "case" : l: [0..x]{Expr}, r:CodeBlock
 		function Option() {
 			if (!test("case")) return false;
 			
 			debugMsg("ProgramParser : Option");
 			
 			var exprList=[];
 			var i=0;
 			do {
 				lexer.next();
 				
 				exprList[i]=Expr();
 				i++; 
 				
 			} while (test(",") && !eof());
 			
 			check(":");
 			
 			var code=CodeBlock();
 			
 			return new ASTBinaryNode("case",exprList,code);
 		}
 		
//      JavaScript := "javascript"  {Letter | Digit | Symbol} "javascript"
//		AST: "javascript": l: String(JavascriptCode)
 		function JavaScript() {
 			debugMsg("ProgramParser : JavaScript");
			check("javascript");
			check("(")
			var param=[];
			var p=Ident(false);
			if (p) {
				param.push(p)
				while (test(",") && !eof()) {
					lexer.next();
					param.push(Ident(true));
				}	
			}
 			check(")");
 					
 			var js=lexer.current.content;
 			checkType("javascript");
 						
 			return new ASTUnaryNode("javascript",{"param":param,"js":js});
 		}
 		
// 		Return := "return" [Expr] 
//		AST: "return" : ["expr": Expr] 
 		function Return() {
 			debugMsg("ProgramParser : Return");
 			var line=lexer.current.line;
 			
 			lexer.next();
 			
 			var expr=Expr();
 			var ast=new ASTUnaryNode("return",expr);
 			ast.line=line;
 			return ast;
 		}
	}
	
/*
 * Expression Parser handles expressions and assignments
 */
 	function ExpressionParser() {
 		this.parse = function() {
	 		return Statement(); 
	 	}
 		
//		Statement := Assignment | Expr	
		this.Statement=function() {return Statement();}
	 	function Statement() {
	 		debugMsg("ExpressionParser : Statement");
	
    	    var ast;
    	    // Expressin or Assignment ??
    	    if (lexer.skipLookAhead().type=="assignmentOperator") {
    	    	ast = Assignment(); 
    	    } else {
    	    	ast = Expr();
    	    }
    	    return ast;
	 	}
	 	
//		Assignment := IdentSequence "=" Expr 
//		AST: "=": l:target, r:source
 		this.Assignment = function() {return Assignment();}
 		function Assignment() {
 			debugMsg("ExpressionParser : Assignment");
 		
 			var ident=IdentSequence();
 			if (!ident) return false;
 		
 			check("="); // Return if it's not an Assignment
 		
 			var expr=Expr();
 			
 			return new ASTBinaryNode("=",ident,expr);
	 	}
 		

//		Expr := And {"|" And} 	
//		AST: "|": "left":And "right":And
 		this.Expr = function () {return Expr();}	
 		function Expr() {
 			debugMsg("ExpressionParser : Expr");
 			
 			var ast=And();
 			if (!ast) return false;
 					
 		
 			while (test("|") && !eof()) {
 				debugMsg("ExpressionParser : Expr");
 				lexer.next();
 				ast=new ASTBinaryNode("|",ast,And());
 			}
 			return ast;
 		}
 	
//		And := Comparison {"&" Comparison}
//		AST: "&": "left":Comparasion "right":Comparasion	
		function And() {
 			debugMsg("ExpressionParser : And");
 			var ast=Comparasion();
 			if (!ast) return false;
 				
 			while (test("&") && !eof()) {
	 			debugMsg("ExpressionParser : And");
 				lexer.next();
 				ast=new ASTBinaryNode("&",ast,Comparasion());
	 		}
	 		return ast;
	 	}
	 	 	
// 		Comparison := Sum {("==" | "!=" | "<=" | ">=" | "<" | ">" | "in") Sum}
//		AST: "==" | "!=" | "<=" | ">=" | "<" | ">" : "left":Sum "right":Sum
		function Comparasion() {
 			debugMsg("ExpressionParser : Comparasion");
			var ast=Sum();
			if (!ast) return false;
		
			while ((test("==") ||
					test("!=") ||
					test("<=") ||
					test(">=") ||
					test("<")  ||
					test(">")) ||
					test("in") &&
					!eof())
			{
 				debugMsg("ExpressionParser : Comparasion");
				var symbol=lexer.current.content;
				lexer.next();
	 			ast=new ASTBinaryNode(symbol,ast,Sum());
			} 	
			return ast;	
	 	}
	 	
//		Sum := ["+" | "-"] Product {("+" | "-") Product}
//		AST: "+1" | "-1" : l:Product
//		AST: "+" | "-" :  l:Product | r:Product   
 		function Sum() {
 			debugMsg("ExpressionParser : Sum");
		
			var ast;
			// Handle Leading Sign
			if (test("+") || test("-")) {
				var sign=lexer.current.content+"1";
				lexer.next();
				ast=new ASTUnaryNode(sign,Product());	
	 		} else {
	 			ast=Product();
	 		} 
 			
 			while ((test("+") || test("-")) && !eof()) {
 				debugMsg("ExpressionParser : Sum");
 				var symbol=lexer.current.content;
 				lexer.next();
 				ast=new ASTBinaryNode(symbol,ast,Product());		
 			} 	
 			return ast;
 		}

//		Product := Factor {("*" | "/" | "%") Factor} 	
	 	function Product() {
	 		debugMsg("ExpressionParser : Product");

 			var ast=Factor();
 		
	 		while ((test("*") || test("/") || test("%")) && !eof()) {
	 			debugMsg("ExpressionParser : Product");

	 			var symbol=lexer.current.content;
 				lexer.next();
 				ast=new ASTBinaryNode(symbol,ast,Factor());
 			} 
	 		return ast;
 		}
 		
// 	  Factor := 		[("this" | "super") "."]IdentSequence ["(" [Expr {"," Expr}] ")"]
//					   | "!" Expr 
//					   | "(" Expr ")" 
//					   | Array 
//					   | Boolean
//					   | Integer
//					   | Number
//					   | Character
//					   | String 
 		function Factor() {
 			debugMsg("ExpressionParser : Factor"+lexer.current.type);

	 		var ast;
 		
	 		switch (lexer.current.type) {
	 			
	 			case "token"	:
				//	AST: "functionCall": l:Ident(Name) r: [0..x]{Params}
					switch (lexer.current.content) {
						case "new": 
							lexer.next();
						
							var ident=Ident(true);
							
							check("(");
						
 							var param=[];
 							if(!test(")")){
 								param[0]=Expr();
								for (var i=1;test(",") && !eof();i++) {
									lexer.next();
 									param[i]=Expr();
 								}
 							}	 																
 							check(")");
 					
 							ast=new ASTBinaryNode("new",ident,param);
 						break;
 						case "this":
 						case "super":
						case "constructor": return IdentSequence();
 						break;
						default:
							error.expressionExpected();
 							return false;
						break;
					}
				break;

//				Factor :=	IdentSequence 				
 				case "ident":
 				    return IdentSequence();
 				break;
 				
// 			Factor:= "!" Expr			
 				case "operator": 
	 				if (!test("!")) {
	 					error.expressionExpected();
	 					return false;
 					}
 					lexer.next();
 				
	 				var expr=Expr();
 					ast=new ASTUnaryNode("!",expr);
	 			break;
 				
//				Factor:= "(" Expr ")" | Array 			
 				case "brace"	:
 					switch (lexer.current.content) {
 						
// 					   "(" Expr ")"
 						case "(":
 							lexer.next();
 							ast=Expr();					
 							check(")");
 						break;
 	
 					
 						default:
 							error.expressionExpected();
 						  	return false;
	 					break;
	 				}
	 			break;
 			
//				Factor:= Boolean | Integer | Number | Character | String
//				AST: "literal": l: "bool" | "int" | "float" | "string" | "char": content: Value 
	 			case "_$boolean" 		:			
	 			case "_$integer"  		:
	 			case "_$number" 		:
	 			case "_$string"			:		
				case "_$character"		:
				case "null"				:
											ast=new ASTUnaryNode("literal",lexer.current);
 											lexer.next();
 				break;
				
//				Not A Factor 				 				
 				default: 	error.expressionExpected();
 							lexer.next();
 							return false;
	 						break;
 			}
 			return ast;
 		}

 
//		IdentSequence := ("this" | "super") | [("this" | "super") "."] ("constructor" "(" [Expr {"," Expr}] ")" | Ident {{ArrayIndex} | "." Ident } ["(" [Expr {"," Expr}] ")"]);
//		AST: "identSequence": l: [0..x]["_$this"|"_$super"]("constructor" | Ident{Ident | ArrayIndex})
// 		or AST: "functionCall": l:AST IdentSequence(Name), r: [0..x]{Params}
		this.IdentSequence=function () {return IdentSequence();};
 		function IdentSequence() {
 			debugMsg("ExpressionParser:IdentSequence()");
 			
 			var ast=new ASTListNode("identSequence");
 			if (test("this") || test("super")) {
 				ast.add({"type":"ident","content":"_$"+lexer.current.content,"line":lexer.current.line,"column":lexer.current.column});
 				lexer.next();
 				if (!(test("."))) return ast;
 				lexer.next();
 			}

			var functionCall=false;
			if (test("constructor")) {
				ast.add({"type":"ident","content":"construct","line":lexer.current.line,"column":lexer.current.column});
				lexer.next();
				check("(");
				functionCall=true;
			} else {
 				var ident=Ident(true);
 			
 				ast.add(ident);
 			
 				var index;
 				while((test(".") || test("[")) && !eof()) {
 					 if (test(".")) {
 					 	lexer.next();
 						ast.add(Ident(true));
 					} else ast.add(ArrayIndex());
 				}
 				if (test("(")) {
 					functionCall=true;
 					lexer.next();
 				}
 			}
 	
 			if (functionCall) {	
				var param=[];
				if(!test(")")){
 					param[0]=Expr();
					for (var i=1;test(",") && !eof();i++) {
						lexer.next();
 						param[i]=Expr();							
 					}
 				}	 									
 				check(")");
 				ast=new ASTBinaryNode("functionCall",ast,param);
 			} 
 			return ast;
 		}
 		
 //		ArrayIndex:="[" Expr "]"
 //		AST: "arrayIndex": l: Expr
 		function ArrayIndex(){
 			debugMsg("ExpressionParser : ArrayIndex");
 			check("[");
 			 			
 			var expr=Expr();
 		
 			check("]");
 			
 			return new ASTUnaryNode("arrayIndex",expr);
 		}

//		Ident := Letter {Letter | Digit | "_"}
//		AST: "ident", "content":Ident
	 	this.Ident=function(forced) {return Ident(forced);}
 		function Ident(forced) {
 			debugMsg("ExpressionParser:Ident("+forced+")");
 			if (testType("ident")) {
 				var ast=lexer.current;
 				lexer.next();
 				return ast;
 			} else {
 				if (!forced) return false; 
 				else { 
 					error.identifierExpected();
					return SystemIdentifier();
				}
			} 	
 		}
 	}
 		
	this.parse=function(source,kind) {
		var parser=programParser;;
		
		debugMsg("Parser.parse(..) ... initialising");
		// Initialise the parser
	
 		debugMsg("Parser.parse(..) ... Setting Mode");
 		//Setting up mode
		switch (kind) {
			case "library": 	debugMsg ("Library");
			   					mode.library();
							 	mode.program();
			break;
			
			case "instruction": debugMsg ("Instruction");
								mode.user();
							   	mode.instruction();
			break;
			break;
			
			case "program": 	debugMsg("Program");
								mode.user();
								mode.program();
			break;
			default: debugMsg("Unknown Source Type in parser.js Parser.parse(source,kind) : "+kind); return;
		}
		
		preventWhile=(mode.lexer.do && ! mode.lexer.while);
		error.reset();
		lexer.init(source,mode.lexer);
		symbolTable.init(mode.reset,mode.lib);
        
		//Parse   
		debugMsg("Parser.parse(..) ... parsing");     
        try {
        	var ast=parser.parse(kind); 
        } catch(err) {
        	debugMsg("Parser.parse(..) ... parsing failed : "+err.message+" at "+err.fileName+" line "+err.lineNumber);
        	error.eof();
        	return false;
        } 
        
        if (error.occured || !ast) return false;
        
        if (lexer.current.type!="eof") { 
        	error.tooMuchInput();
        	return false;
        }
        
        debugMsg("Parser.parse(..) ... returning ast.....");
        debugMsg(ast);
        return new ParseResult(symbolTable.getUniverse(),ast);	
	}
}