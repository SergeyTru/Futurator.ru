// Purpose of this function is to convert following keys values of "S" object to lowercase
// eVar1.. eVar100
//prop1.. prop100
//s.channel
//s.server
//s.PageName
function ConvertS_ObjectValuesToLowerCase() {

    for (var i = 0; i < 100; i++) {
        var eVarKey = "eVar" + i;
        var propKey = "prop" + i;
        if (typeof s[eVarKey] !== 'undefined' && s[eVarKey]) {            
            s[eVarKey] = s[eVarKey].toString().toLowerCase();            
        }
        if (typeof s[propKey] !== 'undefined' && s[propKey]) {           
            s[propKey] = s[propKey].toString().toLowerCase();          
        }
    }

    if (typeof s['channel'] !== 'undefined' && s['channel']) {
        s['channel'] = s['channel'].toString().toLowerCase();
    }
    if (typeof s['server'] !== 'undefined' && s['server']) {
        s['server'] = s['server'].toString().toLowerCase();
    }
    if (typeof s['pageName'] !== 'undefined' && s['pageName']) {
        s['pageName'] = s['pageName'].toString().toLowerCase();
    }
    if (typeof s['products'] !== 'undefined' && s['products']) {
        s['products'] = s['products'].toString().toLowerCase();
    }
    if (typeof s['hier1'] !== 'undefined' && s['hier1']) {
        s['hier1'] = s['hier1'].toString().toLowerCase();
    }
}