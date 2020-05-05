/*
Create godot scene files from a set of obj files + material paths.

NOTE: Doesn't currently work on model files with _ or . in their name as
these are used to split up names to extract info.

Assumes Material is already added and setup

------------------------------------------------------------------------
Example Godot tscn file.
Scene is a single mesh + material with a kinematic box collider to match
(; are single line comments - removed if saved by the editor!)

```
[gd_scene load_steps=4 format=2]

;----------------------------------------------------------
; external resources, compiled here and referenced by type + id combination
[ext_resource path="res://materials/mat_matte_test.tres" type="Material" id=1]
[ext_resource path="res://blender_import/cube_one_uv_side.obj" type="ArrayMesh" id=2]

;----------------------------------------------------------
; Sub resource - resources declared in this scene file, in this case, the box shape
; for the collision shape
[sub_resource type="BoxShape" id=1]
extents = Vector3( 2, 2, 2 )

; root node
[node name="prefab_stone_wall_01_" type="Spatial"]

[node name="MeshInstance" type="MeshInstance" parent="."]
use_in_baked_light = true
mesh = ExtResource( 2 )
material/0 = ExtResource( 1 )

; collision body
[node name="KinematicBody" type="KinematicBody" parent="."]

; collision shape
[node name="CollisionShape" type="CollisionShape" parent="KinematicBody"]
shape = SubResource( 1 )
```

*/

const fs = require("fs");

const g_outputDir = "zqf_auto/";
const g_godotRoot = "res://";
const g_meshSubDir = "mesh/";

const g_meshPath = "res://blender_import/cube_one_uv_side.obj";

//const g_materialPath = "res://materials/mat_matte_test.tres";
const g_materialPath = "res://zqf_auto/materials/mat_dev_grid.tres";

const g_materialName = "mat_zqf_blockmap_cube";

// let g_files = fs.readdirSync(`./zqf_auto/mesh/beam`);
// g_files = g_files.concat(fs.readdirSync(`./zqf_auto/mesh/cube`));
// g_files = g_files.concat(fs.readdirSync(`./zqf_auto/mesh/square`));
// g_files = g_files.concat(fs.readdirSync(`./zqf_auto/mesh/panel`));

// if (g_files.length === 0) {
	// console.log(`No files found`);
	// return;
// }
// for (let i = 0; i < g_files.length; ++i) {
	
// }
// console.log(g_files);
// console.log(`Read ${g_files.length} input files`);

// let g_objMeshes = [
// 	{ name: "beam_2x1x1", size: { x: 2, y: 1, z: 1 } },
// 	{ name: "beam_4x1x1", size: { x: 4, y: 1, z: 1 } },
// 	{ name: "beam_8x1x1", size: { x: 8, y: 1, z: 1 } },
// 	{ name: "beam_16x1x1", size: { x: 16, y: 1, z: 1 } },
	
// 	{ name: "cube_1x1x1", size: { x: 1, y: 1, z: 1 } },
// ];

let g_objMeshes = [];

// go
convertFilesInPath(g_outputDir + g_meshSubDir, "beam");
convertFilesInPath(g_outputDir + g_meshSubDir, "cube");
convertFilesInPath(g_outputDir + g_meshSubDir, "square");
convertFilesInPath(g_outputDir + g_meshSubDir, "panel");

////////////////////////////////////////////////////////////
// Prepare input/output
////////////////////////////////////////////////////////////

function writeFile(path, txt) {
	console.log(`Writing ${txt.length} chars to ${path}`);
	fs.writeFileSync(path, txt);
}

// format widthxheightxdepth eg:
// 1x2x4
function extractSize(sizeTxt) {
	let parts = sizeTxt.split(`x`);
	if (parts.length != 3) {
		console.warn(`size string "${sizeTxt}" split is length ${parts.length} not 3`);
		return { x: 1, y: 1, z: 1 };
	}
	return {
		x: parseFloat(parts[0]),
		y: parseFloat(parts[1]),
		z: parseFloat(parts[2]),
	};
}

function extractJobFromFileName(fileName) {
	// chop off extension
	let dotParts = fileName.split(`.`);
	dotParts.splice(1, dotParts.length - 1);
	let name = dotParts.join(`.`);
	
	// chop off size info
	let scoreParts = name.split(`_`);
	let sizePart = scoreParts[scoreParts.length - 1];
	let size = extractSize(sizePart);
	
	// console.log(`Name: ${name}`);
	// console.log(`\tsize: `, size);
	
	return { name: name, size: size };
}

///////////////////////////////////////////////////////////////
// Do
///////////////////////////////////////////////////////////////

function convertFilesInPath(root, subDir) {
	let files = fs.readdirSync(root + subDir);
	
	console.log(`Files:`);
	console.log(files);

	let objects = files.map(f => extractJobFromFileName(f));
	// g_files.forEach(f => {
		// extractFromFileName(f);
	// });
	console.log(`Inputs:`);
	console.log(objects);
	build(objects, subDir);
}

function build(objects, subDir) {
	objects.forEach(obj => {
		let name = obj.name;
		let size = obj.size;
		let outputPath = `${g_outputDir}scene/${subDir}/${name}_.escn`;
		let meshPath = `${g_godotRoot}${g_outputDir}${g_meshSubDir}${name}.obj`;
		buildByPatching(g_materialPath, meshPath, name, outputPath, size, false);
	});
}

// buildByPatching(
	// `${g_rootGodotPath}${g_meshSubDir}`
// );

/*
size should be a vector with x/y/z
*/
function buildByPatching(materialPath, meshPath, node_name, outputPath, size, verbose) {
	if (!verbose) { verbose = false; }
	if (verbose) {
		console.log(`Writing prefab ${node_name}`);
		console.log(`\t"Mesh ${meshPath}"`);
		console.log(`\tMat: ${g_materialPath}`);
		console.log(`\tto ${outputPath}`);
	}
	
let txt =
`[gd_scene load_steps=4 format=2]

[ext_resource path="${materialPath}" type="Material" id=1]
[ext_resource path="${meshPath}" type="ArrayMesh" id=2]

[sub_resource type="BoxShape" id=1]
extents = Vector3( ${size.x * 0.5}, ${size.y * 0.5}, ${size.z * 0.5} )

[node name="${node_name}_" type="Spatial"]

[node name="MeshInstance" type="MeshInstance" parent="."]
use_in_baked_light = true
mesh = ExtResource( 2 )
material/0 = ExtResource( 1 )

[node name="KinematicBody" type="KinematicBody" parent="."]
collision_layer = 1
collision_mask = 1

[node name="CollisionShape" type="CollisionShape" parent="KinematicBody"]
shape = SubResource( 1 )
`;
	if (verbose) {
		console.log(`-----------------------------\nResult\n-----------------------------`);
		console.log(txt);
	}
	writeFile(outputPath, txt);
}
