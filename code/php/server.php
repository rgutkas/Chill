<?php 
/*
* server.php	Storage Management on the server
 * 
 *				Handles POT requests, format : command=... {"&" option=...}  
 * 
 *				command				options	 							returns
 * 				listStudents											[{user:...,pass:....,name:...}]
 * 				addStudent			user,pass,name
 * 				getExerciseTree											[{id:...,exercise:[{name:...,text.....}]}]
 * 				storeExercise":     lecture,exercise,data
*/
require('settings.php');
require('init.php');

function json_clean_decode($json, $assoc = false, $depth = 512, $options = 0) {
    // search and remove comments like /* */ and //
    $json = preg_replace("#(/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+/)|([\s\t]//.*)|(^//.*)#", '', $json);
   
    if(version_compare(phpversion(), '5.4.0', '>=')) {
        $json = json_decode($json, $assoc, $depth, $options);
    }
    elseif(version_compare(phpversion(), '5.3.0', '>=')) {
        $json = json_decode($json, $assoc, $depth);
    }
    else {
        $json = json_decode($json, $assoc);
    }

    return $json;
}

function success($data) {
	global $success;

	echo $success.json_encode($data);
}

function generateExclude($table,$selectField,$checkField,$value) {
	$result=query("SELECT ".$selectField." FROM ".$table." WHERE ".$checkField."='".$value."'","Getting content of",$table);
	$exclude="";
	$colon=false;
	while ($row = $result->fetch_assoc()) {
		if ($colon) $exclude=$exclude.",";
		else $colon=true;
		$exclude=$exclude."'".$row[$selectField]."'";
	}
	
	if (strlen($exclude)!=0) return " AND NOT id IN (".$exclude.")"; 
	else return "";
}

if(!empty($_POST['command']) && !empty($_POST['what']) && !empty($_POST['data'])){
	
	$table=$_POST["what"]."s";
	$values=json_decode($_POST['data'],true);
	
	$id="'0'";			
	if (!empty($values["id"])) {
		if ($values["id"]==-1) unset($values["id"]);
		else $id="'".$values["id"]."'";  
	} 
	
	switch ($_POST["command"]){
		
		case "get":
			
			if ($_POST["what"]=="predefindedItems"){
				$result=query("SELECT items.code FROM items,itemInExercises WHERE items.id=itemInExercises.item AND itemInExercises.exercise='".$values["exercise"]."'","getting from","items");
				success($result->fetch_all());
			} elseif ($_POST["what"]=="submission"){
				$result=query("SELECT code,time FROM submissions WHERE exercise=".$values["exercise"]." AND user=".$values["user"],"getting from","submissions");
				$row=$result->fetch_assoc();
				$row['emitted']=$result->num_rows!=0;
			//	if ($row['emitted']) $row['code']=base64_decode($row['code']);
				success($row);
				
			} elseif ($_POST["what"]=="rating"){
				$result=query("SELECT feedback,grade,time FROM ratings WHERE exercise=".$values["exercise"]." AND user=".$values["user"],"getting from","ratings");
				$row=$result->fetch_assoc();
				$row['rated']=$result->num_rows!=0;
			//	if ($row['emitted']) $row['code']=base64_decode($row['code']);
				success($row);			
			} else {
				switch($_POST["what"]) {
					case "user"				: $fields="id,name,user,pass,email"; break;
					case "exercise"			: $fields="id,name,description,mode,features"; break;
					case "course"			: $fields="id,name,description"; break;
					case "item" 			: $fields="id,name,course,code,help,public"; break;
					default					: $fields="id";
				}
				
				$result=query("SELECT ".$fields." FROM ".$table." WHERE id=".$id,"getting ".$fields." from ",$table);	
				$row = $result->fetch_assoc();
			
				if ($_POST["what"]=="course") {
						$list=query("SELECT users.id,users.name FROM users,students WHERE students.course=".$id." AND users.id=students.user","getting from","students");
						$row["students"]=JSONEncodeList($list,'name',false);
						$list=query("SELECT users.id,users.name FROM users,teachers WHERE teachers.course=".$id." AND users.id=teachers.user","getting from","teachers");
						$row["teachers"]=JSONEncodeList($list,'name',false);
				}
				
				if ($_POST["what"]=="exercise") {
					if (!empty($values['user'])) {
						$result=query("SELECT time FROM submissions WHERE exercise=".$id." AND user=".$values["user"],"Getting from","submissions");
						
						if ($result->num_rows==0) {
							$row['emitted']=FALSE;	
						} else {
							$row = array_merge($row,$result->fetch_assoc());
							$row['emitted']=TRUE;
						}
						
						$result=query("SELECT time,feedback,grade FROM ratings WHERE exercise=".$id." AND user=".$values["user"],"Getting from","ratings");
						if ($result->num_rows==0) {
							$row['rated']=FALSE;	
						} else {
							$row = array_merge($row,$result->fetch_assoc());
							$row['rated']=TRUE;
						}
					} 
					
					$list=query("SELECT items.id,items.name FROM items,itemInExercises WHERE itemInExercises.exercise=".$id." AND items.id=itemInExercises.item","getting from","itemInExercises");
					$row["items"]=JSONEncodeList($list,"name",false);
					$row["mode"]=base64_encode($row["mode"]);
				}
			
				success($row);	
			}
		break;
			
		case "add":			
			// Set Default Values
			switch($_POST["what"]) {				
				case "exercise"				: 	$values["mode"] = 'instruction';
				case "course"				: 	$values["name"] = base64_encode('Unknown');
				break;
				case "user"					: 	$values["role"] =  'user';
				break;
				case "userToCourse"			:	$table=base64_decode($values["role"])."s";
												unset($values["role"]);
				break; 
			}
			
			//echo $values->code;
			
			// Prepare key and value lists
			$keyStr=" (";
			$valueStr="(";
			$colon=false;
			foreach ($values as $key => $value) {
				if ($colon) {
					$keyStr=$keyStr.",";
					$valueStr=$valueStr.",";
				} else $colon=true;	
		
				$keyStr=$keyStr.$key;
				$valueStr=$valueStr."'".$value."'";
			}
			$keyStr=$keyStr.")";
			$valueStr=$valueStr.")";
	
			$result=query("INSERT INTO ".$table.$keyStr." VALUES ".$valueStr,"Inserting into",$table);
			success(array("id" => $mysqli->insert_id));		
		break;
		
		case "del":
						
			switch($_POST["what"]) {
				case "student":
				case "teacher":
					$where=" WHERE course='".$values["course"]."' AND user='".$values["user"]."'";
					$values["id"]=$values["user"];
				break;
				
				case "course": 
					
					// Del users in course
					query("DELETE FROM students WHERE course=".$id,"Deleting from","students");
					query("DELETE FROM teachers WHERE course=".$id,"Deleting from","teachers");
					
					// Del  links from items to exercises
					$result=query("SELECT id FROM exercises WHERE course=".$id,"Getting from","exercises");
					while ($row = $result->fetch_assoc()) {
						query("DELETE FROM itemInExercises WHERE exercise='".$row['id']."'","Deleting exercise ".$row['exercise'],"itemInExercises");
					}
					
					// Del Predefined Items
					query("DELETE FROM items WHERE course=".$id." AND public='0'","Deleting from","items");
				break;
				
				case "user":	
					// Deleting links to courses
					query("DELETE FROM students WHERE user=".$id,"Deleting from","students");
					query("DELETE FROM teachers WHERE user=".$id,"Deleting from","teachers");
				break;
				case "item":
					//Delete Link to Exercise
					query("DELETE FROM itemInExercises WHERE item=".$id,"Deleting from","itemInExercises");
				break;
				
				case "exercise":
					//Delete Link to Exercise
					query("DELETE FROM itemInExercises WHERE exercise=".$id,"Deleting from","itemInExercises");
				break;
				
				case "itemInExercise":
					$where=" WHERE item='".$values["item"]."' AND exercise='".$values["exercise"]."'";
				break;
				
			}
			if (empty($where)) $where=" WHERE id=".$id;
			
			query("DELETE FROM ".$table.$where,"Deleting from",$table);	
			
			success(array("id" =>$values["id"]));
		break; 
			
		case "update":	
			
			$valueStr="";
			$colon=false;
			
			if (!empty($values["mode"])) $values["mode"]=base64_decode($values["mode"]); 
			
			foreach ($values as $key => $value) {
				if ($colon) $valueStr=$valueStr.",";
				else $colon=true;	
				$valueStr=$valueStr.$key."='".$value."'";
			}
			
			query("UPDATE ".$table." SET ".$valueStr." WHERE id=".$id,"Updating",$table);
			success(array("id" =>$values["id"]));
		break;
		
		case "list":
			$field="name";
			$where="";
			
			switch($_POST['what']) {
				case "user": 
					$where=" WHERE role='user'"; 
				
					// IF course is specified only list users not allready attending
					if(!empty($values["course"])) {									  		
						$where=$where.generateExclude("students","user","course",$values["course"]);
						$where=$where.generateExclude("teachers","user","course",$values["course"]);	
					}								  		
				break;
				
				case "exercise":
					$where=" WHERE course='".$values['course']."'";
				break;
				
				case "item":		
					$where="public='1'";		
					if(!empty($values["exercise"]) && !empty($values["course"])) {
							 $where=$where." OR course='".$values["course"]."'";
							 $where=$where.generateExclude("itemInExercises","item","exercise",$values["exercise"]); 
					}		
					$where=" WHERE ".$where;
					$field="name,public,course";
					$public=true;
				break; 
				
				
			}
				
			$result=query("SELECT id,".$field." FROM ".$table.$where,"Listing content of",$table);
			if (!empty($public)) {
				$json="[";
				$colon=false;
				while ($row = $result->fetch_assoc()) {
					if ($colon) $json=$json.",";
					else $colon=true;
					if ($row["public"]==1 && $row["course"]!=$values["course"]) $value=base64_encode("Public : ".base64_decode($row["name"]));
					else $value=$row["name"];
					$json=$json.'{"id":'.$row['id'].',"text":"'.$value.'"}';
				}
				$json=$json."]";
				success($json);	
			} else success(JSONEncodeList($result,$field,false));
		break;
		
		case "submit":
			query("INSERT INTO submissions (code,exercise,user,time) VALUES ('".$values["code"]."','".$values["exercise"]."','".$values["user"]."',now())","Inserting into","submissions");
			$result=query("SELECT time FROM submissions WHERE exercise=".$values["exercise"]." AND user=".$values["user"],"Getting from","submissions");
			success($result->fetch_assoc());
		break; 
		
		case "rate":
			query("INSERT INTO ratings (exercise,user,feedback,grade,time) VALUES ('".$values["exercise"]."','".$values["user"]."','".$values["feeback"]."','".$values["grade"]."',now())","Inserting into","ratings"); 
			$result=query("SELECT time FROM ratings WHERE exercise=".$values["exercise"]." AND user=".$values["user"],"Getting from","ratings");
			success($result->fetch_assoc());
		break;

		/*
		 * Default means unknown command
		 */ 
		default: echo $error."Unknown command ".$_POST['command']; 
	}
	
	$mysqli->close();
}


?>
