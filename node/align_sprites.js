const process = require("process");
const Jimp = require('jimp');
const jobs = [
	{
		source: "C:\\Dropbox\\projects\\assets\\Freedoom_Sprites_Sorted\\Player\\PLAYA1.png",
		output: "player_a_1.png",
		offsetX: 22,
		offsetY: 52
	}
];

function fatal(err) {
	console.error(err);
	process.exit(1);
}

function doJob(job) {
	Jimp.read(job.source).then(img => {
		console.log(`Read ${job.source}`);
		const srcW = img.bitmap.width;
		const srcH = img.bitmap.height;
		const offX = job.offsetX;
		const offY = job.offsetY;
		console.log(`\t${srcW} by ${srcH} pixels`);
		console.log(`\tAlignment: ${offX} by ${offY}`);
	}).catch(err => {
		console.error(err);
	});
}

const numJobs = jobs.length;
console.log(`Read ${numJobs} jobs`);
for (let i = 0; i < numJobs; ++i) {
	doJob(jobs[i]);
}
