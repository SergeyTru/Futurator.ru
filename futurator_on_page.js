function sortUnique(arr, equality) {
    if (!equality)
      equality = function(a, b) { return a === b; };

    //http://stackoverflow.com/a/4833835
    if (arr.length === 0) return arr;
    arr = arr.sort();
    var ret = [arr[0]];
    for (var i = 1; i < arr.length; i++) { // start loop at 1 as element 0 can never be a duplicate
        if (!equality(arr[i-1], arr[i])) {
            ret.push(arr[i]);
        }
    }
    return ret;
}

function findUriClusters(links) {
  links = links.filter(x => x!==undefined).map(link => {
    var idx = link.indexOf('#');
    if (idx >= 0)
      return link.slice(0, idx);
    else
      return link;
  }).filter(x => x.length > 0);
  var refs = sortUnique(links).map(a=>new URI(a));
  var clusters = [];
  for (var i = refs.length - 1; i > 0; --i)
    for (var j = i - 1; j >= 0; --j) {
      var cluster = templateForUris(refs[i], refs[j]);
      if (cluster)
        clusters.push(cluster);
    }
  return sortUnique(clusters, UriTemplate.equals);
}

function clusterize() {
  var linkClusters = findUriClusters([].slice.call(document.links).map(a=>a.href));
  var imgClusters = findUriClusters([].slice.call(document.images).map(img=>img.src));
  
  console.log("Links:");
  linkClusters.forEach(clust => console.log(clust.toString()));
  console.log("Images:");
  imgClusters.forEach(clust => console.log(clust.toString()));
}

//clusterize();

/* DomPath from stackoverflow http://stackoverflow.com/a/16742828 */
function getDomPath(el) {
    if (!el) {
        return false;
   }
    var stack = [];
    while (el.parentNode !== null) {
        var nodeName = el.nodeName.toLowerCase();
        stack.unshift(nodeName);
		el = el.parentNode;
		if (el.nodeType === 11) { // for shadow dom
			el = el.host;
		}        
    }
    stack.splice(0, 1); // removes the html element
    return stack.join(' > ');
}
 
/*********FUNCTIONS********/
Object.prototype.addToKey = function (key, value) {
    if (key in this)
        this[key].push(value);
    else
        this[key] = [value];
};
function log(obj, debug) {
    if (debug) {
        console.log(obj);
    }
}

function getPathAndUrlsArrayfromAnchors(debug) {
    //vars
    //return object
    var resultObj = {};
    //array of all anchors with "good" hrefs, html and DOM paths
    var anchorsArray = [];
    //object with key = common DOM path, value = array of anchors in this DOM path
    var anchorsByPathArrayObj = {};
    //object with key= distinct DOM path, value = distinct URItemplates 
    var uriClusterByPathObj = {};
    //get clusters
    var linkClusters = findUriClusters([].slice.call(document.links).map(a=>a.href));

    //Collect all anchors in DOM
    var anchors = document.querySelectorAll("a");
    //Populate anchorsArray with elements
    anchors.forEach(function (el, index) {
        var shortHref;       
        var href = el.href;
        if(href !== undefined) {
            var idx = href.indexOf('#');
            if (idx >= 0)
                shortHref = href.slice(0, idx);
            else
                shortHref = href;

            if (shortHref !== "") {
                var anchorObj = {};
                anchorObj.href = shortHref;
                anchorObj.html = el.innerHTML; // for tests
                anchorObj.path = getDomPath(el);
                anchorsArray.push(anchorObj);
            }
        }
        
    });
    //add to anchorsArray elements linkClusters, based on element.href vs 
    //each cluster regex
    anchorsArray.forEach(function (el) {
        el.linkClusters = [];
        linkClusters.forEach(function (cluster) {
            var expr = '^' + cluster.toRegexp() + "$";
            if (el.href.match(expr)) {
                el.linkClusters.push(cluster);
            }
        });
    });
    //populating object with key = common DOM path, 
    //value = array of anchors in this DOM path
    anchorsArray.forEach(function (anchorObj) {
        anchorsByPathArrayObj.addToKey(anchorObj.path, anchorObj);
    });
    //Now in anchorsByPathArrayObj we have all distinct paths with anchors
    log(anchorsByPathArrayObj, debug);
    //Look inside each distinct path in anchorsByPathArrayObj and
    //find findUriClusters (>0) there. Store them
    Object.keys(anchorsByPathArrayObj).forEach(function (path) { 
        var clusters = findUriClusters(        
            anchorsByPathArrayObj[path]?anchorsByPathArrayObj[path].map(anchorObj =>
                anchorObj.href):[]        
        );
        if (clusters.length > 0) {
            uriClusterByPathObj[path] = clusters;
        }
    });
    //Now we have all distinct paths with 1 or more UriClusters.
    log(uriClusterByPathObj, debug);
    Object.keys(anchorsByPathArrayObj).forEach(function (path) {
        anchorsByPathArrayObj[path].forEach(function (anchorObj) {
            anchorObj.linkClusters = anchorObj.linkClusters.filter(cluster =>                 
                (uriClusterByPathObj[path]?uriClusterByPathObj[path]
                    .map(pathCluster => pathCluster.path):[])
                        .indexOf(cluster.path) >= 0
            );
        });
    });
    //Now in anchorsByPathArrayObj we have all distinct paths with anchors
    //and with right UriClusters.
    //In short we had now there are UriClasters in anchors
    //that are equal instide path
    log(anchorsByPathArrayObj, debug);

    //Add to result objects with distinct path and cluster 
    Object.keys(anchorsByPathArrayObj).forEach(function (path) {
        var urlClusterArray = anchorsByPathArrayObj[path];
        urlClusterArray.forEach(function (anchorObj) {
            anchorObj.linkClusters.forEach(function (cluster) {
                resultObj.addToKey("path: " + path + " | cluster: " + cluster.path, anchorObj);
            });
        });
    });

    return resultObj;
}


var debug=true;

var pathAndUrlsArrayfromAnchors = getPathAndUrlsArrayfromAnchors(debug);
log("result", debug);
log(pathAndUrlsArrayfromAnchors, debug);
