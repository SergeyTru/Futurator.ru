function sortUnique(arr, equality) {
    if (!equality) {
      equality = function(a, b) { return a === b; };
    }

    //http://stackoverflow.com/a/4833835
    if (arr.length === 0) return arr;
    arr = arr.sort();
    let ret = [arr[0]];
    for (var i = 1; i < arr.length; i++) { // start loop at 1 as element 0 can never be a duplicate
        if (!equality(arr[i-1], arr[i])) {
            ret.push(arr[i]);
        }
    }
    return ret;
}

function findUriClusters(links) {
  let refs = sortUnique(links).map(a=>new URI(a));
  let clusters = [];
  for (let i = refs.length - 1; i > 0; --i)
    for (let j = i - 1; j >= 0; --j) {
      let cluster = templateForUris(refs[i], refs[j]);
      if (cluster) {
        clusters.push(cluster);
      }
    }
  return sortUnique(clusters, UriTemplate.equals);
}

function getCSSPath(elem, withClasses) {
  //http://stackoverflow.com/questions/1648412/how-to-generate-css-path-with-javascript-or-jquery
  if (elem.id) {
    return elem.id.split(' ').filter(x => x.length > 0).map(x => '#' + x).join('');
  }

  if (elem.tagName == "BODY") {
    return '';
  }

  let path = getCSSPath(elem.parentNode) + ' ' + elem.tagName;
  if (withClasses && elem.className)
    path = path + ' ' + elem.tagName + elem.className.split(' ').filter(x => x.length > 0).map(x => '.' + x).join('');

  return path;
}

/** DomPath from stackoverflow http://stackoverflow.com/a/16742828 */
function getDomPath(el) {
    if (!el) {
        return false;
    }
    let stack = [];
    while (el.parentNode !== null) {
        let nodeName = el.nodeName.toLowerCase();
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

/** Convert objects in array to map
    Example:
      data = [{"name": "Chris", "surname": "Doe"}, {"name": "Chris", "surname": "Ronnov"}, {"name": "Homer", "surname": "Simpson"}]
      keyFunction = obj=>obj.name
      dataFunction = obj=>obj.surname
      result object: {"Chris": ["Doe", "Ronnov"], "Homer": ["Simpson"]}
 */
function groupByKey(data, keyFunction, dataFunction) {
  if (keyFunction === undefined) {
    keyFunction = any => any;
  }
  if (dataFunction === undefined) {
    dataFunction = any => any;
  }
  resultObject = {};
  data.forEach(item => {
    pushProperty(resultObject, keyFunction(item), dataFunction(item));
  });
  return resultObject;
}

function pushProperty(obj, key, value) {
    if (key in resultObject) {
        obj[key].push(value);
    } else {
        obj[key] = [value];
    }
}

function getUrlWithoutHash(href) {
    let idx = href.indexOf('#');
    return (idx >= 0 ? href.slice(0, idx) : href);
}

function getRootNodes(nodes) {
  if (nodes.length < 2) {
    throw "getRootNodes requires at least 2 nodes";
  }
  //nodes should have same depth
  let parents = nodes.map(x => ({node: x.node.parentNode, url: x.url, path: x.path}));
  for (let i = parents.length - 1; i > 0; --i) {
    for (let j = i - 1; j >= 0; --j) {
      if (parents[i].node === parents[j].node && parents[i].url !== parents[j].url) {
        return nodes;
      }
    }
  }
  return getRootNodes(parents);
}

function findCardsRoots() {
  let anchorInfos = [].slice.call(document.links)
      .map(a => ({ node: a, url: getUrlWithoutHash(a.href), path: getDomPath(a) }))
      .filter( x => x.url.length > 0 );
  let anchorsByPath = groupByKey(anchorInfos, a => a.path);
  let roots = [];
  for (key in anchorsByPath) {
    let clusters = findUriClusters(anchorsByPath[key].map(awi => awi.url));
    clusters.forEach(cluster => {
        let expr = '^' + cluster.toRegexp() + "$";
        let nodesByCluster = anchorsByPath[key].filter(awi => awi.url.match(expr));
        if (nodesByCluster.length > 1) {
          let rootNodes = getRootNodes(nodesByCluster);
          roots.push(rootNodes.map(x => x.node));
        } else {
          console.log("Cluster " + cluster + " lost nodes");
        }
    });
  }
  return roots;
}

function arrayIncludes(bigArray, smallArray) {
  return !smallArray.some(sm => !bigArray.some(bg => sm === bg));
}

function haveSame(array, elem, tillIndex) {
  let idx = tillIndex;
  while (--idx >= 0) {
    if (elem.length == array[idx].length && arrayIncludes(elem, array[idx])) {
      return true;
    }
  }
  return false;
}

function includesInOther(array, elem, idxToExclude) {
  return array.find((other, idx) =>
      idxToExclude != idx &&
      other.length > elem.length &&
      arrayIncludes(other, elem)
    ) != null;
}

function sizeOfList(roots) {
  return roots
    .map(item => item.offsetWidth * item.offsetHeight)
    .reduce((a, b) => a+b, 0);
}

function findListsInPage() {
  let roots = findCardsRoots();
  console.log(roots);
  //remove duplicates and sublists
  roots = roots.filter((root, idx) => !haveSame(roots, root, idx) && !includesInOther(roots, root, idx));
  console.log(roots);
  console.log(roots.map(x => sizeOfList(x)));
  roots = roots
       .map(list => ({"list": list, "square": sizeOfList(list)}))
       .sort((a, b) => b.square - a.square)
       .map(shell => shell.list);
  // roots.sort((a,b) => sizeOfList(b) - sizeOfList(a));
  console.log(roots);
  roots.forEach((root, idx) =>
    root.forEach(el =>
      el.className += (" f_list_" + idx)
    )
  );
}

findListsInPage();
