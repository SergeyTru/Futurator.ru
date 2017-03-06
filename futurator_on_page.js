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


function setCards(groups) {
    groups.forEach((group, pos) => {
		//if(pos==2) { 
		
			findCardsSingle(group);

			composeCardSingle(group);

			cardEl(group,pos);        
		//}
    });	
}


function findCard(nodeMain,node2) {//check if nodeMain===node2 before launch
    var CardNode;
	var parent1=nodeMain.parentNode;
	var parent2=node2.parentNode;
	if(parent1===document.body)
		return nodeMain; //elements have exact same Cards

	if(parent1!==parent2) {
		CardNode=findCard(parent1,parent2);
	} else {		
        return nodeMain; //comonCard for both nodes found. Return previous
	}
    return CardNode;
}



function findCardsSingle(obj) {
    if(obj.nodes.length<2) 
        return false;
    var saveNodes=[];
    obj.nodes.forEach((nodeMain,i) => {
        saveNodes.push(nodeMain);
        nodeMain.Card=[];        
        obj.nodes.forEach((node2,j) => {
            if((saveNodes.indexOf(node2)==-1))
            {
                comonCard=findCard(nodeMain,node2);
                if(comonCard)							
                    nodeMain.Card.push(comonCard);
                else {
                    log("failed Card search for nodes");
                }
            }
        });	
    });
	
}




function composeCardSingle(group) {

    if(group.nodes.length> 1)
    {
        //get array of all cards in group
        var CardArray=[];
        CardArray=group.nodes.reduce(function(prev, next, i, a) {//HACK
            if(typeof(prev.Card)!=="undefined")
                prev=prev.Card;
            return prev.concat(next.Card);
        });	


        //get array of all path for card in group   
        var CardArrayPath=[];
        CardArrayPath=CardArray.map((CardEl)=>getDomPath(CardEl));

        //Select the deepest
        group.pathToCard=CardArrayPath.reduce(function(prev, next, index, array) {
            if(prev.split(">").length>=next.split(">"))
            {
                return prev; 
            } else {
                return next;  
            }
        });	
    } else {
        group.pathToCard=getDomPath(group.nodes[0].parentNode);
    }

}




function cardEl(group,pos) {

    //https://www.paulirish.com/2009/random-hex-color-code-snippets/    
    var bgColor='#'+Math.floor(Math.random()*16777215).toString(16);
    
    var cardWayLength=group.pathToCard.split(">").length;
    var groupwayLength=group.path.split(">").length;

    group.nodes.forEach(function(node,index){
        var cardNode=node;
        for(var i=0; i<groupwayLength-cardWayLength; i++) {
            cardNode=cardNode.parentNode;
        }
        node.cardNode=cardNode;
        node.cardNode.id = "cardId_"+pos+"_"+index;  
		node.cardNode.className+= " card_class_group_"+pos;  
        node.cardNode.style.border="6px dashed #CC0";
        node.cardNode.style['background-color']=bgColor;               
 
    });    
}



var groups = getPathAndUrlsArrayfromAnchors();
 
//groups=groups.splice(0,1);
log(groups);
log(debugNbeautifyPathsWithClusters(groups));


setCards(groups);
runTests(groups);

function runTests(groups) {
	//test_class_group_2 card_class_group_2
    groups.forEach((group, pos) => {
		if(document.querySelector(".test_class_group_"+pos)==document.querySelector(".card_class_group_"+pos)) {
			console.log("Test for group "+pos+" - success");
		}
		else {
			console.log("!Test for group "+pos+" - failed");
		}
    });	
	
}

/*
//Single Test Visual

var resItem=0;

findCardsSingle(groups[resItem]);

composeCardSingle(groups[resItem]);

cardEl(groups[resItem]);
*/
