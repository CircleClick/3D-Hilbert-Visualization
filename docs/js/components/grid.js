const gridDefaults = {
	size: 16,
	divisions: 16,
	colorCenterLine: 0x000000,
	colorGrid: 0xAAAAAA,
	textColor: 0x444444,
	number: true,
}

import { distance2Point } from '../utils/hilbert.js';

export class Grid {
	constructor(gridOptions = {}, ) {

		this.gridOptions = Object.assign({}, gridDefaults);
		Object.assign(this.gridOptions, gridOptions);

		this.group = new THREE.Group();
		this.grid = this.create(this.gridOptions);
		this.group.add(this.grid);

		const loader = new THREE.FontLoader();
		loader.load('js/utils/open-sans.json', (font) => {
			if (this.gridOptions.number && this.gridOptions.divisions <= 32) {
				const target = this.gridOptions.divisions*this.gridOptions.divisions;
				const ratio = this.gridOptions.size/this.gridOptions.divisions;

				for (let index = 0; index < target; index++) {
					const xy = distance2Point(index);

					const text_geometry = new THREE.TextBufferGeometry(`${index}`, {
						font: font,
						size: (this.gridOptions.size/this.gridOptions.divisions)/3.5,
						height: 0,
					});

					const text = new THREE.Mesh(text_geometry, new THREE.MeshBasicMaterial({ color: this.gridOptions.textColor }));
					text.position.x = xy[0] - this.gridOptions.size/2;
					text.position.z = xy[1] - this.gridOptions.size/2+(ratio*0.6);
					text.rotation.x = -Math.PI/2;
					this.group.add(text);
				}
			}
		});
	}

	create(options) {
		return new THREE.GridHelper(
			options.size,
			options.divisions,
			options.colorCenterLine,
			options.colorGrid);
	}
}