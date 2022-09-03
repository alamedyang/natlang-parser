// "use strict";

// low budget module system, go! -SB
var window = window || {};
window.natlang = window.natlang || {};
var natlang = natlang || window.natlang;

var log = false;

/*

Natlang parser class/constructor/tealWhatsit:

1. Give it the language config object when making a new one
2. `Parser.lex(inputString)` to generate tokens (?)
3. `Parser.parse(tokens)` to generate a finalState object or smthg (?)

- Where can the fileName come in? (Needed for procedural dialog names)

TODO

*/

natlang.makeParseTrees = function (flatTrees) {
	flatTrees = flatTrees || {};
	var result = {};
	Object.keys(flatTrees).forEach(function (treeName) {
		flatTrees[treeName].forEach(function (branch) {
			result[treeName] = result[treeName] || {
				treeName: treeName
			};
			var refs = [ result[treeName] ];
			var newRefs = [];
			var patternWords = branch[0].split(' ');
			var whatDo = branch[1];
			// DO IT
			patternWords.forEach(function (word) {
				var captureType;
				var captureLabel;
				var value;
				if (word[0] === "$" && word.includes(":")) {
					var wordSplits = word.split(':')
					captureType = wordSplits[1];
					captureLabel = wordSplits[0].substring(1);
				} else if (word[0] === "?") {
					newRefs = refs.slice();
					value = word.substring(1);
				} else {
					value = word;
				}
				refs.forEach(function (ref) {
					ref.next = ref.next || [];
					var foundRef = ref.next.find(function (item) {
						var literal = item.value && item.value === value;
						var capture = item.capture
							&& item.capture.type === captureType
							&& item.capture.label === captureLabel;
						return literal || capture;
					})
					if (!foundRef) {
						var insert = { next: [] };
						if (captureType) {
							insert.capture = {
								label: captureLabel,
								type: captureType
							};
						} else if (value) {
							insert.value = value;
						}
						ref.next.push(insert)
						newRefs.push(insert);
					} else {
						var nextRef = ref.next.find(function (item) {
							var literal = item.value && item.value === value;
							var capture = item.capture
								&& item.capture.type === captureType
								&& item.capture.label === captureLabel;
							return literal || capture;
						})
						newRefs.push(nextRef);
					}
				})
				refs = newRefs;
				newRefs = [];
			})
			refs.forEach(function (ref) {
				ref.function = whatDo;
			})
			
		})
	})
	return result;
};

natlang.prepareConfig = function (config) {
	if (!config.trees) {
		throw new Error("Config object missing \"trees\" entry!");
	}
	if (!config.blocks) {
		throw new Error("Config object missing \"blocks\" entry!");
	}
	if (!config.capture) {
		throw new Error("Config object missing \"capture\" entry!");
	}
	var parseTrees = natlang.makeParseTrees(config.trees);
	return {
		parseTrees: parseTrees,
		blocks: config.blocks,
		capture: config.capture
	};
};

natlang.opLookup = {
	'SET': "SET",
	'set': "SET",
	'=': "SET",
	'ADD': "ADD",
	'add': "ADD",
	'+': "ADD",
	'SUB': "SUB",
	'sub': "SUB",
	'-': "SUB",
	'DIV': "DIV",
	'div': "DIV",
	'/': "DIV",
	'MUL': "MUL",
	'mul': "MUL",
	'*': "MUL",
	'MOD': "MOD",
	'mod': "MOD",
	'%': "MOD",
	'RNG': "RNG",
	'rng': "RNG",
	'?': "RNG",
};

natlang.decayTo = {
	bareword: function (token) {
		if (token.type === "bareword") {
			return token.value;
		} else if (token.barewordValue) {
			return token.barewordValue;
		} else { return undefined; }
	},
	operator: function (token) {
		var result = token.type === "operator" ? token.value : undefined;
		if (!result) {
			result = natlang.opLookup[token.value]; // ???
		}
		return result;
	},
	color: function (token) {
		return token.type === "color" ? token.value : undefined;
	},
	boolean: function (token) {
		return token.type === "boolean" ? token.value : undefined;
	},
	quotedString: function (token) {
		return token.type === "quotedString" ? token.value : undefined;
	},
	number: function (token) {
		return token.type === "number" ? token.value : undefined;
	},
	duration: function (token) {
		return token.type === "duration" || token.type === "number"
			? token.value : undefined;
	},
	distance: function (token) {
		return token.type === "distance" || token.type === "number"
			? token.value : undefined;
	},
	quantity: function (token) {
		return token.type === "quantity" || token.type === "number"
			? token.value : undefined;
	},
	string: function (token) {
		var bareWord = natlang.decayTo.bareword(token);
		if (bareWord) {
			return bareWord;
		}
		if (token.type === "quotedString") {
			return token.value;
		}
		return undefined;
	},
	
};

natlang.tryBranch = function (tokens, tokenPos, branch) {
	var report = {
		success: false,
		captures: {},
		thenDo: null,
		tokenCount: 0
	};
	var reportCheckpoint;
	var ref = branch;
	while (ref.next && ref.next.length) {
		var foundTwigMatch = false;
		var token = tokens[tokenPos];
		if (!token) {
			if (!reportCheckpoint) {
				if (log) { console.log('Attempted to parse token out of bounds.'); }
			}
			break;
		}
		// LITERAL VALUE PASS (can't Array.filter; this changes index!!)
		for (var index = 0; index < ref.next.length; index++) {
			var testTwig = ref.next[index];
			if (testTwig.value !== undefined) { // (value might be literally `false`)??
				// then its type is literal
				if (testTwig.value === tokens[tokenPos].value) {
					// console.warn("  >>>> " + testTwig.value);
					ref = testTwig;
					report.tokenCount += 1;
					tokenPos += 1;
					foundTwigMatch = true;
					break;
				}
			}
		}
		// VARIABLE VALUE PASS (only if literal wasn't matched)
		if (!foundTwigMatch) {
			for (var index = 0; index < ref.next.length; index++) {
				var testTwig = ref.next[index];
				if (testTwig.capture) { // then its type is variable
					var captureType = testTwig.capture.type;
					var captureMatch = null;
					if (token.type === captureType) {
						captureMatch = token.value;
					}
					if (captureMatch === null) {
						var decayedValue = natlang.decayTo[captureType](token);
						if (decayedValue) {
							captureMatch = decayedValue;
						}
					}
					if (captureMatch !== null) {
						// console.warn("  >>>> " + captureMatch);
						report.captures[testTwig.capture.label] = captureMatch;
						ref = testTwig;
						report.tokenCount += 1;
						tokenPos += 1;
						foundTwigMatch = true;
						break;
					}
				}
			}
		}
		// break if neither pass found a match
		if (!foundTwigMatch) {
			var expected = ref.next
				.map(function (item) {
					var flat = "unknownEntry";
					if (item.value) {
						flat = item.value;
					} else if (item.capture) {
						flat = `$${item.capture.label}:${item.capture.type}`;
					}
					return flat;
				}).map(function (item) {
					return '"' + item + '"';
				})
			report.currentTwig = ref;
			report.currentToken = token;
			report.found = token.value;
			var cutOff = 5
			if (expected.length > cutOff) {
				expected = expected.slice(0,cutOff).concat(["…"]);
			}
			report.expected = expected.join(', ');
			break;
		}
		// at this point, a function means we're at a possible endpoint
		if (ref.function) {
			if (ref.next && ref.next.length) {
				// there's more possible twigs to try
				// so make a copy to fall back to if further twigs fail
				reportCheckpoint = JSON.parse(JSON.stringify(report));
				reportCheckpoint.success = true;
				reportCheckpoint.thenDo = ref.function;
			} else {
				// otherwise we win
				report.thenDo = ref.function;
				report.success = true;
			}
		}
		// loop continues if you've made it this far (and there's more twigs)
	}
	if (!report.success && reportCheckpoint) {
		return reportCheckpoint;
	}
	return report;
};

natlang.parse = function (config, inputString, fileName) {
	if (!config.parseTrees) {
		throw new Error("Config object missing \"parseTrees\" entry! (Did you forget to put your config object through 'prepareConfig' first?)");
	}
	if (!config.blocks) {
		throw new Error("Config object missing \"blocks\" entry!");
	}
	if (!config.capture) {
		throw new Error("Config object missing \"capture\" entry!");
	}
	var state = {
		fileName: fileName || 'untitledFile',
		inputString: inputString,
		// token info
		tokens: [],
		curTokenIndex: 0,
		// block state
		blockStack: [ "root" ],
		blockPos: 0,
		blockLooping: false,
		// other
		bestTry: null,
		bestTryLength: 0,
		lastMatch: {
			blockName: '',
			blockPos: 0,
		},
		// parsed data
		finalState: {},
		inserts: {},
		captures: {},
	};
	var lex = natlang.lex(inputString);
	if (lex.success) {
		state.tokens = lex.tokens;
	} else {
		natlang.printParseMessage(
			"error",
			inputString,
			lex.errors[0].pos,
			lex.errors[0].text
		)
		return lex;
	}
	// block functions
	state.startBlock = function (blockName) {
		if (log) { console.log("state.startBlock: Starting the block named " + blockName); }
		var blockInfo = config.blocks[blockName];
		if (blockInfo.onOpen) {
			blockInfo.onOpen(state);
		}
		state.blockStack.unshift(blockName);
		state.blockPos = 0;
		state.blockLooping = false;
	};
	state.endBlock = function () {
		var blockName = state.blockStack.shift();
		var blockLabel = blockName ? blockName : "[block name missing]";
		if (log) { console.log("Closing block '" + blockLabel + "'..."); }
		state.blockPos = 0;
		state.blockLooping = false;
		state.bestTry = null;
		state.bestTryLength = 0,
		state.lastMatch = {
			blockName: '',
			blockPos: 0,
		};
		var blockInfo = config.blocks[blockName];
		if (blockInfo) {
			if (blockInfo.onClose) {
				if (log) { console.log(blockLabel + "'s onClose function found! Doing it now..."); }
				blockInfo.onClose(state);
			} else {
				console.warn("Was I supposed to find a block 'onClose' function for " + blockLabel + "? Because I didn't! (Maybe you didn't want one for this block?) Proceeding anyway....");
			}
		} else {
			var message = natlang.getTokenContext(
				state.inputString,
				state.tokens[state.curTokenIndex],
				"Could not find block info for a block named " + blockLabel
			)
			throw new Error(message);
		}
	};
	// parsed data functions
	state.clearCaptures = function () {
		state.captures = {};
	};
	state.makeAutoIdentifierName = function () {
		var pos = state.tokens[state.curTokenIndex].pos;
		var coords = natlang.findLineAndCharNumbers(state.inputString, pos);
		return state.fileName+':'+coords.row +':'+coords.col;
	};
	state.processCaptures = function (captureType, args) {
		if (!config.capture[captureType]) {
			throw new Error("No 'capture' function found for " + captureType + "(Token index " + state.curTokenIndex + ")");
		}
		config.capture[captureType](state, args);
	};
	// THE THING
	bigloop: while (state.curTokenIndex < state.tokens.length) {
		var blockName = state.blockStack[0];
		var blockInfo = config.blocks[blockName];
		if (!blockInfo) {
			throw new Error(`No block info found for: "${blockName}"`);
		}
		var blockBranches = blockInfo.branches;
		if (!blockBranches) {
			throw new Error(`No branches found for: "${blockName}"`);
		}
		if (log) { console.log(`Processing block "${blockName}" ...`); }
		if (
			blockInfo.closeChar
			&& blockInfo.closeChar === state.tokens[state.curTokenIndex].value
				// TODO: check for "operator" type specifically?
		) {
			if (log) { console.log("But wait! We've hit its end char: " + blockInfo.closeChar); }
			state.curTokenIndex += 1;
			state.endBlock();
			continue bigloop;
		}
		var curBlockBranch = blockBranches[state.blockPos];
		if (!curBlockBranch) { // if there's no branch at this branch index
			if (blockInfo.branchesLoop) { // if branches can loop...
				if (state.blockLooping) { // ...avoid infinite loop
					break bigloop;
				} else { // ...otherwise try to loop
					if (log) { console.log("Trying a loop (ONCE)"); }
					state.blockLooping = true;
					state.blockPos = 0;
					if (blockInfo.onLoop) {
						blockInfo.onLoop(state);
					}
					continue bigloop;
				}
			} else { // if branches can't loop and we didn't hit the end char, IS END OF PARSE TIMES, END OF UNDERSTANDABLE INSTRUCTIONS IN INPUT
				break bigloop;
			}
		}
		// we have a legit branch to try
		var curBranchName = curBlockBranch.branch;
		var tryBranch = natlang.tryBranch(
			state.tokens,
			state.curTokenIndex,
			config.parseTrees[curBranchName]
		);
		if (tryBranch && tryBranch.success) { // branch matched
			var contextMessage = natlang.getTokenContext(
				state.inputString,
				state.tokens[state.curTokenIndex],
				`Parsing as '${curBranchName}' (in block '${blockName}')`
			)
			if (log) { console.log(contextMessage); }
			state.captures = tryBranch.captures;
			if (log) { console.log("Branch success! Doing its 'thenDo'"); }
			tryBranch.thenDo(state);
			if (log) { console.log("(Did the state change? I hope it did:)"); }
			if (log) { console.log({
				finalState: state.finalState,
				inserts: state.inserts,
				captures: state.captures
			}); }
			state.blockLooping = false; // because this loop was successful
			state.bestTry = null;
			state.bestTryLength = 0;
			state.lastMatch.blockName = blockName;
			state.lastMatch.blockPos = state.blockPos;
			// state.matchCheckpoint = null;
			state.curTokenIndex += tryBranch.tokenCount;
			if (!curBlockBranch.multipleOkay) {
				state.blockPos += 1;
				if (log) { console.log(`This branch (${curBranchName}) can't repeat. Moving on to the next branch index in the block....`); }
				continue bigloop
			}
			continue bigloop;
		} else { // branch didn't match
			if (tryBranch.tokenCount > state.bestTryLength || !state.bestTryLength) {
				// store the branch if it's better than nothing (or current)
				// (the text may have been trying to follow this pattern)
				state.bestTry = tryBranch;
				state.bestTryLength = tryBranch.tokenCount;
			}
			if (curBlockBranch.zeroOkay) {
				if (log) { console.log(`This branch (${curBranchName}) didn't match, but it's okay to skip it. Moving from ${state.blockPos} -> ${state.blockPos +1}`); }
				state.blockPos += 1;
				continue bigloop;
			} else if (
				!curBlockBranch.zeroOkay
				&& state.lastMatch.blockName === blockName
				&& state.lastMatch.blockPos === state.blockPos
			) {
				if (log) { console.log(`This branch (${curBranchName}) isn't okay to skip outright, but we did match it already so we can move on. Moving from ${state.blockPos} -> ${state.blockPos + 1}`); }
				state.blockPos += 1;
				continue bigloop;
			} else if (!curBlockBranch.zeroOkay) {
				break bigloop;
			}
		}
	}
	// bigloop over
	if (state.curTokenIndex === state.tokens.length) { // success!
		if (log) { console.log("FINAL STATE:"); }
		return state.finalState;
	} else { // failure!
		if (state.bestTry) {
			var found = state.bestTry.found;
			var expected = state.bestTry.expected;
			var blockInfo = config.blocks[state.blockStack[0]];
			var branchInfo = blockInfo.branches[state.blockPos];
			var message
				= branchInfo.failMessage
				? branchInfo.failMessage
				: `Unexpected token "${found}" (expected ${expected})`;
			var errorToken = state.tokens[state.curTokenIndex + state.bestTry.tokenCount];
			var contextMessage = natlang.getTokenContext(
				state.inputString,
				errorToken,
				message
			)
			throw new Error(contextMessage);
		} else {
			var message = `Unable to identify branch! (Block: '${state.blockStack[0]}')`;
			var contextMessage = natlang.getTokenContext(
				state.inputString,
				state.tokens[state.curTokenIndex],
				message
			)
			throw new Error(contextMessage);
		}
	}
};

natlang.buildDialogFromState = function (state) {
	var dialogSettings = state.finalState.dialogSettings || [];
	var identifier = state.inserts.dialogIdentifier;
	var parameters = state.inserts.dialogParameters;
	var messages = state.inserts.dialogMessages;
	var options = state.inserts.dialogOptions;
	var result = {};
	// getting params from dialogSettings
	if (identifier.type === "name") {
		result.name = identifier.value;
	}
	if (identifier.type === "label") {
		var labelEntries = dialogSettings.filter(function (item) {
				return item.type === "label"
					&& item.value === identifier.value;
			})
		if (labelEntries.length > 0) {
			labelEntries.forEach(function (entry) {
				var capturedParams = Object.keys(entry.parameters);
				capturedParams.forEach(function (propertyName) {
					result[propertyName] = entry.parameters[propertyName];
				})
			})
		} else {
			identifier.type = "entity";
			// result.labelWarning = `No settings found for label "${identifier.value}" -- treating as entity name`;
			// treat as entitiy; will handle immediately below
		}
	}
	if (identifier.type === "entity" || Object.keys(result).length === 0) {
		var labelEntries = dialogSettings.filter(function (entry) {
				return entry.type === "entity"
					&& entry.value === identifier.value;
			})
		if (labelEntries.length) {
			labelEntries.forEach(function (entry) {
				var capturedParams = Object.keys(entry.parameters);
				capturedParams.forEach(function (propertyName) {
					result[propertyName] = entry.parameters[propertyName];
				})
			})
		}
		result.entity = identifier.value;
	}
	// put in global params only if no existing params by that name
	var globalParams = dialogSettings.filter(function (item) {
		return item.type === "global"
	})
	if (globalParams.length) {
		globalParams.forEach(function (globalEntry) {
			Object.keys(globalEntry.parameters).forEach(function (propertyName) {
				if (!result[propertyName]) {
					result[propertyName] = globalEntry.parameters[propertyName];
				}
			})
		})
	}
	// override the above with params found in the dialog itself
	if (parameters) {
		Object.keys(parameters).forEach(function (parameterName) {
			result[parameterName] = parameters[parameterName];
		})
	}
	var alignmentMap = {
		"BL": "BOTTOM_LEFT",
		"BR": "BOTTOM_RIGHT",
		"TL": "TOP_LEFT",
		"TR": "TOP_RIGHT",
		"BOTTOM_LEFT": "BOTTOM_LEFT",
		"BOTTOM_RIGHT": "BOTTOM_RIGHT",
		"TOP_LEFT": "TOP_LEFT",
		"TOP_RIGHT": "TOP_RIGHT"
	}
	result.messages = messages.map(function (string) {
		var cleanedString = natlang.cleanString(string);
		return natlang.wrapText(cleanedString, result.messagesWrap);
	});
	if (options && options.length) {
		result.response_type = "SELECT_FROM_SHORT_LIST";
		result.options = options.map(function (option) {
			return {
				label: natlang.cleanString(option.label),
				script: option.script
			}
		});
	}
	var newAlignment = alignmentMap[result.alignment];
	if (!newAlignment) {
		var warningMessage = "Alignment cannot be " + result.alignment + "; falling back to 'BOTTOM_LEFT'";
		console.warn(warningMessage);
		result.alignWarning = warningMessage;
		result.alignment = "BOTTOM_LEFT";
	} else {
		result.alignment = newAlignment;
	}
	delete result.messagesWrap;
	return result;
};

natlang.cleanString = function (inputString) {
	return inputString
		.replace(/(“|”)/g, '"')
		.replace(/(‘|’)/g, "'")
		.replace(/…/g, "...")
		.replace(/—/g, "--") // emdash
		.replace(/–/g, "-"); // endash
}
natlang.wrapText = function (inputString, wrapTo) {
	var countSpaces = function (string) {
		var match = string.match(/^ +/);
		return match ? match[0].length : false;
	};
	var countWordChars = function (string) {
		var length = string.length;
		if (string[0] === string[string.length -1]) {
			if (string[0] === "%") {
				length = 12;
			} else if (string[0] === "$") {
				length = 5;
			}
		}
		return length;
	};
	wrapTo = wrapTo || 42; // TODO: magic number alert
	var finishedText = [];
	var pendingLine = '';
	var pendingLineSize = 0;
	var workingString = inputString;
	var pos = 0;
	var lastSpaceFound = null;
	var shuntLine = function () {
		finishedText.push(workingString.substring(0, lastSpaceFound));
		workingString = workingString.substring(pos);
		pendingLine = '';
		pendingLineSize = 0;
		pos = 0;
		lastSpaceFound = null;
	}
	while (workingString.length) {
		var spaceCount = countSpaces(workingString.substring(pos));
		if (spaceCount) {
			lastSpaceFound = pos;
			pendingLine += ' '.repeat(spaceCount);
			pendingLineSize += spaceCount;
			pos += spaceCount;
			continue;
		}
		var nextChar = workingString[pos];
		if (nextChar === '\n') {
			lastSpaceFound = pos;
			pos += 1;
			shuntLine();
			continue;
		}
		var wordMatch = workingString.substring(pos).match(/^[^ \n]+/)
		if (wordMatch) {
			var word = wordMatch[0];
			var wordSize = countWordChars(word);
			var projectedSize = pendingLineSize + wordSize;
			if (projectedSize > wrapTo) {
				shuntLine();
			}
			pendingLine += word;
			pendingLineSize += wordSize;
			pos += wordSize;
		} else {
			break
		}
	}
	finishedText.push(pendingLine);
	return finishedText.join('\n');
};
