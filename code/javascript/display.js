/*	display.js
*	Helps to control the frames in display 
*/
var _cols="cols";


/* 
 * replaces a character in a string at position pos

function replaceStringAtPos(string,pos,char) {
	return string.substr(0,pos)+char+string.substr(pos+1,string.length);	
} */

/* 
 * if value==true it shows the frame which cols sequence is stored in the string at the position index 
 * index starts at 0;

function show(value,index) {
	var h=document.getElementById("df").cols;
	index=index*2;
	
	if (value) {
		h=replaceStringAtPos(h,index,"*");
	} else {
		h=replaceStringAtPos(h,index,"0");
	}
	top.display.document.getElementById("df").cols=h;
} */
var visible="code";


function showCodeNvar() {	
	document.getElementById("df").cols="*,0,0";
}

function showOutput() {
	document.getElementById("df").cols="0,*,0";
}

function showHelp() {
	document.getElementById("df").cols="0,0,*";
}




/*function loadDisplaySettings() {
	if (document.cookie) {
	  top.display.document.getElementById("df").cols =	_cols))) {
				top.display.document.getElementById("df").cols="*,0,*,0,0,0,*";
	}	
} 

function storeDisplaySettings()	{	
		localStorage.setItem(_cols,String(top.display.document.getElementById("df").cols));	
} */
