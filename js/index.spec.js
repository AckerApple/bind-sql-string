"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
describe("bind-sql-string", () => {
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
        someNumberValue: 1,
        someStringValue: "He's got value",
        startDate: Date.now(),
        endDate: Date.now()
    };
    it("#queryBindToString", () => {
        const string = index_1.queryBindToString(sql, bindings, { quoteEscaper: "''" });
        expect(string).toBeDefined();
        expect(typeof (string)).toBe("string");
        expect(string.includes("keep this :binding")).toBe(false);
    });
    it("#queryBind", () => {
        const setup = index_1.queryBind(sql, bindings);
        expect(setup).toBeDefined();
        expect(typeof (setup)).toBe("object");
        expect(setup.sql).toBeDefined();
        expect(setup.parameters).toBeDefined();
        expect(setup.parameters.length).toBe(10);
        expect(setup.sql.indexOf(':')).toBe(-1);
        expect(setup.valuesObject.quotedReplacement_0).toBeDefined();
        expect(setup.valuesObject.quotedReplacement_0).toBe("B");
        expect(setup.valuesObject.quotedReplacement_1).toBeDefined();
        expect(setup.valuesObject.quotedReplacement_1).toBe("C");
        expect(setup.valuesObject.quotedReplacement_2).toBeDefined();
        expect(setup.valuesObject.quotedReplacement_2).toBe("keep this '':binding''");
    });
});

describe("bind-sql-string-to-array", () => {
    const sql = `
        SELECT *
        FROM   SomeTable st
        WHERE st.some = :someNumberValue  
        st.SomeColumn IN (:someArray) 
    `;
    const bindings = {
        someNumberValue: 1,
        someArray: ["A", "B", "C"]
    };
    it("#queryBindArray", () => {
        const setup = index_1.queryBind(sql, bindings);
        expect(setup).toBeDefined();
        expect(setup.parameters.length).toBe(4);
        expect((setup.sql.match(/\?/g) || []).length).toEqual(4);
    });
});
//# sourceMappingURL=index.spec.js.map
