<?php 
/*
*	init.php	Check Initialisation if it dosen't exist run initialisation
*/

/*
 * Get MySql Configuration
 */
// Get mySQLUser & Password
if (!file_exists($conf)) die($error."reading configuration.");


$handle = file ($conf,FILE_IGNORE_NEW_LINES);
$mySQLServerName = $handle[0];								// My SQL Server Name
$mySQLUserName 	 = $handle[1];								// My SQL User Name
$mySQLPassword 	 = $handle[2];								// My SQL Password

$mysqli = new mysqli($mySQLServerName, $mySQLUserName, $mySQLPassword);	// My SQL Connection
if ($mysqli->connect_error === TRUE) die($error."connecting to mySQL Server: " . $mysqli->connect_error);

// Select Database
$sql="USE ".$dbName;
if (!($mysqli->query($sql) === TRUE)) die($error."selecting database: " . $mysqli->error);


/*
 * MySQL -Helpers
 */

// Make a query 
function query($sql,$msg,$table) {		
	global $error,$mysqli;

	if (!($result=$mysqli->query($sql)) === TRUE) die($error.$msg." table ".$table." : ".$mysqli->error);	
	return $result;
}


// Encode a list of rows (containing id and an data Field) to json format 
function JSONEncodeList($list,$dataFieldName,$decodeBase64) {	
	$result="[";
	$colon=false;
	
	while ($row = $list->fetch_assoc()) {
		if ($colon) $result=$result.",";
		else $colon=true;
		if ($decodeBase64) $value=base64_decode($row[$dataFieldName]);
		else $value=$row[$dataFieldName];
		$result=$result.'{"id":'.$row['id'].',"text":"'.$value.'"}';
	}
	$result=$result."]";
	return $result;
}




