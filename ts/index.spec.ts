import { queryBindToString, queryBind } from "./index";

declare const console: any;

describe("index.spec.ts", () => {
    describe("bind-sql-string", () => {
        const sql = `
            SELECT *
            FROM   SomeTable st
            WHERE  st.SomeNumberColumn > :someNumberValue
            AND    st.SomeStringColumn = :someStringValue
            AND    st.SomeDate BETWEEN :startDate AND :endDate 
            AND    st.SomeOtherColumn < :someNumberValue
            AND    st.SomeInColumn IN (:someStringValue,'B','C')
            AND    st.SomeOtherColumn = 2 + :someStringValue
            AND    st.SomeStringArg = 'keep this '':binding'''
            AND    st.SomeStringColumn IN (:multipleValues)
            AND    st.Some = :some
        `;
    
        const bindings = {
            some: 99,
            someNumberValue:  1,
            someStringValue:  "He's got value",
            startDate: Date.now(),
            endDate: Date.now(),
            multipleValues: ["Aa", "Bb", "Cc"]
        };
    
        describe("#queryBindToString", () => {
            it("simple", () => {
                const string = queryBindToString(sql, bindings, {quoteEscaper:"''"});
                expect(string).toBeDefined();
                expect(typeof(string)).toBe("string");
                expect(string.includes("keep this :binding")).toBe(false);
                expect(string.includes("'Aa','Bb','Cc'")).toBe(true);
                expect(string.includes("AND    st.Some = 99")).toBe(true);
            });    
        });
    
        it("#queryBind autoBindStrings true", () => {
            const setup = queryBind(sql, bindings, {autoBindStrings: true});
            expect(setup).toBeDefined();
            expect(typeof(setup)).toBe("object");
            expect(setup.sql).toBeDefined();
            expect(setup.parameters).toBeDefined();
            expect(setup.parameters.length).toBe(14);
            expect(setup.sql.indexOf(':')).toBe(-1);
            expect(setup.valuesObject._quotedReplacement_0).toBeDefined();
            expect(setup.valuesObject._quotedReplacement_0).toBe("B");
            expect(setup.valuesObject._quotedReplacement_1).toBeDefined();
            expect(setup.valuesObject._quotedReplacement_1).toBe("C");
            expect(setup.valuesObject._quotedReplacement_2).toBeDefined();
            expect(setup.valuesObject._quotedReplacement_2).toBe("keep this '':binding''");
        });

        it("#queryBind autoBindStrings false", () => {
            const setup = queryBind(sql, bindings, {autoBindStrings: false});
            expect(setup).toBeDefined();
            expect(typeof(setup)).toBe("object");
            expect(setup.sql).toBeDefined();
            expect(setup.parameters).toBeDefined();
            expect(setup.parameters.length).toBe(11);
            expect(setup.sql.indexOf(':')).toBeGreaterThan(0);
            expect(setup.valuesObject._quotedReplacement_0).toBeUndefined();
            expect(setup.valuesObject._quotedReplacement_1).toBeUndefined();
            expect(setup.valuesObject._quotedReplacement_2).toBeUndefined();
            expect(setup.sql.includes("'B'")).toBeTruthy();
            expect(setup.sql.includes("'C'")).toBeTruthy();
            expect(setup.sql.includes("keep this '':binding''")).toBeTruthy();
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
            const setup = queryBind(sql, bindings);
            expect(setup).toBeDefined();
            expect(setup.parameters.length).toBe(4);
            expect((setup.sql.match(/\?/g) || []).length).toEqual(4);
        });
    
    });
});
