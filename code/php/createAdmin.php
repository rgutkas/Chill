<?php 
/*
 * createAdmin.php	Create Database and Admin Account 
 */
require ("settings.php");
require ("init.php");
 	
	// Get Settings
 	$username = base64_encode($_GET["user"]); 
	$password = base64_encode($_GET["pass"]);
	if (!$username || !$password) die($error."Wrong Parameter specified!");
	
	$sql = "INSERT INTO users (user,pass,role)
			VALUES ('".$username."', '".$password."','admin')";

	if ($mysqli->query($sql) === TRUE) echo "Admin Account created.<br> Setup completed.";
	else die ($error."Couldn't insert admin account into Database: ".$mysqli->error);
?>
