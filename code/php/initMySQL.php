<?php 
/*
 * initMySQL.php	Initialize My-SQL 
 */
require ("settings.php");
	
	// Get Settings
 	$host	  = $_GET["host"];
 	$username = $_GET["user"]; 
	$password = $_GET["pass"];
	if (!$host || !$username || !$password) die($error."Wrong Parameter specified!");
	
	
	// Check if settings are correct
	$mysqli = new mysqli($host, $username, $password);
	if ($mysqli->connect_error) {
		readfile($initMySQL);	
		die ("<span style='color:red'>Couldn't connect to MySQL as ".$username."@".$host."</span><br>");
	}
		
	$mysqli->close();
	
 	// Store working configuration
	$file = fopen($conf , 'w');	//creates new file
	
	if ($file) {	
	    fwrite($file, $host."\n");
		fwrite($file, $username."\n");
		fwrite($file, $password."\n");
	
	    fclose($file);
		chmod($conf,0700);
		echo "<html><head></head><body><script>location.reload();</script></body></html>";
	} else die ($error."Couldn't gain write access for configuration file.");
?>
