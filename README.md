# bind-sql-string

Helpful functionality to convert a query string, that has name/value bindings, into a query string better suited for your individual database engine.

## History
This code was born out of [ibm_db](https://www.npmjs.com/package/ibm_db) not supporting named value binding parameters. It seems to only support positional question mark bindings.

## Examples

### Example String and Binding Array

Replace all named bindings with question marks. Most database engines support binding variables by an array. Not all support named value bindings. Use this function with a database engine that supports linear variable bindings

```js
import queryBind from "bind-sql-string";

const sql = `
    SELECT *
    FROM   SomeTable st
    WHERE  st.SomeNumberColumn > :someNumberValue
    AND    st.SomeStringColumn = :someStringValue
    AND    st.SomeDate BETWEEN :startDate AND :endDate 
    AND    st.SomeOtherColumn<:someNumberValue
    AND    st.SomInColumn IN (:someStringValue,'B','C')
    AND    st.SomeOtherColumn = 2+:someStringValue
    AND    st.SomeStringArg = 'keep this '':binding'''
`;

const bindings = {
    someNumberValue:  1,
    someStringValue:  "He's got value",
    startDate: Date.now(),
    endDate: Date.now()
};

const setup = queryBind(sql, bindings);

// RESULT: {sql: string, parameters: any[]}

{
    sql: `
        SELECT *
        FROM   SomeTable st
        WHERE  st.SomeNumberColumn > ?
        AND    st.SomeStringColumn = ?
        AND    st.SomeDate BETWEEN ? AND ? 
        AND    st.SomeOtherColumn<?
        AND    st.SomInColumn IN (?,?,?)
        AND    st.SomeOtherColumn = 2+?
        AND    st.SomeStringArg = ?
    `,
    parameters:[
      1, // someNumberValue
      'He\'s got value', // someStringValue
      1579032023955, // startDate
      1579032023955, // endDate
      1, // someNumberValue
      'He\'s got value', // someStringValue
      'B', // quotedReplacement_0
      'C', // quotedReplacement_1
      'He\'s got value', // someStringValue
      'keep this \'\':binding\'\'' // quotedReplacement_2
    ]
}
```

### Example String Return

Replace all named bindings with inline values. If you cannot bind variables at all in your query, use this function to at least support the syntax of name/value binding

```js
import { queryBindToString } from "bind-sql-string";

const sql = `
    SELECT *
    FROM   SomeTable st
    WHERE  st.SomeNumberColumn > @someNumberValue
    AND    st.SomeStringColumn = @someStringValue
    AND    st.SomeDate BETWEEN @startDate AND @endDate
    AND    st.SomeOtherColumn < @someNumberValue
`;

const bindings = {
    someNumberValue:  1,
    someStringValue:  "He's got value",
    startDate: Date.now(),
    endDate: Date.now()
};

const setup = queryBindToString(sql, bindings, {quoteEscaper:"''"});

// RESULT: string

SELECT *
FROM   SomeTable st
WHERE  st.SomeNumberColumn > 1
AND    st.SomeStringColumn = 'He''s got value'
AND    st.SomeDate BETWEEN 1576258452153 AND 1576258452153
AND    st.SomeOtherColumn < 1 
```
