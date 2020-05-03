/*
Create godot scene files from a set of obj files + material paths.

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

const g_rootGodotPath = "res://zqf_auto/"
const g_meshSubDir = "mesh/"
const g_meshPath = "res://blender_import/cube_one_uv_side.obj";
const g_materialPath = "res://materials/mat_matte_test.tres";

const g_materialName = "mat_zqf_blockmap_cube";

const g_objNames = [
	""
];


