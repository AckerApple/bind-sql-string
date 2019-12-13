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
        AND    st.SomeOtherColumn < :someNumberValue
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
    });
    it("#queryBind", () => {
        const setup = index_1.queryBind(sql, bindings);
        expect(setup).toBeDefined();
        expect(typeof (setup)).toBe("object");
        expect(setup.sql).toBeDefined();
        expect(setup.parameters).toBeDefined();
    });
});
