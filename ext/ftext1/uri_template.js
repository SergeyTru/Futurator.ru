/// Generate template by two URL and match other URL by template
//
// Note: this code does not handle escapes like "%DE%DA".
//       You need to handle them before this code

function UriTemplate(protocol, authority, path, params) {
  this.protocol = protocol
  this.authority = authority
  this.path = path
  this.params = params
}

UriTemplate.equals = function(a, b) {
  if (a === b)
    return true;
  if (a == undefined)
    return false;
  return a.protocol == b.protocol && a.authority == b.authority && a.path == b.path && a.params == b.params;
}

UriTemplate.prototype.toString = function() {
  function textOf(x) {
    if (x instanceof Function)
      return x();
    else
      return x;
  }

  var result = "";
  if (this.protocol)
    result += textOf(this.protocol) + ":";
  if (this.authority)
    result += "//" + textOf(this.authority);
  if (this.path)
    result += textOf(this.path);
  if (this.params)
    result += "?" + textOf(this.params);
  return result;
};

UriTemplate.prototype.toRegexp = function() {
  //regexp is not fully functional: js regexp does not handle unicode
  var replacer = function(match, p1, p2) {
    p1 = p1.toUpperCase();
    if (p1 === 'N')
      return "\\d+";
    if (p1 === 'T')
      return "[\\w\\+А-Яа-я" + p2 + "]+";
    if (p1 === '/')
      return "[\\wА-Яа-я/]+";
    if (p1 === '*')
      return ".*";
    throw "Unhandled symbol " + match;
  }

  var result = this.toString()
    .replace(/[.+?^$()|[\]\\]/g, "\\$&")
    .replace(/{(.)([-_]*)}/g, replacer);
  var idx = result.indexOf('?');
  if (idx >= 0)
    return result.slice(0, idx+1) + '(&?' + result.slice(idx+1).split('&').join("|&?") + ')+';
  else
    return result;
}

function arrayIntersection(array1, array2, collectUniques, arraysContainsUniqueValues) {
  var common = [];
  var distinct1 = [];
  var distinct2 = [];
  for (var i = 0; i < array1.length; ++i) {
    var item = array1[i];
    if (array2.indexOf(item) >= 0) {
      if (arraysContainsUniqueValues || common.indexOf(item) < 0)
        common.push(item);
    }
    else if (collectUniques) {
      if (arraysContainsUniqueValues || distinct1.indexOf(item) < 0)
        distinct1.push(item);
    }
  }
  if (collectUniques || common.length < array2.length)
    for (var i = 0; i < array2.length; ++i) {
      if (array1.indexOf(item) >= 0)
        if (arraysContainsUniqueValues || distinct2.indexOf(item) < 0)
          distinct2.push(item);
    }
  return {
    common: common,
    hasDistinct: common.length < array1.length || common.length < array2.length,
    distinct1: distinct1,
    distinct2: distinct2
  };
}

var templateForUris = function(url1, url2) {
  //Urls from https://code.google.com/archive/p/js-uri/

  if (!textEqualsNoCase(url1.getScheme(), url2.getScheme()))
    return;

  function textEqualsNoCase(text1, text2) {
    if (text1 === undefined)
      return text2 === undefined
    else if (text1 === null)
      return text2 === null
    else
      return text2 != undefined && text1.toUpperCase() === text2.toUpperCase();
  }

  var sameForBoth = function(val1, val2, cond, forTrue, forFalse) {
    var res1 = cond(val1);
    var res2 = cond(val2);
    return (res1 && res2)? forTrue : (res1 || res2)? undefined : forFalse;
  }

  function generateVaryText(parts1, parts2) {
    let hasSub = false;
    let hasSlash = false;
    parts1.concat(parts2).forEach(function(part) {
      if (part.includes("-"))
        hasSlash = true;
      if (part.includes("_"))
        hasSub = true;
    });
    let result = "{T";
    if (hasSub)
      result += "_";
    if (hasSlash)
      result += "-";
    return result + "}";
  }

  //init function should give us reversed array
  function merge(text1, text2, initFunction, sideFunction, postFunction) {
    var arr1 = initFunction(text1);
    var arr2 = initFunction(text2);
    if (arr1 === undefined || arr2 === undefined)
      return;

    var rev = sideFunction(arr1, arr2);
    if (rev === undefined)
      return;
    if (!rev.hasUnhandled)
      return rev.result.reverse();

    arr1 = arr1.slice(rev.handled).reverse();
    arr2 = arr2.slice(rev.handled).reverse();
    var dir = sideFunction(arr1, arr2);
    if (dir === undefined)
      return;

    var center = postFunction(arr1.slice(dir.handled), arr2.slice(dir.handled),
      dir.result, rev.result);
    if (center === undefined)
      return;

    return dir.result.concat(center).concat(rev.result.reverse());
  }

  function templateForTextPart(part1, part2) {
    var isNumber = ch => ch >= '0' && ch <= '9';
    var isDivider = ch => ch === '-' || ch === '_' || ch === '.' || ch === '+' || ch === ':';
    var isText = ch => ch.toLowerCase() != ch.toUpperCase();
    var classFor = ch => [isDivider, isNumber, isText].find(cl => cl(ch));

    function splitTextPart(path) {
      if (path.length === 0)
        return;

      var result = [];
      var curStart = 0;
      var curClass = classFor(path.charAt(0));
      for (var i = 1; i < path.length; ++i) {
        if (curClass !== isDivider && curClass(path.charAt(i)))
          continue;
        result.push(path.slice(curStart, i));
        curStart = i;
        curClass = classFor(path.charAt(i));
        if (!curClass)
          return;
      }
      result.push(path.slice(curStart, i));
      return result.reverse();
    }

    function joinTextParts(parts1, parts2) {
      var result = [];
      var actualLen = 0;
      var minLen = Math.min(parts1.length, parts2.length);
      for (var i = 0; i < minLen; ++i) {
        var p1 = parts1[i];
        var p2 = parts2[i];
        var cl = classFor(p1.charAt(0));
        if (cl != classFor(p2.charAt(0)))
          break;

        if (cl === isDivider ||
          p1.toUpperCase() === p2.toUpperCase()) {
          result.push(p1);
          actualLen = result.length;
        }
        else if (cl === isNumber)
          result.push("{N}");
        else if (cl === isText)
          break;
        else
          throw "Unknown class";
      }
      var hasUnhandled = i < parts1.length || i < parts2.length;
      if (hasUnhandled) {
        result = result.slice(0, actualLen);
        i = actualLen;
      }
      return {result: result, handled: i, hasUnhandled: hasUnhandled};
    }

    return merge(part1, part2, splitTextPart, joinTextParts,
      (x, y) => sameForBoth(x, y, item => item.length > 0, [generateVaryText(x, y)], []))
  }

  var auth1 = url1.getAuthority();
  var auth2 = url2.getAuthority();
  //OK if both is null or both without authority
  if (auth1 === null && auth2 === null)
    ;//it's ok
  else if (auth1 !== null && auth1.indexOf('@') < 0 && auth2 !== null && auth2.indexOf('@') < 0)
    ;//it's even better
  else
    return;

  var urlsIsSame = true;
  if (textEqualsNoCase(auth1, auth2)) {
    auth = url1.getAuthority()
  } else {
    auth = (function(auth1, auth2) {
      var ps1 = auth1.indexOf('.');
      var ps2 = auth2.indexOf('.');
      var substr1 = auth1.slice(ps1);
      var substr2 = auth2.slice(ps2);
      //allow subdomain variations (like cdn), but 2nd level domain should be the same
      if (!textEqualsNoCase(substr1, substr2) || 
          substr1.lastIndexOf('.') <= 0 || substr2.lastIndexOf('.') <= 0)
        return;

      var result = templateForTextPart(auth1.slice(0, ps1), auth2.slice(0, ps2));
      if (result != undefined)
        result = result.join("");
      return result + auth1.slice(ps1);
    })(url1.getAuthority(), url2.getAuthority());
    urlsIsSame = false;
  }
  if (auth === undefined)
    return;
  var query;
  if (textEqualsNoCase(url1.getQuery(), url2.getQuery())) {
    query = url1.getQuery()
  } else {
    query = (function(query1, query2) {
      if (query1 == null && query2 == null)
        return query1;
      if (query1 == null || query2 == null)
        return;

      var params1 = URIQuery.fromString(query1).params;
      var params2 = URIQuery.fromString(query2).params;

      var result = "";
      var common = arrayIntersection(Object.keys(params1), Object.keys(params2), false, true);
      var commonParams = common.common;
      var allDistinctIsNums = arr => !arr.some(elem => isNaN(elem));
      for (var i = 0; i < commonParams.length; ++i) {
        var param = commonParams[i];
        var paramText = param.replace(/ /g, "+");
        var commonValues = arrayIntersection(params1[param], params2[param], true, false);
        var commonVals = commonValues.common;
        for (var j = 0; j < commonVals.length; ++j)
          result += "&" + paramText + "=" + commonVals[j].replace(/ /g, "+");
        if (commonValues.hasDistinct) {
          result += "&" + paramText + "=";
          if (allDistinctIsNums(commonValues.distinct1) &&
              allDistinctIsNums(commonValues.distinct2))
            result += "{N}";
          else
            result += "{T}";
        }
      }
      if (common.hasDistinct)
        result += "&{*}";
      if (result.length > 1)
        return result.slice(1);
    })(url1.getQuery(), url2.getQuery());
    urlsIsSame = false;
  }
  if (query === undefined)
    return;

  var path1 = url1.getPath();
  var path2 = url2.getPath();
  if (path1 === null)
    path1 = '/';
  if (path2 === null)
    path2 = '/';
  if (textEqualsNoCase(path1, path2)) {
    if (urlsIsSame)
      return undefined;
    else
      return new UriTemplate(url1.getScheme(), auth, url1.getPath(), query);
  }

  function reversedPathParts(path) {
    if (path.indexOf('{/}') >= 0)
      throw "not implemented for templates"; //invalid path?
    if (path !== null)
      return (path.match(/[^\/]+/g) || []).reverse();
    else
      return [];
  }

  var handleVaryPathPart = function(center1, center2) {
    return sameForBoth(center1, center2, x => x.length > 0, ['{/}'], [generateVaryText(center1, center2)]);
  }

  function templateForPathPart(parts1, parts2) {
    var minLen = Math.min(parts1.length, parts2.length);
    var result = [];
    var diffLen = parts1.length != parts2.length;
    for (var i = 0; i < minLen; ++i) {
      var subRes = templateForTextPart(parts1[i], parts2[i]);
      if (subRes === undefined)
        return;
      if (diffLen)
        if (subRes.length === 1 && subRes[0] === '{T}')
          break;
      if (result.length > 0)
        result.push('/');
      result = result.concat(subRes.reverse());
    }
    return {result: result, handled: i, hasUnhandled: diffLen || i < minLen};
  }

  var pathParts = merge(path1, path2, reversedPathParts, templateForPathPart, handleVaryPathPart);
  if (pathParts === undefined)
    return;
  pathParts = pathParts.join('');
  if (pathParts != '{/}')
    pathParts = '/' + pathParts;
  if (path1.endsWith('/') && path2.endsWith('/'))
    pathParts += '/';
  return new UriTemplate(url1.getScheme(), auth, pathParts, query);
}