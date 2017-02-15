/*	templates.js
		Provides some usefull functions for the UI and Server Communication
*/


// Generate and handle user forms/dialogs according to role
// Role can be User / Student / Teacher
function userFormTemplate(role,handlerLayout,controlPanel,displayPanel,clickAction) {
	this.role=role;
	var w2uiName;
	var sidebarName=role.toLowerCase()+'List';
	
	
	// Create Form 
	if (role=="User") {
		$().w2form(initForm());
		$().w2sidebar({
    		name: sidebarName,
    	 	onClick: function(target,event) {
    	 		sendCommand("get","user",{"id":Number(target)},function (data) {
					setValues(w2uiName,data);
				 	w2ui[handlerLayout].get(controlPanel).toolbar.enable("delete");
				  	w2ui[handlerLayout].content(displayPanel,w2ui[w2uiName]);
				  	event.onComplete=function(){
				  		if (clickAction!=undefined) clickAction();
				  	}
				});
			} 	
    	});

		function add() {
			sendCommand("add","user",{"name":"Unknown"},function (data) {
				setValues(w2uiName,{"name":"","email":"","login":"","password":"","id":data.id});
				w2ui[sidebarName].add({'id':Number(data.id),'text':'Unknown'});
				w2ui[sidebarName].select(data.id);
				w2ui[handlerLayout].get(controlPanel).toolbar.enable('delete');
				w2ui[handlerLayout].content(displayPanel, w2ui[w2uiName]);
			});
		}
		
		function del() {
			var sel=getSelection(sidebarName);
			sendCommand("del","user",{"id":sel},function (data) {
				w2ui[sidebarName].remove(sel);
				w2ui[handlerLayout].get(controlPanel).toolbar.disable('delete');
				w2ui[handlerLayout].content(displayPanel, "");
			});
		}
		
		this.toolbarTemplate=function () {
			return toolbarTemplate(role,add,del);
		}
		
	//Create Dialogs	
	} else {
		$().w2form(initForm("add"));
		$().w2form(initForm("update"));
		$().w2sidebar({
    		name: sidebarName,
    		onClick: function (event){
    	 		w2ui[handlerLayout].get(controlPanel).toolbar.enable("edit","delete"); 	
    	 		event.onComplete=function(){
    	 			if (clickAction!=undefined) clickAction();
	    	 	}
    	 	}    
    	});
    	
		// Init and open a dialog to add a user to a course
		function add(){
			sendCommand("list","user",{"course":courseId},function (data) {
				w2ui['add'+w2uiName].fields[0].options.items=[{id:-1,text:"New"}].concat(data);
				w2ui['add'+w2uiName].User={id:-1,text:"New"};
				setValues('add'+w2uiName,{"name":undefined,"email":undefined,"login":undefined,"password":undefined,"id":-1})
				openDialog("add"+w2uiName,"500px");	
			});
		}
				
		// init and open a dialog to update user information
		function update(){
			sendCommand("get","user",{"id":getSelection(sidebarName)},function (data) {
				setValues("update"+w2uiName,data);	
				openDialog("update"+w2uiName,undefined,"250px");
			});
		}
		
		function del(){
			var sel=getSelection(sidebarName);
			sendCommand("del",role.toLowerCase(),{"course":courseId,"user":sel},function (data) {
				w2ui[sidebarName].remove(sel);
				w2ui[handlerLayout].get(controlPanel).toolbar.disable("edit","delete"); 	
			});
		}
		
		
		
		this.toolbarTemplate=function () {
			return toolbarTemplate(role,add,del,update);
		}
	}
	
	function setValues(name,values) {
		var record=w2ui[name].record;	
		record.Name=values.name;
		record.Email=values.email;
		record.Login=values.user;
		record.Password=values.pass;
		record.Id=Number(values.id);
	}
	
	// Create a form  
    function initForm(action) {
    	
		// returns the function called on a change (ok for dialogs, onChange for form) event according to the action		
		function change(action,w2uiName) {
			
			//returns the callback function according to the action
			function callback(action,record,dialog) {
				return function(data) {
					// add
					if (action=="add") {
						var userId=data.id;
       					sendCommand("add","userToCourse",{"role":role.toLowerCase(),"course":courseId,"user":userId},function (data) {
   							w2ui[sidebarName].add({id:Number(userId),text:record.Name});
						});	
					// Update	
					} else {
						w2ui[sidebarName].set(Number(data.id),{text:record.Name});
					}
				}		 		
			}
			
			// The actual change function
			return function() {
						var record=w2ui[w2uiName].record;
						var preform=action;
						if (action=="add") if (record.User.id!=-1) preform="update";
				   		sendCommand(preform,"user",{"id":record.Id,"user":record.Login,"pass":record.Password,"name":record.Name,"email":record.Email},callback(action,record)); 
				   		
				   		if (dialog) closeDialog();
				   }
		}
		
		var dialog=(action!=undefined);
		if (dialog) {	// Its a dialog
			w2uiName=role+"Dialog";
		
			//Action Buttons
			var actionButtons = {
   					cancel: closeDialog,
   					ok: change(action,action+w2uiName) 
    			};
    			
		// It's a Form displayed in main Window
		} else {	
			w2uiName=role.toLowerCase()+"Form";
			action="";
			
			// Save Changes
			var onChangeFunct=function(event){event.onComplete=change("update",w2uiName);}
	   	}
	

		// The template for Creation
	 	var template={
   				name:action+w2uiName,
   				header   : role+' Information',	
            		
   				fields : [
   					{ name: 'Name'		, type: 'text',required:dialog, html:{attr:"style='width:98%;'"}},
     				{ name: 'Email'	  	, type:  'text',required:dialog, html:{attr:"style='width:98%;'"}},
     				{ name: 'Login'	  	, type:  'text',required:dialog, html:{attr:"style='width:98%;'"}},
     				{ name: 'Password'	, type:  'pass',required:dialog, html:{attr:"style='width:98%;'"}},
   				],
   				record: {
   					Id:-1
   				},
   				onChange:onChangeFunct,
   				actions:actionButtons
		};
		
	   		
		// Add Select field if its an add Dialog
   		if (action=="add") template.fields=[{ name: 'User', type: 'list',options:{items: []},required:dialog, html:{attr:"style='width:98%;' onchange='userListSelect("+'"'+action+w2uiName+'"'+")'"}}].concat(template.fields);	
   		
   		return template;
   }
}

// Select a user from the user List
function userListSelect(dialogName){	
	var	dialog=w2ui[dialogName];
	
	if (dialog.record.User.id==-1) {
		dialog.clear();
		dialog.record.User={id:-1,text:"New"};
		dialog.refresh();
	} else {
		sendCommand("get","user",{"id":Number(dialog.record.User.id)},function (data) {
				dialog.record.Name=data.name;
				dialog.record.Email=data.email;
				dialog.record.Login=data.user;
			    dialog.record.Password=data.pass;
				dialog.record.Id=Number(data.id);				
				dialog.refresh();
		});
	}
}


function toolbarTemplate(header,addFunction,delFunction,editFunction) {

	var toolbar =	{
						items : [
    			 			{ 	type	:  'html',  
								html	: 	'<div style="padding: 3px 10px;"><b>'
											+header+
											'</b></div>' 
							},
				 			
							{	type	:	'spacer',	}
						]
	};	
	
	if (addFunction!=undefined) toolbar.items.push({  type	:	'button', id	: 'add', caption :'+', onClick:addFunction});
	if (editFunction!=undefined) toolbar.items.push({  type	:	'button', id	: 'edit', caption :'&#9998;', onClick:editFunction});
	if (delFunction!=undefined) toolbar.items.push({  type	:	'button', id	: 'delete', caption :'-', onClick:delFunction});
	
	return toolbar;

}	

//Language Features
//Typing Levels
var typing= ["Untyped","Optional Declaration","Declaration, optional type","Strict Typing"];	
//var statements=["if","switch","do","while","for","function","javascript","array","structure","object"];

 function helpTemplate(id,itemName){
  		return {
    		name:id+"HelpDialog",
    		header: itemName,
    		formHTML: '<div class="w2ui-page page-0" style="width: 100%;">'+
   				   		'<textarea name="help" disabled style="width: 100%;height: 100%;resize:none;"></textarea>'+
					'</div><div class="w2ui-buttons style="width: 100%;">'+
   					 		'<button class="btn" name="ok">ok</button>'+
					 '</div>',
    		fields : [
   				{ name: 'help', type: 'textarea',required:true},
     		],
    	actions: {	ok:function () {
   						closeDialog();	
   					},
   				},
   		};
  }



function languageFormTemplate(){
	return     '<div class="w2ui-page page-0">'+
		    					 '<div style="width: 100%; margin-right: 0px;">'+
		            		 			'<div class="w2ui-field w2ui-span4"><input name="typing" type="radio" value="0">'+typing[0]+'</div>'+
		            		 			'<div class="w2ui-field w2ui-span4"><input name="typing" type="radio" value="1">'+typing[1]+'</div>'+
										'<div class="w2ui-field w2ui-span4"><input name="typing" type="radio" value="2">'+typing[2]+'</div>'+
		            		 			'<div class="w2ui-field w2ui-span4"><input name="typing" type="radio" value="3">'+typing[3]+'</div>'+
		                   		'</div>'+
		        				 '<div style="width: 40%; float: left; margin-right: 0px;">'+
		            		 		'<div class="w2ui-group" style="height: 130px;">'+
		            		 			'<div class="w2ui-field w2ui-span4"><input name="if" type="checkbox">if</div>'+
		                   				'<div class="w2ui-field w2ui-span4"><input name="switch" type="checkbox">switch</div>'+
		                   				'<div class="w2ui-field w2ui-span4"><input name="do" type="checkbox">do</div>'+
		                				'<div class="w2ui-field w2ui-span4"><input name="while" type="checkbox">while</div>'+
		                   				'<div class="w2ui-field w2ui-span4"><input name="for" type="checkbox">for</div>'+
									'</div>'+
								'</div>'+
								'<div style="width: 40%; float: right; margin-left: 0px;">'+
		            		 		'<div class="w2ui-group" style="height: 130px;">'+
		            		 			'<div class="w2ui-field w2ui-span4"><input name="function" type="checkbox">function</div>'+
		            		 			'<div class="w2ui-field w2ui-span4"><input name="javascript" type="checkbox">javascript</div>'+
		                	 			'<div class="w2ui-field w2ui-span4"><input name="array" id="array" type="checkbox">array</div>'+
		                   				'<div class="w2ui-field w2ui-span4"><input name="structure" id="structure" type="checkbox">structure</div>'+
		                   				'<div class="w2ui-field w2ui-span4"><input name="object" id="object" type="checkbox">object</div>'+
									'</div>'+
								'</div>'+
		        '</div>';
}


