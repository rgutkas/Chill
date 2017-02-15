/* Code.js
*	Translates the ast into executable javascript and preforms type-checks
*/

function Code(){
	
	 var code=[];
	 var pos=-1;
     var lineBefore=1;
//     var debug=false;
//     var debugCnt=0;
	 var library=false; 
     
     function add(text){
     	debugMsg ("code.add("+text+")");
     	code[pos]+=text;
     }
     
     function next(){
     	pos++;
     	code[pos]="";
     }
          
	 this.reset=function(libraryOn) {
	 	library=libraryOn;
	 	code=[];
	 	pos=-1;
	 	next();
	 	if (library) this.add("l='Predefined Items';");
	 	else this.add("l=1;");
     	lineBefore=1;
     	sectionCnt=0;
     	subSectionCnt=0;
	 	section=[];
	 }
	 
	 this.get=function() {
	 	var result="";
	 	for (var i=0;i<code.length;i++) {
	 		result+=code[i];	
	 	}
	 	
	 	return result;
	 }
	 
	 this.add=function(text){
	 	if (text!=undefined) add(text);
	 };
	 
	 this.begin=function(mode) {
	 	add("function m(){p.enter('");
	 	if (library) add("l");
	 	else add(mode);
	 	add("');");	
	 }
	
	 this.end=function(mode) {
	 	add("p.exit('");
	 	if (library) add("l");
	 	else add(mode);
		add("');}; m();");
	 }
	  
	 
	 this.pause=function(){
	 		add("run(m"+(pos+2)+");};");	
	 		next();
	 }
	 
	 this.proceed=function(){
	 		next();
	 		add("function m"+pos+"(){");	
	 }
	
	 this.comment=function(comment) {
	 	if (comment!=undefined) {
	 		add("/*"+comment+"*/");
	 	}
	 }
	 
	 this.position=function(line) {
	 	if (lineBefore<line) {
	 		for (;lineBefore<line;lineBefore++) add("\nl="+(lineBefore+1)+";");
	 	} else if (line!=lineBefore) add("l="+line+";");
	 }
	 
	 
	 this.variableDeclaration=function(name,typeName){
	 	add("v.create('"+name+"','"+typeName+"');");		
	 }
	 
	 this.assign=function(targetName) {
	 	/*add("assign('"+targetName+"');");*/
	 	add(targetName+".assign();");
	 }
	 
	 this.addType=function(name,kind,extend) {
	 	add("t.addClass('"+name+"','"+kind+"','"+extend+"');");
		add("type=t['"+name+"'];");
	 }
	 
	 this.addArray=function(name,typeName,bound) {
	 	add("t.addArray('"+name+"','"+typeName+"','"+bound+"');");
	 }
	 
	 this.addField=function(typeName,name,constant,bounds) {
	 	add("type.fields['"+name+"']={'typeName':'"+typeName+"','name':'"+name+"','constant':"+constant+",'bounds':"+bounds+"};");
	 }
	 	
	 this.addMethod=function(name,globalName) {
	 	add("type.methods['"+name+"']=global['"+globalName+"'];");
	 }
	 
	 // Sections are like chapter numberings (this is needed for jumps)	
	 var sectionCnt=0;
	 var subSectionCnt=0;
	 var section=[];
 
	 this.sectionBegin=function(){ 	
	 		section.push(sectionCnt);
    		sectionCnt=subSectionCnt;
    		return section;	
	 }
	 
	 this.sectionEnd=function(s){
	 	subSectionCnt=sectionCnt+1;
	 	sectionCnt=s.pop();
	 	section=s;
	 }
	 
	 this.getNextSection = function () 		   {return getSection(sectionCnt+1); };
	 function getSection(cnt){
	 	if (library) var prefix="y";
	 	else var prefix="x";
  		return prefix+'["'+String(section).replace(/,/g,"_")+"_"+cnt+'"]';
	 }
	 
	 
	 this.jump=function(n){
	 	add("run("+getSection(sectionCnt+n)+");");	
	 }
	 
	 this.next=function() {
	 	sectionCnt++;
	 	add("}; "+getSection(sectionCnt)+"=function(){");
	 			
	 }
	 
	 this.jumpNext=function(){
	 	this.jump(1);	
	 }	
	 
	 this.jumpNextNext=function(){
	 	this.jump(2);	
	 }	
	 		   		
	 this.jumpBegin=function(){
	 	this.jump(0);
	 }		   		
	 
	 this.x=function(line){
	 	if (line!=undefined) {
	 		this.position(line);
	 		
	 		if (library) add("run");
	 		else add("jump");
	 		
	 		add("("+getSection(sectionCnt+1)+","+line+");");
	 		this.next();
	 	}
	 }
	 		   	
	 // Jumps to the begin if cond is true		   		
	 this.condJump=function(){
	 	add("if (pop().value)");
	 	this.jumpBegin();
	 	add("else ");
	 	this.jumpNext();
	 }		   	
	 
	 //Jumps to the next Snipet if condition is true or to the one following next if condition is false
	 this.condJumpNext=function(){
	 	add("if (pop().value)");
	 	this.jumpNext();
	 	add("else ");
	 	this.jumpNextNext();	
	 }
	 
	 
	 function Tabulator() {
	 	this.cnt="";
	 	
	 	this.inc=function(){
	 		this.cnt+="\t";
	 	}
	 	this.dec=function(){
	 		this.cnt=this.cnt.slice(0,this.cnt.length-1);
	 	}
	 }
}
	 

	