
function printBits(flags) {
	let str = "";
	for (let i = 31; i >= 0; --i) {
		if ((flags & (1 << i)) != 0) { str += "1"; }
		else { str += "0"; }
		if (i % 8 === 0) { str += ","; }
	}
	return str;
}

let g_input = 22;
g_input &= ~6;
if (process.argv.length > 2) {
	g_input = parseInt(process.argv[2]);
}

console.log(`Bits in ${g_input}`);
console.log(`${printBits(g_input)}`);
