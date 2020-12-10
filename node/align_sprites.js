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
const inputDir = "input";
const outputDir = "output";
const jobs = JSON.parse(fs.readFileSync(`input/jobs.json`, "utf-8"));

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

function doJob(job) {
	Jimp.read(`${inputDir}/${job.src}`).then(img => {
		const srcW = img.bitmap.width;
		const srcH = img.bitmap.height;
		const offX = job.x;
		const offY = job.y;
		console.log(`Read ${job.src} - ${srcW} by ${srcH} off ${offX} by ${offY}`);
		// console.log(`\t${srcW} by ${srcH} pixels`);
		// console.log(`\tAlignment: ${offX} by ${offY}`);
		let newW, newH, x, y;
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
		new Jimp(newW, newH, 0xffffffff, (err, destImg) => {
			fillChequer(destImg);
			destImg.blit(img, x, y);
			destImg.writeAsync(`${outputDir}/${job.out}`);
		});
	}).catch(err => {
		console.error(err);
	});
}

const numJobs = jobs.length;
console.log(`Read ${numJobs} jobs`);
for (let i = 0; i < numJobs; ++i) {
	doJob(jobs[i]);
}
