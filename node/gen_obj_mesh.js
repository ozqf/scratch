/*
Script for generating primitive (and sub-optimal!) .obj mesh files for prototyping.
> main intention is to output cuboids with automatically scaled uvs so that textures
are not stretched but tiled.
(This means same texture for each side unfortuneately)

Notes:

http://paulbourke.net/dataformats/obj/
https://en.wikipedia.org/wiki/Wavefront_.obj_file

v x y z w
	Specifies a geometric vertex and its x y z coordinates
	w is the weight required for rational curves and surfaces. It is
    not required for non-rational curves and surfaces. If you do not
    specify a value for w, the default is 1.0.

vn i j k
	Specifies a normal vector with components i, j, k
	When vertex normals are present, they supersede smoothing groups.

vt u v w
	Specifies a texture vertex with components u v w
	w is optional value for the depth, default 0


Components are numbered as they are encountered, starting at 1
	v 1 0 0 	vertex 1
	v 0 0 1		vertex 2

Referencing groups of vertices
For faces and surfaces, reference component vertices by their number with /
and no spaces! Number of components must be consistent
portion of a sample file for a four-sided face element:
	f 1/1/1 2/2/2 3/3/3 4/4/4
	f v/vt/vn v/vt/vn v/vt/vn v/vt/vn



////////////////////////////////////////////////////////
// Quake .map
It would be nice to be able to read geometry from .map files...

https://quakewiki.org/wiki/Quake_Map_Format
- doesn't store verts directly!

https://developer.valvesoftware.com/wiki/Source_BSP_File_Format
https://developer.valvesoftware.com/wiki/Valve_Map_Format#Planes
https://github.com/id-Software/Quake-III-Arena/tree/master/q3map
https://github.com/id-Software/Quake-III-Arena/search?q=MakeVisibleBspFaceList&unscoped_q=MakeVisibleBspFaceList
https://github.com/id-Software/Quake-III-Arena/blob/dbe4ddb10315479fc00086f08e25d968b4b43c49/q3map/facebsp.c

*/

// fetch required modules
const fs = require("fs");
const utils = require("./gen_obj_utils.js");
const g_verbose = false;

/////////////////////////////////////////////
// Output
/////////////////////////////////////////////
function writeFile(path, data) {
	console.log(`Writing ${data.length} chars to ${path}`);
	fs.writeFileSync(path, data);
}

function readJobs(path) {
	let jobs = JSON.parse(fs.readFileSync(path, "utf-8"));
	console.log(`Read ${jobs.batches.length} jobs from ${path}`);
	return jobs;
}

console.log(`Zqf simple .obj mesh generator`);

function buildConfig(jobFile, job, sizeArr) {
	let cfg = {};
	cfg.textureRes = g_jobFile.textureResolution;
	cfg.pixelsPerMetre = g_jobFile.pixelsPerMetre;
	cfg.size = {
		x: sizeArr[0],
		y: sizeArr[1],
		z: sizeArr[2]
	};
	cfg.halfSize = {
		x: cfg.size.x / 2,
		y: cfg.size.y / 2,
		z: cfg.size.z / 2
	};
	cfg.outputName = `${job.name}_${cfg.size.x}x${cfg.size.y}x${cfg.size.z}`;
	cfg.outputPath = `${jobFile.outputPath}/${job.name}/${cfg.outputName}.obj`;
	return cfg;
}

/////////////////////////////////////////////
// run jobs file
/////////////////////////////////////////////
let g_jobFile = readJobs("gen_obj_mesh_jobs.json");

// this config object will be reused. per-job stuff patched in
// let g_config = {};
// g_config.textureRes = g_jobFile.textureResolution;
// g_config.pixelsPerMetre = g_jobFile.pixelsPerMetre;
let g_jobs = [];
g_jobFile.batches.forEach(job => {
	// prepare names and paths
	// result object name
	//g_config.outputName = job.name;

	// iterate sizes
	// TODO: Currently have to make the directories manually!
	job.sizes.forEach(sizeArray => {
		//let path = `${g_}`;
		g_jobs.push(buildConfig(g_jobFile, job, sizeArray));
	});
});

console.log(`Built ${g_jobs.length} jobs`);
console.log(`\teg: `, g_jobs[0]);

function findJobOfSize(jobs, size, ignoreIndex) {
	for (let i = 0; i < jobs.length; ++i) {
		if (i === ignoreIndex) { continue; }
		let job = jobs[i];
		if (job.size.x === size.x
			&& job.size.y === size.y
			&& job.size.z === size.z) {
			return i;
		}
	}
	return -1;
}

// look for dupes
let foundDupe = false;
g_jobs.forEach((job, i) => {
	let indexOfDupe = findJobOfSize(g_jobs, job.size, i);
	if (indexOfDupe !== -1) {
		console.log(`Duplicate size at job ${indexOfDupe}: `, job.size);
		foundDupe = true;
	}
});
if (foundDupe) {
	return;
}
g_jobs.forEach(job => {
	test_tris(job);
});

/////////////////////////////////////////////
// Read args
/////////////////////////////////////////////
/*
let args;
if (process.argv.length === 2) {
	// Use command line args
	args = [ "test_tris", 2, 1, 4, 128, 128, "foo" ];
}
else if (process.argv.length === 9) {
	// use hard coded test args
	args = process.argv.slice(2);
}
else {
	// abort
	console.log(`incorrect arg count.`);
	return;
}
*/

//console.log(`Args ${args}`);

/*
let g_config = {};
g_config.shape = args[0];
g_config.size = {
	x: parseFloat(args[1]),
	y: parseFloat(args[2]),
	z: parseFloat(args[3]),
};
g_config.halfSize = {
	x: g_config.size.x / 2,
	y: g_config.size.y / 2,
	z: g_config.size.z / 2,
};
g_config.textureRes = parseFloat(args[4]); 			// eg 128 for retro 3D
g_config.pixelsPerMetre = parseFloat(args[5]);		// eg 64 how many in-world metres does the texture res stretch over?
g_config.outputName = args[6];						// result object name
g_config.outputPath = `./zqf_auto/mesh/${g_config.outputName}.obj`; // result file name


switch (g_config.shape) {
	case "test":
	console.log(`test mode`);
	//test(cfg);
	break;
	case "test_tris":
	test_tris(g_config);
	break;
	default:
	console.log(`Unknown shape type ${g_config.shape}`);
	return;
}
*/

/////////////////////////////////////////////
// Calc
/////////////////////////////////////////////
/*
function quickUVCalc(cfg) {
	// eg 64 * 1 == 64 pixels, half a 128 texture
	const totalPixelsCovered = cfg.pixelsPerMetre * cfg.size.x;
	console.log(`Total pixels over ${cfg.size.x} metres at ${cfg.pixelsPerMetre} per metre: ${totalPixelsCovered}`);
	// eg 64 / 128 == 0.5
	const uvWidth = cfg.textureRes / totalPixelsCovered;
	console.log(`\tUV width ${uvWidth}`);
}
*/

function calcTriUVs(tri, cfg) {
	// console.log(`Calc tri UVs`);
	// console.log(JSON.stringify(tri, null, 2));
	let minX = Number.POSITIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY;
	let minZ = Number.POSITIVE_INFINITY;
	let maxX = Number.POSITIVE_NEGATIVE;
	let maxY = Number.POSITIVE_NEGATIVE;
	let maxZ = Number.POSITIVE_NEGATIVE;
	for (let i = 0; i < 3; ++i) {
		let v = tri.verts[i];
		if (v.x < minX) { minX = v.x; }
		if (v.y < minY) { minY = v.y; }
		if (v.z < minZ) { minZ = v.z; }
		
		if (v.x > maxX) { maxX = v.x; }
		if (v.y > maxY) { maxY = v.y; }
		if (v.z > maxZ) { maxZ = v.z; }
	}
	// for now, assuming we can use mesh width and height
	// normal will be 0, 0, 1
	let n = tri.normal;
	tri.verts[0].u = cfg.size.x;
	tri.verts[0].v = cfg.size.y;
	tri.verts[1].u = cfg.size.x;
	tri.verts[1].v = cfg.size.y;
	tri.verts[2].u = cfg.size.x;
	tri.verts[2].v = cfg.size.y;
}

/**
auto-calculate UV coords for each triangle
*/
function calcTrisMeshUVs(mesh, cfg) {
	if (mesh.tris.length === 0) { console.log(`Mesh has no tris`); return; }
	console.log(`Calc tris UVs`);
	let w = cfg.size.x, h = cfg.size.y, d = cfg.size.z;
	let texMinX = 0, texMinY = 0, texMinZ = 0
	
	let texMaxX = utils.calcUVRange(w, cfg.pixelsPerMetre, cfg.textureRes);
	let texMaxY = utils.calcUVRange(h, cfg.pixelsPerMetre, cfg.textureRes);
	let texMaxZ = utils.calcUVRange(d, cfg.pixelsPerMetre, cfg.textureRes);
	console.log(`Shape  w/h/d: ${w}, ${h}, ${d}`);
	console.log(`Pixels per metre: ${cfg.pixelsPerMetre}`);
	console.log(`UV limits for each axis: ${texMaxX}, ${texMaxY}, ${texMaxZ}`);
	
	for (let i = 0; i < mesh.tris.length; ++i) {
		let tri = mesh.tris[i];
		calcTriUVs(tri, cfg);
	}
}

/////////////////////////////////////////////
// Do
/////////////////////////////////////////////

function test_tris(cfg) {
	
	const writeOutput = true;
	
	console.log(`Test tris`);
	let w = cfg.size.x, h = cfg.size.y, d = cfg.size.z;
	let hx = cfg.halfSize.x, hy = cfg.halfSize.y, hz = cfg.halfSize.z;
	let trisMesh = utils.createTrisMesh();
	
	let texMinX = 0, texMinY = 0, texMinZ = 0
	
	let texMaxX = utils.calcUVRange(w, cfg.pixelsPerMetre, cfg.textureRes);
	let texMaxY = utils.calcUVRange(h, cfg.pixelsPerMetre, cfg.textureRes);
	let texMaxZ = utils.calcUVRange(d, cfg.pixelsPerMetre, cfg.textureRes);
	console.log(`Shape  w/h/d: ${w}, ${h}, ${d}`);
	console.log(`Pixels per metre: ${cfg.pixelsPerMetre}`);
	console.log(`UV limits for each axis: ${texMaxX}, ${texMaxY}, ${texMaxZ}`);
	
	let verts = [
		utils.makeVert(-hx, -hy, hz, 0, 0),
		utils.makeVert(hx, -hy, hz, 1, 0),
		utils.makeVert(hx, hy, hz, 1, 1),
		utils.makeVert(-hx, hy, hz, 0, 1),
		
		utils.makeVert(-hx, -hy, -hz, 0, 0),
		utils.makeVert(hx, -hy, -hz, 1, 0),
		utils.makeVert(hx, hy, -hz, 1, 1),
		utils.makeVert(-hx, hy, -hz, 0, 1)
	];
	
	let triangles = [
		// front 0 1
		[ 0, 1, 2],
		[ 0, 2, 3],
		// back 2 3
		[ 5, 4, 7],
		[ 5, 7, 6],
		// top 4 5
		[ 3, 2, 6],
		[ 3, 6, 7],
		// bottom 6 7
		[ 4, 5, 1],
		[ 4, 1, 0],
		// left 8 9
		[ 4, 0, 3],
		[ 4, 3, 7],
		// right 10 11
		[ 1, 5, 6],
		[ 1, 6, 2]
	];
	
	// Add triangles - make sure to duplicate the verts
	// so their UVs can be modified separately!
	triangles.forEach(tri => {
		let v0 = utils.copyVert(verts[tri[0]]);
		let v1 = utils.copyVert(verts[tri[1]]);
		let v2 = utils.copyVert(verts[tri[2]]);
		trisMesh.addTriangle(v0, v1, v2);
	});
	
	// manually set UVs
	// TODO: Can UV generation be automated easily?
	// front
	trisMesh.tris[0].verts[0].u = texMinX;
	trisMesh.tris[0].verts[0].v = texMinY;
	trisMesh.tris[0].verts[1].u = texMaxX;
	trisMesh.tris[0].verts[1].v = texMinY;
	trisMesh.tris[0].verts[2].u = texMaxX;
	trisMesh.tris[0].verts[2].v = texMaxY;
	
	trisMesh.tris[1].verts[0].u = texMinX;
	trisMesh.tris[1].verts[0].v = texMinY;
	trisMesh.tris[1].verts[1].u = texMaxX;
	trisMesh.tris[1].verts[1].v = texMaxY;
	trisMesh.tris[1].verts[2].u = texMinX;
	trisMesh.tris[1].verts[2].v = texMaxY;
	
	// back
	trisMesh.tris[2].verts[0].u = texMinX;
	trisMesh.tris[2].verts[0].v = texMinY;
	trisMesh.tris[2].verts[1].u = texMaxX;
	trisMesh.tris[2].verts[1].v = texMinY;
	trisMesh.tris[2].verts[2].u = texMaxX;
	trisMesh.tris[2].verts[2].v = texMaxY;
	
	trisMesh.tris[3].verts[0].u = texMinX;
	trisMesh.tris[3].verts[0].v = texMinY;
	trisMesh.tris[3].verts[1].u = texMaxX;
	trisMesh.tris[3].verts[1].v = texMaxY;
	trisMesh.tris[3].verts[2].u = texMinX;
	trisMesh.tris[3].verts[2].v = texMaxY;

	// top
	trisMesh.tris[4].verts[0].u = texMinX;
	trisMesh.tris[4].verts[0].v = texMinZ;
	trisMesh.tris[4].verts[1].u = texMaxX;
	trisMesh.tris[4].verts[1].v = texMinZ;
	trisMesh.tris[4].verts[2].u = texMaxX;
	trisMesh.tris[4].verts[2].v = texMaxZ;
	
	trisMesh.tris[5].verts[0].u = texMinX;
	trisMesh.tris[5].verts[0].v = texMinZ;
	trisMesh.tris[5].verts[1].u = texMaxX;
	trisMesh.tris[5].verts[1].v = texMaxZ;
	trisMesh.tris[5].verts[2].u = texMinX;
	trisMesh.tris[5].verts[2].v = texMaxZ;

	// bottom
	trisMesh.tris[6].verts[0].u = texMinX;
	trisMesh.tris[6].verts[0].v = texMinZ;
	trisMesh.tris[6].verts[1].u = texMaxX;
	trisMesh.tris[6].verts[1].v = texMinZ;
	trisMesh.tris[6].verts[2].u = texMaxX;
	trisMesh.tris[6].verts[2].v = texMaxZ;
	
	trisMesh.tris[7].verts[0].u = texMinX;
	trisMesh.tris[7].verts[0].v = texMinZ;
	trisMesh.tris[7].verts[1].u = texMaxX;
	trisMesh.tris[7].verts[1].v = texMaxZ;
	trisMesh.tris[7].verts[2].u = texMinX;
	trisMesh.tris[7].verts[2].v = texMaxZ;
	
	// left
	trisMesh.tris[8].verts[0].u = texMinZ;
	trisMesh.tris[8].verts[0].v = texMinY;
	trisMesh.tris[8].verts[1].u = texMaxZ;
	trisMesh.tris[8].verts[1].v = texMinY;
	trisMesh.tris[8].verts[2].u = texMaxZ;
	trisMesh.tris[8].verts[2].v = texMaxY;
	
	trisMesh.tris[9].verts[0].u = texMinZ;
	trisMesh.tris[9].verts[0].v = texMinY;
	trisMesh.tris[9].verts[1].u = texMaxZ;
	trisMesh.tris[9].verts[1].v = texMaxY;
	trisMesh.tris[9].verts[2].u = texMinZ;
	trisMesh.tris[9].verts[2].v = texMaxY;
	
	// right
	trisMesh.tris[10].verts[0].u = texMinZ;
	trisMesh.tris[10].verts[0].v = texMinY;
	trisMesh.tris[10].verts[1].u = texMaxZ;
	trisMesh.tris[10].verts[1].v = texMinY;
	trisMesh.tris[10].verts[2].u = texMaxZ;
	trisMesh.tris[10].verts[2].v = texMaxY;
	
	trisMesh.tris[11].verts[0].u = texMinZ;
	trisMesh.tris[11].verts[0].v = texMinY;
	trisMesh.tris[11].verts[1].u = texMaxZ;
	trisMesh.tris[11].verts[1].v = texMaxY;
	trisMesh.tris[11].verts[2].u = texMinZ;
	trisMesh.tris[11].verts[2].v = texMaxY;
	
	
	// Calculate Texture UVs
	//calcTrisMeshUVs(tris, cfg);
	
	if (!writeOutput) { return; }
	
	if (g_verbose) {
		console.log(`Verts: `);
		console.log(verts);
		console.log(JSON.stringify(trisMesh, null, 2));
	}
	
	
	
	let objMesh = trisMesh.toObjMesh();
	let txt = objMesh.writeAsci(cfg.outputName, cfg.outputPath);
	if (g_verbose) {
		console.log(txt);
	}
	writeFile(cfg.outputPath, txt);
}

function test_tris_2(cfg) {
	console.log(`Test tris`);
	let w = cfg.size.x, h = cfg.size.y, d = cfg.size.z;
	let tris = utils.createTrisMesh();
	
	let texW = utils.calcUVRange(w, cfg.pixelsPerMetre, cfg.textureRes);
	let texH = utils.calcUVRange(h, cfg.pixelsPerMetre, cfg.textureRes);
	let texD = utils.calcUVRange(d, cfg.pixelsPerMetre, cfg.textureRes);
	console.log(`Shape  w/h/d: ${w}, ${h}, ${d}`);
	console.log(`Pixels per metre: ${cfg.pixelsPerMetre}`);
	console.log(`UV limits for each axis: ${texW}, ${texH}, ${texD}`);
	let v0, v1, v2;
	
	//////////////////////////////
	// Y-Axis faces
	//////////////////////////////
	// Top
	// anti-clockwise vert order
	v0 = tris.makeVert(-w, h, -d, 0, 0);
	v1 = tris.makeVert(w, h, -d, texW, 0);
	v2 = tris.makeVert(w, h, d, texW, texD);
	// insert clockwise
	tris.addTriangle(v0, v2, v1);
	
	v0 = tris.makeVert(-w, h, -d, 0, 0);
	v1 = tris.makeVert(w, h, d, texW, texD);
	v2 = tris.makeVert(-w, h, d, 0, texD);
	tris.addTriangle(v0, v2, v1);
	
	// Bottom - change order to reverse dir
	v0 = tris.makeVert(-w, -h, -d, 0, 0);
	v1 = tris.makeVert(w, -h, -d, texW, 0);
	v2 = tris.makeVert(w, -h, d, texW, texD);
	// insert clockwise
	tris.addTriangle(v0, v1, v2);
	
	v0 = tris.makeVert(-w, -h, -d, 0, 0);
	v1 = tris.makeVert(w, -h, d, texW, texD);
	v2 = tris.makeVert(-w, -h, d, 0, texD);
	tris.addTriangle(v0, v1, v2);
	
	
	//////////////////////////////
	// X-Axis faces
	//////////////////////////////
	
	// Left
	v0 = tris.makeVert(-w, -h, -d, 0, 0);
	v1 = tris.makeVert(w, -h, -d, texW, 0);
	v2 = tris.makeVert(w, -h, d, texW, texD);
	// insert clockwise
	tris.addTriangle(v0, v1, v2);
	
	v0 = tris.makeVert(-w, -h, -d, 0, 0);
	v1 = tris.makeVert(w, -h, d, texW, texD);
	v2 = tris.makeVert(-w, -h, d, 0, texD);
	tris.addTriangle(v0, v1, v2);
	
	
	console.log(`Build Tris mesh`);
	//console.log(JSON.stringify(tris, null, 4));
	
	let objMesh = tris.toObjMesh();
	let txt = objMesh.writeAsci(cfg.outputName, cfg.outputPath);
	if (g_verbose) {
		console.log(txt);
	}
	writeFile(cfg.outputPath, txt);
}
