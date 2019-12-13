import { queryBindToString, queryBind } from "./index";

describe("bind-sql-string", () => {
    const sql = `
        SELECT *
        FROM   SomeTable st
        WHERE  st.SomeNumberColumn > :someNumberValue
        AND    st.SomeStringColumn = :someStringValue
        AND    st.SomeDate BETWEEN :startDate AND :endDate 
        AND    st.SomeOtherColumn<:someNumberValue
        AND    st.SomInColumn IN (:someStringValue,'B','C')
        AND    st.SomeOtherColumn=2+:someStringValue
    `;

    const bindings = {
        someNumberValue:  1,
        someStringValue:  "He's got value",
        startDate: Date.now(),
        endDate: Date.now()
    };

    it("#queryBindToString", () => {
        const string = queryBindToString(sql, bindings, {quoteEscaper:"''"});
        expect(string).toBeDefined();
        expect(typeof(string)).toBe("string");
    });

    // TODO: need more involved tests
    it("#queryBind", () => {
        const setup = queryBind(sql, bindings);
        expect(setup).toBeDefined();
        expect(typeof(setup)).toBe("object");
        expect(setup.sql).toBeDefined();
        expect(setup.parameters).toBeDefined();
        expect(setup.parameters.length).toBe(7);
        expect(setup.sql.indexOf(':')).toBe(-1);
    });
});
