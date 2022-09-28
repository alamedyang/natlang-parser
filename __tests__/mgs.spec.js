var fs = require('fs');
var testJSON = require('./mgs.testdata.json');
var stableStringify = require('fast-json-stable-stringify');

const natlang = require('../natlang-parse.js');
const zigzag = require('../mgs-preprocessor-zigzag.js');

describe('Zigzag test suite', function () {
	describe('Pass tests', function () {
		testJSON.zigzagTestsGood.forEach(function (item, index) {
			it(`Should flatten zigzag #${index}`, function () {
				var expected = item.expectedOutput;
				var result = zigzag.process(item.lex.tokens);
				expect(stableStringify(result)).toBe(stableStringify(expected));
			})
		})

	})
	describe('Fail tests', function () {
		testJSON.zigzagTestsFail.forEach(function (item) {
			var tokens = natlang.lex(item.inputString);
			var expected = item.toThrow;
			test(expected, () => {
				expect(() => {
					zigzag.process(tokens.tokens);
				}).toThrow(expected);
			})
		})
	})
})

// npm run test