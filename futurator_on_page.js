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
    //Ставить флажок если один пустой, а другой цифра
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

/*
function clusterize() {
    var linkClusters = findUriClusters([].slice.call(document.links).map(a => a.href));
    var imgClusters = findUriClusters([].slice.call(document.images).map(img => img.src));

    console.log("Links:");
    linkClusters.forEach(clust => console.log(clust.toString()));
    console.log("Images:");
    imgClusters.forEach(clust => console.log(clust.toString()));
}

//clusterize();
*/

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


/*
1. Найти группы - класстер/путь (внутри - ноды)
2. Найти карточки 
    - для каждый двух нод ищем одинакого родителя - это корень. Возвращаемся на шаг вниз - это карточка. Записываем её в Список
    - для каждой группы выбираем из Списка самого красивого (с коротким путём) родителя

*/
console.log("*************** FTN START **************");
var groups = getPathAndUrlsArrayfromAnchors();

//debugNbeautifyPathsWithClustersColors(groups); 
//groups=groups.splice(0,1);

//log(groups);
//log(debugNbeautifyPathsWithClusters(groups));

//problem with bash - gr 53(quotes)/56(sux)/
/*
gr 53 - quotes - card OK
gr 56 - sux - card not OK (to small)
*/
setCards(groups);

console.log(groups);

//compareCards(groups[4],groups[6]);
function compareCards(groupA,groupB) {
    var equality=false;
    groupA.nodes.forEach(function(nodeA) {
        groupB.nodes.forEach(function(nodeB) {
            if(nodeA.cardNode==nodeB.cardNode) 
            {
                //console.log("Card node equality");
                //console.log(nodeA.cardNode);
                //return nodeA.cardNode; //aka true                
                equality=true;
                return true;
            }
        }, this);

    }, this);

    return equality;

}

//Hip1 - we can use pathToCard to sort groups by Card
//Failed - there are too many equal strings pathToCard which are separate cards

function getGroupsByCard(groupList) {


    var byCards=[];
    groupList.forEach(function(group) {
        if(!byCards[group.pathToCard])
            byCards[group.pathToCard]=[];
        byCards[group.pathToCard].push(group);
    }, this);

    console.log(byCards);
    
    return byCards;
}


//Hip2 - if even one Card from each group has CardNodeEquality this can be CardGroup (with longest group as seed)
generateCardNodesList(groups);

function generateCardNodesList(groupList) {
    var cardNodesListArray=[];



    groupList.forEach(function(groupA,indexA) {

        newCardNodeNumber=cardNodesListArray.length++;                    
        if(!cardNodesListArray[newCardNodeNumber])
            cardNodesListArray[newCardNodeNumber]=[];

        groupList.forEach(function(groupB,indexB) {
            if(indexA>=indexB)
                return false;

            //console.log(indexA+"/"+indexB); //- all with all visial test
            var hasSameCards=compareCards(groupA,groupB);
            if(hasSameCards) {
                groupA.nodes.forEach(function(nodeA) {
                    groupB.nodes.forEach(function(nodeB) {
                        if(nodeA.cardNode==nodeB.cardNode)  // && nodeA!=nodeB
                        {
                            cardNodesListArray[newCardNodeNumber].push(nodeA);
                            cardNodesListArray[newCardNodeNumber].push(nodeB);
                        }
                    }, this);

                }, this);                                
            }

        }, this);

    }, this);

    console.log(cardNodesListArray);

    //store by card
    var cardNodesListByCard=[];
    cardNodesListArray.forEach(function(cardNodesList) {
            cardNodesList.forEach(function(node) {                
            var cardID=node.cardNode.id;

            if(!cardNodesListByCard[cardID])
                cardNodesListByCard[cardID]=[];
            //if(!(node in cardNodesListByCard[cardID]))  {
            if(!nodeInList(node,cardNodesListByCard[cardID])) {    
                cardNodesListByCard[cardID].push(node);
            } else {
                console.log("Node already here");
            }


            }, this);
            
    }, this);



    console.log(cardNodesListByCard);



    return cardNodesListByCard;

}


function nodeInList(node,nodeList) {
    var result=false;

    nodeList.forEach(function(el) {
        if(el==node)
            {
                result=true;
                return true;
            }
    }, this);
    return result;
}

//var byCards=getGroupsByCard(groups);


//group 4 group 6 group 5

/*


//runTests(groups);

groups[5].imgsArr=findImgByGroup(groups[5]);

setCardImg(groups[5]);

logCards(groups[5]);
*/

//FLOW

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
    console.log(groupedByPath);
    return pathsWithClusters;



}


 



function debugNbeautifyPathsWithClustersColors(pathsWithClusters) {
/*
    var div = document.createElement('div');

    div.className = 'futurator_div';

    div.innerHTML = '';

    div.style['position']="fixed";    
    div.style['padding']="10px";    
    div.style['overflow']="auto";    

    div.style['background-color']="#FFF";    
    div.style['border']="3px dashed #CCC";    
    div.style['width']="20%";    
    div.style['height']="80%";    
    div.style['top']="0";    
    div.style['right']="0";    


    document.body.appendChild(div);


    var divContent="";

    pathsWithClusters.forEach((group, groupN) => {
        divContent+="<h2>GROUP "+groupN+" ("+group.nodes.length+")</h2>";
        divContent+="<h5>"+group.path+"</h5>";
        divContent+="<h5>"+group.urlClusterText+"</h5>";
        var bgColor='#'+Math.floor(Math.random()*16777215).toString(16);

        group.nodes.forEach((node,index) => {
                divContent+="<p>"+node.href+"</p>";
                node.id = "pathId_"+index;  
                node.className+= " card_class_group_"+index;  
                node.style.border="6px dashed #CC0";
                node.style['background-color']=bgColor;        
        });            
    });
    div.innerHTML=divContent;
*/    
    pathsWithClusters.forEach((group, groupN) => {
        console.log("group "+groupN+" ("+group.nodes.length+")");
        console.log("path: "+group.path);
        console.log("cluster: "+group.urlClusterText);
         
        

        group.nodes.forEach((node,index) => {
                console.log(node.href);
        });            

        

    });
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
		//if(pos==56 || pos==54 || pos==55 || pos==56 || pos==57) { 
        if(pos!=57) {             
            //Работаю с карточками, мы изменяем их и уже в изменённых местах (нодах), так что если одна ссылка оказывается в другой группе - она перезаписывается
            /*
            Проблема в том, что в идеале - в каждой группе хранится независимая копия ноды
            Но клонирование элемента лишает его parents
            А на данный момент, добавляя элементу свойства мы, находя его в другой группе,
            эти свойства перезаписываем

            
            */
        //if(1) {
		
			findCardsSingle(group);

			composeCardSingle(group);

			cardEl(group,pos);        
		}
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

       //node=node.cloneNode(); //trying to serve connection here

        node.cardNode=cardNode;
       
        node.cardNode.id = "cardId_"+pos+"_"+index;  
		node.cardNode.className+= " card_class_group_"+pos;  
        node.cardNode.style.border="6px dashed #CC0";
        node.cardNode.style['background-color']=bgColor;               
        
 
    });    
}






function logCards(group) {
    var info={};
    group.nodes.forEach((node)=>{
        info={};
        info.href=node.href;
        if(node.cardNode)
            {
                info.img=node.cardNode.imgS[0].src;
            }
        console.log(info);
    });
}

 
function setCardImg(group) {
    var cards=[];
    var imgs=[];
    var imgsLinks=[];
    var clusters = [];

    group.nodes.forEach((node)=>{
        if(node.cardNode)
            cards.push(node.cardNode);
    });

    cards.forEach((card)=>{
        imgs=card.querySelectorAll("img");

        console.log(imgs);
        card.imgS=imgs;
    });


}


function findImgByGroup(group) {
    var cards=[];
    var imgs=[];
    var imgsFlat=[];
    var imgsLinks=[];
    var clusters = [];

    group.nodes.forEach((node)=>{
        if(node.cardNode)
            cards.push(node.cardNode);
    });
    //console.log(cards);
    cards.forEach((card)=>{
        imgs.push(card.querySelectorAll("img"));
    });
    //console.log(imgs);
    imgs.forEach((imgArr)=>{
        imgArr.forEach((img)=>{
            imgsFlat.push(img);
        });        
    });
    //console.log("imgsFlat");
    //console.log(imgsFlat);
    imgsFlat.forEach((img)=>{
        imgsLinks.push(img.src);
    });
    //console.log("imgsLinks");
    //console.log(imgsLinks);

     clusters = findUriClusters(imgsLinks);
     //console.log(clusters);



    var imgsForCardArr=[];

    clusters.forEach((cluster) => {
        var expr = '^' + cluster.toRegexp() + "$";
        var nodes = imgsFlat.filter(awi => awi.src.match(expr));
        if(nodes.length>0)
            imgsForCardArr.push({ 
                path: "some", 
                nodes: nodes, 
                urlTemplate: cluster,
                urlClusterText:cluster.toString() 
            });
        
    });    

    console.log(imgsForCardArr);

    return imgsForCardArr;

}





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
/*
    var groupedByPath = {};
    var pathsWithClusters = [];
    var anchors = Array.prototype.slice.call(document.images);

    var anchorsWithInfo = anchors.map(a => {
        return { anchor: a, url: getUrlWithoutHash(a.src), path: getDomPath(a) };
    }).
        filter( x => x.url.length > 0 );

    console.log(anchorsWithInfo);
    anchorsWithInfo.forEach((obj) => {
        groupedByPath.addToKey(obj.path, obj);
    });

    console.log(groupedByPath);
    groupedByPath=[groupedByPath["body > div > div > div > div > div > div > div > img"]];
    Object.keys(groupedByPath).forEach((path) => {
        var values = groupedByPath[path];
        var links = values.map((a) => { return a.url; });
        var clusters = findUriClusters(links);
        
        console.log("clusters:");
        console.log(clusters);
        console.log("<>");
        
        var split=splitByClusters(clusters,values,path);
        console.log(split);
        pathsWithClusters=pathsWithClusters.concat(split).
            filter(x=>x.nodes.length>0);

    });
    console.log("pathsWithClusters");
    console.log(pathsWithClusters);

*/

/*
    console.log("------------------");
    testLinks=["http://html/futurator.ru/web/images/pi.jpg", "http://html/futurator.ru/web/images/pi1.jpg", "http://html/futurator.ru/web/images/pi2.jpg", "http://html/futurator.ru/web/images/pi3.jpg"]
    console.log(findUriClusters(testLinks));
    */