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
    const regexp = /[\s(=><]([\x3A\x24\x40][a-z0-9]*)[\s)]*/gim;
    const returnVal = {
        sql: original.sql,
        parameters: []
    };
    const matches = original.sql.match(regexp);
    if (matches) {
        matches.forEach((match) => {
            const matchedName = match.trim().substr(1, match.length);
            const param = getParamValue(matchedName, original.parameters);
            if (param === undefined) {
                throw new Error("Parameter not found.");
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
