// "use strict";

// low budget module system, go! -SB
var window = window || {};
window.natlang = window.natlang || {};
var natlang = natlang || window.natlang;

var mgs = {
	blocks: {
		"root": {
			branchesLoop: true,
			branches: [
				{ branch: "dialogSettingsNode", multipleOkay: true, zeroOkay: true },
				{ branch: "dialogNode", multipleOkay: true, zeroOkay: true },
				{ branch: "scriptNode", multipleOkay: true, zeroOkay: true },
			]
		},
		"dialogSettings": {
			branches: [
				{ branch: "dialogSettingsTarget", multipleOkay: true, zeroOkay: true },
			],
			closeChar: "}",
			onOpen: function (state) {
				state.finalState.dialogSettings = state.finalState.dialogSettings || [];
			},
			onClose: function () {} // just to silence the "no onClose?!?!" warning
		},
		"dialogSettingsTarget": {
			branches: [
				{ branch: "dialogParameter", multipleOkay: true, zeroOkay: true },
			],
			closeChar: "}",
			onClose: function (state) {
				var inserts = state.inserts;
				var finalState = state.finalState;
				var result = inserts.dialogSettingsTarget;
				result.parameters = inserts.dialogParameters;
				inserts.dialogParameters = {};
				inserts.dialogSettingsTarget = {};
				finalState.dialogSettings = finalState.dialogSettings || [];
				finalState.dialogSettings.push(result);
			},
		},
		"dialog": {
			branchesLoop: true,
			branches: [
				{
					branch: "dialogIdentifier",
					multipleOkay: false,
					zeroOkay: false,
					failMessage: "A dialog identifier is required before any dialog messages!"
				},
				{ branch: "dialogParameter", multipleOkay: true, zeroOkay: true },
				{
					branch: "dialogMessage",
					multipleOkay: true,
					zeroOkay: false,
					failMessage: "You need at least one dialog message!" 
				},
				{ branch: "dialogOption", multipleOkay: true, zeroOkay: true },
			],
			closeChar: "}",
			onLoop: function (state) {
				var inserts = state.inserts;
				var insert = natlang.buildDialogFromState(state);
				inserts.dialogs = inserts.dialogs || [];
				inserts.dialogs.push(insert);
				inserts.dialogIdentifier = {};
				inserts.dialogParameters = {};
				inserts.dialogMessages = [];
				inserts.dialogOptions = [];
			},
			onClose: function (state) {
				var inserts = state.inserts;
				var final = state.finalState;
				var insert = natlang.buildDialogFromState(state);
				inserts.dialogs = inserts.dialogs || [];
				inserts.dialogs.push(insert);
				inserts.dialogIdentifier = {};
				inserts.dialogParameters = {};
				inserts.dialogMessages = [];
				inserts.dialogOptions = [];
				final.dialogs = final.dialogs || {};
				final.dialogs[inserts.dialogName] = inserts.dialogs;
				inserts.dialogName = null;
				inserts.dialogs = [];
			},
		},
		"script": {
			branches: [
				{ branch: "action", multipleOkay: true, zeroOkay: true }
			],
			closeChar: "}",
			onClose: function (state) {
				var inserts = state.inserts;
				var final = state.finalState;
				final.scripts = final.scripts || {};
				final.scripts[inserts.scriptName] = inserts.actions;
				inserts.scriptName = null;
				inserts.actions = [];
			}
		}
	},
	trees: {
		dialogSettingsNode: [
			["settings ?for dialog {",
				function (state) {
					// console.log("    Found 'settings ?for dialog {'")
					state.startBlock("dialogSettings");
				}],
		],
		dialogNode: [
			["dialog $dialog:string {",
				function (state) {
					// console.log("    Found 'dialog $dialog:string {'")
					state.startBlock("dialog");
					state.processCaptures("dialogName");
					state.clearCaptures();
				}],
		],
		scriptNode: [
			["?script $scriptName:string {",
				function (state) {
					// console.log("    Found '?script $scriptName:string {'")
					state.startBlock("script");
					state.processCaptures("scriptName");
					state.clearCaptures();
				}],
		],
		dialogSettingsTarget: [
			["?parameters ?for label $target:string {",
				function (state) {
					// console.log("    Found '?parameters ?for label $target:string {'")
					state.startBlock("dialogSettingsTarget");
					state.processCaptures(
						"dialogSettingsTarget",
						{ type: "label" }
					);
					state.clearCaptures();
				}],
			["?parameters ?for entity $target:string {",
				function (state) {
					// console.log("    Found '?parameters ?for entity $target:string {'")
					state.startBlock("dialogSettingsTarget");
					state.processCaptures(
						"dialogSettingsTarget",
						{ type: "entity" }
					);
					state.clearCaptures();
				}],
			["?parameters ?for ?global default {",
				function (state) {
					// console.log("    Found '?parameters ?for ?global default {'")
					state.startBlock("dialogSettingsTarget");
					state.processCaptures(
						"dialogSettingsTarget",
						{ type: "global" }
					);
					state.clearCaptures();
				}],
			["?parameters ?for ?global defaults {",
				function (state) {
					// console.log("    Found '?parameters ?for ?global defaults {'")
					state.startBlock("dialogSettingsTarget");
					state.processCaptures(
						"dialogSettingsTarget",
						{ type: "global" }
					);
					state.clearCaptures();
				}]
		],
		dialogParameter: [
			["entity $value:string",
				function (state) {
					// console.log("    Found 'entity $value:string'")
					state.processCaptures(
						"dialogParameter",
						{ parameterName: "entity" }
					);
					state.clearCaptures();
				}],
			["name $value:string",
				function (state) {
					// console.log("    Found 'name $value:string'")
					state.processCaptures(
						"dialogParameter",
						{ parameterName: "name" }
					);
					state.clearCaptures();
				}],
			["portrait $value:string",
				function (state) {
					// console.log("    Found 'portrait $value:string'")
					state.processCaptures(
						"dialogParameter",
						{ parameterName: "portrait" }
					);
					state.clearCaptures();
				}],
			["alignment $value:string",
				function (state) {
					// console.log("    Found 'alignment $value:string'")
					state.processCaptures(
						"dialogParameter",
						{ parameterName: "alignment" }
					);
					state.clearCaptures();
				}],
			// ["$parameterName:string $value:string",
			// 	function (state, captures) {
			// 		state.capture.dialogParameter(state, captures.parameterName, captures.value);
			// 	}],
			// (I'd rather make the parameter value a closed list, I think; results in better "why it broke" communication for invalid words)
			["wrap messages ?to $value:number",
				function (state) {
					// console.log("    Found 'wrap messages ?to $value:number'")
					state.processCaptures(
						"dialogParameter",
						{ parameterName: "messageWrap" }
					);
					state.clearCaptures();
				}],
				["wrap options ?to $value:number",
				function (state) {
					// console.log("    Found 'wrap options ?to $value:number'")
					state.processCaptures(
						"dialogParameter",
						{ parameterName: "optionWrap" }
					);
					state.clearCaptures();
				}]
		],
		dialogIdentifier: [
			["$value:bareword",
				function (state) {
					// console.log("    Found '$value:bareword'")
					state.processCaptures(
						"dialogIdentifier",
						{ type: "label" }
					);
					state.clearCaptures();
				}],
			["entity $value:string",
				function (state) {
					// console.log("    Found 'entity $value:string'")
					state.processCaptures(
						"dialogIdentifier",
						{ type: "entity" }
					);
					state.clearCaptures();
				}],
			["name $value:string",
				function (state) {
					// console.log("    Found 'entity $value:string'")
					state.processCaptures(
						"dialogIdentifier",
						{ type: "name" }
					);
					state.clearCaptures();
				}]
		],
		dialogMessage: [
			["$message:quotedString",
				function (state) {
					// console.log("    Found '$message:quotedString'")
					state.processCaptures("dialogMessage");
					state.clearCaptures();
				}]
			],
		dialogOption: [
			["> $label:quotedString : ?goto ?script $script:string",
			// TODO: forbid "goto" and "script" in script/dialog names.... (probably more words, too)
				function (state) {
					// console.log("    Found '$message:quotedString'")
					state.processCaptures("dialogOption");
					state.clearCaptures();
				}]
		],
		action: [
			["show dialog $dialog:string {",
				function (state) {
					// console.log("    Found 'show dialog $dialog:quotedString {'")
					state.startBlock("dialog");
					state.processCaptures("dialogName");
					state.processCaptures(
						"action",
						{ action: "SHOW_DIALOG" }
					);
					state.clearCaptures();
				}],
			["show dialog {",
				function (state) {
					// console.log("    Found 'show dialog {'")
					state.startBlock("dialog");
					state.processCaptures("dialogName");
					state.processCaptures(
						"action",
						{
							action: "SHOW_DIALOG",
							dialog: state.inserts.dialogName
						}
					);
					state.clearCaptures();
				}]
			// more are procedurally added
		],
	},
	capture: {
		dialogName: function (state) {
			var dialog = state.captures.dialog;
			var inserts = state.inserts;
			if (dialog) {
				inserts.dialogName = dialog;
			} else {
				inserts.dialogName = state.makeAutoIdentifierName();
			}
		},
		scriptName: function (state) {
			state.inserts.scriptName = state.captures.scriptName;
		},
		dialogSettingsTarget: function (state, args) {
			state.inserts.dialogSettingsTarget = {
					type: args.type,
					value: state.captures.target
						? state.captures.target
						: null
				}
		},
		dialogParameter: function (state, args) {
			state.inserts.dialogParameters = state.inserts.dialogParameters || {};
			state.inserts.dialogParameters[args.parameterName] = state.captures.value;
		},
		dialogIdentifier: function (state, args) {
			state.inserts.dialogIdentifier = {
				type: args.type,
				value: state.captures.value
			}
		},
		dialogMessage: function (state) {
			state.inserts.dialogMessages = state.inserts.dialogMessages || [];
			state.inserts.dialogMessages.push(state.captures.message);
		},
		dialogOption: function (state) {
			state.inserts.dialogOptions = state.inserts.dialogOptions || [];
			state.inserts.dialogOptions.push({
				label: state.captures.label,
				script: state.captures.script
			});
		},
		action: function (state, args) {
			var newAction = args
				? JSON.parse(JSON.stringify(args))
				: {};
			newAction.action = args.action;
			Object.keys(state.captures).forEach(function (propertyName) {
				newAction[propertyName] = state.captures[propertyName];
			});
			Object.keys(newAction).forEach(function (paramName) {
				if (paramName === "operation") {
					newAction[paramName] = natlang.opLookup[newAction[paramName]];
				}
			})
			state.inserts.actions = state.inserts.actions || [];
			state.inserts.actions.push(newAction);
		}
	}
};

mgs.actionDictionary = [
	{
		action: "BLOCKING_DELAY",
		pattern: "block $duration:duration",
	},
	{
		action: "SET_CAMERA_TO_FOLLOW_ENTITY",
		pattern: "make camera follow entity $entity:string",
	},
	{
		action: "SET_HEX_EDITOR_STATE",
		pattern: "$bool_value:boolean hex editor",
	},
	{
		action: "SLOT_ERASE",
		pattern: "erase slot $slot:number",
	},
	{
		action: "RUN_SCRIPT",
		pattern: "goto ?script $script:string",
	},
	{
		action: "LOOP_ENTITY_ALONG_GEOMETRY",
		pattern: "loop entity $entity:string along geometry $geometry:string over $duration:duration",
	},
	{
		action: "SET_ENTITY_DIRECTION_RELATIVE",
		pattern: "rotate entity $entity:string $relative_direction:number",
	},
	{
		action: "SLOT_SAVE",
		pattern: "save slot",
	},
	{
		action: "SET_SCREEN_SHAKE",
		pattern: "shake camera $frequency:duration $amplitude:distance for $duration:duration",
	},
	{
		action: "NON_BLOCKING_DELAY",
		pattern: "wait $duration:duration",
	},
	{
		action: "WALK_ENTITY_TO_GEOMETRY",
		pattern: "walk entity $entity:string to geometry $geometry:string over $duration:duration",
	},
	{
		action: "WALK_ENTITY_ALONG_GEOMETRY",
		pattern: "walk entity $entity:string along geometry $geometry:string over $duration:duration",
	},
	{
		action: "SET_ENTITY_GLITCHED",
		pattern: "make entity $entity:string glitched",
		values: { "bool_value": true },
	},
	{
		action: "SET_ENTITY_GLITCHED",
		pattern: "make entity $entity:string unglitched",
		values: { "bool_value": false },
	},
	{
		action: "TELEPORT_ENTITY_TO_GEOMETRY",
		pattern: "teleport entity $entity:string to geometry $geometry:string",
	},
	{
		action: "TELEPORT_CAMERA_TO_GEOMETRY",
		pattern: "teleport camera to geometry $geometry:string",
	},
	{
		action: "SET_ENTITY_DIRECTION",
		pattern: "turn entity $entity:string $direction:bareword",
	},
	{
		action: "SET_ENTITY_DIRECTION_TARGET_ENTITY",
		pattern: "turn entity $entity:string toward entity $target_entity:string",
	},
	{
		action: "SET_ENTITY_DIRECTION_TARGET_GEOMETRY",
		pattern: "turn entity $entity:string toward geometry $target_geometry:string",
	},
	{
		action: "PAN_CAMERA_TO_ENTITY",
		pattern: "pan camera to entity $entity:string over $duration:duration",
	},
	{
		action: "PAN_CAMERA_TO_GEOMETRY",
		pattern: "pan camera to geometry $geometry:string over $duration:duration",
	},
	{
		action: "PLAY_ENTITY_ANIMATION",
		pattern: "play entity $entity:string animation $animation:number $play_count:quantity",
	},
	{
		action: "SCREEN_FADE_OUT",
		pattern: "fade out camera to $color:color over $duration:duration",
	},
	{
		action: "SCREEN_FADE_IN",
		pattern: "fade in camera from $color:color over $duration:duration",
	},
	{
		action: "LOAD_MAP",
		pattern: "load map $map:string",
	},
	{
		action: "SLOT_LOAD",
		pattern: "load slot $slot:number",
	},
	{
		action: "SHOW_DIALOG",
		pattern: "show dialog $dialog:string",
	},
	{
		action: "SHOW_SERIAL_DIALOG",
		pattern: "show serial dialog $serial_dialog:string",
	},
	{
		action: "SET_CONNECT_SERIAL_DIALOG",
		pattern: "set serial connect ?message ?to $serial_dialog:string",
	},
	{
		action: "COPY_SCRIPT",
		pattern: "copy ?script $script:string",
		fields: [ "script" ],
	},
	{
		action: "COPY_VARIABLE",
		pattern: "copy entity $entity:string $field:bareword into variable $variable:string",
		values: { "inbound": true },
	},
	{
		action: "COPY_VARIABLE",
		pattern: "copy entity $entity:string $field:bareword from variable $variable:string",
		values: { "inbound": false },
	},
	{
		action: "MUTATE_VARIABLE",
		pattern: "mutate $variable:string $operation:operator $value:number",
	},
	{
		action: "MUTATE_VARIABLES",
		pattern: "mutate $variable:string $operation:operator $source:string",
	},
	{
		action: "SET_MAP_TICK_SCRIPT",
		pattern: "set map tickScript ?to $script:string",
	},
	{
		action: "SET_WARP_STATE",
		pattern: "set warp state ?to $string:string",
	},
	{
		action: "SET_SAVE_FLAG",
		pattern: "set flag $save_flag:string ?to $bool_value:boolean",
	},
	{
		action: "SET_PLAYER_CONTROL",
		pattern: "set player control ?to $bool_value:boolean",
	},
	{
		action: "SET_HEX_EDITOR_DIALOG_MODE",
		pattern: "set hex dialog mode ?to $bool_value:boolean",
	},
	{
		action: "SET_HEX_EDITOR_CONTROL",
		pattern: "set hex control ?to $bool_value:boolean",
	},
	{
		action: "SET_HEX_EDITOR_CONTROL_CLIPBOARD",
		pattern: "set hex clipboard ?to $bool_value:boolean",
	},
	// {
	// 	action: "SET_ENTITY_NAME",
	// 	pattern: "set entity $entity:string name ?to $string:string",
	// } // ONES LIKE THIS ARE PROCEDURALLY ADDED
	{
		action: "CHECK_SAVE_FLAG",
		pattern: "if flag $save_flag:string is $expected_bool:boolean then goto ?script $success_script:string",
	},
	{
		action: "CHECK_FOR_BUTTON_PRESS",
		pattern: "if button $button_id:bareword then goto ?script $success_script:string",
	},
	{
		action: "CHECK_FOR_BUTTON_STATE",
		pattern: "if button $button_id:bareword is pressed then goto ?script $success_script:string",
		values: { "expected_bool": true },
	},
	{
		action: "CHECK_FOR_BUTTON_STATE",
		pattern: "if button $button_id:bareword is not pressed then goto ?script $success_script:string",
		values: { "expected_bool": false },
	},
	{
		action: "CHECK_WARP_STATE",
		pattern: "if warp state is $string:string then goto ?script $success_script:string",
		values: { "expected_bool": true },
	},
	{
		action: "CHECK_WARP_STATE",
		pattern: "if warp state is not $string:string then goto ?script $success_script:string",
		values: { "expected_bool": false },
	},
	{
		action: "CHECK_VARIABLE",
		pattern: "if variable $variable:string is $value:number then goto ?script $success_script:string",
		values: {
			"expected_bool": true,
			"comparison": "==",
		},
	},
	{
		action: "CHECK_VARIABLE",
		pattern: "if variable $variable:string is $comparison:operator $value:number then goto ?script $success_script:string",
		values: { "expected_bool": true },
	},
	{
		action: "CHECK_VARIABLE",
		pattern: "if variable $variable:string is not $value:number then goto ?script $success_script:string",
		values: {
			"expected_bool": false,
			"comparison": "==",
		},
	},
	{
		action: "CHECK_VARIABLE",
		pattern: "if variable $variable:string is not $comparison:operator $value:number then goto ?script $success_script:string",
		values: { "expected_bool": false },
	},
	{
		action: "CHECK_VARIABLES",
		pattern: "if variable $variable:string is $source:string then goto ?script $success_script:string",
		values: {
			"expected_bool": true,
			"comparison": "==",
		},
	},
	{
		action: "CHECK_VARIABLES",
		pattern: "if variable $variable:string is $comparison:operator $source:string then goto ?script $success_script:string",
		values: { "expected_bool": true },
	},
	{
		action: "CHECK_VARIABLES",
		pattern: "if variable $variable:string is not $source:string then goto ?script $success_script:string",
		values: {
			"expected_bool": false,
			"comparison": "==",
		},
	},
	{
		action: "CHECK_VARIABLES",
		pattern: "if variable $variable:string is not $comparison:operator $source:string then goto ?script $success_script:string",
		values: { "expected_bool": false },
	},
	{
		action: "CHECK_ENTITY_HACKABLE_STATE_A_U4",
		pattern: "if entity $entity:string hackableStateAU4 is $expected_u4:number then goto ?script $success_script:string",
	},
	// {
	// 	action: "CHECK_ENTITY_NAME",
	// 	pattern: "if entity $entity:string name is $string:string then goto ?script $success_script:string",
	// 	values: { "expected_bool": true }
	// } // PROCEDURALLY DONE
	{
		action: "CHECK_IF_ENTITY_IS_IN_GEOMETRY",
		pattern: "if entity $entity:string is inside geometry $geometry:string then goto ?script $success_script:string",
		values: { "expected_bool": true },
	},
	{
		action: "CHECK_IF_ENTITY_IS_IN_GEOMETRY",
		pattern: "if entity $entity:string is not inside geometry $geometry:string then goto ?script $success_script:string",
		values: { "expected_bool": false },
	},
	{
		action: "CHECK_ENTITY_GLITCHED",
		pattern: "if entity $entity:string is glitched then goto ?script $success_script:string",
		values: { "expected_bool": true },
	},
	{
		action: "CHECK_ENTITY_GLITCHED",
		pattern: "if entity $entity:string is not glitched then goto ?script $success_script:string",
		values: { "expected_bool": false },
	},
];

mgs.entityPropertyMap = { // used for the procedural dictionary entries 
	CHECK_ENTITY_NAME: {
		actionProperty: "string",
		natLangProperty: "name",
		dictionaryRef: ":string",
	},
	CHECK_ENTITY_X: {
		actionProperty: "expected_u2",
		natLangProperty: "x",
		dictionaryRef: ":number",
	},
	CHECK_ENTITY_Y: {
		actionProperty: "expected_u2",
		natLangProperty: "y",
		dictionaryRef: ":number",
	},
	CHECK_ENTITY_INTERACT_SCRIPT: {
		actionProperty: "expected_script",
		natLangProperty: "interactScript",
		dictionaryRef: ":string",
	},
	CHECK_ENTITY_TICK_SCRIPT: {
		actionProperty: "expected_script",
		natLangProperty: "tickScript",
		dictionaryRef: ":string",
	},
	CHECK_ENTITY_TYPE: {
		actionProperty: "entity_type",
		natLangProperty: "type",
		dictionaryRef: ":string",
	},
	CHECK_ENTITY_PRIMARY_ID: {
		actionProperty: "expected_u2",
		natLangProperty: "primaryID",
		dictionaryRef: ":number",
	},
	CHECK_ENTITY_SECONDARY_ID: {
		actionProperty: "expected_u2",
		natLangProperty: "secondaryID",
		dictionaryRef: ":number",
	},
	CHECK_ENTITY_PRIMARY_ID_TYPE: {
		actionProperty: "expected_byte",
		natLangProperty: "primaryIDtype",
		dictionaryRef: ":number",
	},
	CHECK_ENTITY_CURRENT_ANIMATION: {
		actionProperty: "expected_byte",
		natLangProperty: "animation",
		dictionaryRef: ":number",
	},
	CHECK_ENTITY_CURRENT_FRAME: {
		actionProperty: "expected_byte",
		natLangProperty: "animationFrame",
		dictionaryRef: ":number",
	},
	CHECK_ENTITY_DIRECTION: {
		actionProperty: "direction",
		natLangProperty: "direction",
		dictionaryRef: ":bareword",
	},
	CHECK_ENTITY_HACKABLE_STATE_A: {
		actionProperty: "expected_byte",
		natLangProperty: "hackableStateA",
		dictionaryRef: ":number",
	},
	CHECK_ENTITY_HACKABLE_STATE_B: {
		actionProperty: "expected_byte",
		natLangProperty: "hackableStateB",
		dictionaryRef: ":number",
	},
	CHECK_ENTITY_HACKABLE_STATE_C: {
		actionProperty: "expected_byte",
		natLangProperty: "hackableStateC",
		dictionaryRef: ":number",
	},
	CHECK_ENTITY_HACKABLE_STATE_D: {
		actionProperty: "expected_byte",
		natLangProperty: "hackableStateD",
		dictionaryRef: ":number",
	},
	CHECK_ENTITY_HACKABLE_STATE_A_U2: {
		actionProperty: "expected_u2",
		natLangProperty: "hackableStateAU2",
		dictionaryRef: ":number",
	},
	CHECK_ENTITY_HACKABLE_STATE_C_U2: {
		actionProperty: "expected_u2",
		natLangProperty: "hackableStateCU2",
		dictionaryRef: ":number",
	},
	CHECK_ENTITY_PATH: {
		actionProperty: "geometry",
		natLangProperty: "path",
		dictionaryRef: ":string",
	},
	SET_ENTITY_NAME: {
		actionProperty: "string",
		natLangProperty: "name",
		dictionaryRef: ":string",
	},
	SET_ENTITY_X: {
		actionProperty: "u2_value",
		natLangProperty: "x",
		dictionaryRef: ":number",
	},
	SET_ENTITY_Y: {
		actionProperty: "u2_value",
		natLangProperty: "y",
		dictionaryRef: ":number",
	},
	SET_ENTITY_INTERACT_SCRIPT: {
		actionProperty: "script",
		natLangProperty: "interactScript",
		dictionaryRef: ":string",
	},
	SET_ENTITY_TICK_SCRIPT: {
		actionProperty: "script",
		natLangProperty: "tickScript",
		dictionaryRef: ":string",
	},
	SET_ENTITY_TYPE: {
		actionProperty: "entity_type",
		natLangProperty: "type",
		dictionaryRef: ":string",
	},
	SET_ENTITY_PRIMARY_ID: {
		actionProperty: "u2_value",
		natLangProperty: "primaryID",
		dictionaryRef: ":number",
	},
	SET_ENTITY_SECONDARY_ID: {
		actionProperty: "u2_value",
		natLangProperty: "secondaryID",
		dictionaryRef: ":number",
	},
	SET_ENTITY_PRIMARY_ID_TYPE: {
		actionProperty: "byte_value",
		natLangProperty: "primaryIDtype",
		dictionaryRef: ":number",
	},
	SET_ENTITY_CURRENT_ANIMATION: {
		actionProperty: "byte_value",
		natLangProperty: "animation",
		dictionaryRef: ":number",
	},
	SET_ENTITY_CURRENT_FRAME: {
		actionProperty: "byte_value",
		natLangProperty: "animationFrame",
		dictionaryRef: ":number",
	},
	SET_ENTITY_HACKABLE_STATE_A: {
		actionProperty: "byte_value",
		natLangProperty: "hackableStateA",
		dictionaryRef: ":number",
	},
	SET_ENTITY_HACKABLE_STATE_B: {
		actionProperty: "byte_value",
		natLangProperty: "hackableStateB",
		dictionaryRef: ":number",
	},
	SET_ENTITY_HACKABLE_STATE_C: {
		actionProperty: "byte_value",
		natLangProperty: "hackableStateC",
		dictionaryRef: ":number",
	},
	SET_ENTITY_HACKABLE_STATE_D: {
		actionProperty: "byte_value",
		natLangProperty: "hackableStateD",
		dictionaryRef: ":number",
	},
	SET_ENTITY_HACKABLE_STATE_A_U2: {
		actionProperty: "u2_value",
		natLangProperty: "hackableStateAU2",
		dictionaryRef: ":number",
	},
	SET_ENTITY_HACKABLE_STATE_C_U2: {
		actionProperty: "u2_value",
		natLangProperty: "hackableStateCU2",
		dictionaryRef: ":number",
	},
	SET_ENTITY_HACKABLE_STATE_A_U4: {
		actionProperty: "u4_value",
		natLangProperty: "hackableStateAU4",
		dictionaryRef: ":number",
	},
	SET_ENTITY_PATH: {
		actionProperty: "geometry",
		natLangProperty: "path",
		dictionaryRef: ":string",
	}
}

// adding tedious entity properties to action dictionary

Object.keys(mgs.entityPropertyMap)
	.filter(function (actionName) {
		return actionName.includes('SET_');
	})
	.forEach(function (actionName) {
		var lookup = mgs.entityPropertyMap[actionName];
		var pattern =
			"set entity $entity:string "
			+ lookup.natLangProperty + " ?to "
			+ "$" + lookup.actionProperty + lookup.dictionaryRef;
		var insert = {
			action: actionName,
			pattern: pattern,
		}
		mgs.actionDictionary.push(insert);
	});

Object.keys(mgs.entityPropertyMap)
	.filter(function (actionName) {
		return actionName.includes('CHECK_');
	})
	.forEach(function (actionName) {
		var lookup = mgs.entityPropertyMap[actionName];
		var pattern =
			"if entity $entity:string "
			+ lookup.natLangProperty
			+ " is $" + lookup.actionProperty + lookup.dictionaryRef
			+ " then goto ?script $success_script:string"
		var insert = {
			action: actionName,
			pattern: pattern,
			values: { "expected_bool" : true }
		}
		var patternNeg =
			"if entity $entity:string "
			+ lookup.natLangProperty
			+ " is not $" + lookup.actionProperty + lookup.dictionaryRef
			+ " then goto ?script $success_script:string"
		var insertNeg = {
			action: actionName,
			pattern: patternNeg,
			values: { "expected_bool" : false }
		}
		mgs.actionDictionary.push(insert);
		mgs.actionDictionary.push(insertNeg);
	})
	//TODO!! [lol what is this todo?]

// adding action dictionary items to the "flat" tree
mgs.actionDictionary.forEach(function (item) {
	item = JSON.parse(JSON.stringify(item));
	var values = item.values || {};
	values.action = item.action;
	var autoActionFunction = function (values) {
		return function (state) {
			state.processCaptures("action", values);
		}
	}
	mgs.trees.action.push(
		[
			item.pattern,
			autoActionFunction(values)
		]
	);
})

var mgsTest = natlang.prepareConfig(mgs);

window.mgs = mgs;

mgs.boolPrefs = {
	SET_HEX_EDITOR_STATE: [ 'open', 'close' ], // required due to keywords
	SET_PLAYER_CONTROL: [ 'on', 'off' ],
	SET_HEX_EDITOR_DIALOG_MODE: [ 'on', 'off' ],
	SET_HEX_EDITOR_CONTROL: [ 'on', 'off' ],
	SET_HEX_EDITOR_CONTROL_CLIPBOARD: [ 'on', 'off' ],
	// [ 'true', 'false' ] for everything else
};

mgs.operationPrefs = {
	"SET": "=",
	"ADD": "+",
	"SUB": "-",
	"MUL": "*",
	"DIV": "/",
	"MOD": "%",
	"RNG": "?",
}

mgs.actionToNatlang = function (origJSON) {
	// TODO: dialog integration
	var patternChoices = mgs.actionDictionary
		.filter(function (entry) {
			return entry.action === origJSON.action
		})
	if (patternChoices.length === 0) { //
		console.error(origJSON)
		throw new Error("The above action was not found in the action dictionary! Action: " + origJSON.action);
	}
	if (patternChoices.length > 1) { // filter
		patternChoices = patternChoices
			.filter(function (entry) {
				var commonValues = true;
				if (!entry.values) {
					throw new Error("This action has several dictionary entries but no means of distinguishing them! Action: " + origJSON.action);
				}
				var params = Object.keys(entry.values);
				params.forEach(function (param) {
					if (entry.values[param] !== origJSON[param]) {
						commonValues = false;
					}
				})
				return commonValues;
			})
	}
	if (patternChoices.length === 0) { // overfiltered
		console.error(origJSON)
		throw new Error("The above action was so aggressively filtered there was nothing left! Action: " + origJSON.action);
	} else if (patternChoices.length > 1) { // underfiltered
		if (log) {console.log(origJSON); }
		if (log) {console.log("This action has several dictionary entries and filtering failed to sufficiently distinguish them. Assuming synonyms...."); }
	}
	// Only 1 action dictionary entry remains. (Or, if not, they are hopefully synonyms, and we can just use the first one, which is presumably the "default")
	var wordArray = patternChoices[0].pattern.split(' ');
	var finalWords = [];
	wordArray.forEach(function (word) {
		if (word[0] === "?") {
			finalWords.push(word.substring(1));
		} else if (word[0] === "$") {
			// properly formatting the natlang word
			var varSplits = word.substring(1).split(":");
			var paramName = varSplits[0];
			var extractedWord = origJSON[paramName];
			if (extractedWord === undefined) { // Must explicitly check against undefined, as this value may be `false`!
				console.error(origJSON)
				throw new Error("No parameter named '" + paramName + "' found in action " + origJSON.action);
			}
			var variableType = varSplits[1];
			if (variableType === "operator") {
				extractedWord = mgs.operationPrefs[extractedWord]
					|| extractedWord;
			} else if (
				mgs.boolPrefs[origJSON.action]
				&& variableType === "boolean"
			) {
				extractedWord = extractedWord
					? mgs.boolPrefs[origJSON.action][0]
					: mgs.boolPrefs[origJSON.action][1]
			} else if (variableType === "duration") {
				extractedWord += 'ms';
			} else if (variableType === "distance") {
				extractedWord += 'px';
			} else if (variableType === "quantity") {
				if (extractedWord === 1) {
					extractedWord = "once";
				} else if (extractedWord === 2) {
					extractedWord = "twice";
				} else if (extractedWord === 3) {
					extractedWord = "thrice";
				} else {
					extractedWord += 'x';
				}
			} else if (typeof extractedWord === "string") {
				extractedWord = mgs.makeStringSafe(extractedWord);
			}
			// formatting done
			finalWords.push(extractedWord)
		} else {
			finalWords.push(word);
		}
	})
	return '\t' + finalWords.join(' ');
}

mgs.actionToNatlangComments = function (origJSON) {
	// extract comments from action JSON
	var actionName = origJSON.action;
	var foundParams = {
		action: true
	};
	var dictionaryItem = mgs.actionDictionary.find(function (entry) {
		// just the first one is fine; any should be just as good as another
		return entry.action === actionName;
	})
	var patternSplits = dictionaryItem.pattern.split(' ');
	patternSplits.forEach(function (patternWord) {
		if (patternWord[0] === "$") {
			var splits = patternWord.substring(1).split(":");
			foundParams[splits[0]] = true;
		}
	})
	if (dictionaryItem.values) {
		Object.keys(dictionaryItem.values).forEach(function (extraParam) {
			foundParams[extraParam] = true;
		})
	}
	// foundParams are parameters the action "needs"; all else are comments!
	var comments = [];
	Object.keys(origJSON).forEach(function (paramName) {
		if (!foundParams[paramName]) {
			var cleanComment = origJSON[paramName].replace(/\n/g," ");
			comments.push(`	// ${paramName}: ${cleanComment}`)
		}
	})
	return comments.join('\n');
}

mgs.assessDialogParams = function (dialogObj) {
	// wants MGE dialog JSON
	var entityTallies = {};
	var nameTallies = {};
	var skipParamsLookup = {
		"messages": true,
		"response_type": true,
		"options": true
	}
	var dialogNames = Object.keys(dialogObj);
	dialogNames.forEach(function (dialogName) {
		var dialogChonkArray = dialogObj[dialogName];
		dialogChonkArray.forEach(function (chonk) {
			if (chonk.entity) {
				entityTallies[chonk.entity] = entityTallies[chonk.entity] || {};
				var tallies = entityTallies[chonk.entity];
				var paramNames = Object.keys(chonk);
				var relevantParams = paramNames.filter(function (paramName) {
					return !skipParamsLookup[paramName]
						&& paramName !== "entity"
				})
				relevantParams.forEach(function (paramName) {
					tallies[paramName] = tallies[paramName] || {};
					tallies[paramName][chonk[paramName]] = tallies[paramName][chonk[paramName]] + 1 || 1;
				})
				tallies["TOTAL"] = tallies["TOTAL"] + 1 || 1;
			} else if (chonk.name) {
				nameTallies[chonk.name] = nameTallies[chonk.name] || {};
				var tallies = nameTallies[chonk.name];
				var paramNames = Object.keys(chonk);
				var relevantParams = paramNames.filter(function (paramName) {
					return !skipParamsLookup[paramName]
						&& paramName !== "name"
				})
				relevantParams.forEach(function (paramName) {
					tallies[paramName] = tallies[paramName] || {};
					tallies[paramName][chonk[paramName]] = tallies[paramName][chonk[paramName]] + 1 || 1;
				})
				tallies["TOTAL"] = tallies["TOTAL"] + 1 || 1;
			}
		})
	})
	return {
		entityTallies: entityTallies,
		nameTallies: nameTallies
	};
// yields include:
// {
// 	"%PLAYER%": {
// 		"alignment": {
// 			"BOTTOM_RIGHT": 23,
// 			"TOP_RIGHT": 3
// 		},
// 		"TOTAL": 26
// 	}
// }
}

mgs.getBestTally = function (object) {
	var best = '';
	var bestCount = 0;
	Object.keys(object).forEach(function (param) {
		if (object[param] > bestCount) {
			best = param;
			bestCount = object[param];
		}
	})
	return best;
	// turns
	//	{
	//		"BOTTOM_RIGHT": 23,
	//		"TOP_RIGHT": 3
	//	}
	// into
	//	"BOTTOM_RIGHT"
}

mgs.metaAlignmentAssessment = function (assessment) {
	// wants object from mgs.assessDialogParams()
	var entityNames = Object.keys(assessment.entityTallies);
	var nameNames = Object.keys(assessment.nameTallies);
	var entityAlignments = entityNames.map(function (name) {
		var info = assessment.entityTallies[name];
		var best = mgs.getBestTally(info.alignment);
		return best;
	}) // returns { "%PLAYER%": "BOTTOM_RIGHT", "%SELF%": …}
	var nameAlignments = nameNames.map(function (name) {
		var info = assessment.nameTallies[name];
		var best = mgs.getBestTally(info.alignment);
		return best;
	})
	// if an entity/name gets one vote each (choosing their favorite), what alignment wins?
	var overall = {
		"TOP_RIGHT": 0,
		"TOP_LEFT": 0,
		"BOTTOM_RIGHT": 0,
		"BOTTOM_LEFT": 0
	}
	var totalAlignments = entityAlignments.concat(nameAlignments);
	totalAlignments.forEach(function (alignment) {
		overall[alignment] += 1;
	})
	return overall;
}

mgs.makeStringSafe = function (string) {
	// wrap in double quotes unless the string matches the "bareword" pattern from the lexer
	var safe = string.match(/^[-A-Za-z0-9_.$#]+$/)
	if (safe) {
		return string;
	} else {
		return '"' + string + '"';
	}
}

mgs.intelligentDialogHandler = function (dialogObj, indent) {
	if (!Object.keys(dialogObj).length) {
		return {
			dialogs: {},
			settings: '',
			naiveString: '',
		}
	}
	// optimized for BMG2020 trends... not particularly intelligent otherwise
	indent = indent || '\t' // will replace with desired indent later
	var assessment = mgs.assessDialogParams(dialogObj);
	var metaAlignment = mgs.metaAlignmentAssessment(assessment);
	var globalAlign = mgs.getBestTally(metaAlignment);
	// ^^ we now have the "global" alignment trend

	var entityAlignmentLookup = {};
	var nameAlignmentLookup = {};

	Object.keys(assessment.entityTallies).forEach(function (entityName) {
		// get favorite alignment for each "entity" entry
		var info = assessment.entityTallies[entityName];
		var alignment = mgs.getBestTally(info.alignment);
		entityAlignmentLookup[entityName] = alignment;
	})
	Object.keys(assessment.nameTallies).forEach(function (nameName) {
		// get favorite alignment for each "name" entry
		var info = assessment.nameTallies[nameName];
		var alignment = mgs.getBestTally(info.alignment);
		nameAlignmentLookup[nameName] = alignment;
	})

	// dialog settings node: first, globals to start things off
	var settings
		= `settings for dialog {\n`
		+ `	parameters for global defaults {\n`
		+ `		alignment ${globalAlign}\n`
		+ `	}\n`

	// built-in labels for inconvenient and common identifiers
	var specialCases = {
		"%PLAYER%": "PLAYER",
		"%SELF%": "SELF"
	};

	Object.keys(specialCases).forEach(function (entityName) {
		if (entityAlignmentLookup[entityName]) {
			settings = settings
				+`	parameters for label ${specialCases[entityName]} {\n`
				+`		entity "${entityName}"\n`
			if (entityAlignmentLookup[entityName] !== globalAlign) {
				settings += `		alignment ${entityAlignmentLookup[entityName]}\n`
			}
			settings += `	}\n`
		}
	})
	Object.keys(entityAlignmentLookup)
		// filter out %PLAYER% or %SELF etc (they've been handled already)
		.filter(function (entityName) {
			return !specialCases[entityName];
		})
		.forEach(function (entityName) {
			if (entityAlignmentLookup[entityName] !== globalAlign) {
				settings = settings
				+`	parameters for entity ${mgs.makeStringSafe(entityName)} {\n`
				+`		alignment ${entityAlignmentLookup[entityName]}\n`
				+`	}\n`
			}
		})

	// spacious
	settings = settings + "}\n"

	var result = {
		settings: settings,
		dialogs: {},
		naiveString: ``
	};

	// making the dialogs O.o

	var dialogNames = Object.keys(dialogObj);
	dialogNames.forEach(function (dialogName) {
		var dialogArray = dialogObj[dialogName]; // raw JSON object for that dialog screen/chonk/unit
		var chonks = dialogArray.map(function (dialog) {
			var stringArray = [];
			// IDENTIFIER
			var identifier = specialCases[dialog.entity]
			// any convenience labels for %SELF% and %PLAYER% will be found this way
			if (!identifier) { // if not a special case
				var entityName = dialog.entity;
				if (entityName) { // the dialog is "entity" type
					identifier = mgs.makeStringSafe(entityName);
					// if the "safe" name is wrapped in quotes,
					// must prefix it with `entity` to make it a valid natlang identifier
					// (otherwise it will parse as a dialog message)
					if (identifier[0] === '"') {
						identifier = "entity " + identifier;
					}
				} else { // the dialog is "name" type (only these 2 scenarios are valid in MGE dialog chonks)
					// "name" prefix is ALWAYS required for these; bare names are parsed as (lazy) entity names
					identifier = "name " + mgs.makeStringSafe(dialog.name);
				}
			}
			stringArray.push(`	${identifier}`);

			// PARAMETERS (alignment)
			var defaultAlign = globalAlign;
			if (dialog.entity) { // if it's an "entity" dialog, get its favorite alignment
				defaultAlign
					= entityAlignmentLookup[dialog.entity]
					? entityAlignmentLookup[dialog.entity]
					: defaultAlign // TODO: determine whether this fallback is actually useful
			}
			if (dialog.alignment !== defaultAlign) {
				// if this chonk doesn't use its favorite alignment, include it now
				stringArray.push(`	alignment ${dialog.alignment}`);
			}

			// PARAMETERS (other)
			var paramNames = Object.keys(dialog);
			if (dialog.entity) {
				paramNames = paramNames.filter(function (item) {
					return item !== "entity";
				})
			} else if (dialog.name) {
				paramNames = paramNames.filter(function (item) {
					return item !== "name";
				})
			}
			// entity, name, portrait, alignment, border_tileset are relevent now
			// however we did alignment already:
			paramNames = paramNames.filter(function (item) {
				return item !== "messages"
					&& item !== "response_type"
					&& item !== "options"
					&& item !== "alignment" // has been handled already
			})
			// and we should filter the ones that were used for the identifier
			if (dialog.entity) {
				paramNames = paramNames.filter(function (item) {
					return item !== "entity"
				})
			} else {
				paramNames = paramNames.filter(function (item) {
					return item !== "name"
				})
			}
			// what's left that is "real" is portrait, border_tileset (and possibly name)
			// all others must therefore be comments
			var commentList = {};
			paramNames.forEach(function (paramName) {
				if (
					paramName === "name"
					|| paramName === "portrait"
					|| paramName === "border_tileset"
				) {
					var value = dialog[paramName];
					stringArray.push(`	${paramName} ${mgs.makeStringSafe(value)}`);
				} else {
					commentList[paramName] = dialog[paramName];
				}
			})
			Object.keys(commentList).forEach(function (comment) {
				var cleanComment = dialog[comment].replace(/\n/g," ");
				stringArray.push(`	// ${comment}: ${cleanComment}`);
			})
			// MESSAGES
			var messages = dialog.messages.map(function (message) {
				var line = message // javascript~~
					.replace(/\n/g,"\\n")
					.replace(/\t/g,"    ")
					.replace(/\"/g,"\\\"");
				return `	"${line}"`
			}).join('\n');
			stringArray.push(messages);
			// OPTIONS
			if (dialog.options) {
				dialog.options.forEach(function (option) {
					stringArray.push(`	> "${option.label}" : goto "${mgs.makeStringSafe(option.script)}"`);
				})
			}
			// THE REST OF THE OWL
			var chonk = stringArray.join('\n');
			return chonk;
		})
		var dialogBody = chonks.join('\n\n');
		result.dialogs[dialogName] = dialogBody;
	})
	result.naiveString += result.settings;
	dialogNames.forEach(function (dialogName) {
		var dialogBody = result.dialogs[dialogName];
		result.naiveString += `dialog "${dialogName}" {\n`
		result.naiveString += `${dialogBody}\n`
		result.naiveString += `}\n`
	})
	result.naiveString = result.naiveString.replace(/\t/g, indent);
	return result;
}

mgs.intelligentDualHandler = function (scriptObj, dialogObj, indent) {
	var handledDialogObj = mgs.intelligentDialogHandler(dialogObj);
	var scriptNames = Object.keys(scriptObj)
	var handledDialogNames = [];
	var naiveString = ``;
	if (handledDialogObj && handledDialogObj.settings.length) {
		naiveString += handledDialogObj.settings + '\n';
	}
	var scriptStrings = scriptNames.map(function (scriptName) {
		var stringed = mgs.makeStringSafe(scriptName) + ' {\n'
		var actions = scriptObj[scriptName];
		actions.forEach(function (action) {
			if (
				action.action === "SHOW_DIALOG"
				&& handledDialogObj.dialogs[action.dialog]
				&& !handledDialogNames.includes(action.dialog)
			) {
				handledDialogNames.push(action.dialog);
				var dialogString = handledDialogObj.dialogs[action.dialog];
				dialogString = dialogString.replace(/\t/g,"\t\t");
				stringed += `	show dialog ${mgs.makeStringSafe(action.dialog)} {\n`
					+ `${dialogString}\n`
					+ "	}\n"
			} else {
				stringed += mgs.actionToNatlang(action) + '\n';
			}
			var actionComments = mgs.actionToNatlangComments(action);
			if (actionComments) {
				stringed += actionComments + '\n';
			}
		})
		stringed += '}'
		return stringed;
	})
	naiveString += scriptStrings.join('\n\n');
	var totalDialogNames = Object.keys(handledDialogObj.dialogs);
	var unhandledDialogNames = totalDialogNames.filter(function (dialogName) {
			return !handledDialogNames.includes(dialogName);
		})
	var unhandledDialogStrings = [];
	unhandledDialogNames.forEach(function (dialogName) {
		var insert = `dialog ${mgs.makeStringSafe(dialogName)} {\n`
		insert += handledDialogObj.dialogs[dialogName] + '\n';
		insert += `}`
		unhandledDialogStrings.push(insert);
	})
	if (unhandledDialogStrings.length) {
		naiveString += '\n\n' + unhandledDialogStrings.join('\n');
	}
	if (indent) {
		naiveString = naiveString.replace(/\t/g, indent)
	}
	return naiveString;
}
