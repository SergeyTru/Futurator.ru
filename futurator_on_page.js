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
 
Object.prototype.addToKey = function (key, value) {
    if (key in this)
        this[key].push(value);
    else
        this[key] = [value];
};

function log(obj) {
    debug=true;
    if (debug) {
        console.log(obj);
    }
}


function getPathAndUrlsArrayfromAnchors() {
    //vars
    //return object
    var resultObj = {};
    //array of all anchors with "good" hrefs, html and DOM paths
    var anchorsArray = [];
    //object with key = common DOM path, value = array of anchors in this DOM path
    var anchorsByPathArrayObj = {};
    //object with key= distinct DOM path, value = distinct URItemplates 
    var uriClusterByPathObj = {};
    //get ahchors
    var anchors = Array.prototype.slice.call(document.links);

    //Collect all anchors in DOM
    //Populate anchorsArray with robust elements
    anchors.forEach(function (el, index) {
        var shortHref; 
        var idx=el.href.indexOf('#');      
        shortHref=idx>=0? el.href.slice(0, idx) : el.href;


        if (shortHref) {
            anchorsArray.push({href: shortHref, html: el.innerHTML, path: getDomPath(el)});
        }
        
    });

    anchorsArray.forEach(function (anchorObj) {
        anchorsByPathArrayObj.addToKey(anchorObj.path, anchorObj);
    });

    Object.keys(anchorsByPathArrayObj).forEach(function (path) { 
        var clusters = findUriClusters(        
            anchorsByPathArrayObj[path]?anchorsByPathArrayObj[path].map(anchorObj =>
                anchorObj.href):[]        
        );
        if (clusters.length > 0) {
            anchorsByPathArrayObj[path].map(a=> a.linkClusters = clusters);
        } else {
            delete anchorsByPathArrayObj[path];
        }
    });

    log(anchorsByPathArrayObj);
    

    Object.keys(anchorsByPathArrayObj).forEach(function (path) {
        var urlClusterArray = anchorsByPathArrayObj[path];
        urlClusterArray.forEach(function (anchorObj) {       
           anchorObj.linkClusters.forEach(function (cluster) {
                var expr = '^' + cluster.toRegexp() + "$";
                if (anchorObj.href.match(expr)) {
                    clusterString=cluster.toString();
                    resultObj.addToKey("path: " + path + " | cluster: " + cluster.path, anchorObj);
                }     
            });
        });
    });

    return resultObj;
}


function testPathAndUrls(resultObj,l,el1,el2) {
    var ok="pathed";
    if(Object.keys(resultObj).length!=l)
        ok="failed";
    if(resultObj[el1.key].length!=el1.l)    
       ok="failed";
    if(resultObj[el2.key].length!=el2.l)    
        ok="failed";      
    console.log("test "+ok);
    console.log(resultObj);
}




var pathAndUrlsArrayfromAnchors = getPathAndUrlsArrayfromAnchors();
 
testPathAndUrls(
    pathAndUrlsArrayfromAnchors,
    7,
    {key:"path: body > div > div > div > div > div > a | cluster: /futurator.ru/web/catalog/{T}.html",l:4},
    {key:"path: body > div > div > div > div > ul > li > a | cluster: /futurator.ru/web/{T}.html",l:9}
);



