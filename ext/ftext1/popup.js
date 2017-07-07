document.addEventListener('DOMContentLoaded', function() {

var checkPageButton = document.getElementById('AddContacts');
checkPageButton.addEventListener('click', function() {

chrome.tabs.getSelected(null, function(tab) {
	      d = document;
alert(JSON.stringify(d));
alert(JSON.stringify($(d)));
  // add_all_friends(false,d); 
 });
}, false);
}, false);



function add_all_friends(add,d) {
 	var buttons=$(d).find(".bt-request-buffed");
	alert(JSON.stringify(buttons));
	var local_title_array=localStorage["title_array"];
	if(!!local_title_array) {
	var title_array=JSON.parse(local_title_array);
	} else
	{
	var title_array=[];
	}
	var title_array_new=[];
	buttons.each(function( index ) {
		var button_title= $( this ).attr('title');
		if(title_array.indexOf(button_title)==-1) {
			title_array_new.push(button_title);
			if(add) {
				$( this ).click();
				console.log(button_title+" clicked");
			}
		}
	}); 
	/*
	console.log("answer:");
	console.log(title_array_new);
	console.log("answer");
	*/
	if(!add) {
		console.log(title_array_new);
		console.log(title_array);
	}
	localStorage["title_array"] = JSON.stringify(title_array.concat(title_array_new));
}