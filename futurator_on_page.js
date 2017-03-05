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
        /*
        if(el.className)
            nodeName+="."+el.className;
        */
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
    debug = false;
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


 
function findRoots(PathAndUrlsArrayfromAnchors) {
    PathAndUrlsArrayfromAnchors.forEach((obj) => {
        findRootsSingle(obj);
    });	
}
 



function findRoot(nodeMain,node2) {//check if nodeMain===node2 before launch
    var rootNode;
	var parent1=nodeMain.parentNode;
	var parent2=node2.parentNode;
	if(parent1===document.body)
		return nodeMain; //elements have exact same roots
	isDistinct=(parent1!==parent2);
	if(isDistinct) {
		rootNode=findRoot(parent1,parent2);
	} else {		
        return nodeMain; //comonRoot for both nodes found. Return previous
	}
    return rootNode;
}


function findRootsSingle(obj) {
    var bgColor='#'+Math.floor(Math.random()*16777215).toString(16);
    if(obj.nodes.length<2) 
        return false;
    obj.nodes.forEach((nodeMain,i) => {
        nodeMain.root=[];
        obj.nodes.forEach((node2,j) => {
            if((nodeMain!==node2))
            {
                comonRoot=findRoot(nodeMain,node2);
                if(comonRoot)							
                    nodeMain.root.push(comonRoot);
                else {
                    log("failed root search for nodes");
                    //nodeMain.root.push("failed root search for nodes");
                }
            }
        });	
        /*        
        console.log(i);
        console.log(nodeMain.root);
      
        nodeMain.root=nodeMain.root.reduce(function(pV, cV, index, array) {//HACK
            if(getDomPath(pV).split(">").length>=getDomPath(cV).split(">")) 
            {
                return cV; 
            } else {
                return pV;  
            }
        });	
        nodeMain.root.style.border="6px dashed #CC0";
        //https://www.paulirish.com/2009/random-hex-color-code-snippets/
        nodeMain.root.style['background-color']=bgColor;
        */


    });
}


findRootsSingle(result[resItem]);
//findRoots(result);
//console.log(result[0].nodes[0].root);



function composeRootSingle(res) {
    var rootArray=[];
    rootArray=res.nodes.reduce(function(prev, next, i, a) {//HACK
         if(typeof(prev.root)!=="undefined")
            prev=prev.root;
         return prev.concat(next.root);
    });	
    console.log("rootArray");
    console.log(rootArray);

   
    var rootArrayPath=[];
    rootArrayPath=rootArray.map((rootEl)=>getDomPath(rootEl));
    console.log("rootArrayPath");
    console.log(rootArrayPath);

    var totalRoot=rootArrayPath.reduce(function(prev, next, index, array) {//HACK
        if(prev.split(">").length>=next.split(">"))
        {
            return next; 
        } else {
            return prev;  
        }
    });	

/*

    var totalRoot=rootArray.reduce(function(pV, cV, index, array) {//HACK
        if(getDomPath(pV).split(">").length>=getDomPath(cV).split(">")) 
        {
            return cV; 
        } else {
            return pV;  
        }
    });	
    */
    console.log("totalRoot");
    console.log(totalRoot); // document.querySelectorAll("body > div > div > div > div > ul > li") - for group
    return totalRoot;
}


var totalRoot=composeRootSingle(result[resItem]);

cardEl(result[resItem],totalRoot);


function cardEl(group,totalRoot) {
    var allEls=document.querySelectorAll(totalRoot);
    var bgColor='#'+Math.floor(Math.random()*16777215).toString(16);

    group.nodes.forEach(function(node){

      node.root.forEach(function(nodeRoot){

        allEls.forEach(function(el){

            if(el===nodeRoot) {
                node.true_root=el;
                node.true_root.style.border="6px dashed #CC0";
                //https://www.paulirish.com/2009/random-hex-color-code-snippets/
                node.true_root.style['background-color']=bgColor;               
            }
        });

          
      });


    });

}


//console.log(debugNbeautifyPathsWithClusters(result));