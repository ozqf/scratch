
'use strict';

//////////////////////////////////////////////////////////
// logic
//////////////////////////////////////////////////////////
function findComponent(componentName, components) {
    let comp = components.find(c => c.name === componentName);
    if (comp) {
        return comp;
    }
    components.push({ name: componentName });
    return components[components.length - 1];
}

function addToResult(results, nameToAdd, countToAdd) {
    let result = results.find(r => r.name === nameToAdd);
    if (result) {
        result.count += countToAdd;
        return;
    }
    results.push({
        name: nameToAdd,
        count: countToAdd
    });
}

function tallyIngredients(componentName, print, components, results) {
    const comp = findComponent(componentName, components);
    if (print) {
        console.log(comp);
    }
    if (comp.components) {
        comp.components.forEach(c => {
            if (!c.count) { c.count = 1; }
            for (let i = 0; i < c.count; ++i) {
                tallyIngredients(c.name, false, components, results);
            }
        })
    }
    else {
        addToResult(results, comp.name, (comp.count ? comp.count : 1));
    }
}

//////////////////////////////////////////////////////////
// data
//////////////////////////////////////////////////////////
let g_components = [];

g_components = [
    {
        name: "copper wire",
        components: [
            { name: "copper ore", count: 2 }
        ]
    },
    {
        name: "wiring kit",
        components: [
            { name: "silver ore", count: 2 }
        ]
    },
    {
        name: "computer chip",
        components: [
            { name: "table coral sample", count: 2 },
            { name: "gold ore" },
            { name: "copper wire" },
        ]
    },
    {
        name: "silicone rubber",
        components: [
            { name: "creepvine seed cluster" }
        ]
    },
    {
        name: "advanced wiring kit",
        components: [
            { name: "wiring kit" },
            { name: "gold ore", count: 2 },
            { name: "computer chip" }
        ]
    },
    {
        name: "power cell charger",
        components: [
            { name: "advanced wiring kit" },
            { name: "ruby", count: 2 },
            { name: "titanium ore", count: 2 }
        ]
    },
    {
        name: "repair tool",
        components: [
            { name: "silicone rubber" },
            { name: "cave sulfur" },
            { name: "titanium" }
        ]
    },
    {
        name: "fabricator",
        components: [
            { name: "titanium" },
            { name: "gold" },
            { name: "table coral sample" }
        ]
    },
    {
        name: "titanium ingot",
        components: [{ name: "titanium ore", count: 10 }]
    },
    {
        name: "glass",
        components: [{ name: "quartz", count: 2 }]
    },
    {
        name: "enameled glass",
        components: [{ name: "glass", count: 2 }, { name: "stalker tooth" }]
    },
    {
        name: "plasteel ingot",
        components: [
            { name: "titanium ingot", count: 1 },
            { name: "lithium ore", count: 2 }
        ]
    },
    {
        name: "reinforced dive suit",
        components: [
            { name: "synthetic fibers" },
            { name: "diamond", count: 2 },
            { name: "titanium", count: 2}
        ]
    },
    {
        name: "hydrochloric acid",
        components: [
            { name: "deep shroom", count: 3 },
            { name: "salt deposit" }
        ]
    },
    {
        name: "polyailine",
        components: [
            { name: "gold ore" },
            { name: "hydrochloric acid" }
        ]
    },
    { name: "lubricant", components: [{ name: "creepvine seed cluster" }] },
    { name: "benzene", components: [{ name: "blood oil", count: 3 }] },
    { name: "polyaniline" },
    {
        name: "cyclops engine efficiency module",
        components: [
            { name: "computer chip" },
            { name: "benzene" },
            { name: "polyaniline" }
        ]
    },
    {
        name: "cyclops depth module",
        components: [
            { name: "plasteel ingot" },
            { name: "ruby", count: 3 }
        ]
    },
    {
        name: "cyclops docking bay repair module",
        components: [
            { name: "repair tool" },
            { name: "copper wire" }
        ]
    },
    {
        name: "cyclops sonar upgrade",
        components: [
            { name: "computer chip" },
            { name: "magnetite", count: 3 }
        ]
    },
    {
        name: "cyclops shield generator",
        components: [
            { name: "advanced wiring kit" },
            { name: "polyaniline" },
            { name: "power cell" }
        ]
    },
    {
        name: "moonpool",
        components: [
            { name: "titanium ingot", count: 2 },
            { name: "lubricant" },
            { name: "lead", count: 2 }
        ]
    },
    {
        name: "prawn grappling arm",
        components: [
            { name: "advanced wiring kit" },
            { name: "benzene" },
            { name: "titanium ore", count: 5 },
            { name: "lithium ore" }
        ]
    },
    {
        name: "prawn drill arm",
        components: [
            { name: "titanium ore", count: 5 },
            { name: "lithium ore", count: 1 },
            { name: "diamond", count: 4 }
        ]
    },
    {
        name: "cyclops",
        components: [
            { name: "plasteel ingot", count: 3 },
            { name: "enameled glass", count: 3 },
            { name: "lubricant" },
            { name: "advanced wiring kit" },
            { name: "lead ore", count: 3 }
        ]
    }
];

//////////////////////////////////////////////////////////
// run
//////////////////////////////////////////////////////////

let desired = "advanced wiring kit";
if (process.argv.length > 2) {
    desired = process.argv[2];
}
console.log(`Tallying for ${desired}`);
let results = [];
tallyIngredients(desired, true, g_components, results);
console.log(results.map(r => `${r.name} x${r.count}`));
