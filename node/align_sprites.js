'use strict';
const process = require("process");
const Jimp = require('jimp');
const fs = require("fs");
const g_inputDir = "input";
const g_outputDir = "output";

function fatal(err) {
	console.error(err);
	process.exit(1);
}

function fillChequer(image) {
	let w = image.bitmap.width;
	let h = image.bitmap.height;
	let hw = w / 2;
	let hh = h / 2;
	// top left
	for (let y = 0; y < hh; ++y) {
		for (let x = 0; x < hw; ++x) {
			image.setPixelColor(0xff00ffff, x, y);
		}
	}
	// top bottom right
	for (let y = hh; y < h; ++y) {
		for (let x = hw; x < w; ++x) {
			image.setPixelColor(0xff00ffff, x, y);
		}
	}
}

function doAlignItem(settings, job) {
	Jimp
		.read(`${g_inputDir}/${settings.inputDir}/${job.src}`)
		.then(img => {
			
		const srcW = img.bitmap.width;
		const srcH = img.bitmap.height;
		const offX = job.x;
		const offY = job.y;
		
		let newW = offX * 2;
		let newH = offY * 2; 
		let x = 0, y = 0;
		if (newW < srcW) {
			newW = (srcW - offX) * 2;
			x = Math.ceil(srcW / 2) - offX;
		}
		else {
			newW = offX * 2;
			x = 0;
		}
		if (newH < srcH) {
			newH = (srcH - offY) * 2;
			y = Math.ceil(srcH / 2) - offY;
		}
		else {
			newH = offY * 2;
			y = 0
		}
		console.log(`Read ${job.src} - ${srcW} by ${srcH} off ${offX} by ${offY} to ${job.out} (${newW} by ${newH} at ${x}, ${y})`);
		let fillColour = 0x00000000;
		if (settings.chequer_bg === true) {
			fillColour = 0xffffffff
		}
		new Jimp(newW, newH, fillColour, (err, destImg) => {
			if (settings.chequer_bg === true) {
				fillChequer(destImg);
			}
			destImg.blit(img, x, y);
			if (job.flipX === true) {
				destImg.flip(true, false);
			}
			destImg.writeAsync(`${g_outputDir}/${settings.outputDir}/${job.out}`);
		});
	}).catch(err => {
		console.error(err);
	});
}

/////////////////////////////////////////////////
// Realign action
/////////////////////////////////////////////////
function doOffsetJob(job) {
	const numItems = job.items.length;
	console.log(`\tRead ${numItems} items`);
	for (let j = 0; j < numItems; ++j) {
		doAlignItem(job.settings, job.items[j]);
	}
}

/////////////////////////////////////////////////
// Spritesheet action
/////////////////////////////////////////////////
function doSpritesheetJob(job) {
	const frameX = job.settings.frameWidth;
	const frameY = job.settings.frameHeight;
	const sheetX = job.settings.sheetWidth;
	const sheetY = job.settings.sheetHeight;
	console.log(`Create sprite sheet.`);
	console.log(`Frame size ${frameX}, ${frameY} total sheet space ${sheetX}, ${sheetY}`);

}

/////////////////////////////////////////////////
// Define actions and read job file
/////////////////////////////////////////////////
const g_actions = [
	{ name: "offset", fn: doOffsetJob },
	{ name: "sheet", fn: doSpritesheetJob }
];

console.log(`${g_actions.length} actions`);

function runJobsFile(fileName) {
	if (!fileName.endsWith(`.json`)) {
		fileName = `${fileName}.json`;
	}

	const path = `${g_inputDir}/${fileName}`;
	console.log(`Reading jobs file "${path}"`);
	const data = JSON.parse(fs.readFileSync(path, "utf-8"));
	const jobs = data.jobs;
	const numJobs = jobs.length;
	console.log(`Read ${numJobs} jobs\n`);

	for (let i = 0; i < numJobs; ++i) {
		let job = jobs[i];
		let action = g_actions.find(x => x.name === job.settings.action);
		if (action) {
			console.log(`Run action "${job.settings.action}" with ${job.items.length} items`);
			action.fn(job);
		}
		else {
			console.log(`Found no job action ${job.settings.action}`);
			console.log(`Available actions are:`);
			console.log(g_actions.map(x => x.name));
		}
	}
}

const g_numArgs = process.argv.length;
//console.log(`Args `, process.argv);
runJobsFile(process.argv[g_numArgs - 1]);
