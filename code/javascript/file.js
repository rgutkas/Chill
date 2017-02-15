/*	save.js
*	Used to store a c
*/ 
 
     function save(fileName,data) {
      	try { 
  	  		// Test if FileSaver is supported
    		var isFileSaverSupported = !!new Blob(); 
    		
    		//Generate File
    		var blob = new Blob([data], {type: "text/plain;charset=utf-8"});
    		
    		//Save it
    		saveAs(blob, fileName);
    	} 
    	catch(e) {
    		alert("Failed to save file : "+fileName+" !");
   	 	}
      }
      
    function errorHandler(evt) {
    	switch(evt.target.error.code) {
      		case evt.target.error.NOT_FOUND_ERR:
        		alert('File Not Found!');
        		break;
      		case evt.target.error.NOT_READABLE_ERR:
        		alert('File is not readable');
        		break;
      		case evt.target.error.ABORT_ERR:
        		break; // noop
      		default:
        		alert('An error occurred reading this file.');
    	};
  	}
      
	  function load(fileName, target) {
	  	var fileReader=new FileReader();
	  	fileReader.onerror = errorHandler;
	  	// Read in the image file as a binary string.
	  	fileReader.onload = function(e) {
	  		target.html(e.target.result);	
       	};
   		
   		fileReader.readAsText(fileName);
   		 
	  }
