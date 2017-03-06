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


 
function findCards(PathAndUrlsArrayfromAnchors) {
    PathAndUrlsArrayfromAnchors.forEach((obj) => {
        findCardsSingle(obj);
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
   //var bgColor='#'+Math.floor(Math.random()*16777215).toString(16);



    if(obj.nodes.length<2) 
        return false;
    obj.nodes.forEach((nodeMain,i) => {
        nodeMain.Card=[];
        obj.nodes.forEach((node2,j) => {
            if((nodeMain!==node2))
            {
                comonCard=findCard(nodeMain,node2);
                if(comonCard)							
                    nodeMain.Card.push(comonCard);
                else {
                    log("failed Card search for nodes");
                    //nodeMain.Card.push("failed Card search for nodes");
                }
            }
        });	
        /*        
        console.log(i);
        console.log(nodeMain.Card);
      
        nodeMain.Card=nodeMain.Card.reduce(function(pV, cV, index, array) {//HACK
            if(getDomPath(pV).split(">").length>=getDomPath(cV).split(">")) 
            {
                return cV; 
            } else {
                return pV;  
            }
        });	
        nodeMain.Card.style.border="6px dashed #CC0";
        //https://www.paulirish.com/2009/random-hex-color-code-snippets/
        nodeMain.Card.style['background-color']=bgColor;
        */


    });
}

var resItem=5;

findCardsSingle(result[resItem]);
//findCards(result);
//console.log(result[0].nodes[0].Card);



function composeCardSingle(res) {
    var CardArray=[];
    CardArray=res.nodes.reduce(function(prev, next, i, a) {//HACK
         if(typeof(prev.Card)!=="undefined")
            prev=prev.Card;
         return prev.concat(next.Card);
    });	
    console.log("CardArray");
    console.log(CardArray);

   
    var CardArrayPath=[];
    CardArrayPath=CardArray.map((CardEl)=>getDomPath(CardEl));
    console.log("CardArrayPath");
    console.log(CardArrayPath);

    var totalCard=CardArrayPath.reduce(function(prev, next, index, array) {//Выбираем самый глубокий путь 
        if(prev.split(">").length>=next.split(">"))
        {
            return next; 
        } else {
            return prev;  
        }
    });	

/*

    var totalCard=CardArray.reduce(function(pV, cV, index, array) {//HACK
        if(getDomPath(pV).split(">").length>=getDomPath(cV).split(">")) 
        {
            return cV; 
        } else {
            return pV;  
        }
    });	
    */
    console.log("totalCard");
    console.log(totalCard); // document.querySelectorAll("body > div > div > div > div > ul > li") - for group
    return totalCard;
}


var totalCard=composeCardSingle(result[resItem]);
//result[0].nodes[3].Card.push(result[0].nodes[3].parentNode); hack - вставим правильную карточку сюда




//cardElOld(result[resItem],totalCard);

cardEl(result[resItem],totalCard);

function cardEl(group,totalCard) {

    //https://www.paulirish.com/2009/random-hex-color-code-snippets/    
    var bgColor='#'+Math.floor(Math.random()*16777215).toString(16);
    
    var cardWayLength=totalCard.split(">").length;
    var groupwayLength=group.path.split(">").length;

    group.nodes.forEach(function(node,index){
        var cardNode=node;
        for(var i=0; i<groupwayLength-cardWayLength; i++) {
            cardNode=cardNode.parentNode;
        }
        node.cardNode=cardNode;
        node.cardNode.style.border="6px dashed #CC0";
        node.cardNode.style['background-color']=bgColor;               
 
    });    
}














function cardElOld(group,totalCard) {
    var allEls=document.querySelectorAll(totalCard);
    var bgColor='#'+Math.floor(Math.random()*16777215).toString(16);
    //Добавить уникальный ID каждому элементу (чтобы его потом найти)
    group.nodes.forEach(function(node,i){
        node.id = "theId_"+resItem+"_"+i;
    });    


    console.log(group.nodes);
    /*
    group.nodes.forEach(function(node,i){

        var el=document.querySelector(totalCard+" #"+node.id).parentNode;
        node.true_Card=el;
        node.true_Card.style.border="6px dashed #CC0";
        //https://www.paulirish.com/2009/random-hex-color-code-snippets/
        node.true_Card.style['background-color']=bgColor;               


    });    

*/

/*
    group.nodes.forEach(function(node){

      //потому что мы не умеем искать нормально элемент, мы ищем его среди рутов
      //а надо по как нашу карточку  body > div > div > div > div > ul > li
      node.Card.forEach(function(nodeCard){

        allEls.forEach(function(el){

            if(el===nodeCard) {
                node.true_Card=el;
                node.true_Card.style.border="6px dashed #CC0";
                //https://www.paulirish.com/2009/random-hex-color-code-snippets/
                node.true_Card.style['background-color']=bgColor;               
            }
        });

          
      });


    });
    */
    group.nodes.forEach(function(node){


        allEls.forEach(function(el){

            if(el.contains(document.querySelector(totalCard+" #"+node.id).parentNode)) { //проверку на то, что node (мы можем взять его по айти) является сыном el
                node.true_Card=el;
                node.true_Card.style.border="6px dashed #CC0";
                //https://www.paulirish.com/2009/random-hex-color-code-snippets/
                node.true_Card.style['background-color']=bgColor;               
            }
        });

    });    
 

}


//console.log(debugNbeautifyPathsWithClusters(result));