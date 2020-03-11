"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = queryBind;
function queryBind(string, nameValuePairs, options) {
    return getParameterizedSql({ sql: string, parameters: nameValuePairs }, options);
}
exports.queryBind = queryBind;
function queryBindToString(string, nameValuePairs, options = { quoteEscaper: "''" }) {
    const returnVal = queryBind(string, nameValuePairs);
    returnVal.parameters.forEach((param) => {
        const newParam = sqlStringParam(param, options);
        returnVal.sql = sqlStringInjectParam(returnVal.sql, newParam);
    });
    return returnVal.sql;
}
exports.queryBindToString = queryBindToString;
function sqlStringParam(param, options = { quoteEscaper: "''" }) {
    let newParam = ` ${param} `;
    if (typeof (param) === "string") {
        newParam = stringParam(param, options);
    }
    return newParam;
}
function stringParam(param, { quoteEscaper } = { quoteEscaper: "''" }) {
    param = param.replace(/'/g, quoteEscaper);
    return `'${param}'`;
}
const sqlParamRegexp = /([\s(=><,])(\?)([\s)]*)/;
function sqlStringInjectParam(sql, param) {
    return sql.replace(new RegExp(sqlParamRegexp, "im"), "$1" + param + "$3");
}
function getParameterizedSql(original, { autoBindStrings } = { autoBindStrings: true }) {
    const quoteRegEx = "('([^']|'')*')";
    const bindRegString = "(?!([\s(,=><]){1})([\x3A\x24\x40][a-z0-9_]*)(?=[\s,)]*)";
    const regexp = new RegExp(bindRegString, 'gi');
    const returnVal = {
        sql: original.sql,
        parameters: [],
        valuesObject: original.parameters
    };
    const quoteMatches = returnVal.sql.match(new RegExp(quoteRegEx, 'g'));
    const quoteValues = {};
    if (quoteMatches) {
        quoteMatches.forEach((match, index) => {
            const name = "_quotedReplacement_" + index;
            original.parameters[name] = match.substring(1, match.length).substring(0, match.length - 2);
            quoteValues[name] = original.parameters[name];
            returnVal.sql = returnVal.sql.replace(match, ":" + name);
        });
    }
    const bindMatches = returnVal.sql.match(regexp);
    if (bindMatches) {
        bindMatches.forEach((match) => {
            const matchedName = match.trim().substr(1, match.length);
            const param = getParamValue(matchedName, original.parameters);
            if (param === undefined) {
                throw new Error("Parameter not found: '" + matchedName + "'. Available: " + Object.keys(original.parameters));
            }
            else {
                if (Array.isArray(param.value)) {
                    param.value.forEach(p => returnVal.parameters.push(p));
                }
                else {
                    returnVal.parameters.push(param.value);
                }
            }
        });
    }
    const keys = [...Object.keys(original.parameters)];
    keys.forEach(keyName => {
        const param = getParamValue(keyName, original.parameters);
        if (param === undefined) {
            throw new Error("Parameter not found: '" + keyName + "'. Available: " + Object.keys(original.parameters));
        }
        else {
            const replaceValue = Array.isArray(param.value) ?
                ("?".repeat([...param.value].length)).split('').join(",") :
                "?";
            returnVal.sql = returnVal.sql.replace(new RegExp("[\x3A\x24\x40]" + keyName, "g"), replaceValue);
        }
    });
    if (!autoBindStrings) {
        Object.keys(quoteValues).forEach((key) => {
            returnVal.sql.replace(key, quoteValues[key]);
        });
    }
    return returnVal;
}
function getParamValue(name, parameters) {
    for (let keyName in parameters) {
        if (keyName === name) {
            return { value: parameters[keyName] };
        }
    }
}
//# sourceMappingURL=index.js.map