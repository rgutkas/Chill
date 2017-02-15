<?php 
/*
*	settings.php	All settings used in scripts
*/

/*
 *	For Debugging turn on all errors, in production comment it out
 */
error_reporting(E_ALL); ini_set('display_errors', 1); 

/*
 *	Directories 
 */
if (!isset($codeDir)) $codeDir="";
 
$appName			=	"Chill";									// Name of the Application
$dataDir			=	$codeDir."../../data/"; 					// Main path of data files
$htmlDir			=	$codeDir."../html/";

/*
 *	Filenames
 */ 
$conf				=   $dataDir.$appName.".conf"; 				// Configuration file
$log 				=	$dataDir.$appName.".log";				// Log File
$index				=	$codeDir."../../index.php";						// Main Index
$login				=	$htmlDir."login.html";					// Login Screen
$adminIndex			=	$htmlDir."admin.html";					// Admin App
$teacherIndex		=	$htmlDir."teacher.html";				// Teacher App
$studentIndex  	 	=	$htmlDir."student.html";				// Students App
$initMySQL   		= 	$htmlDir."initMySQL.html";				// My SQL Initialisation
$createAdmin		= 	$htmlDir."createAdmin.html";			// Create Admin Account

/*
 * 	mySQL
 */
$dbName	  			= 	$appName; 								// Name of the Database
$userTable			=	"users";								// Name of the user Table
$courseTable		=	"courses";								// Name of the course Table




/*
 * Messages
 */
$error 				=	"Error :";
$success			=   "Ok:";





