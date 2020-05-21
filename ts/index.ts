declare const console: any;
export default queryBind;

interface INameValuePairs {
    [index: string]: boolean|string|number|baseType[];
}

type baseType = boolean|string|number;

interface INamedParameterizedSql {
    sql: string;
    parameters: INameValuePairs;
}

interface IBindOptions {
    autoBindStrings?: boolean;
}

interface IDb2ParameterizedSql {
    sql: string;
    parameters: (boolean|string|number)[];
    valuesObject: any;
}

export function queryBind(
    queryString: string,
    nameValuePairs: INameValuePairs,
    options?: IBindOptions
): IDb2ParameterizedSql {
    return getParameterizedSql({sql: queryString, parameters: nameValuePairs}, options);
}
export function queryBindToString(
    queryString: string,
    nameValuePairs: INameValuePairs,
    options: { quoteEscaper: string } = {quoteEscaper: "''"}
): string {
    const returnVal = queryBind(queryString, nameValuePairs);
    for (const param of returnVal.parameters) {
        const newParam = sqlStringParam(param, options);
        returnVal.sql = sqlStringInjectParam(returnVal.sql, newParam);
    }
    return returnVal.sql;
}

function sqlStringParam(
    param: baseType | baseType[],
    options: { quoteEscaper: string } = {quoteEscaper: "''"}
) {
    if (typeof(param) === "string") {
        return stringParam(param, options);
    }

    return param;
}

function stringParam(
    param: string,
    {quoteEscaper}: { quoteEscaper: string } = {quoteEscaper: "''"}
) {
    return "'" + param.replace(/'/g, quoteEscaper) + "'";
}

const sqlParamRegexp: RegExp = /([\s(=><,])(\?)([\s)]*)/;
const sqlParamReg = new RegExp(sqlParamRegexp, "im");
function sqlStringInjectParam(
    sql: string,
    param: baseType | baseType[]
): string {
    return sql.replace(
        sqlParamReg,
        "$1" + (param as string) + "$3"
    );
}

const baseQuoteVarName = "_quotedReplacement_";
const quoteRegEx = "('([^']|'')*')";
const bindRegString = "(?!([\s(,=><]){1})(:[a-z0-9_]*)(?=[\s,)]*)";
const regexp: RegExp = new RegExp(bindRegString, "gi"); // gim;
const quoteReg = new RegExp(quoteRegEx, "g");

function getParameterizedSql(
    original: INamedParameterizedSql,
    {autoBindStrings}: IBindOptions = {autoBindStrings: false}
): IDb2ParameterizedSql {
    const returnVal: IDb2ParameterizedSql = {
        sql: original.sql,
        parameters: [],
        valuesObject: original.parameters
    };

    // all existing strings to parameters regardless of setting
    const quoteMatches = returnVal.sql.match(quoteReg);
    const quoteValues: {[index: string]: any} = {};
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
            const matchedName: string = match.trim().substr(1, match.length);
            const param = returnVal.valuesObject[matchedName];
            
            if (param === undefined) {
                throw new Error("Parameter not found: '" + matchedName + "'. Available: " + Object.keys(returnVal.valuesObject));
            } else {
                if (!autoBindStrings && quoteValueKeys.indexOf(matchedName) >= 0) {
                    continue; // dont add to list of parameters as this will be removed
                }
                
                if (Array.isArray(param)) {
                    returnVal.parameters.push(...param);
                } else {
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
        } else {
            const keyNameFind = ":" + keyName + "(\\s|[^a-zA-Z]|$)";
            const keyNameReg = new RegExp(keyNameFind, "g");

            if (!autoBindStrings && keyName.substring(0, baseQuoteVarName.length) === baseQuoteVarName) {
                delete original.parameters[keyName];
                returnVal.sql = returnVal.sql.replace(keyNameReg, "'" + quoteValues[keyName] + "'$1");
                continue; // no string auto hoisting as parameter which also mean don't continue to ? replacements
            }

            const replaceValue = Array.isArray(param) ?
                ("?".repeat([...param].length)).split("").join(",") :
                "?";

            returnVal.sql = returnVal.sql.replace(
                keyNameReg, replaceValue + "$1"
            );
        }
    }

    return returnVal;
}
