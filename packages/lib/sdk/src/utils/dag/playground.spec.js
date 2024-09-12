import { describe, expect, it, vi } from 'vitest';
import { Input, InputValue, Query, withDeps } from './playground.js';

// TODO: SQL Autofragments / custom stringification

describe('playground', () => {
	it('should transform set values to InputValues', () => {
		const myInput = new Input();
		myInput.value = 10;
		expect(myInput.value).toBeInstanceOf(InputValue);
		expect(`${myInput.value}`).toEqual('10');
	});
	it('should transform deeply set values to InputValues', () => {
		const myInput = new Input();

		myInput.value.param = 10;

		expect(myInput.value).toBeInstanceOf(InputValue);
		expect(myInput.value.param).toBeInstanceOf(InputValue);
		expect(`${myInput.value.param}`).toEqual('10');
	});
	it('should let you access the root input', () => {
		const myInput = new Input();
		expect(myInput.value.input).toBe(myInput);
	});
	it('should let you deeply access the root input', () => {
		const myInput = new Input();
		expect(myInput.value.value.value.a.a.a.a.a.a.a.a.a.a.input).toBe(myInput);
	});

	describe('Query', () => {
		it('should track inputs passed in with update', () => {
			const inputOne = new Input('i1');
			inputOne.sqlSnippet = 'i1';

			const inputTwo = new Input('i2');
			inputTwo.value = 'i2v';

			const inputThree = new Input('i3');
			inputThree.a.a.a.a = 'i3a';

			const query = new Query('q');

			query.update`SELECT ${inputOne}, ${inputTwo.value}, ${inputThree.a.a.a.a};`;

			expect(query.__dag.parents.has(inputOne.__dag)).toEqual(true);
			expect(query.__dag.parents.has(inputTwo.__dag)).toEqual(true);
			expect(query.__dag.parents.has(inputThree.__dag)).toEqual(true);
			expect(query.text).toEqual('SELECT i1, i2v, i3a;');
            expect(`${query}`).toEqual(`(${query.text})`)
		});
        it('should track deps on other queries', () => {
            const queryOne = new Query('q1');
            const queryTwo = new Query('q2');

            queryOne.update`SELECT 1`;
            queryTwo.update`SELECT ${queryOne}`;

            expect(queryTwo.__dag.parents.has(queryOne.__dag)).toEqual(true);
            expect(queryTwo.text).toEqual("SELECT (SELECT 1)")

        })
	});

    // describe("Complex Cases", () => {
    //     // TODO: Build some nested queries that use parent queries and inputs
    // })
});
