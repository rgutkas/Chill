/*  formatOutput.js
*	Formats the data types, for the output on the screen
*/

// Prepare the value for display, returns the prepared value
function format(value) {
	switch (typeof value){
    	case "boolean": value=String(value);
    					break;
    								
        // Round numbers to 3 digits behind komma 
    	case "number":  value=String(Math.round(value*1000)/1000);
    				    break;
    				                
    	// Strings               
    	case "string":  
    					// Limit Strings to size of 10               
    					if(value.length>10) {
    						value=value.slice(0,4)+"..."+value.slice(value.length-2,value.length);
    					}
    					value=_quote+value+_quote;
    				    break;
    	default:               
     } 
     return value;
}