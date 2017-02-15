/* translator.js
*	Translates the ast into executable javascript and preforms type-checks
*/
importScripts("code.js");

function Translator(mode){
	
	 var code=new Code();
 	 var debug=false;
 	 var debugCnt=0;
 
	 var prevRet=[];
	 var ret;
	 
	 
	 /* Translation FLags */
	 var initInThisScope=false;
	 var declareVariable=false;
	 var addLines=true;
	 var library=false;
	 /*var id=0;*/ 
	
	 this.translate = function(parseResult,libraryOn){
	 	
	 	library=libraryOn;
	 	code.reset(library);
	 	if (library) code.comment("---Begin Of Predefined Items---");
	 	
	 	error.reset();
	 	translate(parseResult.symbolTable,parseResult.ast);
	 	if (error.occured) return false;
	 	if (library) code.comment("---End Of Predefined Items---");
	 	return code.get(); 	
	 };
		 
	 
	 function Return(name,type){
	 	this.name="ret"+name;
	 	this.type=type;
	 }
		 
	 function Translation(translation,type,line,kind,option,init,scope){
	 	this.translation=translation;
	 	this.type=type;
	 	this.line=line;
	 	this.kind=kind;
	 	this.option=option;
	 	this.init=init;
	 	this.scope=scope;
	 }	 
	 
	 
	 function isType(symbolTable,ident) {
		var tmp=translate(symbolTable,ident);
	 	switch (tmp.kind) {
	 		case "type":
	 		case "class":
	 		case "struct":
	 		case "array": 	return tmp;
	 		default 	:   error.typeExpected(tmp.translation,tmp.kind,tmp.line)
	 	}
	 }
		 
	 // A little helper to translate a sequence of code in an array (needed by program an codeblock)
	 function statementSequence(symbolTable,seq) {
	 	var s=code.sectionBegin();
	 	for (var i=0;i<seq.length;i++){	 
	 		code.x(seq[i].line);		
	 		translate(symbolTable,seq[i]); 					
	 		if (seq[i].comment!=undefined) code.comment(seq[i].comment);
	 		//code.x(seq[i].line);
	 	}
	 	code.sectionEnd(s);
	 }
	 
	 function identSequence(symbolTable,ast) {
		//Get the first identifier
		var identSeq=translate(symbolTable,ast.l[0]);
		if (identSeq.kind == "class" || identSeq.kind == "struct")	{
	 		error.expected(identSeq.translation,identSeq.kind,"variable, array or function",identSeq.line)
	 		return identSeq;
	 	}
		
		// Check for declare before use
	 	if (symbolTable.isNotDeclared(identSeq.translation)) error.declareBeforeUse(identSeq.translation,identSeq.kind,identSeq.line);
	 	identSeq.translation="global['"+identSeq.translation+"']";
		var typed=(identSeq.type.name!="_$any");

		var translation=identSeq.translation; 								// Translation for error report
			
		var indexes=[];														// Buffer Index Expression
		var boundCnt=0;												    	// Count of specified Bounds 
		
	 	for(var i=1;i<ast.l.length;i++) {
	 			 			 		
	 		switch(ast.l[i].type) {	 							
	 			case "ident":	 			
	 			
	 				//boundCnt=0;	
	 				if (identSeq.type.kind=="array"  && ast.l[i].content=="_$length") {  // Length of an Array
	 					identSeq.type=t["_$integer"];
	 					identSeq.kind="literal";
	 					identSeq.option=undefined;							
	 					//identSeq.translation+=".value.length()";
	 					identSeq.translation+=".access('_$length')";
	 					break;	
	 				}
	 				
	 				if (identSeq.type.kind=="array"  && ast.l[i].content=="_$keys") { // Keys of an Array
	 					debugMsg("Here I am");

	 					identSeq.type=t["keys"+identSeq.type.name];
	 					identSeq.kind="array";
	 					identSeq.option=undefined;							
						//identSeq.translation+=".value.keys()";
						identSeq.translation+=".access('_$keys')";
	 					break;	
	 				}
	 				debugMsg(identSeq.type.kind);
	 				debugMsg(ast.l[i].content);

	 				if (typed) {
	 					var entry=symbolTable.get(identSeq.type.name);

	 					if (entry.kind != "class" && entry.kind != "struct") {   // Must be a field of a class or a struct
	 						error.structOrClassExpected(translation,entry.kind,identSeq.line);		
	 						return identSeq;
	 					} else symbolTable=entry.scope;							// Set Symbol Table for current level
	 				
	 					if (!symbolTable.inThisScope(ast.l[i].content))  { 		 // Check if it's really a field 
	 						error.fieldExpected(ast.l[i].content,translation,identSeq.line);
							return identSeq;
						}
										
	 					var ident=translate(symbolTable,ast.l[i]);				//  Update the sequence
	 					identSeq.type=ident.type;
	 					identSeq.kind=ident.kind;
	 					if (ident.kind == "class" || ident.kind == "struct")	{
	 						error.expected(translation,ident.kind,"constant, variable, array or function",identSeq.line)
	 						return identSeq;
	 					}

	 					identSeq.option=ident.option;							// The bound of an array or params of a function
	 				} else var ident={"translation":ast.l[i].content};
	 					
	 				
	 				identSeq.translation+=".access('"+ident.translation+"')";
	 				translation+=ident.translation;
	 				
	 			break;
	 				
	 			case "arrayIndex":	 
	 				if (typed){				
	 					// Check if it's really an array
	 					if (identSeq.type.kind=="array") {
	 						indexes.push({"scope":symbolTable,"bound":identSeq.type.bound/*s[boundCnt]*/,"expr":ast.l[i].l}); // store the index expressions
	 						identSeq.kind=identSeq.type.kind;
							identSeq.type=identSeq.type.type;
	 					} else {	 		
	 						error.arrayExpected(translation,identSeq.kind,identSeq.line);
	 						return identSeq;	 				
	 					}
	 				} else indexes.push({"scope":symbolTable,"bound":t["_$any"]/*s[boundCnt]*/,"expr":ast.l[i].l}); // store the index expressions

	 		
	 				identSeq.translation+=".access(pop())";
	 				translation+="[]";
	 		/*		boundCnt++;		
	 				if (boundCnt>=identSeq.type.bounds.length) {*/
	 					
	 						
					//}
	 			break;
	 			default: console.log("Internal Error in translator.js identSequence wrong type in argument.. ast.l["+i+"].type=="+ast.l[i].type);
	 		}
	 	}
	 	
	 	//Translate Index Expressions
	 	for (var i=indexes.length-1;i>=0;i--) {
	 		var expr=translate(indexes[i].scope,indexes[i].expr);
	 		if (typed) indexes[i].bound.assign(expr);		
	 	}
	
	 	return identSeq;
	} 
	
	function varDecl(symbolTable,decl) {
		
		isType(symbolTable,decl.type);

	 	var entry=translate(symbolTable,decl.name);
	 	symbolTable.declare(entry.translation);
	 	
	 	/*var bounds=undefined;
	 	if (entry.kind=="array") bounds=entry.option;*/
	 	if (entry.kind!="variable" && entry.kind!="constant") error.variableExpected(entry.translation,entry.kind,entry.line);
	 	
	 	var init=false;				 						 						 				
	 	if (decl.expr) {
	 		
	 		init=true;				
	 		var expr=translate(symbolTable,decl.expr);
	 						
	 		entry.type.assign(expr); //Type Check 
	 					
	 	} 
	 	
	 	return new Translation(entry.translation,entry.type,entry.line,entry.kind,null,init);	 			
	 }
	 
	 
	 function functionDecl(symbolTable,ast,className) {
	 	if (className==undefined) className="";
	 	var section=code.sectionBegin();
	 			
	 	// Check the return type
	 	var retType=isType(symbolTable,ast.l.returnType);
	 				 			
	 	// Generate Function Hearder
	 	var ident=translate(symbolTable,ast.l.name);
	 	if (ident.kind!="function") error.functionExpected(ident.translation,ident.kind,ast.l.name.line);//Type Check
	 	
	 	prevRet.push(ret); //store the previously defined retType
	 	if (!ident.type) ident.type=t._$any;
	 	ret=new Return(ident.translation,ident.type);						   // Declare a variable for the return value
	 	
	 	addLines=false;
	 	code.add("{f.create('"+ident.translation+className+"',");		
	 	code.add("f.enter('"+code.getNextSection()+"',[");					// Store the return point and create the function scope
	 			
		//Translate Parameter
	 	for (var i=0;i<ast.l.param.length;i++) {
	 		var param=varDecl(ast.l.scope,ast.l.param[i]);

	 		code.add("{'n':'"+param.translation+"','t':'"+param.type.name+"','c':"+(param.kind=="constant")+"},");
	 		ast.l.scope.declare(param.translation);
	 	}
	 	
	 	code.add("]));"); 
	 	addLines=true;
	 	
	 	//Translate the CodeBlock of the function
	 	code.next();		
	 	translate(ast.l.scope,ast.l.code);
	 			
	 	// No Return
	 	code.add("f.exit('"+ret.type.name+"');");
	 	code.add("};");
	 	ret=prevRet.pop(); //restore the previously defined retType 
	 			
	 	code.sectionEnd(section);
	 	return {"name":ident.translation,"globalName":ident.translation+className}; 
	 }
	
	 
     function translate(symbolTable,ast) {
     	debugMsg("Translator:translate("+ast.type+")");
     	
     	if (ast.line!=undefined) {
     		if (addLines && !library) code.position(ast.line);
     		line=ast.line;
     	}
     	
	 	switch (ast.type) {
	 		
	 		case "program":
	 			code.begin(mode.mode);
	 			ret=new Return("",t._$any);
	 			statementSequence(symbolTable,ast.l);	
	 			code.end(mode.mode);
	 		break;
	 			
	 		case "function":
	 			code.pause();
	 			functionDecl(symbolTable,ast);
	 			code.proceed();
	 		break;
	 		
	 		case "return":	 				 				
	 		   	if (ast.l) { // If there is a return value return it
	 		   		var expr=translate(symbolTable,ast.l);  		
	 		  		ret.type.assign(expr);	
	 		  		code.add("f.exit('"+ret.type.name+"',pop(),"+ast.line+");"); 		  		
	 		   	} else code.add("f.exit('"+ret.type.name+"',undefined,"+ast.line+");");
	 			code.add("return;");
	 		break;
	 		
	 		case "functionCall":
	 			var section=code.sectionBegin();
	 			var ident=identSequence(symbolTable,ast.l);
	 			var typed=(ident.type.name!="_$any");
	 			
	 			if (typed && ident.kind!="function") error.functionExpected(ident.translation,ident.kind,ast.l.line);
	 					 				
	 			// Check for right param count 
	 			if (ident.option!=undefined) if (typed && ident.option.length!=ast.r.length) error.wrongParameterCount(ident.translation,ident.option.length,ast.l.line);
	 				
	 			// Translate Parameter	
	 			for (var i=0;i<ast.r.length;i++) {
	 				var param=translate(symbolTable,ast.r[i]);
						
					// TypeCheck
					if (typed) t[ident.option[i].content].assign(param);		 
	 			}
	 			code.add("run("+ident.translation+",'"+code.getNextSection()+"');"); // Call the function with the return place
	 				
	 			code.next(); // The return place;
	 				
	 			code.sectionEnd(section);
	 			return ident.type;
	 		break;	
	 			
	 		// Variable Declaration
	 		case "constant":
	 		case "variable":
	 			var decl=varDecl(symbolTable,ast.l);
		
	 			switch (decl.kind) {	
	 				case "variable"	:   code.add("v.create('"+decl.translation+"','"+decl.type.name+"');");		
 					break;
 
				/*	case "array"	:   code.add("array.create('"+decl.translation+"','"+decl.type.name+"',"+decl.option+");");	 
					break; */
						
					case "constant"	:   code.add("c.create('"+decl.translation+"','"+decl.type.name+"');");
	 				break;
	 				
	 				default			:	error.variableExpected(decl.translation,decl.kind,decl.line);
	 				break;
	 			}
	 									 				
	 			if (decl.init) code.assign("global['"+decl.translation+"']");
	 		break;
	 			
	 		case "codeBlock":
	 			var section=code.sectionBegin();  			
	 			code.x(ast.l.begin);
	 			code.add("s.enter();");
	 			statementSequence(ast.l.scope,ast.l.code);
	 			code.x(line);
	 			code.add("s.exit();")
	 			code.x(ast.l.end);
	 			code.sectionEnd(section); 	 
	 		break;
	 			 			
	 		case "if":	 		   	 		
	 			var section=code.sectionBegin();   	   		
	 			var cond=translate(symbolTable,ast.l.cond);
	 		   		
	 		   	//TypeCheck
	 		   	t._$boolean.assign(cond);

				// If 
				code.comment("if-begin");
	 		    code.condJumpNext();
	 		   	code.next();
	 		   	code.comment("if-block");

	 		   	translate(symbolTable,ast.l.code);		   	
	 		   	// Else	
	 		   	if (ast.l.elseBlock!=undefined) {
	 		   		code.jumpNextNext();
	 		   		code.next();
	 		   		code.comment("else-block");
	 		   		translate(symbolTable,ast.l.elseBlock);	
	 		   	} 
	 		   	
	 		   	code.jumpNext();
	 		   	code.next();
	 		   	code.comment("else-end");
	 		   	code.sectionEnd(section); 	

	 		break;
	 		   
	 		case "do": 		
	 			var section=code.sectionBegin();   
	 			code.comment("do-begin");   
	 		   	code.jumpNext();
	 		   
				code.next(); 		
							
	 		   	//The Code
	 		   	translate(symbolTable,ast.r);
	 		   		
	 		   	var cond=translate(symbolTable,ast.l);
	 		   	t._$boolean.assign(cond);
	 		   		
	 		   		
	 		   	code.comment("while");
	 		   	code.condJump(ast.line);
	 		   		
	 		   	code.comment(ast.comment);
	 		   	 		   		
	 		   	code.next();  
	 		   	code.comment("do-end");
	 		   	code.sectionEnd(section); 	
			break;
	 		   
	 		case "while":   
	 			var section=code.sectionBegin();
				var cond=translate(symbolTable,ast.l);
	 		   	t._$boolean.assign(cond);
	 		   		
	 		   	code.comment("while-begin");
	 		   	code.condJumpNext();
	 		   	code.next();
	 		   		 
	 		   	// The Codeblock 
	 		   	translate(symbolTable,ast.r);
	 		   	
	 		   	translate(symbolTable,ast.l);
	 		   	code.condJump(ast.line);
	 		   		
	 		   	code.next();
	 		   	code.comment("while-end");	 	
	 		   	code.sectionEnd(section);	   		
	 		break;
	 		
	 		case "foreach":
	 			var section=code.sectionBegin();
	 			code.comment("for-each");
	 			
	 			if (mode.auto) declareVariable=true;  
	 			var elem=identSequence(symbolTable,ast.l.elem);
	 			declareVariable=false;
	 			var array=identSequence(symbolTable,ast.l.array);
	 			
	 			// Check if array is an array and elem is of the elementType of the array
				if (array.type.name!="_$any"){
	 				if (array.type.kind!="array") error.arrayExpected(array.name,array.kind,array.line);
	 				else elem.type.assign(array.type.type);
	 			}
	 			code.add("debugMsg('foreach');");
	 			
				code.add(array.translation+".value.first();");
				
				code.condJumpNext();
				code.next();
				code.add("debugMsg('foreach-head');");

				code.add(elem.translation+".assign();");
				// Code
	 		   	translate(symbolTable,ast.l.code);
	 		   	
	 		   	identSequence(symbolTable,ast.l.array);
	 		   	code.add(array.translation+".value.next();");
	 		   	code.add("debugMsg('foreach-tail');");

				code.condJump(ast.line);

				code.next();
				code.add("debugMsg('foreach-end');");

				code.comment("for-end");
	 			code.sectionEnd(section);	   		
	 		break;
	 		   
	 		case "for":
	 			var section=code.sectionBegin();
	 			
	 			// Initialisation
	 		   	code.comment("for-init");
	 		   	var init=translate(symbolTable,ast.l.init);
	 		   		
	 		   	code.comment("for-cond");
	 		   	var cond=translate(symbolTable,ast.l.cond);
	 		   	t._$boolean.assign(cond);
	 		   		
	 		   	code.condJumpNext();
	 		   	code.next();
	 		   	code.comment("for-begin");
	 		   		
	 		   	// Code

	 		   	translate(symbolTable,ast.l.code);
   			 		   		
	 		   	code.comment("for-inc");
	 		   	translate(symbolTable,ast.l.inc);
	 		   		
	 		   	code.comment("for-cond");
	 		   	translate(symbolTable,ast.l.cond);
	 		   	code.condJump(ast.line);
	 		   		
	 		   	code.next();
	 		   	code.comment("for-end");	
	 		   	code.sectionEnd(section); 	   		
			break;
	 		   
	 		case "switch":
	 			var section=code.sectionBegin();
	 			var ident=identSequence(symbolTable,ast.l.ident);
	 		   
	 		   	code.comment("switch-begin");
	 		       		
	 		   	// Translate all Options
	 		   	for (var i=0;i<ast.l.option.length;i++) {
	 		   		var option=ast.l.option[i];
	 		   			
	 		   		// Case - Part
	 		   		var cond="";
	 		   		for (var j=0;j<option.l.length;j++) {
						code.add("push("+ident.translation+");");
	 		   			var expr=translate(symbolTable,option.l[j]);	
	 		   				
	 		   			// Type-Check
	 		   			ident.type.eq(expr);
	 		   				
	 		   			code.add("eq();");
	 		   			if (j!=0) code.add("or();");
	 		   		}
	 		   			
	 		    	code.condJumpNext();
	 		   		code.next();
	 		   		code.comment("case-"+i);
	 		   		// Code
	 		   		translate(symbolTable,option.r);
	 		   		
	 		   		//Jump to End
	 		   		code.jump((ast.l.option.length-i)*2);
	 		   		
	 		   		code.next();
	 		   	}
	 		   	
	 		   	code.comment("default");
	 		   	
	 		   	translate(symbolTable,ast.l.defBlock);
	 		   	
	 		   	//Must Jump out of default, or program wouldn't continue
	 		   	code.jumpNext();
	 		   	
	 		   	code.next();
	 		   	code.comment("case-end");
	 		   	code.sectionEnd(section);
			break;
	 		   
	 		case "javascript":
	 		
	 			code.add("use(");
	 			// Translate Parameter	
	 			for (var i=0;i<ast.l.param.length;i++) {
	 				if (i!=0) code.add(",");
	 				var param=translate(symbolTable,ast.l.param[i]);
	 			
	 				// Disable custom types in javascript includes
					switch (param.type.name) {
			 
						case "_$any":
						case "_$boolean":
						case "_$integer":
						case "_$number":
						case "_$character":
						case "_$string":
	 					break;
	 					default:
							error.add("variable "+correctName(param.translation)+" of custom type "+correctName(param.type.name)+" may not be used in javascript",line);
						break;						
					}
					code.add("{'n':'"+param.translation+"','t':'"+param.type.name+"'}");
	 			}	 	
	 				
	 			code.add(");");	
	 			code.add("runJS('"+ast.l.js+"');");
	 		break;
	 		   	
	 		   	
	 		case "=":
	 		   	
	 			var source=translate(symbolTable,ast.r);
	 		   	if (mode.auto) declareVariable=true;  
	 			var target=identSequence(symbolTable,ast.l);
	 			declareVariable=false; 
	 				
	 			// Type Check	
	 			target.type.assign(source);
	 			
	 			code.assign(target.translation);	
	 				
	 		break;
	 			
	 		case "!":
	 			var expr=translate(symbolTable,ast.l);
	 			
	 			code.add("not();");
	 			
	 			return expr.not();
	 		break;	
	 			
	 		case "|":
	 			var l=translate(symbolTable,ast.l);
	 			var r=translate(symbolTable,ast.r);
	 				
	 			code.add("or();");
	 					
				return l.or(r);
	 		break;
	 			
	 		case "&":
	 		    var l=translate(symbolTable,ast.l);
	 			var r=translate(symbolTable,ast.r);
	 			
	 			code.add("and();");
	 					 				
				return l.and(r);
	 		break;
	 			
	 		case "==":
	 			var l=translate(symbolTable,ast.l);
	 			var r=translate(symbolTable,ast.r);
	 			
	 			code.add("eq();");	
	 				
				return l.eq(r);
	 		break;
	 			
	 		case "!=":
	 			var l=translate(symbolTable,ast.l);
	 			var r=translate(symbolTable,ast.r);
	 				
	 			code.add("ne();");	
	 				
				return l.ne(r);
	 		break;
	 			
	 		case "<=":
	 			var l=translate(symbolTable,ast.l);
	 			var r=translate(symbolTable,ast.r);
	 				
	 			code.add("le();");
	 					
				return l.le(r);
	 		break;
	 			
	 		case ">=":
	 			var l=translate(symbolTable,ast.l);
	 			var r=translate(symbolTable,ast.r);
	 				
	 			code.add("ge();");
	 				
				return l.ge(r);
	 		break;
	 			
	 		case "<":
	 			var l=translate(symbolTable,ast.l);
	 			var r=translate(symbolTable,ast.r);
	 				
	 			code.add("lt();");
	 				
				return l.lt(r)
	 		break;
	 		
	 		case ">":
	 			var l=translate(symbolTable,ast.l);
	 			var r=translate(symbolTable,ast.r);
	 				
	 			code.add("gt();");	
	 				
				return l.gt(r);
	 		break;
	 		
	 		case "in":
	 			var l=translate(symbolTable,ast.l);
	 			var r=translate(symbolTable,ast.r);
	 			
	 			code.add("inArray();");	
	 				
				return l.inArray(r);
	 		break;
	 			
	 		case "+1":
	 			var l=translate(symbolTable,ast.l);
	 				
	 			code.add("plus();");
	 			
	 			return l.plus();
	 		break;
	 			
	 		case "-1":
	 			var l=translate(symbolTable,ast.l);
	 				
	 			code.add("minus();");
	 				
	 			return l.minus();
	 		break;
	 			
	 		case "+":
	 			var l=translate(symbolTable,ast.l);
	 			var r=translate(symbolTable,ast.r);
	 				
	 			code.add("add();");
	 				
				return l.add(r);
	 		break;
	 			
	 		case "-":
	 			var l=translate(symbolTable,ast.l);
	 			var r=translate(symbolTable,ast.r);
	 				
	 			code.add("sub();");	
	 				
				return l.sub(r);
	 		break;
	 			
	 		case "*":
	 			var l=translate(symbolTable,ast.l);
	 			var r=translate(symbolTable,ast.r);
	 				
	 			code.add("mul();");
	 				
				return l.mul(r);
	 		break;
				
			case "/":
	 			var l=translate(symbolTable,ast.l);
	 			var r=translate(symbolTable,ast.r);
	 				
	 			code.add("div();");	
	 				
				return l.div(r);
	 		break;
	 			
	 		case "%":
	 			var l=translate(symbolTable,ast.l);
	 			var r=translate(symbolTable,ast.r);
	 				
	 			code.add("mod();");
	 				
				return l.mod(r);
	 		break;
	 		
	 		case "ident":
	 				
	 			var name=ast.content;
	 			
	 			var symTabEntry=symbolTable.get(name);
	 				
	 			// If there is no symTab entry create one
	 			var type;
	 			if (!symTabEntry) {
	 				type=t._$any;
	 				if(declareVariable) {
	 					console.log(mode);
	 					if (!(mode.mode=="i" &&  error.occured)) {
	 						code.variableDeclaration(name,type.name);
	 						symbolTable.addVar(name,type.name);
	 						symTabEntry=symbolTable.get(name);
	 						symTabEntry.isDeclared=true;
	 					}
	 				} else error.notDeclaredIdentifier(name,ast.line);
	 			} else type=t[symTabEntry.type];
	 			
	 			var option;
	 			if (symTabEntry.paramType) option=symTabEntry.paramType;
	 			else if (symTabEntry.bounds) option=symTabEntry.bounds;
	 		 	
	 			return new Translation(name,type,ast.line,symTabEntry.kind,option,false,symTabEntry.scope);
	 		break;
	 		
	 		case "literal":
	 			if (addLines) code.add("l="+ast.l.line+";");
	 			code.add("push(lit['"+ast.l.type+"'].get("+ast.l.content+"));");
	 			return t[ast.l.type];
	 		break;

				 			
	 		case "identSequence":
			
				var ident=identSequence(symbolTable,ast);
				code.add("push("+ident.translation+");");
				return ident.type;
	 		break;
	 		
	 			
	 		case "operator":
	 		case "assignmentOperator":
	 			return  ast.content;
	 		break;
	 		
	 		case "new":
	 			var section=code.sectionBegin();
	 			var name=translate(symbolTable,ast.l);
	 			if (name.kind!="class") error.classExpected(name.translation,name.kind,name.line); //Type Check
	 			
	 			// Create Object
	 			code.add("obj=o.create('"+name.translation+"');");

	 			// Prepare Constructor Call	
	 			var construct=name.scope.get("construct");	
	 			if (construct) {				
	 				// Check for right param count 
	 				
	 				if (construct.paramType.length!=ast.r.length) error.wrongParameterCount(name.translation,construct.paramType.length,ast.l.line);
	 			
	 				for (var i=0;i<ast.r.length;i++) {
	 					var param=translate(name.scope,ast.r[i]);
						// TypeCheck
						t[construct.paramType[i].content].assign(param);
	 				}
		 			
		 			// Call the constructor	
	 				//code.add("o.call(obj,'construct','"+code.getNextSection()+"');"); // Call the constructor
	 				code.add("run(o.call(obj,'construct'),'"+code.getNextSection()+"');");
	 				code.next(); // The return place;
	 				code.add("pop();")
	 			} else if (ast.r.length!=0) error.wrongParameterCount(name.translation,0,ast.l.line);
	 			
	 			// Push new Object to stack stack
	 			code.add("push(obj);");
	 			code.sectionEnd(section);
	 			return name.type;
	 		break;
	 				 				
	 		case "class":
	 			code.pause();
				
	 		 	//		Class:= "class" Ident ["extends" Ident] "{" {VarDecl | Function}"}"
				//		AST: "class" : l: name:Identifier,extends: ( undefined | Identifier),fields:VarDecl[0..i], methods:Function[0...i]
	 			
	 			// Get the symbol table entry for the class
	 			var name=translate(symbolTable,ast.l.name);
	 			if (name.kind!="class") {
	 				error.classExpected(name.translation,name.kind,name.line); //Type Check
	 				return;
	 			}
	 			code.comment("Class "+name.translation);
	 				 			
	 			// Get the symbol table entry for the Superclass
	 			var extend={"translation":"null"};
	 			if (ast.l.extends.content){
	 				var extend=translate(symbolTable,ast.l.extends);
	 				if (extend.kind!="class") error.classExpected(extend.translation,extend.kind,extend.line); //Type Check
	 				else { name.scope.addObjectElements(name.type.name,extend.type.name); 
	 				       name.scope.extend(name.translation,extend.translation,extend.scope);
	 				     }
	 			} else name.scope.addObjectElements(name.type.name,undefined);
	 			
	 			
	 			code.addType(name.translation,'class',extend.translation);
	 			
	 			// Property declaration 
		   	 	for (var i=0;i<ast.l.fields.length;i++) {
	 				var decl=varDecl(ast.l.scope,ast.l.fields[i].l);
	 				code.addField(decl.type.name,decl.translation,decl.kind=="constant");
	 			}
	 			
	 			//Method declaration
				for (var i=ast.l.methods.length-1;i>=0;i--) {
	 				var curMethod=functionDecl(ast.l.scope,ast.l.methods[i],name.translation);
	 				code.addMethod(curMethod.name,curMethod.globalName);
	 			}
	 							
	 			// Add type
	 			code.comment("Class "+name.translation);
	 			 			
	 			code.proceed();
	 		break;
	 		
	 		case "structure":
	 			// AST: "structure" : l: "name":Ident, "decl":[VarDecl]
	 			code.pause();
	 			
	 			var name=translate(symbolTable,ast.l.name);
	 			if (name.kind!="struct") error.structureExpected(name.translation,name.kind,name.line);
	 			
	 			code.addType(name.translation,'struct','null');

	 			for (var i=0;i<ast.l.decl.length;i++) {
	 				var decl=varDecl(ast.l.scope,ast.l.decl[i].l);
	 				code.addField(decl.type.name,decl.translation,decl.kind=="constant",decl.option);
	 			} 				 					 				 				 				 				 			
	 			code.proceed();
	 		break;
	 		
	 		case "array":
	 			var name=translate(symbolTable,ast.l.name);
				if (name.kind!="array") {
					error.arrayExpected(name.translation,name.kind,name.line);
				}
				
				// TypeCheck Bound
				isType(symbolTable,ast.l.indexType);
	
				// TypeCheck ElemType
				isType(symbolTable,ast.l.elemType);
				
				code.addArray(name.translation,name.type.name,name.option);
	 		break;
	 			
	 		default: console.log("Translator:"+ast.type+"... unknown AST Type");
	 	}
	    return undefined;

	 }
}
	