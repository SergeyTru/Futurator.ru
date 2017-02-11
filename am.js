/* DomPath from stackoverflow http://stackoverflow.com/a/16742828 */
function getDomPath(el) {
	if (!el) {
		return;
	}
	var stack = [];
	var isShadow = false;
	while (el.parentNode != null) {
    	var nodeName = el.nodeName.toLowerCase();

		stack.unshift(nodeName);

		el = el.parentNode;
		if (el.nodeType === 11) { // for shadow dom, we
			isShadow = true;
			el = el.host;
		}
	}
	stack.splice(0, 1); // removes the html element
	return stack.join(' > ');
}

/*********FUNCTIONS********/

function getUrlfromPath(anchors_by_path_Array) {
	if(!anchors_by_path_Array)
		return [];

	var links_array = [];		
	anchors_by_path_Array.forEach(function (anchorObj, index) {
		links_array.push(anchorObj.href);
	});
	return links_array;
}



function getRightPath(pathClusters) {	
	if(!pathClusters) 
		return [];

	var paths = [];		
	pathClusters.forEach(function (pathCluster) {		
		paths.push(pathCluster.path);
	});
	return paths;
}



Object.prototype.addToKey = function (key, value) {
	if (key in this)
		this[key].push(value);
	else
		this[key] = [value];
}

function log(obj,debug) {
	if(debug)
	{
		console.log(obj);
	}
}


/**********CODE********/
function getPathnUrlsArray_fromAnchors(linkClusters,debug) {
	//vars
	//return object
	var resultObj={};
	//array of all anchors with "good" hrefs, html and DOM paths
	var anchorsArray = [];
	//object with key = common DOM path, value = array of anchors in this DOM path
	var anchors_by_path_ArrayObj = {};	
	//object with key= distinct DOM path, value = distinct URItemplates 
	var uriCluster_by_pathObj = {};
	



	//Collect all anchors in DOM
	var anchors = document.querySelectorAll("a");

	//Populate anchorsArray with elements
	anchors.forEach(function (el, index) {
		var href = el.href;
		var idx = href.indexOf('#');
		if (idx >= 0)
			short_href = href.slice(0, idx);
		else
			short_href = href;

		if (short_href !== undefined && short_href !== "") {

			var anchorObj = {};
			anchorObj.href = short_href;
			anchorObj.html = el.innerHTML; // for tests
			anchorObj.path = getDomPath(el);

			anchorsArray.push(anchorObj);
		}
		else {
			log("bad href " + short_href,debug)
		}
	});

	//add to anchorsArray elements linkClusters, based on element.href vs 
	//each cluster regex
	anchorsArray.forEach(function (el) {
		el.linkClusters = [];
		linkClusters.forEach(function (cluster, i) {
			expr = '^' + cluster.toRegexp() + "$";
			if (el.href.match(expr)) {
				el.linkClusters.push(cluster);
			}
		});
	});

	//populating object with key = common DOM path, 
	//value = array of anchors in this DOM path
	anchorsArray.forEach(function (anchorObj) {
		anchors_by_path_ArrayObj.addToKey(anchorObj.path,anchorObj)
	});

	//Now in anchors_by_path_ArrayObj we have all distinct paths with anchors
	log(anchors_by_path_ArrayObj,debug)
 
	//Look inside each distinct path in anchors_by_path_ArrayObj and
	//find findUriClusters (>0) there. Store them
	Object.keys(anchors_by_path_ArrayObj).forEach(function (path) {
		var clusters = findUriClusters(getUrlfromPath(
			anchors_by_path_ArrayObj[path])
		);

		if (clusters.length > 0) {
			uriCluster_by_pathObj[path] = clusters;
		} 
	});

	//Now we have all distinct paths with 1 or more UriClusters.
	log(uriCluster_by_pathObj,debug)
 
	Object.keys(anchors_by_path_ArrayObj).forEach(function (path) {
		anchors_by_path_ArrayObj[path].forEach(function (anchorObj) {
			anchorObj.linkClusters = anchorObj.linkClusters.filter(cluster =>
				getRightPath(uriCluster_by_pathObj[path]).indexOf(cluster.path) > -1
			)
		});

	});
 
	//Now in anchors_by_path_ArrayObj we have all distinct paths with anchors
	//and with right UriClusters.
	//In short we had now there are UriClasters in anchors
	//that are equal instide path
	log(anchors_by_path_ArrayObj,debug)



	//Add to result objects with distinct path and cluster 
	Object.keys(anchors_by_path_ArrayObj).forEach(function (path) {
		var urlClusterArray = anchors_by_path_ArrayObj[path];
		urlClusterArray.forEach(function (anchorObj) {
			anchorObj.linkClusters.forEach(function (cluster) {
				var totalString = "path: " + path + " | cluster: " + cluster.path;
				resultObj.addToKey(totalString, anchorObj);
			});

		});

	});



	return resultObj;
}

var PathnUrlsArray_fromAnchors=getPathnUrlsArray_fromAnchors(linkClusters,1); 
log(PathnUrlsArray_fromAnchors,1);