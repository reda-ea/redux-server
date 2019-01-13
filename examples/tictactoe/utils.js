
var _ = require('lodash');

// functional object manipulation

module.exports.set = function(state, path, value) {
    return _.setWith(_.clone(state), path, value, _.clone);
};

module.exports.push = function(state, path, value) {
    var arr = _.get(state, path);
    if(!_.isArray(arr))
        return state;
    var newarr = _.concat(arr, [value]);
    return module.exports.set(state, path, newarr);
};

module.exports.pull = function(state, path, index) {
    var arr = _.get(state, path);
    if(!_.isArray(arr))
        return state;
    var newarr = _.filter(arr, function(v, i) {
        return i != index;
    });
    return module.exports.set(state, path, newarr);
};

module.exports.delete = function(state, path) {
    var parentpath = _.initial(_.toPath(path));
    var childpath = _.last(_.toPath(path));
    var obj = _.get(state, parentpath);
    if(_.isArray(obj))
        return module.exports.pull(state, parentpath, childpath);
    var newobj = _.omit(obj, childpath);
    return module.exports.set(state, parentpath, newobj);
};

// tests
if(require.main === module) {
    var obj = {
        "glossary": {
            "title": "example glossary",
    		"GlossDiv": {
                "title": "S",
    			"GlossList": [{
                    "GlossEntry": {
                        "ID": "SGML",
    					"SortAs": "SGML",
    					"GlossTerm": "Standard Generalized Markup Language",
    					"Acronym": "SGML",
    					"Abbrev": "ISO 8879:1986",
    					"GlossDef": {
                            "para": "A meta-markup language, used to create markup languages such as DocBook.",
    						"GlossSeeAlso": ["GML", "XML"]
                        },
    					"GlossSee": "markup"
    }}]}}};

    var _logcmp = function(newobj, compares) {
        console.log(JSON.stringify(newobj));
        compares.forEach(function(path) {
            console.log(
                '    ',
                path,
                _.get(obj, path) == _.get(newobj, path)
            );
        });
        console.log('----------------------------------------------');
    };
    var fn = module.exports;

    _logcmp(fn.set(obj, 'glossary.GlossDiv.title', 'T'), [
        'glossary.GlossDiv', // false
        'glossary.GlossDiv.title', // false
        'glossary.GlossDiv.GlossList', // true
    ]);

    _logcmp(fn.set(obj, 'glossary.GlossDiv.GlossList[0].GlossEntry', null), [
        'glossary.GlossDiv.title', // true
        'glossary.GlossDiv.GlossList', // false
    ]);

    _logcmp(fn.push(obj, 'glossary.GlossDiv.GlossList', {GlossEntry:{ID:'NONE'}}), [
        'glossary.GlossDiv', // false
        'glossary.GlossDiv.GlossList', // false
        'glossary.GlossDiv.GlossList[0]', // true
    ]);

    _logcmp(fn.pull(obj, 'glossary.GlossDiv.GlossList[0].GlossEntry.GlossDef.GlossSeeAlso', 0), [
        'glossary.GlossDiv.GlossList[0].GlossEntry.GlossDef.GlossSeeAlso', // false
        'glossary.GlossDiv.GlossList[0].GlossEntry.GlossDef.GlossSeeAlso[0]', // false
        'glossary.GlossDiv.GlossList[0].GlossEntry.GlossDef.GlossSeeAlso[1]', // false
        'glossary.GlossDiv.GlossList[0].GlossEntry.GlossDef.para', // true
    ]);

    _logcmp(fn.delete(obj, 'glossary.GlossDiv.GlossList[0].GlossEntry.GlossDef'), [
        'glossary.GlossDiv.GlossList[0].GlossEntry', // false
        'glossary.GlossDiv.GlossList[0].GlossEntry.GlossTerm', // true
    ]);

    _logcmp(fn.delete(obj, 'glossary.GlossDiv.GlossList[0].GlossEntry.GlossDef.GlossSeeAlso[0]'), [
        'glossary.GlossDiv.GlossList[0].GlossEntry.GlossDef.GlossSeeAlso', // false
        'glossary.GlossDiv.GlossList[0].GlossEntry.GlossDef.GlossSeeAlso[0]', // false
        'glossary.GlossDiv.GlossList[0].GlossEntry.GlossDef.GlossSeeAlso[1]', // false
        'glossary.GlossDiv.GlossList[0].GlossEntry.GlossDef.para', // true
    ]);
}
