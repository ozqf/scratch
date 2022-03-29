/*
Script to condense a wavefront .obj mesh output by Trenchbroom into a more
optimal arrangement for importing into the Godot engine.
Merges all world brush entities into one, and merges all material slots to produce
a single mesh of all faces with only one slot per material.

TODO: Apply scale factor to vertices, eg downscale mesh by * 32.
TODO: Ignore faces that use a 'skip' texture (and trim out vertices only used by those faces).
*/
'use strict';

function readMapLines(filePath) {
	const raw = fs.readFileSync(filePath, "utf-8");
	const lines = raw.split(/\r?\n/);
	console.log(`Read ${lines.length} lines from ${filePath}`);
	return lines;
}

function createEmptyMesh() {
	return {
		verts: [],
		uvs: [],
		normals: [],
		materials: [],
		faces: []
	};
}

function findOrCreateMaterial(materials, name) {
	let mat = materials.find(mat => mat.name === name);
	if (mat) {
		return mat;
	}
	mat = {
		name: name,
		faces: []
	};
	materials.push(mat);
	return mat;
}

/*
read in mesh data, grouping faces by material
syntax example:

usemtl test_textures/aqconc08
f 69/1/1 70/32/1 71/39/1 72/4/1
*/
function extractMeshData(lines) {
	let mesh = createEmptyMesh();
	let currentMat = findOrCreateMaterial(mesh.materials, "");
	
	for (let i = 0; i < lines.length; ++i) {
		const line = lines[i];
		const tokens = line.split(' ');
		if (tokens[0] === 'usemtl') {
			currentMat = findOrCreateMaterial(mesh.materials, tokens[1]);
			continue;
		}
		if (tokens[0] === 'v') {
			let index = mesh.verts.length;
			mesh.verts.push({
				i: index,
				x: tokens[1],
				y: tokens[2],
				z: tokens[3]
			});
			continue;
		}
		if (tokens[0] === 'vt') {
			let index = mesh.uvs.length;
			mesh.uvs.push({
				i: index,
				x: tokens[1],
				y: tokens[2]
			});
			continue;
		}
		if (tokens[0] === 'vn') {
			let index = mesh.normals.length;
			mesh.normals.push({
				i: index,
				x: tokens[1],
				y: tokens[2],
				z: tokens[3]
			});
			continue;
		}
		if (tokens[0] === 'f') {
			if (currentMat.name.endsWith("skip")) {
				continue;
			}
			currentMat.faces.push(line);
			// let mat = mesh.materials.find(x => x === current);
			// mat.push(line);
			mesh.faces.push({
				mat: currentMat.name,
				face: line
			});
			continue;
		}
	}
	mesh.materials = mesh.materials.filter(mat => mat.faces.length > 0);
	console.log(`${mesh.verts.length} verts, ${mesh.faces.length} faces, ${mesh.materials.length} materials in ${lines.length} lines`);
	return mesh;
}

function writeMesh(mesh, filePath) {
	let endL = "\r\n";
	let output = "";
	output += `# vertices${endL}`;
	let l = mesh.verts.length;
	for (let i = 0; i < l; ++i) {
		let v = mesh.verts[i];
		output += `v ${v.x} ${v.y} ${v.z}${endL}`;
	}
	
	output += `${endL}# texture coordinates${endL}`;
	l = mesh.uvs.length;
	for (let i = 0; i < l; ++i) {
		let uv = mesh.uvs[i];
		output += `vt ${uv.x} ${uv.y}${endL}`;
	}
	
	output += `${endL}# face normals${endL}`;
	l = mesh.normals.length;
	for (let i = 0; i < l; ++i) {
		let n = mesh.normals[i];
		output += `vn ${n.x} ${n.y} ${n.z}${endL}`;
	}
	
	output += `${endL}# objects${endL}o world${endL}`;
	l = mesh.materials.length;
	for (let i = 0; i < l; ++i) {
		let mat = mesh.materials[i];
		output += `usemtl ${mat.name}${endL}`;
		
		let lf = mat.faces.length;
		for (let j = 0; j < lf; ++j) {
			output += `${mat.faces[j]}${endL}`;
		}
	}
	
	output += `${endL}`;
	
	console.log(`Writing ${output.length} chars to ${filePath}`);
	fs.writeFileSync(filePath, output);
	console.log(`\tDone`);
}

function listMaterials(mesh) {
	const l = mesh.materials.length;
	for (let i = 0; i < l; ++i) {
		const mat = mesh.materials[i];
		console.log(`Mat ${mat.name}: ${mat.faces.length} faces`);
	}
}

//////////////////////////////////////////////
// run
const fs = require("fs");
const gInputPath = process.argv.length >= 4 ? process.argv[2] : "test_map_chunk.obj";
const gOutputPath = process.argv.length >= 4 ? process.argv[3] : "output.obj";
console.log(`Input ${gInputPath}, output ${gOutputPath}`);
const gLines = readMapLines(gInputPath);
const gMesh = extractMeshData(gLines);
listMaterials(gMesh);
writeMesh(gMesh, gOutputPath);
//console.log(gMesh);
