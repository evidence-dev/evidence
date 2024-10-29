// import { AccessTrack } from './AccessTrack.js';

// const obj = {
// 	test: 'hi',
// 	test2: 2,
// 	test3: false
// };

// const tracked = AccessTrack(obj, 'test');

// const tag = (str) => {
// 	const results = tracked.immediate();
// 	return results;
// };

// const listening = (fn) => {
// 	const gather = tracked.listen();
// 	fn();
// 	return gather();
// };

// // const gather = tracked.track();

// setTimeout(() => {
// 	console.log('A', tag(`${tracked.test}`), ['test']);
// 	console.log('B', tag(`${tracked.test2} ${tracked.test3}`), ['test2', 'test3']);
// }, Math.random() * 1000);
// setTimeout(() => {
// 	console.log('C', tag(`${tracked.test}`), ['test']);
// 	console.log('D', tag(`${tracked.test2}`), ['test2']);
// }, Math.random() * 1000);
// setTimeout(() => {
// 	`${tracked.test3}`;
// 	console.log(
// 		'E',
// 		listening(() => `${tracked.test} ${tracked.test2}`),
// 		['test', 'test2']
// 	);
// 	console.log('F', tag(``), []);
// }, Math.random() * 1000);
// setTimeout(() => {}, Math.random() * 1000);

class MyClass {
	anon() {
		console.log(this);
	}
	arrow = (x, y, z, ...args) => {
		const allArgs = [x, y, z, ...args];
		console.log(this, args, allArgs);
	};
	superAnon = function () {
		console.log(this);
	};
}

const { anon, arrow, superAnon } = new MyClass();

anon();
arrow();
superAnon();

const anon2 = new MyClass().anon;

anon2();
