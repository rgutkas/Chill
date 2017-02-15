
//Resize an element to the window size
function resize (id,id2) {
	if (id2==undefined) {	
		$("#"+id).width($(document).width()-20);
		$("#"+id).height($(document).height()-20);
	} else 	{
		$("#"+id).width($("#"+id2).width()-20);
		$("#"+id).height($("#"+id2).height()-20);
	}	
}