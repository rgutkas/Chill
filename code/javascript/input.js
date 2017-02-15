/* input.js	
		it reacts to inputs, parses them and outputs the result
*/
	


/* handle reacts to the submission of a text statement entered in the input line
	 	  and outputs the results in the display frame
*/
function handle() {
	var input=this.statement.text.value; // Dom Path to the window holding the statement the user did enter
	var res;
		
	this.cnv.code.document.write(input+_lf); // Output the code entered
	res=execute(input);

	// Output the result
	if (res) {
		this.error.document.body.innerHTML=res; // Output the result	
	} else {
		this.error.document.body.innerHTML=_errorMsg[_error]+_errorMsg[_unexpected]+err; // Or the error
	}
}