"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = queryBind;
function queryBind(queryString, nameValuePairs, options) {
    return getParameterizedSql({ sql: queryString, parameters: nameValuePairs }, options);
}
exports.queryBind = queryBind;
function queryBindToString(queryString, nameValuePairs, options = { quoteEscaper: "''" }) {
    const returnVal = queryBind(queryString, nameValuePairs);
    for (const param of returnVal.parameters) {
        const newParam = sqlStringParam(param, options);
        returnVal.sql = sqlStringInjectParam(returnVal.sql, newParam);
    }
    return returnVal.sql;
}
exports.queryBindToString = queryBindToString;
function sqlStringParam(param, options = { quoteEscaper: "''" }) {
    if (typeof (param) === "string") {
        return stringParam(param, options);
    }
    return param;
}
function stringParam(param, { quoteEscaper } = { quoteEscaper: "''" }) {
    return "'" + param.replace(/'/g, quoteEscaper) + "'";
}
const sqlParamRegexp = /([\s(=><,])(\?)([\s)]*)/;
const sqlParamReg = new RegExp(sqlParamRegexp, "im");
function sqlStringInjectParam(sql, param) {
    return sql.replace(sqlParamReg, "$1" + param + "$3");
}
const baseQuoteVarName = "_quotedReplacement_";
const quoteRegEx = "('([^']|'')*')";
const bindRegString = "(?!([\s(,=><]){1})(:[a-z0-9_]*)(?=[\s,)]*)";
const regexp = new RegExp(bindRegString, "gi");
const quoteReg = new RegExp(quoteRegEx, "g");
function getParameterizedSql(original, { autoBindStrings } = { autoBindStrings: false }) {
    const returnVal = {
        sql: original.sql,
        parameters: [],
        valuesObject: original.parameters
    };
    const quoteMatches = returnVal.sql.match(quoteReg);
    const quoteValues = {};
    if (quoteMatches) {
        for (let index = quoteMatches.length - 1; index >= 0; --index) {
            const match = quoteMatches[index];
            const name = baseQuoteVarName + index;
            returnVal.valuesObject[name] = match.substring(1, match.length).substring(0, match.length - 2);
            quoteValues[name] = returnVal.valuesObject[name];
            returnVal.sql = returnVal.sql.replace(match, ":" + name);
        }
    }
    const bindMatches = returnVal.sql.match(regexp);
    if (bindMatches) {
        const quoteValueKeys = Object.keys(quoteValues);
        for (const match of bindMatches) {
            const matchedName = match.trim().substr(1, match.length);
            const param = returnVal.valuesObject[matchedName];
            if (param === undefined) {
                throw new Error("Parameter not found: '" + matchedName + "'. Available: " + Object.keys(returnVal.valuesObject));
            }
            else {
                if (!autoBindStrings && quoteValueKeys.indexOf(matchedName) >= 0) {
                    continue;
                }
                if (Array.isArray(param)) {
                    returnVal.parameters.push(...param);
                }
                else {
                    returnVal.parameters.push(param);
                }
            }
        }
    }
    const keys = Object.keys(returnVal.valuesObject);
    for (const keyName of keys) {
        const param = returnVal.valuesObject[keyName];
        if (param === undefined) {
            throw new Error("Parameter not found: '" + keyName + "'. Available: " + Object.keys(returnVal.valuesObject));
        }
        else {
            const keyNameFind = ":" + keyName + "(\\s|[^a-zA-Z]|$)";
            const keyNameReg = new RegExp(keyNameFind, "g");
            if (!autoBindStrings && keyName.substring(0, baseQuoteVarName.length) === baseQuoteVarName) {
                delete original.parameters[keyName];
                returnVal.sql = returnVal.sql.replace(keyNameReg, "'" + quoteValues[keyName] + "'$1");
                continue;
            }
            const replaceValue = Array.isArray(param) ?
                ("?".repeat([...param].length)).split("").join(",") :
                "?";
            returnVal.sql = returnVal.sql.replace(keyNameReg, replaceValue + "$1");
        }
    }
    return returnVal;
}
//# sourceMappingURL=index.js.map