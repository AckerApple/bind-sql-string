# bind-sql-string

Helpful functionality to convert a query string, that has name/value bindings, into a query string better suited for your individual database engine.

### Table of Contents
- [History](#history)
- [Examples](#examples)
    - [Example String and Binding Array](#example-string-and-binding-array)
    - [Example String Return](#example-string-return)
- [Auto String Binding](#auto-string-binding)

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
    AND    st.SomeInColumn IN (:someStringValue,'B','C')
    AND    st.SomeOtherColumn = 2+:someStringValue
    AND    st.SomeStringArg = 'keep this '':binding'''
    AND    st.SomeStringColumn IN (:multipleValues)
`;

const bindings = {
    someNumberValue:  1,
    someStringValue:  "He's got value",
    startDate: Date.now(),
    endDate: Date.now(),
    multipleValues: ["A", "B", "C"]
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
        AND    st.SomeInColumn IN (?,'B','C')
        AND    st.SomeOtherColumn = 2+?
        AND    st.SomeStringArg = 'keep this '':binding'''
        AND    st.SomeStringColumn IN (?,?,?)
    `,
    parameters:[
      1, // someNumberValue
      'He\'s got value', // someStringValue
      1579032023955, // startDate
      1579032023955, // endDate
      1, // someNumberValue
      'He\'s got value', // someStringValue
      'He\'s got value', // someStringValue
      'A', 'B', 'C'
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
    WHERE  st.SomeNumberColumn > :someNumberValue
    AND    st.SomeStringColumn = :someStringValue
    AND    st.SomeDate BETWEEN :startDate AND :endDate
    AND    st.SomeOtherColumn < :someNumberValue
    AND    st.SomeStringColumn IN (:multipleValues)
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
AND    st.SomeStringColumn IN ('A','B','C')
```

## Auto String Binding
This library can hoist all query string variables (aka query string literals) into binded parameters

```
const setup = queryBind(sql, bindings, {autoBindStrings: true});
```

Benefits to Auto String Binding
- You can use this library with code that has ZERO query binding parameters and get:
    - Instantly you will have full SQL injection protection
    - Instantly your database will better be able to cache query execution plans better
        - Only applies to sql queries with only string values that would change
- WARN: Since all strings are auto casted to binding parameters some wierd things could happen:
    - Database engine and/or connectors could have problems with string lengths
    - Database engine and/or connectors could have datatype casting issues
    - Developers may not know of auto string hoisting and become confused during debugging
