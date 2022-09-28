// "use strict";

var constants = {};

constants.barewordValue = function (token) {
	if (!token) {
		throw new Error (`constants.barewordValue: Token out of bounds!`);
	}
	if (token.barewordValue) {
		return token.barewordValue;
	}
	if (token.type === "bareword") {
		return token.value;
	}
	return false; // won't conflict with boolean `false` because we're using the barewordValue
}

constants.isConstant = function (token) {
	// should be bareword `$_____`
	var barewordValue = constants.barewordValue(token);
	if (barewordValue) {
		return barewordValue[0] === '$' ? barewordValue : false;
	}
	return false;
};

constants.isDeclaration = function (tokens, tokenPos) {
	var constName = constants.isConstant(tokens[tokenPos]);
	if (!constName) {
		return false;
	}
	if (!tokens[tokenPos+1] || !tokens[tokenPos+2]) {
		return false;
	}
	if (tokens[tokenPos+1].value === "=" && tokens[tokenPos+2].type !== "operator") {
		return {
			name: constName,
			value: tokens[tokenPos+2] // NOTE: this is a token, not a bare value!
		}
	}
	return false;
};

constants.process = function (origTokens) {
	// first check whether the whole lex object was passed by accident:
	var tokens = origTokens.success ? origTokens.tokens : origTokens;
	// (okay we're good now)	
	var declaredConstants = {};
	var tokenPos = 0;
	var outputTokens = [];
	while (tokenPos < tokens.length) {
		var declaration = constants.isDeclaration(tokens, tokenPos);
		if (declaration) {
			// found `$varName = value`
			var valueToken = JSON.parse(JSON.stringify(declaration.value));
			valueToken.declarationName = declaration.name;
			valueToken.preprocessor = "constants";
			valueToken.preprocessorPhase = "declaration";
			declaredConstants[declaration.name] = valueToken;
			tokenPos += 3;
			continue;
		}
		var constName = constants.isConstant(tokens[tokenPos]);
		if (constName) { // found `$varName`
			var valueToken = declaredConstants[constName];
			if (!valueToken) {
				var errorObject = new Error(`constants.process: Constant ${constName} is undefined! (inputString pos: ${tokens[tokenPos].pos})`);
				errorObject.tokenIndex = tokenPos;
				errorObject.token = tokens[tokenPos];
				errorObject.pos = tokens[tokenPos].pos;
				throw errorObject;
			}
			var useToken = tokens[tokenPos];
			// valueToken = the `$varName` declaration token
			// useToken = the in-context `$varName` token
			var insertToken = JSON.parse(JSON.stringify(valueToken));
			insertToken.declarationPos = useToken.pos;
			insertToken.pos = insertToken.pos;
			insertToken.preprocessorPhase = "insertion";
			outputTokens.push(insertToken);
			tokenPos += 1;
			continue;
		}
		outputTokens.push(tokens[tokenPos]);
		tokenPos += 1;
	}
	return outputTokens;
};

constants.log = function (tokens) { // THIS WAS COPIED todo: figure out the data flow
	var string = '';
	var bracketStack = [];
	var newline = false;
	tokens.forEach(function (token, index) {
		var tokenValue = token.barewordValue || token.value;
		if (token.type === "quotedString") {
			tokenValue = token.quotationMark + token.value + token.quotationMark;
		}
		if (string === '') {
			string = tokenValue;
		} else {
			if (tokenValue === '}') {
				newline = true;
				bracketStack.pop();
			}
			if (tokenValue === 'if') {
				newline = true;
			}
			if (tokenValue === 'goto' && tokens[index-1] && tokens[index-1].value !== 'then') {
				newline = true;
			}
			if (newline) {
				string += '\n' + '\t'.repeat(bracketStack.length);
			} else {
				string += ' ';
			}
			newline = false;
			string += tokenValue;
			if (tokenValue === '{') {
				newline = true;
				bracketStack.push(tokenValue);
			}
			if (tokenValue === '}') {
				newline = true;
			}
		}
	})
	return {
		logBody: string,
		logType: "mgs",
		raw: tokens
	};
}


var constScript =`testScript {
	$five = 5
	wait $five
}`;

var constTokens = [
    {
      "pos": 0,
      "type": "bareword",
      "value": "testScript"
    },
    {
      "pos": 11,
      "type": "operator",
      "value": "{"
    },
    {
      "pos": 14,
      "type": "bareword",
      "value": "$five"
    },
    {
      "pos": 20,
      "type": "operator",
      "value": "="
    },
    {
      "pos": 22,
      "type": "number",
      "value": 5
    },
    {
      "pos": 24,
      "type": "bareword",
      "value": "wait"
    },
    {
      "pos": 29,
      "type": "bareword",
      "value": "$five"
    },
    {
      "pos": 35,
      "type": "operator",
      "value": "}"
    }
  ]

var window = window || {};
window.constants = constants;

if (typeof module === 'object') {
	module.exports = constants
}
