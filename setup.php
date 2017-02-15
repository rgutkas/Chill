<?php
$codeDir = "code/php/";
require($codeDir."settings.php");

function createTable($name,$fields) {
	
	global $error,$dbName,$mysqli;

	$sql="SHOW TABLES LIKE '".$name."'";
		  
	if (($result=$mysqli->query($sql)) === FALSE) die ($error."testing if table ".$name." exists: " . $mysqli->error);
	
		
	if ($result->num_rows == 0) {			
			echo "Creating Table ".$name."<br>";  
			$sql = "CREATE TABLE ".$name." (id INT UNSIGNED NOT NULL AUTO_INCREMENT,".$fields." , PRIMARY KEY  (id))";
			if (!($mysqli->query($sql) === TRUE)) die($error."creating table ".$name.": " . $mysqli->error);
	} echo "Table ".$name." exists<br>"; 
	
}

if (!file_exists($conf)) readfile($initMySQL);	// Show Init of Database
else {
		
	// Get mySQLUser & Password
	$handle 		 = file ($conf,FILE_IGNORE_NEW_LINES);
	$mySQLServerName = $handle[0];								// My SQL Server Name
	$mySQLUserName 	 = $handle[1];								// My SQL User Name
	$mySQLPassword 	 = $handle[2];								// My SQL Password
	
	$mysqli = new mysqli($mySQLServerName, $mySQLUserName, $mySQLPassword);	// My SQL Connection
	
	// Check if settings are correct
	if ($mysqli->connect_error) die ($error."Couldn't connect MySQL Databse.");

	// Check if mySQL database exists
	$sql 	= 'SELECT COUNT(*) AS `exists` FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMATA.SCHEMA_NAME="'.$dbName.'"';
	$query 	= $mysqli->query($sql);
	if ($query === false) die ($error."MySQL ErrorNr. ".$mysqli->errno." : ".$mysqli->error);	
	$row = $query->fetch_object();
	$dbExists = (bool) $row->exists;
	
	// Create the database if it doesn't exist
	if (!$dbExists) {
		// Create database
		echo "Creating database ".$dbName."<br>";
		$sql = "CREATE DATABASE ".$dbName;
		if (!($mysqli->query($sql) === TRUE)) die($error."creating database: " . $mysqli->error);
	}	echo "Database ".$dbName." exists. <br>";
	
	
	//Select Database
	$sql="USE ".$dbName;
	if (!($mysqli->query($sql) === TRUE)) die($error."selecting database: " . $mysqli->error);
	
	// Create Tables if they don't exist
	
	// Users Table
	createTable	("users","	user VARCHAR( 50 ) NULL,
    					 	pass VARCHAR( 50 ) NULL,
    						name VARCHAR( 150 ) NULL ,
    					 	email VARCHAR( 255 ) NULL ,
    					 	role ENUM ('admin','user'),
    					 	UNIQUE(user)"
			  	);
						
	// Courses Table
	createTable ("courses","	name VARCHAR( 150 ) NOT NULL,
    							description TEXT NULL"
    			);
				
	// teachers Table
	createTable ("teachers","	course INT UNSIGNED NOT NULL,
    							user INT UNSIGNED NOT NULL"
    			);
				
	// students Table
	createTable ("students","	course  INT UNSIGNED NOT NULL,
    							user INT UNSIGNED NOT NULL"
    			);			
    
		
	// Exercises Table
	createTable	("exercises","	
    							name VARCHAR( 150 ) NULL,
    							course INT UNSIGNED NOT NULL,
   								description TEXT NULL,
   								mode ENUM ('instruction','program'),
   								features VARCHAR(255)"				
   				);    		
				
	// functionsInExercise Table
	createTable ("itemInExercises","	exercise 	INT UNSIGNED NOT NULL,
    									item 		INT UNSIGNED NOT NULL"
    			);			
				
   	// Functions Table
	createTable	("items","			name   VARCHAR(255) NOT NULL,
									course INT UNSIGNED NOT NULL,
									public BOOLEAN NOT NULL default 0,
 			    					code   text NULL,
    								help   TEXT NULL"
    			);
    			
    // Handed in code
    createTable ("submissions","		code text NULL,
    									exercise INT UNSIGNED NOT NULL,
    									user 	 INT UNSIGNED NOT NULL,
    									time	 DATETIME 
    												  	"
				);
				
	// Handed in code
    createTable ("ratings","			feedback text NULL,
    									grade	 INT UNSIGNED NOT NULL,
    									exercise INT UNSIGNED NOT NULL,
    									user 	 INT UNSIGNED NOT NULL,
    									time	 DATETIME 
    												  	"
				);
  
    echo "Table Setup completed<br>";
	
	// Check if Admin Account exists
	$sql = "SELECT id FROM users WHERE role = 'admin' ";	
	if (($result=$mysqli->query($sql))===FALSE) die ($error."checking admin:".$mysqli->error);
	else if ($result->num_rows==0) {  // Create Admin account
		 readfile($createAdmin);
		 exit;
	}
	$mysqli->close();  
} 
	
?> 

