"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = queryBind;
function queryBind(string, nameValuePairs) {
    return getParameterizedSql({ sql: string, parameters: nameValuePairs });
}
exports.queryBind = queryBind;
function queryBindToString(string, nameValuePairs, { quoteEscaper } = { quoteEscaper: "''" }) {
    const regexp = /[\s(=><](\?)[\s)]*/gim;
    const returnVal = queryBind(string, nameValuePairs);
    quoteEscaper = quoteEscaper || "''";
    returnVal.parameters.forEach(param => {
        let newParam = ` ${param} `;
        if (typeof (param) === "string") {
            newParam = param.replace(/'/g, quoteEscaper);
            newParam = ` '${newParam}' `;
        }
        returnVal.sql = returnVal.sql.replace(new RegExp(regexp, "im"), newParam);
    });
    return returnVal.sql;
}
exports.queryBindToString = queryBindToString;
function getParameterizedSql(original) {
    const quoteRegEx = "('([^']|'')*')";
    const bindRegString = "(?!([\s(,=><]){1})([\x3A\x24\x40][a-z0-9_]*)(?=[\s,)]*)";
    const regexp = new RegExp(bindRegString, 'gi');
    const returnVal = {
        sql: original.sql,
        parameters: [],
        valuesObject: original.parameters
    };
    const quoteMatches = returnVal.sql.match(new RegExp(quoteRegEx, 'g'));
    if (quoteMatches) {
        quoteMatches.forEach((match, index) => {
            const name = "quotedReplacement_" + index;
            original.parameters[name] = match.substring(1, match.length).substring(0, match.length - 2);
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
                returnVal.parameters.push(param.value);
            }
        });
    }
    for (let keyName in original.parameters) {
        returnVal.sql = returnVal.sql.replace(new RegExp("[\x3A\x24\x40]" + keyName, "g"), "?");
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
