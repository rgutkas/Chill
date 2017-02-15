/*	reset.js
*	Performs a total system reset
*/

function reset() {
	 variableStorage.reset();
	 this.display.cnv.code.document.innerHTML="";
	this.display.output.document.innerHTML="";
    this.error.document.innerHTML="";
}
