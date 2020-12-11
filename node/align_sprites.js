'use strict';
const process = require("process");
const Jimp = require('jimp');
const fs = require("fs");
const jobs2 = [
	{
		//source: "C:\\Dropbox\\projects\\assets\\Freedoom_Sprites_Sorted\\Player\\PLAYA1.png",
		src: "input\\PLAYA1.png",
		out: "output\\player_a_1.png",
		x: 22,
		y: 52
	}
];
const g_inputDir = "input";
const g_outputDir = "output";
const g_data = JSON.parse(fs.readFileSync(`input/jobs.json`, "utf-8"));
const g_jobs = g_data.jobs;

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

function doJob(settings, job) {
	Jimp.read(`${g_inputDir}/${settings.inputDir}/${job.src}`).then(img => {
		const srcW = img.bitmap.width;
		const srcH = img.bitmap.height;
		const offX = job.x;
		const offY = job.y;
		console.log(`Read ${job.src} - ${srcW} by ${srcH} off ${offX} by ${offY}`);
		// console.log(`\t${srcW} by ${srcH} pixels`);
		// console.log(`\tAlignment: ${offX} by ${offY}`);
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
		/*
		eg
		41 by 56
		22 by 52
		*/
		console.log(`Writing to ${job.out} (${newW} by ${newH} at ${x}, ${y})`);
		let fillColour = 0x00000000;
		if (settings.chequer_bg === true) {
			fillColour = 0xffffffff
		}
		new Jimp(newW, newH, fillColour, (err, destImg) => {
			if (settings.chequer_bg === true) {
				fillChequer(destImg);
			}
			destImg.blit(img, x, y);
			destImg.writeAsync(`${g_outputDir}/${settings.outputDir}/${job.out}`);
		});
	}).catch(err => {
		console.error(err);
	});
}

const numJobs = g_jobs.length;
console.log(`Read ${numJobs} jobs\n`);
for (let i = 0; i < numJobs; ++i) {
	let job = g_jobs[i];
	let numItems = job.items.length;
	console.log(`\tRead ${numItems} items`);
	for (let j = 0; j < numItems; ++j) {
		doJob(job.settings, job.items[j]);
	}
}
