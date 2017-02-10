function getDomPath(el) {
  if (!el) {
    return;
  }
  var stack = [];
  var isShadow = false;
  while (el.parentNode != null) {
    // console.log(el.nodeName);
    var sibCount = 0;
    var sibIndex = 0;
    // get sibling indexes
    for ( var i = 0; i < el.parentNode.childNodes.length; i++ ) {
      var sib = el.parentNode.childNodes[i];
      if ( sib.nodeName == el.nodeName ) {
        if ( sib === el ) {
          sibIndex = sibCount;
        }
        sibCount++;
      }
    }
    // if ( el.hasAttribute('id') && el.id != '' ) { no id shortcuts, ids are not unique in shadowDom
    //   stack.unshift(el.nodeName.toLowerCase() + '#' + el.id);
    // } else
    var nodeName = el.nodeName.toLowerCase();
    if (isShadow) {
      nodeName += "::shadow";
      isShadow = false;
    }
	/*	
    if ( sibCount > 1 ) {
      stack.unshift(nodeName + ':nth-of-type(' + (sibIndex + 1) + ')');
    } else {
      stack.unshift(nodeName);
    }
	*/
	
	stack.unshift(nodeName);
	
    el = el.parentNode;
    if (el.nodeType === 11) { // for shadow dom, we
      isShadow = true;
      el = el.host;
    }
  }
  stack.splice(0,1); // removes the html element
  return stack.join(' > ');
}
var urls=$('a');
var urlArray=[];
var urlClusterArrayObj={};

urls.each(function( index ) { 
//console.log(index);
	var href=this.href;
	//var href=$(this).attr('href');
	var idx = href.indexOf('#');
	if (idx >= 0)
	  href=href.slice(0, idx);
	else
	  href=href;		
	
	
	if(href!==undefined && href!==""){
  
	  
	  var urlObj={};
	  urlObj.href=href;
	  urlObj.html=$( this ).html(); // for tests
	  urlObj.path=getDomPath(this);

		
	  
	  
	  
	  urlArray.push(urlObj);
	}
	else {
		console.log("bad href "+href);
	}
});


$.each(urlArray,function( index, el ) { 
	  el.linkClusters=[];
	  
	  $.each(linkClusters, function(i,cluster){
		var text=cluster;
		expr = '^' + text.toRegexp() + "$";
		if(el.href.match(expr)) {
			//console.log("href number "+index+"; cluster number "+i+"; result:");
			//console.log(href.match(expr));
			el.linkClusters.push(cluster);
		}
		
		  
	  });
});
	  
 
 
$.each(urlArray, function( index,urlObj ) {
	
	if(!(urlObj.path in urlClusterArrayObj))
			urlClusterArrayObj[urlObj.path]=[];

	urlClusterArrayObj[urlObj.path].push(urlObj);
});


var distincturlClusterArrayObj=[];

function getUrlfromPath(urlClusterArray) {
	var links_array=[];
	$.each(urlClusterArray, function( index,urlObj ) {
		links_array.push(urlObj.href);
	});
	//console.log(links_array);
	return links_array;
}

/*
var pathClusters=[];

 
$.each(urlClusterArrayObj, function( index,urlClusterArray ) {
	
	var clusters=findUriClusters(getUrlfromPath(urlClusterArray));
	if(clusters.length>0) {
		console.log(index+" has "+clusters.length+" clusters");
		pathClusters.push(clusters);
	} else {
		console.log(index+" zero clusters");
	}
});


console.log(pathClusters);

*/
var pathClustersObj={};

 
$.each(urlClusterArrayObj, function( index,urlClusterArray ) {
	
	var clusters=findUriClusters(getUrlfromPath(urlClusterArray));
	if(clusters.length>0) {

		pathClustersObj[index]=clusters;			
		//console.log(index+" has "+clusters.length+" clusters");
	} else {
		//console.log(index+" zero clusters");
	}
});

 






function getRightPath(pathClusters) {
	var paths=[];
	$.each(pathClusters, function( index,pathCluster ) {
		paths.push(pathCluster.path);
	});	
	return paths;
}


  
$.each(urlClusterArrayObj, function( path,urlClusterArray) {
	$.each(urlClusterArray, function( index,urlObj ) {			
			urlObj.linkClusters=urlObj.linkClusters.filter(cluster => getRightPath(pathClustersObj[path]).indexOf(cluster.path)>-1)
	});	
	

});

 

 

var comboArrayObj={};
$.each(urlClusterArrayObj, function( path,urlClusterArray) {
	$.each(urlClusterArray, function( index,urlObj ) {
		$.each(urlObj.linkClusters, function( index,cluster ) {
			var totalString="path: "+path+" | cluster: "+cluster.path;
			if(!(totalString in comboArrayObj))
					comboArrayObj[totalString]=[];

			comboArrayObj[totalString].push(urlObj);			
			
		});	 		
		
	});	
	

});

console.log("comboArrayObj");
console.log(comboArrayObj);


 
 
 /*
console.log(urlArray);
console.log(urlArray.length);

 
console.log(urlClusterArrayObj);
console.log(Object.keys(urlClusterArrayObj).length);
 */
 