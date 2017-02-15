/* editor.js	
		shared functions for the input Editors
*/

var hIndex=0;
var editorIndex = 0;
var inputEditor;

var mode="";
var addLine=true;
var speed=0;

// Functions for use in the html pages

// Compile and Execute code if not active, abort execution if active
function compileButtonPress() {
	switch (button.state("compile")) {
		case "Run":
			button.wait("compile");
			compiler.setMode("run"); 
			if (button.state("debug")=="Next") {
				button.label("debug","Step");	
				button.exec("compile");
				compiler.step();		
			} else {
				var code=inputEditor.getValue();
				
        		if (mode=="program") log.clear();
        		else {
        			log.inMsg(code);
        			inputEditor.setValue("");
        		}
        		compiler.stepInto(code,mode);
        	}
		break;
		case "Stop":	
			button.stop("compile","Run");	
			button.on("debug");
		break;
		defaul: console.log("Error: compileButton Unknown State:"+button.state("compile"));
	}
	inputEditor.focus();
}

// Start Debug or Step
function debugButtonPress() {
	switch (button.state("debug")) {
		case "Step":
			button.wait("debug"); 
			compiler.mode="debug";
  			compiler.stepInto(inputEditor.getValue(),mode);
        	log.clear();
        	inputEditor.setReadOnly(true);
			inputEditor.setHighlightActiveLine(true);
			inputEditor.gotoLine(1);
			stepLine=1;
		break;
		case "Stop":	
			button.stop("debug","Step");	
		break;
		case "Next":
			button.exec("debug");
			compiler.postMessage({"type":"step"});
		break;
		default: console.log("Error: debugButton Unknown State:"+button.state("debug"));
	}	
	inputEditor.focus();
}


function getEditor (name,multiLine) {
	var edit=new Editor(name,multiLine);
		if (parent.editorDisabled) {
			edit.disable();
			parent.editorDisabled=undefined
		};
		edit.load();
		parent.sendCommand("get","predefindedItems",{"exercise":parent.getSelection('exercises')},function (data) {
			edit.setLibrary(data);		
		});
	return edit;
}

function Editor(exerciseName,multiLine) {	
	var name=exerciseName;
	var library=undefined;
	var disabled=false;
	
	// Initialisation	
    editorIndex = 0;
 
 	// Initialises ace ... multiLine is a boolean, specifying if its a multi-line input (true will show a gutter)
    inputEditor = ace.edit("inputEditor");
    inputEditor.setHighlightActiveLine(false);
 	inputEditor.renderer.setShowGutter(multiLine);
    inputEditor.setTheme("ace/theme/chrome");
    inputEditor.getSession().setMode("ace/mode/c_cpp");

 
    button.init();
    if (multiLine) mode="program";
	else {
		mode="instruction";
    	addLine=false;
    	function scrollHistoryDown(editor) {
    		log.historyIndex++;
       		if (log.historyIndex >= log.history.length) {
            	log.historyIndex=log.history.length;
            	editor.setValue("");
        	} else editor.setValue(log.history[log.historyIndex]);

    	}

    	function scrollHistoryUp(editor) {
    		 log.historyIndex--;
       		 if (log.historyIndex <= 0) {
       		 	 log.historyIndex=0;
        	 }
        	 editor.setValue(log.history[log.historyIndex]);
    	}
    	
  		inputEditor.commands.addCommand({
        	    name: 'send',
           		bindKey: {win: 'Return',  mac: 'Return'},
            	exec: compileButtonPress,
            	readOnly: true// false if this command should not apply in readOnly mode
     	});
     
      	inputEditor.commands.addCommand({
            name: 'historyUp',
            bindKey: {win: 'up',  mac: 'up'},
            exec: scrollHistoryUp,
            readOnly: disabled// false if this command should not apply in readOnly mode
      	});

      	inputEditor.commands.addCommand({
            name: 'historyDown',
            bindKey: {win: 'down',  mac: 'down'},
            exec: scrollHistoryDown,
            readOnly: disabled// false if this command should not apply in readOnly mode
     	});
    }
    
    function reset() {
		inputEditor.setValue("");
		log.init(mode);
		initializeCompiler();
	}
    
    reset();
	
	// Methods
	
	// reset the editor
	
	this.reset=function(){
		reset();
		this.setLibrary();
	}
	
	// Set the Value of the editor
	this.set=function(code){
		inputEditor.setValue(code);	
	}
	
	// returns the text contained in the editor
	this.get=function(){
		return inputEditor.getValue();	
	}
	
	this.handIn=function(){
		disabled=true;
		inputEditor.setReadOnly(disabled); 
		console.log("HandIn Readonly"+inputEditor.getReadOnly());
		if (mode=="program") return inputEditor.getValue();
		else return JSON.stringify(log.history);
	}
	
	// Load content to the editor, if no content is given try to load it from local Storage
	this.load=function(){
		
		console.log ("load: "+name+" mode: "+mode);
		var content=parent.editorContent;
		if (content==undefined) {
			content=localStorage.getItem(name);
			if (mode=="instruction") {
				try {content=JSON.parse(content);} catch (err) {content=undefined}
			}
		}
		if (content) {
			switch (mode) {
				case "program": inputEditor.setValue(content);
				 break;
			 
				 case "instruction": log.history=content;
				 					 log.historyIndex=log.history.length;
				 console.log(log.history);	
				 break;
			}
		}
		parent.editorContent=undefined;
	}
	
	// Store the content of the editor to local storage
	this.store=function(){
		console.log("store "+name);
		switch (mode) {
			case "program": localStorage.setItem(name,inputEditor.getValue());
			 break;
			 
			 case "instruction": localStorage.setItem(name,JSON.stringify(log.history));
			 break;
		}
	}
	
	// Load libraries	
	this.setLibrary=function(codeArray){
		if (codeArray!=undefined) library=codeArray;
		log.clear();
		
		button.wait();
		log.Msg("Loading Predefined Items");
		
		//Set response so loaded instructions get executed in instruction mode
		if (mode=="instruction") {
			response=executeLog;
			hIndex=0;
		}
		compiler.postMessage({"type":"library","source":library});
	}
	
	// Set language features
	this.features=function(features){
		compiler.postMessage({"type":"features","features":features});
	}
	
	this.disable=function(){
		disabled=true;
		inputEditor.setReadOnly(disabled);
	}
		
	this.enabled=function(){
		return !disabled;
	}	
	
	this.speed=function(s){
		speed=(100-s)*10;
	}
	
	this.features(parent.getFeatures());
	inputEditor.focus();
	
}

// The Run / Debug ... Button & spinner
var button=new function (){
	var butLabel="Button";
	var divLabel="Div";
	var spinner;
	var spinnerOpts= {lines:13,length:0,width:2,radius:10,scale:1.50,corners:1.0,opacity:0.10,rotate:0,direction:1,speed:1.0,trail:60,top:20,left:17,position:'relative'};
	var spinnerDiv;
	
	this.init=function() {
		spinnerDiv = document.getElementById('spinner');
	}
	
	function startSpinner(){
		if (spinner==undefined) spinner = new Spinner(spinnerOpts).spin(spinnerDiv);
	}
	
	function stopSpinner(){
		if (spinner!=undefined) {
			spinner.stop();
			spinner=undefined;
		}
	}
		
	this.state=function(button){
		return $("#"+button+butLabel+divLabel).html();
	}		

	this.on=function(button){
		$("#"+button+butLabel).attr("disabled", false);
	}	
		
	this.finished=function(button,label) {
		stopSpinner();
		this.label(button,label);
		this.on(button);
		inputEditor.setReadOnly(!parent.editor.enabled());
		inputEditor.setHighlightActiveLine(false);

		parent.editor.store();
	}
	
	this.label=function(button,label) {
		$("#"+button+butLabel+divLabel).html(label);
	}
	
	this.stop=function(button,label){
		compiler.terminate();
		compiler=undefined;
		log.terminated();
		if (runTimeout!=undefined) clearTimeout(runTimeout);
		if (mode=="instruction") {
			parent.editor.reset();
			parent.editor.load();
		} else 		initializeCompiler();

		stopSpinner();
		$("#"+button+butLabel+divLabel).html(label);
		this.on(button);
		inputEditor.setReadOnly(!parent.editor.enabled());
	}
	
	this.wait=function(button){
		$("button").attr("disabled", "disabled");
  		if (button!=undefined) $("#"+button+butLabel+divLabel).html("Wait");
  		startSpinner();
  	}
  	
  	this.exec=function(button) {
  		startSpinner();
  		inputEditor.setReadOnly(true);
  		$("button").attr("disabled", "disabled");
  		$("#"+button+butLabel+divLabel).html("Stop");
  		$("#"+button+butLabel).attr("disabled", false);
  	}
}


// Used to write to the log part of the window
var log=new function(){
	var cell;
	var outPutTable;
	var outMsg="&emsp;&emsp;=>&emsp;";
	
	this.history=[];
	this.history[-1]="";
	this.historyIndex=0;
	
	// For Instruction Mode, to align outtable at bottom
	var out,outContainer,outTable,spacer;
	var spacerHeightBefore=function(){};
	var spacerHeightAfter=function(){};
	
	function createRow(msg){	
		var tmpHeight=spacerHeightBefore();
    	var row = outputTable.insertRow(outputTable.rows.length);
    	cell = row.insertCell(0);
    	cell.style.width="100%";
    	cell.style.textAlign="left";
    	
    	cell.style.fontSize="15px";
		cell.innerHTML = msg;
    	spacerHeightAfter(tmpHeight); 
    	out.scrollTop(out[0].scrollHeight);
	}
	
	this.init=function(mode){
		if (mode=="instruction") {
			this.history=[];
			this.history[-1]="";
			this.historyIndex=0;
			outContainer=$("#outContainer");
			outTable=$("#outputTable");
			spacer=$("#spacer");
			spacerHeightBefore=function(){
				spacer.height(0);
				return outContainer.height();
			}
			spacerHeightAfter=function(tmpHeight){
				spacer.height(tmpHeight-outTable.height()-20);
			}
		}
		outputTable = document.getElementById("outputTable");
		out=$("#out");
	}
	
	this.errorMsg=function(msg){
		this.outMsg("<span style='color:red'>Error :</span> "+msg);        
	}
	
	this.outMsg=function(msg){
		createRow("&emsp;&emsp;=>&emsp;"+msg);
	}
	
	this.Msg=function(msg){
		createRow(String(msg));
	}
	
	this.inMsg=function(msg){
		this.history[this.history.length]=msg;
		this.historyIndex=this.history.length;
		createRow(msg);
	}
	
	this.terminated=function(){
		this.outMsg("terminated");
	}
	
	this.clear=function() {
		var outputTable = document.getElementById("outputTable");
    	var max=outputTable.rows.length-1;
   		for (var i = max; i >= 0; i--) {
        	outputTable.deleteRow(i);
    	}
    	editorIndex = 0;
	}
}; 


/*
 * 	Communiucation with Compiler & Runctime
 */

// Turn Compile Button of and output the result.
function stdResponse(msg){
	log.outMsg(msg);
}

function executeLog(msg){
	log.outMsg(msg);
	execNextLogEntry();
}

function execNextLogEntry() {
	if (hIndex>=log.history.length) response=stdResponse;
	else {
		compiler.postMessage({"type":"execute","source":log.history[hIndex],"kind":mode})
    	log.Msg(log.history[hIndex]);
    	hIndex++;
   }
}

function debugOff(){
	inputEditor.setReadOnly(!parent.editor.enabled());
//	console.log("debugOff Readonly"+inputEditor.getReadOnly());

	inputEditor.setHighlightActiveLine(false);
}

var response=stdResponse; //The Response to a successfull compilation .. It's a variable, because reaction of declarationEditor is different				

function formatString(str) {
	return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/ /g,'&nbsp;').replace(/\n/g,'<br>').replace(/\t/g,'&emsp;').replace(/"/g, '&quot;').replace(/'/g, '&#44;')
}

var compiler;

// Start the Compiler/Runtime - Webworker
function initializeCompiler(){
	if (compiler==undefined) {
		compiler=new Worker ('../javascript/webWorker.js');
		compiler.mode="run";
				
		compiler.setMode=function(mode) {
			this.mode=mode;
		}
		
		compiler.stepInto=function(code,mode) {
			this.postMessage({"type":"execute","source":code,"kind":mode});
		}

		compiler.step=function() {		
			this.postMessage({"type":"step"});	
		}
		
		compiler.onmessage=function(msg) {
			switch(msg.data.type) {
				case "internalError": console.log("Internal error received from compiler.js : "+msg.data.content);
				break;
		
				case "error":
					var tmp=""
					if (addLine) tmp=" at line :"+msg.data.line;
					log.errorMsg(msg.data.content+tmp);
					inputEditor.gotoLine(msg.data.line);
					debugOff();
					if (response==executeLog) execNextLogEntry();
				break;
				
				case "finished": 
					debugOff();
					button.finished("compile","Run");
					button.finished("debug","Step");
				break;
				
				case "sucess":
					runTimeout=undefined;
					button.finished("compile","Run");
					button.finished("debug","Step");
					response(formatString(msg.data.content));
					debugOff();
				break;
				
				case "executing":
					if (this.mode=="run") {
						button.exec("compile");
					}					
				break;
								
				case "step":
					inputEditor.gotoLine(msg.data.line);
					if (this.mode=="run") {
						runTimeout=setTimeout(function() {compiler.step();},speed);
					} else {
						button.finished("debug","Next");
						button.on("compile");
					}
				break;
		
				case "variables":
				    var variablesTable = document.getElementById("variablesTable");
				/*	if (mode=="instruction") {
						var variablesTable = document.getElementById("variablesTable");
					} else var variablesTable=document.getElementById("outputTable");*/
					
					// Clear the variable display
   	         		while(variablesTable.rows.length>0)	{    
   	            		variablesTable.deleteRow(0);
   	        		}
						
						
					// Display Variables
						/*var i;
						for (i=0;i<msg.data.content.length;i++) {
							variablesTable.insertRow(i).insertCell(0).innerHTML = "<div style='margin-left: 30px;'><span class='glyphicon glyphicon-tag'> </span>&nbsp;"+ msg.data.content[i].name + " = " + msg.data.content[i].value + "</div>";
						}*/
					var cell=variablesTable.insertRow(0).insertCell(0);
					cell.innerHTML="";
					cell.style.width="100%";
					cell.style.fontSize="15px";
					cell.style.textAlign="justify";
					for (var i=0;i<msg.data.content.length;i++) {
						if (msg.data.content[i].type) type=msg.data.content[i].type+"&nbsp;";
						else type="";
						cell.innerHTML+=type+msg.data.content[i].name + "=" + formatString(msg.data.content[i].value)+ "&emsp;";
					}
					cell.innerHTML+="";
						
				break;
				
				default: console.log("Unknown Message received in editor.js from compiler.js : "+msg.data.type);
				break;
			}
			inputEditor.focus();
		}
	}
}

//Resize an element to the window size
function resize (id,id2) {
	if (id2==undefined) {	
		$("#"+id).width($(document).width()-15);
		$("#"+id).height($(document).height()-20);
	} else 	{
		$("#"+id).width($("#"+id2).width()-2);
		$("#"+id).height($("#"+id2).height());
	}	
}
