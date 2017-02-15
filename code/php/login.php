<?php 
/*
*	login.php	Handles login requests
*/

require('settings.php');
require('init.php');

if(!empty($_GET['user']) && !empty($_GET['pass'])) {

	$username = base64_encode($_GET["user"]); 
	$password = $_GET["pass"]; 
	
	$logFile = fopen($log, 'a');
	fwrite($logFile,time().";".$username.";".$password.";");
	
	$result=query("SELECT id,pass,role,name FROM users WHERE user = '".$username."'","getting information from","users");	
	
	if ($result->num_rows>0) {	// Check if there is an entry for the username
		$row = $result->fetch_assoc();
		if (base64_decode($row['pass'])==$password) {
			switch ($row['role']) {
				case "user" :
					$id=$row['id'];
					$course=$_GET["course"];
					
					// Preparing Variables for Tacher / Student Pages
					$variables="var userName='".base64_decode($row['name'])."';";
					$variables=$variables."var userId=".$id.";";
					$result=query("SELECT name,description FROM courses WHERE id='".$course."'","getting information from","courses");
					$row = $result->fetch_assoc();
					$variables=$variables."var courseId=".$course.";";					
					$variables=$variables."var courseName='".base64_decode($row['name'])."';";
					$variables=$variables.'var courseDescription='.json_encode(base64_decode($row['description'])).';';
					
					// Check for Student Login
					$result=query("SELECT * FROM students WHERE user = '".$id."' AND course='".$course."'","checking access","student");
					if ($result->num_rows == 0) {
							
						// Check for Teacher Login
						$result=query("SELECT * FROM teachers WHERE user = '".$id."' AND course='".$course."'","checking access","teacher");	
					
						if ($result->num_rows == 0) {
							echo "Error : User is not registeres in the course!";
						} else {
						    $_SESSION['role']='teacher';	
							fwrite($logFile,"access as teacher\n");
							
							// Get Students attending the course
							$studentList=query("SELECT users.id,users.name FROM users,students WHERE students.course='".$course."' AND users.id=students.user","listing","students");
							$variables=$variables."var studentList=".JSONEncodeList($studentList,"name",true);
							
							echo "<script>".$variables."</script>";
							readfile($teacherIndex);
						}
					} else {
						$_SESSION['role']='student';	
						fwrite($logFile,"access as student\n");
						echo "<script>".$variables."</script>";
						readfile($studentIndex);
					}
				break;
				
				case "admin":
					$_SESSION['role']='admin';	
					fwrite($logFile,"access as admin\n");
					readfile($adminIndex);
				break;
				
				default:
					echo "Error : ";
					fwrite($logFile,"failure in users table role is: ".$user['role']."\n"); 
				break;
			}
		} else {
			echo "Error : Invalid password!";
			fwrite($logFile,"invalid password, should be :".$row['pass']."\n"); 
		}	
	
	} else {
		echo "Error : Invalid username!";
		fwrite($logFile,"invalid username\n");	
	}
	fclose($logFile);
} else {
	echo "Error : Access denied!";
}
?>
