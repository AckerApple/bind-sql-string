declare const console: any;
export default queryBind;

interface INameValuePairs {
    [index:string]: boolean|string|number|baseType[]
}

type baseType = boolean|string|number;

interface NamedParameterizedSql {
    sql: string;
    parameters: INameValuePairs;
}

interface IBindOptions {
    autoBindStrings?: boolean
}

interface Db2ParameterizedSql {
    sql: string;
    parameters: (boolean|string|number)[];
    valuesObject: any
}

export function queryBind(
    string: string,
    nameValuePairs: INameValuePairs,
    options?: IBindOptions
): Db2ParameterizedSql {
    return getParameterizedSql({sql: string, parameters: nameValuePairs}, options);
}
export function queryBindToString(
    string: string,
    nameValuePairs: INameValuePairs,
    options: { quoteEscaper:string } = {quoteEscaper: "''"}
): string {
    const returnVal = queryBind(string, nameValuePairs);
    returnVal.parameters.forEach((param) => {
        const newParam = sqlStringParam(param, options);
        returnVal.sql = sqlStringInjectParam(returnVal.sql, newParam);
    });
    return returnVal.sql;
}

function sqlStringParam(
    param: baseType | baseType[],
    options: { quoteEscaper:string } = {quoteEscaper: "''"}
) {
    let newParam = ` ${param} `;

    if (typeof(param) === "string") {
        newParam = stringParam(param, options);
    }

    return newParam;
}

function stringParam(
    param: string,
    {quoteEscaper}: { quoteEscaper:string } = {quoteEscaper: "''"}
) {
    param = param.replace(/'/g, quoteEscaper)
    return `'${param}'`;
}

const sqlParamRegexp: RegExp = /([\s(=><,])(\?)([\s)]*)/;
function sqlStringInjectParam(
    sql: string,
    param: baseType | baseType[]
): string {
    return sql.replace(
        new RegExp(sqlParamRegexp, "im"),
        "$1" + (param as string) + "$3"
    );
}

const baseQuoteVarName = "_quotedReplacement_";
function getParameterizedSql(
    original: NamedParameterizedSql,
    {autoBindStrings}: IBindOptions = {autoBindStrings: true}
): Db2ParameterizedSql {
    const quoteRegEx = "('([^']|'')*')";
    const bindRegString = "(?!([\s(,=><]){1})([\x3A\x24\x40][a-z0-9_]*)(?=[\s,)]*)";
    const regexp: RegExp = new RegExp(bindRegString, 'gi')//gim;

    const returnVal: Db2ParameterizedSql = {
        sql: original.sql,
        parameters: [],
        valuesObject: original.parameters
    };

    // all existing strings to parameters regardless of setting
    const quoteMatches = returnVal.sql.match(new RegExp(quoteRegEx, 'g'));
    const quoteValues: {[index: string]: any} = {};
    if (quoteMatches) {
        quoteMatches.forEach((match, index: number) => {
            const name = baseQuoteVarName + index;
            returnVal.valuesObject[name] = match.substring(1, match.length).substring(0, match.length - 2);
            quoteValues[name] = returnVal.valuesObject[name];
            returnVal.sql = returnVal.sql.replace(match, ":" + name);
        });
    }

    const bindMatches = returnVal.sql.match(regexp);
    if (bindMatches) {
        bindMatches.forEach((match) => {
            const matchedName: string = match.trim().substr(1, match.length);
            const param = getParamValue(matchedName, returnVal.valuesObject);
            
            if (param === undefined) {
                throw new Error("Parameter not found: '" + matchedName + "'. Available: " + Object.keys(returnVal.valuesObject));
            } else {
                if(!autoBindStrings && Object.keys(quoteValues).includes(matchedName)) {
                    return; // dont add to list of parameters as this will be removed
                }
                
                if (Array.isArray(param.value)) {
                    param.value.forEach(p => returnVal.parameters.push(p));
                } else {
                    returnVal.parameters.push(param.value);
                }
            }
        });
    }

    Object.keys(returnVal.valuesObject).forEach((keyName) => {
        const param = getParamValue(keyName, returnVal.valuesObject);
        if (param === undefined) {
            throw new Error("Parameter not found: '" + keyName + "'. Available: " + Object.keys(returnVal.valuesObject));
        } else {
            if(!autoBindStrings && keyName.substring(0, baseQuoteVarName.length) === baseQuoteVarName) {
                delete original.parameters[keyName];
                returnVal.sql = returnVal.sql.replace(":" + keyName, "'" + quoteValues[keyName]+ "'");
                return; // no string auto hoisting as parameter which also mean don't continue to ? replacements
            }

            const replaceValue = Array.isArray(param.value) ?
                ("?".repeat([...param.value].length)).split('').join(",") :
                "?";
            returnVal.sql = returnVal.sql.replace(
                new RegExp(":" + keyName, "g"), replaceValue
            );
        }
    });

    return returnVal;
}

function getParamValue(
    name: string,
    parameters: INameValuePairs
): {value: string | boolean | number | baseType[] } | void {
    for(let keyName in parameters){
        if (keyName === name) {
            return { value: parameters[keyName] };
        }
    }
}
