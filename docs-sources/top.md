A simplified approach to writing game content for the DC801 Black Mage Game Engine (MGE).

- The MGE encoder itself still needs its input in the form of JSON; however, exporting MGS Natlang to JSON is straightforward.
- A syntax coloring grammar (tmLanguage) is in development:
	- Github repo: https://github.com/alamedyang/magegamescript-syntax-highlighting
	- Or search for "MageGameScript Colors" in the Visual Studio Code extensions marketplace

![Syntax color sample, using VSCode's "Dark+" theme](docs-images/syntax-color-sample.png)

## MGS Natlang vs JSON

### Original script JSON:

```json
{
	"on_tick-greenhouse": [
		{
			"action": "CHECK_IF_ENTITY_IS_IN_GEOMETRY",
			"entity": "%PLAYER%",
			"geometry": "door-greenhouse",
			"success_script": "leave-greenhouse",
			"expected_bool": true
		},
		{
			"action": "COPY_SCRIPT",
			"script": "ethernettle-uproot-check",
			"comment": "some kind of comment"
		}
	]
}
```

While relatively human readable, the above is difficult to write in practice.

- It's bulky enough that you can't have very much scripting logic on your screen at once.
- It's easy to lose track of what you're doing as you must constantly reference named scripts and dialogs (and serial dialogs) in different files back and forth.
- JSON cannot be commented, so it's inconvenient to leave yourself supplementary information, such as the contents of a dialog you're referencing when scripting a cutscene.
- The parameters for MGE actions are not highly uniform, so it's easy to forget or confuse parameters if you're not copying and pasting actions from nearby.

### MGS Natlang (script):

```
on_tick-greenhouse {
	if entity "%PLAYER%" is inside geometry door-greenhouse
		then goto leave-greenhouse
	copy script ethernettle-uproot-check // some kind of comment
}
```

Apart from the fact that the MGS Natlang won't receive any syntax coloring by default, this is more approachable.

It's more compact, and the nested relationship of the script and its actions is far easier to see at a glance. Human-friendly grammar constructions (e.g. `is inside` vs `is not inside`) makes it much easier to follow script branching logic.

The syntax is flexible:

- White space agnostic.
- Many strings can be unquoted or quoted freely (though anything with a space or any unusual character *must* be wrapped in quotes). Double or single quotes are both fine.
- Many words are optional, and can be included either to increase logical clarity or omitted to decrease word density, e.g. `goto script scriptName` vs `goto scriptName`.
- Certain variables can be formatted in multiple, human-friendly ways, e.g.
	- duration: `1000ms` or `1s` or `1000`
	- quantity: `once` or `1x` or `1`

### Original dialog JSON

```json
{
	"exampleDialogName": [
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "Trekkie",
			"messages": [
				"Me want to wish you a happy birthday,\n%PLAYER%."
			]
		},
		{
			"alignment": "BOTTOM_RIGHT",
			"entity": "%PLAYER%",
			"messages": [
				"Aww, gee, thanks, Farmer\n%Trekkie%!"
			]
		}
	]
}
```

Dialog JSON is more uniform than script JSON is, but its information density is even worse.

### MGS Natlang (dialog):

```
settings for dialog {
	defaults {
		alignment BL
	}
	parameters for label PLAYER {
		entity "%PLAYER%"
		alignment BR
	}
}
```

With MGS Natlang, you can create presets for common dialog settings. As a result, the dialogs themselves are very lightweight, making it effortless to read and write large swaths of them:

```
dialog exampleDialogName {
	Trekkie
	"Me want to wish you a happy birthday, %PLAYER%."

	PLAYER
	"Aww, gee, thanks, Farmer %Trekkie%!"
}
```

And since MGS Natlang is whitespace agnostic, it can become as compact as you want:

```
dialog exampleDialog2 {
	PLAYER "Neat."
}
```

or even

```
dialog exampleDialog2 { PLAYER "Neat." }
```

### MGS Natlang (combined):

However, where MGS Natlang really shines is in combining both script data and dialog data together:

```
settings for dialog {
	parameters for label PLAYER {
		entity "%PLAYER%"
		alignment BR
	}
}
show_dialog-wopr-backdoor {
	set player control to off
	walk entity "%PLAYER%" along geometry wopr-walkin over 600ms
	wait 400ms
	set player control to on
	show dialog {
		PLAYER
		"Whoa! It looks like I found some kind of back door."
	}
	set flag backdoor-found to true
}
```

Now the dialog's content is no longer separated from its context. The dialog no longer needs a name, either, unless another script needs to refer to it, too.

## MGS Natlang block structure

MGS Natlang currently has several types of blocks, each with their block contents enclosed in a pair of matching curly braces:

```
<BLOCK DECLARATION> { <BLOCK BODY> }

// or

<BLOCK DECLARATION> {
	<BLOCK BODY>
}

// etc
```

Some block types can (or must) be nested within others, but blocks cannot be nested arbitrarily.

Unless otherwise marked, assume all entries in the following list are allowed in any quantity (including zero). Numbered items must be given in exactly that order, but all other items can occur in any order within their parent block.

### Quick reference:

- **[dialog settings block](#dialog-settings-block)**
	- **[dialog settings target block](#dialog-settings-target-block)**
		- **[dialog parameter](#dialog-parameters)**
- **[dialog block](#dialog-block)**
	- **[dialog](#dialog)**
		1. **[dialog identifier](#dialog-identifier)** (exactly 1)
		2. **[dialog parameter](#dialog-parameters)**
		3. **[dialog message](#dialog-message)** (at least 1)
		4. **[dialog option](#dialog-option)**
- **[script block](#script-block)**
	- **[action](#actions)**
	- **[show dialog block](#show-dialog-block)**
		- **[dialog](#dialog)**
			1. **[dialog identifier](#dialog-identifier)** (exactly 1)
			2. **[dialog parameter](#dialog-parameters)**
			3. **[dialog message](#dialog-message)** (at least 1)
			4. **[dialog option](#dialog-option)**

In the following definitions, words in parentheses are optional, and words starting with dollar signs are [variables](#mgs-natlang-variables).

## Dialog setting block

These are a means of defining dialog parameters ahead of time so the dialogs themselves can be very lean.

These blocks must occur on the root level.

### Syntax

```
settings (for) dialog {}
```

### Block contents

Any number of [dialog settings target blocks](#dialog-settings-target-block) in any order.

### Behavior

Dialog settings are applied to dialogs in order as the parser encounters them; a dialog settings block partway down the file will affect only the dialogs afterward, and none before.

- **New settings will override old settings.** If you assign the player the alignment `TOP_RIGHT` and then `BOTTOM_RIGHT` back-to-back, dialogs will use `BOTTOM_RIGHT`.
- **Entity settings will override global settings.** If you assign alignment `BOTTOM_LEFT` to the global defaults, and `BOTTOM_RIGHT` to the player entity, dialogs involving the player entity will use `BOTTOM_RIGHT`.
- **Label settings will override entity settings.** [verify this]
- Parameters given in a dialog's body will override any other settings, however.

## Dialog settings target block

Allows you to choose a target for dialog settings.

Found within [dialog settings blocks](#dialog-settings-block).

### Block contents

Any number of [dialog parameters](#dialog-parameters) in any order.

### Syntax

```
(parameters) (for) <TARGET> {}
```

Several choices for `TARGET`:

- `(global) default(s)`
	- Describes the default behavior for all dialogs in the same MGS Natlang file.
	- Of all MGE dialog parameters, only `alignment` is 100% required, so this is a good parameter to include at the global level.
- `entity $string`
	- Describes the default dialog settings for a specific entity.
- `label $bareword`
	- Defines a dialog identifier shortcut or alias to a specific set of settings.
	- The label name *must* be a bareword, not a quoted string.
	- Dialog labels only exist in MGS Natlang (not the MGE itself), and they do not apply to other entity references (such as the target of an action).

### Example dialog settings target block:

```
parameters for label PLAYER {
	entity "%PLAYER%"
	alignment BR
}
```

This is a common use case for dialog settings, after which dialog messages for the player character can be identified with `PLAYER` instead of `entity "%PLAYER%"`.

## Dialog block

Dialog blocks allow you to name and populate a game dialog.

As these dialog blocks don't have any baked-in script context, a dialog name is required.

These blocks must occur on the root level.

[Show dialog blocks](#show-dialog-block) are similar, except that the latter is used inside a [script block](#script-block) and is not required to have a dialog name.

### Syntax

```
dialog $string {}
```

**$string** refers to the dialog's name, and allows external scripts to reference it.

### Block contents

Any number of [dialogs](#dialogs) in the order they are to be seen in-game.

## Script block

These blocks must occur on the root level.

### Syntax

```
(script) $string {}
```

The word `script` is not required. If absent, any string (other than `dialog` and `settings`) will be intepreted as the script name.

### Block contents

Any number of [actions](#actions) in the order they are to be executed in-game.

Some of these may be [show dialog blocks](#show-dialog-block).

See the [action dictionary](#action-dictionary) far below for detailed information on all actions.

## Show dialog block

This block combines a dialog definition (see [dialog block](#dialog-block)) with its use within a script (the `SHOW_DIALOG` action).

Must be used inside a [script block](#script-block).

### Syntax

```
show dialog ($string) {}
```

The dialog name (**$string**) is optional. Internally, the JSON still requires a dialog name, but if absent, the MGS Natlang translator generates one based on the file name and line number. For authors writing content in MGS Natlang exclusively, this will be entirely invisible. Omitting dialog names for one-offs is recommended to keep things clean.

### Block contents

Any number of [dialogs](#dialog) in the order they are to be seen in-game.

### Versus the [`SHOW_DIALOG`](#SHOW_DIALOG) action

The plain action, `show dialog $string`, can "call" a dialog without having to define it in place.

Dialogs being called this way may be defined elsewhere in the file (even further down) or in another file entirely. The MGE encoder, which sees all scripts and all dialogs at the same time, will warn you if you're calling a dialog that doesn't exist.

## Show serial dialog block

Serial dialog blocks will behave similarly to dialog blocks. (They are not yet implemented in MGS Natlang.)

## Dialog

Found within [dialog blocks](#dialog-block) or [show dialog blocks](#show-dialog-block).

Any number of dialogs can be given back-to-back within their parent block.

### Dialog contents

1. [Dialog identifier](#dialog-identifier): exactly 1
2. [Dialog parameter](#dialog-parameter): 0+
3. [Dialog message](#dialog-message): 1+
4. [Dialog option](#dialog-option): 0-4x

### Dialog identifier:

This identifies the "speaker" of the dialog messages that immediately follow. For the most part, this will be a specific entity, though you can also build up a dialog from its component pieces without referring to a specific entity.

There are three choices of identifier syntax:

- `$bareword`
	- The bareword identifier is assumed to be an entity name if there is no dialog settings label by this value. (See [dialog settings target block](#dialog-settings-target-block))
		- Entity names with spaces or other special characters are not eligible for this usage, however.
	- NOTE: A quoted string is NOT allowed here! This string must be a bareword!
- `entity $string`
	- **$string**: an entity's given name (i.e. the entity's name within the Tiled map).
	- This usage also provides the entity name as an `entity` [parameter](#dialog-parameter) for the dialog.
	- `%PLAYER%` and `%SELF%` must use this pattern (and not the bareword pattern) because they contain special characters. As this can be cumbersome, it's probably best to set up a dialog settings label for them so you can use a bareword for an identifier instead.
- `name $string`
	- **$string**: the dialog's display name.
	- This usage also provides a `name` [parameter](#dialog-parameter) for the dialog.

### Dialog parameter:

Several dialog parameters can occur back-to-back.

Syntax for each parameter:

- `entity $string`
	- **$string**: the "given name" of the entity (i.e. the entity's name on the Tiled map). (Wrapping this name in `%`s is entirely unnecessary and will in fact confuse the MGE encoder.)
		- Can be `%PLAYER%` or `%SELF%`, however.
	- A dialog can inherit a `name` and a `portrait` if given an `entity` parameter. (The entity must be a "character entity" for a portrait to be inherited.)
	- The inherited `name` is a relative reference; the dialog display name will be whatever that entity's name is at that moment.
- `name $string`
	- **$string**: a fixed string of no more than 12 ASCII characters. For a relative name instead, wrap a specific entity's name in `%`s.
		- Can be `%PLAYER%` or `%SELF%`.
	- Overrides names inherited via the `entity` parameter.
	- A dialog name is required, either via this parameter or the `entity` parameter.
- `portrait $string`
	- **$string**: the name of a MGE portrait.
	- Overrides portraits inherited via the `entity` parameter.
- `alignment $string`
	- This **$string** must be one of the following:
		- `TR` (or `TOP_RIGHT`)
		- `BR` (or `BOTTOM_RIGHT`)
		- `TL` (or `TOP_LEFT`)
		- `BL` (or `BOTTOM_LEFT`) (<--default)
- `border_tileset $string`
	- **$string**: the name of a MGE tileset.
	- The default tileset is used if none is provided.
- `emote $number`
	- **$number**: the id of the "emote" in that entity's entry in `portraits.json`.
	- The default emote (`0`) will display if not specified.
- `wrap messages (to) $number`
	- **$number**: the number of chars to auto wrap the contents of dialog messages.
	- 42 is default.

### Dialog message:

Any quoted string.

- Each message is a new "text screen" in the game.
- Only ASCII characters will be displayed (or "printed").
- Insert a relative entity name by wrapping it in `%`s.
	- `%PLAYER%` and `%SELF%` are also allowed, which target the player entity or the entity that is running the script, respectively.
	- Words wrapped in `%`s (entity names) will always count as 12 chars when the dialog message is auto-wrapped.
- Insert the value of a MGE variable by wrapping its name in `$`s.
	- Words wrapped in `$`s (variables) will always count as 5 chars when the dialog message is auto-wrapped.
- Some characters must be escaped in the message body, such as double quote: `\"`
	- `\t` (tabs) are auto-converted to four spaces.
	- `\n` (new lines) are honored, but since text is wrapped automatically, don't worry about explicitly hard wrapping your messages unless you want to force the new lines to specific places.
	- `%` and `$` are printable characters unless used in pairs within a single line, in which case the only way to print them is to escape them (e.g. `\%`).
- Word processor "smart" characters such as ellipses (…) or emdashes (—) are auto converted to ASCII equivalents (`...`) (`--`).

### Dialog option

You may have anywhere from zero to four dialog options per dialog. Syntax:

```
> $label:quotedString : (goto) (script) $script:string
```

Usage:

- You may have up to 4 dialog options per dialog.
- As each of these "branches" results in a script `goto`, no dialog messages afterward will be seen. Therefore, any dialog options must come last within the dialog.
- The **label** is what will be shown to the player. As the cursor (approximated with `>`) takes up some room, assume you will only have 39 characters instead of the usual 42.
	- The label behaves like dialog messages in terms of inserting variables (with `$` or `%`), escaped characters, etc.
	- **Must** be wrapped in quotes.
- In the MGE, dialog options are displayed underneath the final dialog message. Therefore, the last dialog message before any options should consist of a single line of no more than 42 characters.
- The words `goto` and `script` are optional. Any string given after the `:` (other than `goto` and `script`) is assumed to be the script name.

### Example dialogs

Bringing this all together in an example [dialog block](#dialog-block):

```
dialog exampleDialog {
	Bob
	"So I heard about this club...."

	Bob
	alignment BR
	"Oh, no. Don't you start."

	Bob
	"No, no, I swear! Hear me out!"
	> "Fine. What club?"
		: goto bobContinueScript
	> "(walk away)"
		: goto bobLeaveScript
	> "(smack %Bob% with a rubber chicken)"
		: goto bobNoveltyScript
}
```

The first dialog consists only of an identifier and a message:

```
Bob
"So I heard about this club...."
```

The next, however, includes a single parameter (in between the identifier and the message):

```
Bob
alignment BR
"Oh, no. Don't you start."
```

The last includes a few dialog options:

```
Bob
"No, no, I swear! Hear me out!"
> "Fine. What club?"
	: goto bobContinueScript
> "(walk away)"
	: goto bobLeaveScript
> "(smack %Bob% with a rubber chicken)"
	: goto bobNoveltyScript
```

In MGS Natlang, white space doesn't matter, so the first option could very well have been written this way:

```
> "Fine. What club?" : goto bobContinueScript
```

## Comments

MGS Natlang supports two kinds of comments, which can appear anywhere in an .mgs file and inside any block.

### Inline comment

```
testScript {
	wait 1000ms
	wait 1000ms // inline comment
}
```

This is the only time that line breaks are syntactic in MGS Natlang — inline comments start with `//` and end either with a line break or the end of the document.
	
The MGS Natlang translator (JSON -> Natlang) will take extraneous properties from actions and the like and turn them into inline comments automatically.

### Block comment

```
/*
Block comment:
Everything inside is a comment!
The lexer ignores it all! WHEEE
*/
```

Anything between a `/*` and a `*/` is part of the block comment, allowing you to put line breaks and/or extensive text inside a comment.

## MGS Natlang variables

In this document's example syntax, variables are marked with `$`. Whatever is put in place of the variable in the example syntax is the variable's **value**.

For the example syntax `entity $string`:

```
entity Alice       // var value = "Alice"
entity Bob         // var value = "Bob"
entity Charlie     // var value = "Charlie"
entity "Tom Honks" // var value = "Tom Honks"
```

A variable's value is what populates the meat of the JSON output, but its **type** affects how each word is validated against patterns in the MGS Natlang syntax tree, and in most cases will also affect how the word may be formatted in the natlang.

This documentation uses two formats, each with a `$` at the front:

- `$type`
	- e.g. `$string` (which means any valid string)
- `$label:type`
	- e.g. `$scriptName:string` (which means any valid string, and also it will be used as a script name)

The variable's label for most purposes doesn't matter much except as a hint as to the variable's purpose, especially if there are multiple variables in the natlang phrase. (It does matter when trying to analyze the JSON output, however.)

### Variable decay

A special property of variable types is "decay" — this means a variable of a specific type may satisfy a variable's requirement for a different type.

Example #1: an action that wants a duration (syntax `wait $duration`)

```
testScript1 {
    wait 150ms // "duration" = ok
    wait 150   // "number" is fine, too
               //    (decays to "duration")
}
```

Example #2: an action that wants a number (syntax: `load slot $number`)

```
testScript2 {
	load slot 1   // "number" = ok
	load slot 1ms // "duration" won't work!
}
```

In most cases, human intuition is enough to predict whether a variable can decay into another type.

Most important to keep in mind is that a variable wanting to be a `string` will be satisfied by either a `bareword` string or a `quotedString` string, but barewords and quoted strings cannot be substituted for each other.

### Variable types and examples

Note that all numbers must be whole numbers.

- `duration`
	- `1000ms`, `1s`
	- Seconds are translated into milliseconds automatically.
	- Must be a whole number. (`1.5s` is invalid.)
- `distance`
	- `32px`, `128pix`
- `quantity`
	- `1x`, `10x`
	- The barewords `once`, `twice`, and `thrice` also count as `quantity`.
	- Note that the `x` comes after the number, not before.
- `number`
	- `-1`, `100`
	- These alone may be negative.
- `color`
	- `#FFF`, `#00EF39`
	- Some bare color names will also work, e.g. `black` or `white`.
- `boolean`:
	- `true`, `yes`, `on`, `open`
	- `false`, `no`, `off`, `close`
	- Some actions will prefer specific pairs of booleans when being translated from JSON, but when translating the other way, any of the above words will work.
		- e.g. `set player control open` = `set player control on`
- `operator`
	- An exhaustive list:
		- equal sign: `=`
		- plus: `+`
		- hyphen: `-`
			- If a `-` is directly before a number, the number will become negative. Be sure to put a space between a `-` and a number if you want the `-` to be interpreted as an operator.
		- asterisk: `*`
		- forward slash: `/`
		- percent sign: `%`
		- question mark: `?`
		- curly braces: `{` and `}` (for block boundaries)
		- parentheses: `(` and `)` (for macros)
	- Actions that call for an operator will also accept the corresponding bare words `SET`, `ADD` etc.
- `bareword`
	- These are limited to alphanumberic characters plus a handful of others:
		- hyphen: `-`
		- underscore: `_`
		- period: `.`
		- dollar sign: `$`
		- pound: `#`
		- exclamation point: `!`
	- Cannot start with hyphen (`-`).
	- If a bareword starts with `$`, it will be interpreted as a constant by the `const!` macro.
	- Barewords will count as quoted strings if wrapped in quotes.
- `quotedString`
	- These can be just about anything as long as it's wrapped in a matching pair of double quotes (`"`) or single quotes (`'`).
		- (It's Javascript under the hood. Be kind!)
	- Quotes and certain other characters must be escaped (`\"`) inside a quoted string.

### General types, limited values

Some action variables will be of a generic MGS Natlang type (such as `string`) but the action itself will only be satisfied by a value from a limited set of words.

In addition, some values are only valid depending on what other game data has been defined, such as entity names, map names, or script names.

In such cases, invalid values are reported by the MGE encoder, not the MGS Natlang parser.

Specifics below:

#### Button IDS

For actions that check the button state.

NOTE: We found that the joystick clicks were aggressive on the hardware, and would trigger at what felt like arbitrary times. While the engine is capable of detecting these clicks, we recommend not using them.

- `MEM0`
- `MEM1`
- `MEM2`
- `MEM3`
- `BIT128`
- `BIT64`
- `BIT32`
- `BIT16`
- `BIT8`
- `BIT4`
- `BIT2`
- `BIT1`
- `XOR`
- `ADD`
- `SUB`
- `PAGE`
- `LJOY_CENTER`
- `LJOY_UP`
- `LJOY_DOWN`
- `LJOY_LEFT`
- `LJOY_RIGHT`
- `RJOY_CENTER`
- `RJOY_UP`
- `RJOY_DOWN`
- `RJOY_LEFT`
- `RJOY_RIGHT`
- `TRIANGLE`
- `X` or `CROSS`
- `O` or `CIRCLE`
- `SQUARE`
- `HAX` (capacitive touch button on the PCB)
- `ANY`

#### Operations

Used with "mutate variable" actions.

- `=` or `SET` — sets a variable to the value given
- `+` or `ADD` — addition
- `-` or `SUB` — subtraction
- `*` or `MUL` — multiplication
- `/` or `DIV` — integer division
- `%` or `MOD` — modulo (remainder)
- `?` or `RNG` — sets a variable to a random value between 0 and the value given minus one

#### Entity animations

The int value for entity animations:

- `0` = idle animation
- `1` = walk animation
- `2` = action animation
- `3`+ = any subsequent animations the entity might have

## Macros

Macros are run after the lexer breaks the original file into tokens but before the tokens are parsed and converted into JSON.

Macros are syntax-agnostic, find-and-replace type processes, but they nonetheless offer a great deal of utility.

### Zigzag (`if` / `else`)

The pattern `if`...`then goto` is used for quite a lot of script actions, but this is verbose and clumsy because every single optional or branching script behavior has to be contained in an *entirely separate script*, as does any shared behavior that follows.

For a simple case, wherein we check a condition to determine whether to do some brief, optional behavior, we need three scripts:

```
load_map-castle-1 {
	if flag saw-castle is false then goto script load_map-castle-1a
	goto script load_map-castle-2
}

load_map-castle-1a {
	show dialog {
		PLAYER "Whoa! Look at the size of it!"
	}
	set flag saw-castle to true
	goto script load_map-castle-2
}

load_map-castle-2 {
	show dialog {
		Guard "State your name!"
	}
}
```

This gets tiresome quickly when a map's `on_load` script may need a dozen or more of these optional behaviors back-to-back, or when an entity's `on_interact` script branches three or more layers deep.

Instead, we can use an abstracted `if` / `else` syntax which this macro will expand into isolated scripts automatically.

Thanks to the zigzag macro, the above scripts could look like this instead:

```
load_map-castle {
	if (flag saw-castle is false) {
		show dialog {
				PLAYER "Whoa! Look at the size of it!"
			}
		set flag saw-castle to true
	}
	show dialog {
		Guard "State your name!"
	}
}
```

The zigzag macro will take this much-shorter script and expand it to resemble the three scripts in the first example, giving each expanded script a name derived from the original.

Note that the actions `RUN_SCRIPT` (`goto script $string`) and `LOAD_MAP` (`load map $string`) will cause the current script slot to jump to an entirely different script. In such cases, any in-progress zigzags will be aborted.

#### Consequences and drawbacks

1. This macro does not understand MGS Natlang syntax at all, and simply moves tokens around into an expanded form somewhat naively. What's more is that this macro does not create procedural scripts intelligently; it will make entirely empty scripts in certain conditions, e.g. when there's no converging behavior after a zigzag.
	- **This is currently a big problem for `on_tick` scripts**, as the game will crash if an empty `on_tick` script is attempted. Several kinds of common `on_tick` behavior will therefore need to be done the old way.
2. This abstracted syntax obscures the fact that script jumps are happening.
	- If you `COPY_SCRIPT` a script containing any zigzag syntax, only actions from the first script chunk will actually be copied.
	- For `on_interact` scripts that must always start from the top on each attempt and for `on_tick` scripts that must loop indefinitely, you will need to **reset** the script as the very last action if there is any zigzagging involved.
3. Any script behavior that needs to be referenced by an external script cannot be made into a zigzag, as the external script needs a script name to reference.

#### Syntax

Zigzags always consist of an `if` statement, at bare minimum:

- `if ( <CONDITION> ) { <BEHAVIOR> }`

```
scriptName {
	behavior-1
	if ( condition-A ) {
		behavior-A
	}
	behavior-2
}
```

- The `if` **condition** is wrapped with parentheses, and the `if` **body** is wrapped with curly braces.
- The `if` body can contain script actions or additional zigzags.
- Normal actions can occur before and after the `if`.
- Actions that occur after the zigzag will happen regardless of whether the `if` condition is met.

`if` statements can be followed by `else if` and `else` in the standard manner, wherein the script logic will take one of many mutually-exclusive paths.

- `else if ( <CONDITION> ) { <BEHAVIOR> }`
- `else { <BEHAVIOR> }`

```
scriptName {
	behavior-1
	if ( condition-A ) {
		behavior-A
	} else if ( condition-B ) {
		behavior-B
	} else if ( condition-C ) {
		behavior-C
	} else {
		behavior-X
	}
	behavior-2
}
```

- If an `if` or `else if` condition is met, no other conditions from that zigzag chain is checked.
- `else` results in behavior that happens if none of the above `if` or `else if` conditions are met.
- Any number of `else if`s is allowed, but only one `else` is allowed.
- Shared behavior will resume after an `else` statement or after the last `else if` statement.

Remember: An `if` and `else if` is *not* equivalent to two `if`s!

Multiple conditions can be checked at the same time with `||` (boolean OR), which indicates that *any* of the given conditions can be true for the branching behavior to occur:

```
scriptName {
	if ( condition-A || condition-B ) {
		behavior-AB
	}
}
```

The equivalent boolean AND (`&&`) is not implemented, however. If you need an AND, you will need to invert the conditions and use OR:

```
// NOT ALLOWED:

if ( you have money && the game is for sale ) {
	buy the game
} else {
	don't buy the game
}

// INSTEAD:

if ( you don't have money || the game is not for sale ) {
	don't buy the game
} else {
	buy the game
}
```

*Any* action with `if`...`then goto` syntax can use this zigzag syntax instead.

### `const!`

This macro emulates compile-time constants. Its main purpose is to help you avoid "magic numbers" in your scripts by allowing you to define an integer or string (or whatever) in a single place, even if you need to use it multiple times.

The macro literally replaces each const with the token collected during its original value assignment.

These consts are *not* meant to be used as variables for in-game logic, as the game will never see the const as a variable at all, but will only see the token captured by the macro during the const's value assignment. To emphasize this point, you cannot change the value of a const once you've defined it. If you find yourself wanting to do this, you probably want to be using a MGE variable instead.

For value assignment:

```
const! ()
```

Inside the above parentheses can be any number of constant assignments:

```
<CONST_NAME> = <VALUE>
```

- `CONST_NAME`: `$` + bareword (e.g. `$varName`)
- `VALUE`: any MGS Natlang variable whatsoever, e.g. any number, string, bareword, duration, etc.

Keep in mind that `$` is used for MGS Natlang variables in his document's example syntax, but this is a different usage, as those variables are to be replaced by values of that variable type, whereas these constants will appear in the final MGS file literally in the form `$_`.

#### Example

```
const! (
	$field = x
	$bigNumber = 9001
	$hamburgers = "Steamed Toast"
)

testScript {
	set entity $hamburgers $field to $bigNumber
}
```

After the macro does its work, the script `testScript` instead will read:

```
testScript {
	set entity "Steamed Toast" x to 9001
}
```

The above is what the MGS Natlang syntax parser will actually parse. Syntax errors (if any) will be caught at that point and not before; the macro literally doesn't care what the underlying syntax is.

## Action dictionary

These dictionary entries use the default JSON action parameter names, e.g. `entity` for an entity's name (syntax: `entity $entity:string`).

Some of these patterns may also have some hidden parameters built in to the phrasing, such as "is" and "is not" incorporating the action parameter `expected_bool`. These will be noted when they occur.

As a reminder, words in parentheses are optional. For example, the dictionary pattern:

```
set entity $entity:string tick_script (to) $string:string 
```

will be satisfied by either of the following:

```
set entity "Entity Name" tick_script to scriptName
set entity "Entity Name" tick_script scriptName
```