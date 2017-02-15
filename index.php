<?php
session_start();

$codeDir = "code/php/";
require($codeDir."settings.php");
require($codeDir."init.php");

function generateCourseList() {
	global $error,$mysqli,$appName;
	echo "<script> var courseId=-1; var courseName='".$appName."';";	
	$sql 	= 'SELECT id,name FROM courses';
	if (($result=$mysqli->query($sql))===FALSE) die ($error."</script>Getting available courses:".$mysqli->error);
	echo "var courseList=[];";
	while ($row = $result->fetch_assoc()) echo "courseList.push({id:'".$row['id']."',text:'".base64_decode($row['name'])."'});";
	echo "</script>";	
}

if (!empty($_REQUEST["id"])) {	//Course - Id specified in link, login to specific course
	$sql 	= "SELECT name FROM courses WHERE id='".$_REQUEST["id"]."'";
	if (($result=$mysqli->query($sql))===FALSE) die ($error."Getting course:".$mysqli->error);
	if ($result->num_rows == 0) generateCourseList(); // Course not found, goto login with course list
	else {
		$row 	= $result->fetch_assoc();
		echo 	"<script>var courseId=".$_REQUEST['id']."; var courseName='".base64_decode($row['name'])."';</script>";
	}
} else generateCourseList();	// No Course Id specified, so generate select for user

// Load Login Page
readfile ($login);
	
?> 

