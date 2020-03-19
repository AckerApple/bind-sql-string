export default queryBind;
interface INameValuePairs {
    [index: string]: boolean | string | number | baseType[];
}
declare type baseType = boolean | string | number;
interface IBindOptions {
    autoBindStrings?: boolean;
}
interface IDb2ParameterizedSql {
    sql: string;
    parameters: (boolean | string | number)[];
    valuesObject: any;
}
export declare function queryBind(queryString: string, nameValuePairs: INameValuePairs, options?: IBindOptions): IDb2ParameterizedSql;
export declare function queryBindToString(queryString: string, nameValuePairs: INameValuePairs, options?: {
    quoteEscaper: string;
}): string;
