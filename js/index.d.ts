export default queryBind;
interface INameValuePairs {
    [index: string]: boolean | string | number | baseType[];
}
declare type baseType = boolean | string | number;
interface Db2ParameterizedSql {
    sql: string;
    parameters: (boolean | string | number)[];
    valuesObject: any;
}
export declare function queryBind(string: string, nameValuePairs: INameValuePairs): Db2ParameterizedSql;
export declare function queryBindToString(string: string, nameValuePairs: INameValuePairs, { quoteEscaper }?: {
    quoteEscaper: string;
}): string;
