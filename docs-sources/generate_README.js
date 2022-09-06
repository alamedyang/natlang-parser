var fs = require('fs');

var modules = [
	'../natlang-lex.js',
	'../natlang-parse.js',
	'../natlang-config-mage_game_script.js',
	'../mgs-to-natlang.js',
	'mid.js',
];

var moduleString = '';

modules.forEach(function (filePath) {
	moduleString += '\n' + fs.readFileSync(`${__dirname}/${filePath}`);
})

eval(moduleString); // make real modules soon pls~

// THE REST OF THE OWL

var outputFileName = '../README.md';

var top = fs.readFileSync('top.md',"utf-8");
var bot = fs.readFileSync('bot.md',"utf-8");

var pieces = [
	top,
	mid,
	bot
]

var output = pieces.join('\n\n');

fs.writeFileSync(outputFileName, output);
