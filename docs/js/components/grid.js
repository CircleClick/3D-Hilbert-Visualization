const gridDefaults = {
    size: 10,
    divisions: 10,
    colorCenterLine: 0xFFFFFF,
    colorGrid: 0x888888,
}

export class Grid {
    constructor (gridOptions = {}, ) {

        this.gridOptions = Object.assign({}, gridDefaults);
        Object.assign(this.gridOptions, gridOptions);

        this.grid = this.create(this.gridOptions);
    }

    create (options) {
        return new THREE.GridHelper(
            options.size,
            options.divisions,
            options.colorCenterLine,
            options.colorGrid );
    }
}