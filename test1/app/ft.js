this.website="http://ria.ru";
this.input_json={
    "tables": [
        {
            "root": ".b-list__item",
            "fields": [
                {
                    "title": "text",
                    "css_path": ".b-list__item-title span",
                    "content": "all_text",
                    "when_absent": "fail"
                },
                {
                    "title": "img",
                    "css_path": ".b-list__item-img-ind img",
                    "content": "[src]",
                    "format": "url",
                    "when_absent": "fail"
                },
                {
                    "title": "url",
                    "css_path": ">a ",
                    "content": "[href]",
                    "format": "url",
                    "is_id": true,
                    "when_absent": "fail"
                }
            ]
        }
    ],
    "pagination": {
        "css_path": ".pager-listing",
        "content": "[href]",
        "when_absent": "ignore"
    }
}


this.check=function(input_json){
var result_json={results:[]};


var primary_table=input_json.tables[0];
var root=primary_table.root;
var text_field={};
var img_field={};
var url_field={};

//console.log("root elements found: "+$(root).length);

for (var counter=0; counter<$(root).length; counter++)
{
	var result_element={};
	for(var i=0;i<primary_table.fields.length;i++) {
		var field=primary_table.fields[i];
		var field_result_string="";
		if(field.title=="text") 
			text_field=field;
		if(field.title=="img") 
			img_field=field;
		if(field.title=="url") 
			url_field=field;	
		
		var field_element=$($(root)[counter]).find(field.css_path.trim());
		
		
		var reg= /\[(.*)\]/g 
		var test = reg.exec(field.content);

		if(test!=null)
		{
			field_result_string=field_element.attr(test[1]);
		}

		else if(field.content=="all_text") {
			field_result_string=field_element.text();
		}
		
		
		
		//console.log(field.title+" result is "+field_result_string);
		result_element[field.title]=field_result_string;
	}
	result_json.results.push(result_element);
}

return result_json;

}