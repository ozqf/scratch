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

const cfgGroup = {
	input: "input/job_text.txt",
	output: "",
	sourceDir: "",
	fileName: ""
};

const cfg = cfgGroup;
const { exception } = require("console");
//const cfg = cfgTitan;

const fs = require("fs");
const g_lineSplitter = '\r\n'
let g_lines = fs
	.readFileSync(cfg.input, "utf-8")
	.split(g_lineSplitter)
	.filter(x => x !== '');
console.log(`Read ${g_lines.length} lines`);

function parseLine(tokens, items) {
	if (tokens.length < 5) {
		throw `Bad token count at line ${i + 1}: "${line}"`;
	}
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
}

function scanForJobs(lines) {
	// Scan for sets and build jobs
	const lineCount = lines.length;
	let jobs = [];
	let job = null;
	for (let i = 0; i < lineCount; ++i) {
		const line = lines[i];
		const tokens = line.split(' ');
		const numTokens = tokens.length;
		if (tokens[0] == "@@") {
			if (job !== null) {
				// finish current job
				job = null;
			}
			if (numTokens < 3) {
				throw `job heading lacks tokens: "${line}"`;
			}
			job = {
				settings: {
					action: "sheet",
					chequer_bg: false,
					fileName: tokens[1],
					inputDir: tokens[2],
					outputDir: ""
				},
				items: []
			};
			jobs.push(job);
		}
		else {
			parseLine(tokens, job.items);
		}
	}
	return jobs;
}

function save(jobs) {
	const output = {
		jobs: jobs
	};
	const text = JSON.stringify(output, null, 4);
	console.log(`Saving ${text.length} chars`);
	fs.writeFileSync("input/spritesheet_jobs.json", text);
}

const g_jobs = scanForJobs(g_lines);
g_jobs.forEach(j => console.log(`\t${j.settings.fileName} - ${j.items.length} items`));
save(g_jobs);

/*
line eg "CYBRA1.png 0 0 47 103 flipX"
CYBRA1.png source image (src)
0 spritesheet cell X (fx)
0 spritesheet cell Y (fy)
47 offsetX (x)
103 offsetY (y)
(flipX: true)
*/

/*
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
*/
