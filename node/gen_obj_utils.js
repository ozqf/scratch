
/////////////////////////////////////////////////
// Utility functions
/////////////////////////////////////////////////
exports.makeVert = function(x, y, z, u, v) {
	if (!u) { u = 0; }
	if (!v) { v = 0; }
	return {
		x: x, y: y, z: z, u: u, v: v
	};
}

exports.copyVert = function(v) {
	return {
		x: v.x, y: v.y, z: v.z, u: v.u, v: v.v
	}
}

exports.normalise = function(v) {
	let mag = Math.sqrt((v.x * v.x) + (v.y * v.y) + (v.z * v.z));
	v.x /= mag;
	v.y /= mag;
	v.z /= mag;
}

/**
Calculate triangle normal
*/
exports.calcNormal = function(v0, v1, v2) {
	// calc normal
	// https://math.stackexchange.com/questions/305642/how-to-find-surface-normal-of-a-triangle
	let a = {
		x: v1.x - v0.x,
		y: v1.y - v0.y,
		z: v1.z - v0.z
	};
	let b = {
		x: v2.x - v0.x,
		y: v2.y - v0.y,
		z: v2.z - v0.z
	};
	normal = {
		x: (a.y * b.z) - (a.z * b.y),
		y: (a.z * b.x) - (a.x * b.z),
		z: (a.x * b.y) - (a.y * b.x)
	};
	exports.normalise(normal);
	return normal;
}

exports.calcUVRange = function(lengthMetres, pixPerMetre, texRes) {
	let totalPix = lengthMetres * pixPerMetre;
	//let result = texRes / totalPix;
	let result = totalPix / texRes;
	return result;
}


exports.listFaces = function(mesh) {
	console.log(`--- Mesh faces ---`);
	mesh.faces.forEach((f, i) => {
		console.log(`face ${i}`);
		console.log(`Verts`);
		for (let j = 0; j < 3; ++j) {
			let vertIndex = f[j][0];
			console.log(mesh.verts[vertIndex]);
		}
		console.log(`UVs`);
		for (let j = 0; j < 3; ++j) {
			let vertIndex = f[j][1];
			console.log(mesh.uvs[vertIndex]);
		} 
		console.log(`Normals`);
		for (let j = 0; j < 3; ++j) {
			let vertIndex = f[j][2];
			console.log(mesh.normals[vertIndex]);
		}
	});
}


/////////////////////////////////////////////////
// Data types
/////////////////////////////////////////////////

// Mesh as a collection of triangles
exports.createTrisMesh = function() {
	let trisMesh = {
		tris: []
	};
	
	trisMesh.makeVert = function(x, y, z, u, v) {
		return {
			x: x, y: y, z: z, u: u, v: v
		};
	}
	
	trisMesh.addTriangle = function(vert0, vert1, vert2, normal) {
		if (!normal) {
			normal = exports.calcNormal(vert0, vert1, vert2);
		}
		let tri = {
			verts: [ vert0, vert1, vert2 ],
			normal: normal
		}
		this.tris.push(tri);
	}
	
	trisMesh.toObjMesh = function() {
		let mesh = exports.createObjMesh();
		console.log(`Converting tris mesh with ${this.tris.length} triangles to obj mesh`);
		for (let i = 0; i < this.tris.length; ++i) {
			// Pile every vertex in
			// TODO: Optimise out duplicate verts!
			let tri = this.tris[i];
			let v0Index = mesh.addVert(tri.verts[0].x, tri.verts[0].y, tri.verts[0].z);
			let v1Index = mesh.addVert(tri.verts[1].x, tri.verts[1].y, tri.verts[1].z);
			let v2Index = mesh.addVert(tri.verts[2].x, tri.verts[2].y, tri.verts[2].z);
			let uv0Index = mesh.addUV(tri.verts[0].u, tri.verts[0].v);
			let uv1Index = mesh.addUV(tri.verts[1].u, tri.verts[1].v);
			let uv2Index = mesh.addUV(tri.verts[2].u, tri.verts[2].v);
			let n = tri.normal;
			let normalIndex = mesh.addNormal(n.x, n.y, n.z);
			
			mesh.addFace(
				v0Index, uv0Index, normalIndex,
				v1Index, uv1Index, normalIndex,
				v2Index, uv2Index, normalIndex,
			);
		}
		return mesh;
	}	
	return trisMesh;
}


// Mesh as a collection of descreet components
// format suitable for converting to .obj file
exports.createObjMesh = function() {
	let obj = {
		verts: [],
		uvs: [],
		normals: [],
		faces: []
	};
	
	obj.addVert = function(x, y, z) {
		this.verts.push({ x: x, y: y, z: z});
		return (this.verts.length - 1);
	}
	
	obj.addUV = function(u, v) {
		this.uvs.push({ x: u, y: v});
		return (this.uvs.length - 1);
	}
	
	obj.addNormal = function(i, j, k) {
		this.normals.push({ x: i, y: j, z: k });
		return (this.normals.length - 1);
	}
	obj.addFace = function(
		v0, uv0, n0,
		v1, uv1, n1,
		v2, uv2, n2) {
		this.faces.push([
			[ v0, uv0, n0 ],
			[ v1, uv1, n1 ],
			[ v2, uv2, n2 ]
		]);
		return (this.faces.length - 1);
	}
	
	obj.writeAsci = function(modelName, path) {
		// header
		let txt = `# zqf obj gen file "${path}"\n`;
		txt += `o ${modelName}\n`;
		
		// components
		this.verts.forEach(v => {
			txt += `v ${v.x} ${v.y} ${v.z}\n`;
		});
		this.uvs.forEach(uv => {
			txt += `vt ${uv.x} ${uv.y}\n`;
		});
		this.normals.forEach(n => {
			txt += `vn ${n.x} ${n.y} ${n.z}\n`;
		});
		// smoothing off
		txt += `s off\n`;
		// faces
		this.faces.forEach(f => {
			let str = `f `;
			f.forEach(part => {
				str += `${part[0] + 1}/${part[1] + 1}/${part[2] + 1} `;
			});
			str += `\n`;
			txt += str;
		});
		
		// done
		return txt;
	}
	return obj;
}
