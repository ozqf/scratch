'use strict';
const process = require("process");
const Jimp = require('jimp');
const fs = require("fs");
const g_inputDir = "input";
const g_outputDir = "output";

/////////////////////////////////////////////////
// Utility functions
/////////////////////////////////////////////////
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

/////////////////////////////////////////////////
// Realign action
/////////////////////////////////////////////////
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

	// iterate canvas and calc required sizes for canvas and
	// individual frames
	let maxWidth = 0;
	let maxHeight = 0;
	let maxFrameX = 0;
	let maxFrameY = 0;
	const numItems = items.length;
	for (let i = 0; i < numItems; ++i) {
		const item = items[i];
		let w = item.img.bitmap.width;
		let h = item.img.bitmap.height;
		// position offset may cause the required frame size
		// to be larger than just the largest raw source image
		// so check that here
		const offX = item.x * 2;
		if (offX > w) { w = offX; }

		if (w > maxWidth) { maxWidth = w; }
		if (h > maxHeight) { maxHeight = h; }
		if (item.fx > maxFrameX) { maxFrameX = item.fx; }
		if (item.fy > maxFrameY) { maxFrameY = item.fy; }
	}
	const outputPath = `${g_outputDir}/${settings.outputDir}/${settings.fileName}`;
	const frameSizeX = findNext32(maxWidth);
	const frameSizeY = findNext32(maxHeight);
	const canvasX = (maxFrameX + 1) * frameSizeX;
	const canvasY = (maxFrameY + 1) * frameSizeY;
	console.log(`Writing ${outputPath}`);
	console.log(`Furthest frame extents: ${maxFrameX}, ${maxFrameY}`);
	console.log(`Frame size: ${frameSizeX}, ${frameSizeY}`);
	console.log(`Canvas size: ${canvasX}, ${canvasY}`);

	// build canvas
	const fillColour = 0x00000000;
	new Jimp(canvasX, canvasY, fillColour, (err, destImg) => {
		// blit items to canvas
		for (let i = 0; i < numItems; ++i) {
			const item = items[i];

			// chequer
			if (settings.chequer_bg === true) {
				const cx = item.fx * frameSizeX;
				const cy = item.fy * frameSizeY;
				const cw = frameSizeX / 2;
				const ch = frameSizeY / 2;
				fillRect(destImg, cx, cy, cw, ch, 0xff00ffff);
				fillRect(destImg, cx + cw, cy + ch, cw, ch, 0xff00ffff);
			}
			const srcWidth = item.img.bitmap.width;
			const srcHeight = item.img.bitmap.height;
			const cellX = item.fx * frameSizeX;
			const cellY = item.fy * frameSizeY;
			let drawX, drawY;
			// mostly ignoring y offset for now, just place the
			// sprite against the base of the frame.
			// we are assuming sprites will be set on the floor.
			switch (settings.offsetMode) {
				case 1: {
					// TODO: Older janky calc. remove when happy
					// with replacement
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
	const numItems = job.items.length;
	let count = 0;
	for (let i = 0; i < numItems; ++i) {
		const item = job.items[i];
		const path = `${g_inputDir}/${job.settings.inputDir}/${item.src}`;
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
// Scan and generate a palette png from
// the source image
/////////////////////////////////////////////////
function checkBias(colour, biasStr) {
	switch (biasStr) {
		case "blue": {
			const r = ((colour >> 24) & 255);
			const g = ((colour >> 16) & 255);
			const b = ((colour >> 8) & 255);
			return (b > g && b > r);
		}	
		case "red": {
			const r = ((colour >> 24) & 255);
			const g = ((colour >> 16) & 255);
			const b = ((colour >> 8) & 255);
			return (r > g && r > b);
		}
		case "green": {
			const r = ((colour >> 24) & 255);
			const g = ((colour >> 16) & 255);
			const b = ((colour >> 8) & 255);
			return (g > r && g > b);
		}
		default:
		return true;
	}
}

function doPaletteScan(job) {
	const path = job.settings.input;
	const outputPath = job.settings.output;
	const bias = job.settings.bias;
	const area = job.settings.area;
	console.log(`Scanning palette from "${path}" into "${outputPath}" - bias: ${bias}`);
	Jimp
		.read(path)
		.then(img => {
			let colours = [];
			let x = 0;
			let y = 0;
			let w = img.bitmap.width;
			let h = img.bitmap.height;
			if (area) {
				x = area.x;
				y = area.y;
				w = area.w;
				h = area.h;
			}
			for (y = 0; y < h; ++y) {
				for (x = 0; x < w; ++x) {
					let colour = img.getPixelColor(x, y);
					if (!bias || checkBias(colour, bias)) {
						if (colours.indexOf(colour) === -1) {
							colours.push(colour);
						}
					}
				}
			}
			const numColours = colours.length
			console.log(`Found ${numColours} colours`);
			// dump colours to console:
			//console.log(colours.map(c => c.toString(16)).join(", "));
			const fillColour = 0x00000000;
			new Jimp(2, numColours, fillColour, (err, destImg) => {
				let x = 0;
				for (let y = 0; y < numColours; ++y) {
					destImg.setPixelColor(colours[y], x, y);
				}
				destImg.writeAsync(outputPath);
			});
		});
}

/////////////////////////////////////////////////
// Palette swap job
/////////////////////////////////////////////////
function checkPixelSwap(img, x, y, colours) {
	let current = img.getPixelColor(x, y);
	let swap = colours.find(c => c.a === current);
	if (swap) {
		img.setPixelColor(swap.b, x, y);
	}
}

function doPaletteSwap(job) {
	const inputPath = job.settings.input;
	const outputPath = job.settings.output;
	const palettePath = job.settings.palette;
	console.log(`Palette swap`);
	console.log(`in "${inputPath}" out "${outputPath}"`);
	console.log(`swap table ${palettePath}`);
	Jimp
		.read(palettePath)
		.then(paletteImg => {
			let palW = paletteImg.bitmap.width;
			let palH = paletteImg.bitmap.height;
			let colours = [];
			for (let y = 0; y < palH; ++y) {
				colours.push({
					a: paletteImg.getPixelColor(0, y),
					b: paletteImg.getPixelColor(1, y)
				});
			}
			Jimp
				.read(inputPath)
				.then(img => {
					const w = img.bitmap.width;
					const h = img.bitmap.height;
					for (let y = 0; y < h; ++y) {
						for (let x = 0; x < w; ++x) {
							checkPixelSwap(img, x, y, colours);
						}
					}
					img.writeAsync(outputPath);
				});
		});
}

/////////////////////////////////////////////////
// Define actions and read job file
/////////////////////////////////////////////////
const g_actions = [
	{ name: "offset", fn: doOffsetJob },
	{ name: "sheet", fn: doSpritesheetJob },
	{ name: "palette_scan", fn: doPaletteScan },
	{ name: "palette_swap", fn: doPaletteSwap }
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
		const job = jobs[i];
		const action = g_actions.find(x => x.name === job.settings.action);
		if (action) {
			console.log(`Run action "${job.settings.action}"`);
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
