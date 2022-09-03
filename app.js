var app = new Vue({
	el:' #app',
	data: {
		which: 'split',
		origInput: testText,
		lexOutput: {},
		combo: {
			origScript: '{}',
			origDialog: '{}',
			indent: '\t',
			natlang: '',
		},
		split: {
			natlang: oldCoupleHouseNatlang,
			fileName: "untitledFile",
			script: "",
			dialog: "",
		}
	},
	computed: {
		lexSuccess: function () {
			return this.lexOutput && this.lexOutput.numErrors && this.lexOutput.numErrors === 0;
		},
		lexResult: function () {
			return this.lexSuccess ? this.lexOutput.tokens : null;
		},
		lexErrors: function () {
			return this.lexSuccess ? this.lexOutput.messages : null;
		},
	},
	methods: {
		lexInput: function () {
			this.lexOutput = natlang.lex(this.origInput);
		},
		makeComboNatlang: function () {
			this.combo.natlang = mgs.intelligentDualHandler(
				JSON.parse(this.combo.origScript),
				JSON.parse(this.combo.origDialog),
				this.combo.indent
			);
		},
		makeSplitJSONs: function () {
			var safeInput = this.split.natlang;
			var result = natlang.parse(
				mgsTest,
				safeInput,
				this.split.fileName
			);
			this.split.dialog = JSON.stringify(result.dialogs, null, '  ');
			this.split.script = JSON.stringify(result.scripts, null, '  ');
		},
		changeWhich: function (word) {
			this.which = word;
		}
	},
	template: /*html*/`
<div id="app">
	<p>
		<button
			@click="changeWhich('lex')"
		>Lex tester</button>
		<button
			@click="changeWhich('combo')"
		>JSON pair to natlang</button>
		<button
			@click="changeWhich('split')"
		>Natlang to JSON pair</button>
	</p>
	<hr />
	<div
		v-if="which === 'combo'"
	>
		<h3>Original script JSON:</h3>
		<p><textarea
			rows="5" cols="80"
			v-model="combo.origScript"
		></textarea></p>
		<h3>Original dialog JSON:</h3>
		<p><textarea
			rows="5" cols="80"
			v-model="combo.origDialog"
		></textarea></p>
		<hr />
		<h1>
			<span>Make natlang!</span>
			<button
				@click="makeComboNatlang"
			>GO!</button>
		</h1>
		<p>(If problems arise, check the console.)</p>
		<textarea
			rows="20" cols="80"
			v-model="combo.natlang"
		></textarea>
	</div>
	<div
		v-if="which === 'split'"
	>
		<h3>File name:</h3>
		<p><textarea
			rows="1" cols="20"
			v-model="split.fileName"
		></textarea></p>
		<h3>Original natlang:</h3>
		<p><textarea
			rows="10" cols="80"
			v-model="split.natlang"
		></textarea></p>
		<hr />
		<h1>
			<span>Make splits!!</span>
			<button
				@click="makeSplitJSONs"
			>GO!</button>
		</h1>
		<p>(If problems arise, check the console.)</p>
		<h3>Script JSON:</h3>
		<textarea
			rows="20" cols="80"
			v-model="split.script"
		></textarea>
		<h3>Dialog JSON:</h3>
		<textarea
			rows="20" cols="80"
			v-model="split.dialog"
		></textarea>
	</div>
	<div
		v-if="which === 'lex'"
	>
		<textarea
			rows="20" cols="80"
			v-model="origInput"
		></textarea>
		<p>
			<button
				@click="lexInput"
			>LEX!</button>
		</p>
		<pre>{{lexOutput}}</pre>
	</div>
</div>
`});
