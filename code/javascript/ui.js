/*	ui.js
		Provides some usefull functions for the UI and Server Communication
*/

// The server Location
var server="code/php/server.php";


// Storage for the code that should be loaded after input is loaden
var nameOfItemToLoad="";

var editor=undefined;
var editorContent=undefined;

// The Editor Frames
var editors = {
	"instruction" : "<iframe name='editor' id='codeInput' style='width:100%;height:100%;border:0;' src='code/html/instruction.html'></iframe>",
	"program" 	  : "<iframe name='editor' id='codeInput' style='width:100%;height:100%;border:0;' src='code/html/program.html'></iframe>",
	"item" 		  : "<iframe name='itemEditor' id='itemInput' style='width:100%;height:100%;border:0;' src='code/html/items.html'></iframe>",
};


/* Send a command to the server commands can be: add/update/del/list/get 
 * destination is the table to work with (user,exercise,....)
 * data is an json compatible object
 * callBack a function(data) to react to the response
 * 
 * Data will be JSON-encoded and String values will be encoded Base64
 */
function sendCommand(command,destination,data,callBack) {
	$("#communicationError").html("");
	data=JSON.stringify(data, 	function (key, value){ // Base64 encode strings
									switch (typeof value){ 
										case "string": return btoa(value);
										break;
  										default: return value;
  									}
								});
	
	$.post(server,"command="+command+"&what="+destination+"&data="+data,
		function(data){
			if (data=checkData(data)) {callBack(data)};
		});	
}

// Check data returned by the server
function checkData(data) {
	/* Decodes the Data returned from the server */
	function decode(data) {	
		switch (typeof data) {
			case "object":
			case "array" : for (index in data) data[index]=decode(data[index]); 
						   return data;
			break;
			case "string": try {
								data=atob(data);
								try {
									return JSON.parse(data);	
								} catch(err) {
									return data;
								}
							}
							catch(err) {
								try {
									return decode (JSON.parse(data));
								}
								catch(err) {
									return data;
								}
							}
			break;
			default: return data;
		}
				
	}
		
		
		
	/*	,function(key,value) {// Base64 decode strings
					  				if (typeof value === "string") {try{return atob(value);} catch(err){return atob(JSON.parse(value));}}
  									else return value;	
					  			}
					  	);
} */
	
	if (data.slice(0,3)=="Ok:") return decode(data.slice(3,data.length))||true;
	else { // Outputsan error
		$("#communicationError").html("<span style='color:red'>"+data+"</span>");
		return false;
	}
}

// Open a dialog given by name
function openDialog(name,width,height) {
	var opt={};
//	if (height!=undefined) opt={height:""+height+"px"};
  	$().w2popup('open',{
   		body    : '<div id="form" style="width: 100%; height: 100%;"></div>',
   		onOpen: function (event) {
            event.onComplete = function () {
                // specifying an onOpen handler instead is equivalent to specifying an onBeforeOpen handler, which would make this code execute too early and hence not deliver.
                $('#w2ui-popup #form').w2render(name);
            }
       },
       width:width,
       height:height
   	});
}

// Close a dialog
function closeDialog() {
	w2popup.close();	
}

// Refill a sidebar with new data
function refillSidebar(name,data) {
	console.log(name);
	console.log(data);
	// Clear Sidebar
	var nd = []; 
	for (var i in w2ui[name].nodes) nd.push(w2ui[name].nodes[i].id);
	w2ui[name].remove.apply(w2ui[name], nd);
	
	// Add Data
//	for (elem in data) data[elem].id=Number(data[elem].id);
	w2ui[name].add(data);
}

function getSelection(sidebar){
	return Number(w2ui[sidebar].selected);
}

function load() {
	editor.load(nameOfItemToLoad);
}

function loadHelp(name) {
	$.get( "help/"+name+".txt", function( data ) {
        w2ui[name+"HelpDialog"].record.help=data;
	});	
}










