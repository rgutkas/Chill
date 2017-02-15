/*	help.js 
		Offers a class Help, for opening an help Popup
*/

function Help(div) {
	this.div=div;	
	var uiConfig = {

			// The Layout of the help dialog consists of an left index panel	
			layout:	{ 
				name: 'helpLayout',
    			panels: [
        			{ type: 'left', size: 200, resizable: false, content: 'Menu' },
        			{ type: 'main', content: 'loading...' }
    			],
    		},
    		
    		menu: {
    			name: 'helpMenu',
				img: null,
				nodes: [ 
					{ id: 'menu', text: 'Menu', img: 'icon-folder', expanded: true, group: true,
		  				nodes: [ 	{ id: 'ebnf', text: 'EBNF', img: 'icon-page' },
					   			{ id: 'appendix', text: 'Appendix', img: 'icon-folder',
				  					nodes:[ {id: 'about', text: 'About', img: 'icon-page' },
				  							{id: 'references', text: 'References', img: 'icon-page' }
				  					]
				   				}
				 		]
					}		
				],
				
				onClick: function (event) {
			
					// Ignore nodes that expand
					switch(event.target) {
						case"appendix" : break;
				
						// When it's a page load it to conent
						default : w2ui['helpLayout'].load('main', 'help/'+event.target+'.html');
					}
				},
			}			
		};
	
	// call this function with the $function of the html included to initialis w2ui and jquery for the help popup	
	this.$ = function () {
		$(this.div).w2layout(uiConfig.layout);
		$().w2sidebar(uiConfig.menu);
		w2ui.helpLayout.content('left', w2ui.helpMenu);
		w2ui['helpLayout'].load('main', 'help/'+"about"+'.html');
	};
}
