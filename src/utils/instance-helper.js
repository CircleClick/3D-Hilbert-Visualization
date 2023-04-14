import * as THREE from "three";

export class InstanceHelper {
	constructor(scene, geometry, material, count = 256) {
		this.scene = scene;
		this.geometry = geometry;
		this.material = material;

		this.rebuildInstance(count);
	}

	rebuildInstance(count) {
		this.count = count;

		const oldMesh = this.mesh;
		if (oldMesh) {
			this.scene.remove(oldMesh);
		}

		this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.count);
		this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
		this.mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
		this.mesh.setColorAt(0, new THREE.Color(0x00ff00)); // create the initial color buffer
		this.scene.add(this.mesh);

		if (oldMesh) {
			for (let i = 0; i < this.oldMesh.count; i++) {
				this.mesh.setColorAt(i, oldMesh.getColorAt(i));
				this.mesh.setMatrixAt(i, oldMesh.getMatrixAt(i));
			}
		}

		this.mesh.instanceMatrix.needsUpdate = true;
		this.mesh.instanceColor.needsUpdate = true;
		this.mesh.needsUpdate = true;
	}

	createInstance() {
		const meshIndex = this.count;
		this.count++;
		return meshIndex;
	}

	destroy() {
		this.scene.remove(this.mesh);
	}
}
