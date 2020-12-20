'use strict';

const cfgTitan = {
	input: "input/job_text_titan.txt",
	output: "input/jobs_titan_sheet.json",
	sourceDir: "titan",
	fileName: "titan_sheet.png"
};

const cfgCyclops = {
	input: "input/job_text_cyclops.txt",
	output: "input/jobs_cyclops_sheet.json",
	sourceDir: "cyclops",
	fileName: "cyclops_sheet.png"
};

const cfg = cfgCyclops;
//const cfg = cfgTitan;

const fs = require("fs");
const lineSplitter = '\r\n'
let lines = fs
	.readFileSync(cfg.input, "utf-8")
	.split(lineSplitter)
	.filter(x => x !== '');
console.log(`Read ${lines.length} lines`);
/*
line eg "CYBRA1.png 0 0 47 103 flipX"
CYBRA1.png source image (src)
0 spritesheet cell X (fx)
0 spritesheet cell Y (fy)
47 offsetX (x)
103 offsetY (y)
(flipX: true)
*/
let items = [];
lines.forEach(line => {
	const tokens = line.split(' ');
	if (tokens.length < 5) { return; }
	let flipX = false;
	if (tokens.length === 6 && tokens[5] === "flipX") {
		flipX = true;
	}
	items.push({
		src: tokens[0],
		fx: Number(tokens[1]),
		fy: Number(tokens[2]),
		x: Number(tokens[3]),
		y: Number(tokens[4]),
		flipX: flipX
	});
});

const data = {
	jobs: [
		{
			settings: {
				action: "sheet",
				chequer_bg: false,
				inputDir: cfg.sourceDir,
				outputDir: "",
				fileName: cfg.fileName
			},
			items: items
		}
	]
}
const g_outputText = JSON.stringify(data, null, 4);
console.log(`Writing ${g_outputText.length} chars to ${cfg.output}`);
fs.writeFileSync(cfg.output, g_outputText);
