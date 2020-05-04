
const fs = require("fs");
const path = "entities.json";

let g_defs = JSON.parse(fs.readFileSync(path, "utf-8"));
console.log(`Read ${g_defs.length} defs from ${path}`);

function writeFile(path, txt) {
	console.log(`Writing ${txt.length} chars to ${path}`);
	fs.writeFileSync(path, txt);
}

///////////////////////////////////
// do
///////////////////////////////////

function buildConcreteClass(def) {
	//
	let txt =
``;
}

function buildBaseClass() {
	let txt =
`extends Spatial

export var targets: PoolStringArray = []
`;
	writeFile("map_ent.gd", txt);
}
