/*
behaviour tree example

https://towardsdatascience.com/designing-ai-agents-behaviors-with-behavior-trees-b28aa1c3cf8a
https://www.gamedeveloper.com/programming/behavior-trees-for-ai-how-they-work

make some simple diagrams:
https://app.diagrams.net/

Simple starting example:
If has target and in range of target

Node types to implement:
root
acquire/validate target
check distance
walk
*/
const SUCCESS = 1
const FAILURE = 0
const RUNNING = -1

let g_info = {
	health = 100,
	position = { x: 0, y: 0, z: 0 },
	target = { x: 10, y: 0, z: 0 }
};

// a sequence node moves through its children from first to last as each completes
// failure causes the sequence to be abandoned

// A fallback node selects the first of its children that succeeds
function CreateFallbackNodeBase(nodeLabel) {
	let obj = {};
	obj.label = nodeLabel;
	obj.parent = null; // necessary...?
	obj.children = [];
	obj.tick = function(info) {
		const len = this.children.length;
		if (len === 0) { return 0; }
		for (let i = 0; i < len; ++i) {
			let childResult = this.children[i].tick(info);
			if (childResult === SUCCESS) {
				return SUCCESS
			}
		}
	}
}

let g_tree = {
	// tree entry point
	root = null
};

g_tree.root = CreateFallbackNodeBase("root");


function TickTree(root, info) {
	root.tick(g_info);
}

TickTree(g_root, g_info);

