'use strict';

const fs = require("fs")
const path = require("path");

function recursiveFileList(rootPath, filesArr) {
    let dirContents = fs.readdirSync(rootPath);
    let numContents = dirContents.length;
    for (let i = 0; i < numContents; ++i) {
        let fullPath = rootPath + "/" + dirContents[i];
        if (fs.statSync(fullPath).isDirectory()) {
            listAllFiles(fullPath, filesArr);
        }
        else {
            filesArr.push(fullPath);
        }
    }
}

function listAllFiles(rootPath, files) {
    let list = [];
    recursiveFileList(rootPath, list);
    let len = list.length;
    for (let i = 0; i < len; ++i) {
        // clip drive letter off
        let path = list[i].substring(2);
        files[path] = 0;
    }
}

function printKeysList(keys, max = 10) {
    let len = keys.length;
    if (len > max) { len = max; }
    for (let i = 0; i < len; ++i) {
        console.log(`${i}: ${keys[i]}`);
    }
}

const args = process.argv.slice(2, process.argv.length);
if (args.length !== 2) {
    console.log(`please specify two paths to compare`);
    return;
}

const dirA = args[0];
const dirB = args[1];
console.log(`Diffing paths ${dirA} vs ${dirB}`)

let dirAContents = {};
listAllFiles(dirA, dirAContents);
let keysA = Object.keys(dirAContents);

let dirBContents = {};
listAllFiles(dirB, dirBContents);
let keysB = Object.keys(dirBContents);

let inANotB = [];
keysA.forEach(k => {
    let vs = dirBContents[k];
    if (typeof(vs) === "undefined") {
        inANotB.push(k);
    }
});

let inBNotA = [];
keysB.forEach(k => {
    if (typeof(dirAContents[k]) === "undefined") {
        inBNotA.push(k);
    }
});

console.log(`--------------------------------------------------`);
console.log(`In ${dirA} and NOT ${dirB}`);
console.log(`--------------------------------------------------`);
printKeysList(inANotB);

console.log(`--------------------------------------------------`);
console.log(`In ${dirB} and NOT ${dirA}`);
console.log(`--------------------------------------------------`);
printKeysList(inBNotA);
