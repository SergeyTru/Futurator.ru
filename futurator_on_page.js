function sortUnique(arr, equality) {
    if (!equality)
        equality = function (a, b) { return a === b; };

    //http://stackoverflow.com/a/4833835
    if (arr.length === 0) return arr;
    arr = arr.sort();
    var ret = [arr[0]];
    for (var i = 1; i < arr.length; i++) { // start loop at 1 as element 0 can never be a duplicate
        if (!equality(arr[i - 1], arr[i])) {
            ret.push(arr[i]);
        }
    }
    return ret;
}

function findUriClusters(links) {
    links = links.map(link => { 
        return getUrlWithoutHash(link);
    }).filter(x => x.length > 0);
    var refs = sortUnique(links).map(a => new URI(a));
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
    var linkClusters = findUriClusters([].slice.call(document.links).map(a => a.href));
    var imgClusters = findUriClusters([].slice.call(document.images).map(img => img.src));

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
    debug = true;
    if (debug) {
        console.log(obj);
    }
}

function splitByClusters(clusters,values,path) {
        var tmpArray=[];
        clusters.forEach((cluster) => {
            var expr = '^' + cluster.toRegexp() + "$";
            var nodes = values.filter(awi => awi.url.match(expr)).map(awi => awi.anchor);

            tmpArray.push({ 
                path: path, 
                nodes: nodes, 
                urlTemplate: cluster,
                urlClusterText:cluster.toString() 
            });
            
        });    
        return tmpArray;

}

function getUrlWithoutHash(href) {
    var idx = href.indexOf('#');
    return (idx >= 0 ? href.slice(0, idx) : href);
}


function getPathAndUrlsArrayfromAnchors() {
    var groupedByPath = {};
    var pathsWithClusters = [];

    var anchors = Array.prototype.slice.call(document.links);

    var anchorsWithInfo = anchors.map(a => {
        return { anchor: a, url: getUrlWithoutHash(a.href), path: getDomPath(a) };
    }).
        filter( x => x.url.length > 0 );

    log(anchorsWithInfo);

    anchorsWithInfo.forEach((obj) => {
        groupedByPath.addToKey(obj.path, obj);
    });

    log(groupedByPath);

    Object.keys(groupedByPath).forEach((path) => {
        var values = groupedByPath[path];
        var links = values.map((a) => { return a.url; });
        var clusters = findUriClusters(links);
        pathsWithClusters=pathsWithClusters.concat(splitByClusters(clusters,values,path)).
            filter(x=>x.nodes.length>0);

    });
    
    return pathsWithClusters;



}

function debugNbeautifyPathsWithClusters(pathsWithClusters) {
    var resultObj={};
    pathsWithClusters.forEach((obj) => {
            resultObj.addToKey( "path: " + obj.path + " | cluster: " + obj.urlTemplate.toString(), obj);
    });

    Object.keys(resultObj).forEach((key) => {
        var item = resultObj[key][0];
        resultObj[key] = item.nodes.map(node => {
            return { node: node, urlTemplate: item.urlTemplate,  path: item.path, 
                urlClusterText:item.urlTemplate.toString()};
        });
    });
    return resultObj;
}

var result = getPathAndUrlsArrayfromAnchors();
log(result);
log(debugNbeautifyPathsWithClusters(result));

