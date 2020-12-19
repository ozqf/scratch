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

function findNextPowerOfTwo(num) {
	let val = 2;
	while (val < num) { val *= 2; }
	return val;
}

function findNext32(num) {
	let val = 32;
	while (val < num) { val += 32; }
	return val;
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

function fillRect(image, startX, startY, w, h, colourHex) {
	let endX = startX + w;
	let endY = startY + h;
	for (let y = startY; y < endY; ++y) {
		for (let x = startX; x < endX; ++x) {
			image.setPixelColor(colourHex, x, y);
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
function spriteSheetImagesLoaded(settings, items) {
	let maxWidth = 0;
	let maxHeight = 0;
	let maxFrameX = 0;
	let maxFrameY = 0;
	let numItems = items.length;
	for (let i = 0; i < numItems; ++i) {
		let item = items[i];
		let w = item.img.bitmap.width;
		let h = item.img.bitmap.height;
		let offX = item.x * 2;
		if (offX > w) { w = offX; }
		// TODO: Not taking into account the offset of
		// the sprite. the offset may place the sprite
		// off to one side, increasing the width!
		if (w > maxWidth) {
			maxWidth = w;
		}
		if (h > maxHeight) {
			maxHeight = h;
		}
		if (item.fx > maxFrameX) {
			maxFrameX = item.fx;
		}
		if (item.fy > maxFrameY) {
			maxFrameY = item.fy;
		}
	}
	let outputPath = `${g_outputDir}/${settings.outputDir}/${settings.fileName}`;
	let frameSizeX = findNext32(maxWidth);
	let frameSizeY = findNext32(maxHeight);
	// let canvasX = findNextPowerOfTwo((maxFrameX + 1) * frameSizeX);
	// let canvasY = findNextPowerOfTwo((maxFrameY + 1) * frameSizeY);
	let canvasX = (maxFrameX + 1) * frameSizeX;
	let canvasY = (maxFrameY + 1) * frameSizeY;
	console.log(`Writing ${outputPath}`);
	console.log(`Furthest frame positions: ${maxFrameX}, ${maxFrameY}`);
	console.log(`Frame size: ${frameSizeX}, ${frameSizeY}`);
	console.log(`Canvas size: ${canvasX}, ${canvasY}`);
	// build canvas
	let fillColour = 0x00000000;
	new Jimp(canvasX, canvasY, fillColour, (err, destImg) => {
		// blit
		for (let i = 0; i < numItems; ++i) {
			let item = items[i];

			// chequer
			if (settings.chequer_bg === true) {
				let cx = item.fx * frameSizeX;
				let cy = item.fy * frameSizeY;
				let cw = frameSizeX / 2;
				let ch = frameSizeY / 2;
				fillRect(destImg, cx, cy, cw, ch, 0xff00ffff);
				fillRect(destImg, cx + cw, cy + ch, cw, ch, 0xff00ffff);
			}
			let srcWidth = item.img.bitmap.width;
			let srcHeight = item.img.bitmap.height;
			const cellX = item.fx * frameSizeX;
			const cellY = item.fy * frameSizeY;
			let drawX, drawY;
			// mostly ignoring y offset for now, just place the
			// sprite against the base of the frame.
			// we are assuming sprites will be set on the floor.
			switch (settings.offsetMode) {
				case 1: {
					drawX = cellX;
					drawY = cellY;
					let offX = (frameSizeX / 2) - (srcWidth - item.x);
					drawX += offX;
					drawY += frameSizeY - srcHeight;
				} break;
				default: {
					// draw from centre bottom of frame, and offset
					// up and left:
					let itemX = item.x;
					if (item.flipX === true) {
						itemX = srcWidth - itemX;
					}
					drawX = cellX + (frameSizeX / 2) - itemX;
					drawY = cellY + (frameSizeY - srcHeight);
				} break;
			}
			
			destImg.blit(item.img, drawX, drawY);
		}

		destImg.writeAsync(outputPath);
	});
	console.log(`\tDone.`);
}

function doSpritesheetJob(job) {
	let numItems = job.items.length;
	let count = 0;
	for (let i = 0; i < numItems; ++i) {
		let item = job.items[i];
		let path = `${g_inputDir}/${job.settings.inputDir}/${item.src}`;
		//console.log(`Load ${path}`);
		Jimp
			.read(path)
			.then(img => {
				if (item.flipX) {
					img.flip(true, false);
				}
				item.img = img;
				count += 1;
				if (count == numItems) {
					spriteSheetImagesLoaded(job.settings, job.items);
				}
			});
	}
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
