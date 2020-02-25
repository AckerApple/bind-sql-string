export default queryBind;

interface INameValuePairs {
    [index:string]: boolean|string|number|baseType[]
}

type baseType = boolean|string|number;

interface NamedParameterizedSql {
    sql: string;
    parameters: INameValuePairs;
}

interface Db2ParameterizedSql {
    sql: string;
    parameters: (boolean|string|number)[];
    valuesObject: any
}

export function queryBind(
    string: string,
    nameValuePairs: INameValuePairs
): Db2ParameterizedSql {
    return getParameterizedSql({sql: string, parameters:nameValuePairs});
}
export function queryBindToString(
    string: string,
    nameValuePairs: INameValuePairs,
    {quoteEscaper}: { quoteEscaper:string } = {quoteEscaper: "''"}
): string {
    const regexp: RegExp = /[\s(=><](\?)[\s)]*/gim;
    const returnVal = queryBind(string, nameValuePairs);
    quoteEscaper = quoteEscaper || "''";

    returnVal.parameters.forEach(param => {
        let newParam = ` ${param} `;
        
        if (typeof(param) === "string") {
          newParam = param.replace(/'/g, quoteEscaper)
          newParam = ` '${newParam}' `;
        }

        returnVal.sql = returnVal.sql.replace(
            new RegExp(regexp, "im"),
            newParam
        );
    });

    return returnVal.sql;
}

function getParameterizedSql(original: NamedParameterizedSql): Db2ParameterizedSql {
    const quoteRegEx = "('([^']|'')*')";
    const bindRegString = "(?!([\s(,=><]){1})([\x3A\x24\x40][a-z0-9_]*)(?=[\s,)]*)";
    const regexp: RegExp = new RegExp(bindRegString, 'gi')//gim;

    const returnVal: Db2ParameterizedSql = {
        sql: original.sql,
        parameters: [],
        valuesObject: original.parameters
    };

    const quoteMatches = returnVal.sql.match(new RegExp(quoteRegEx, 'g'));
    if (quoteMatches) {
        quoteMatches.forEach((match, index: number) => {
            const name = "quotedReplacement_" + index;
            original.parameters[name] = match.substring(1, match.length).substring(0, match.length - 2);
            returnVal.sql = returnVal.sql.replace(match, ":" + name);
        });
    }

    const bindMatches = returnVal.sql.match(regexp);
    if (bindMatches) {
        bindMatches.forEach((match) => {
            const matchedName: string = match.trim().substr(1, match.length);
            const param = getParamValue(matchedName, original.parameters);
            if (param === undefined) {
                throw new Error("Parameter not found: '" + matchedName + "'. Available: " + Object.keys(original.parameters));
            } else {
                if (Array.isArray(param.value)) {
                    param.value.forEach(p => returnVal.parameters.push(p));
                } else {
                    returnVal.parameters.push(param.value);
                }
            }
        });
    }


    const keys: string[] = [...Object.keys(original.parameters)];
    keys.forEach(keyName => {
        const param = getParamValue(keyName, original.parameters);
        if (param === undefined) {
            throw new Error("Parameter not found: '" + keyName + "'. Available: " + Object.keys(original.parameters));
        } else {
            const replaceValue = Array.isArray(param.value) ?
                ("?".repeat([...param.value].length)).split('').join(",") :
                "?";
            returnVal.sql = returnVal.sql.replace(
                new RegExp("[\x3A\x24\x40]" + keyName, "g"), replaceValue
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
