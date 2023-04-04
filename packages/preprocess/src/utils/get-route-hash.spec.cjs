const md5 = require('blueimp-md5');
const { faker } = require('@faker-js/faker');
const { getRouteHash } = require('./get-route-hash.cjs');

describe('get-route-hash', () => {
	it("should hash /src/pages/+page.md to equal md5('/')", () => {
		const result = getRouteHash('/src/pages/+page.md');
		expect(result).toEqual(md5('/'));
	});

	it("should hash /src/pages/some-route/+page.md to equal md5('/some-route')", () => {
		const result = getRouteHash('/src/pages/some-route/+page.md');
		expect(result).toEqual(md5('/some-route'));
	});

	it('should hash /src/pages/random-string/+page.md the same way twice', () => {
		const route = `/src/pages/${faker.company.bsAdjective()}-${faker.company.bsBuzz()}-${faker.company.bsNoun()}/+page.md`;
		expect(getRouteHash(route)).toEqual(getRouteHash(route));
	});
});
