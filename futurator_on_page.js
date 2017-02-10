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
  window.linkClusters = findUriClusters([].slice.call(document.links).map(a=>a.href));
  var imgClusters = findUriClusters([].slice.call(document.images).map(img=>img.src));
  
 // console.log("Links:");
 // linkClusters.forEach(clust => console.log(clust.toString()));
 // console.log("Images:");
  //imgClusters.forEach(clust => console.log(clust.toString()));
}

clusterize();