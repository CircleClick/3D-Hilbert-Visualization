import { ExtrudeGeometry, Shape, Vector2 } from "three";

/**
 * Hilbert curve rotation function
 * @param {*} n 
 * @param {*} xy 
 * @param {*} rx 
 * @param {*} ry 
 */
function rot(n, xy, rx, ry) {
	if (ry == 0) {
		if (rx == 1) {
			xy[0] = (n - 1 - xy[0]);
			xy[1] = (n - 1 - xy[1]);
		}

		//Swap x and y
		xy.push(xy.shift());
	}
}

// Note: this function will start breaking down for n > 2^26 (MAX_SAFE_INTEGER = 2^5 3)
// x,y: cell coordinates, n: sqrt of num cells (square side size)
/**
 * convert 2D coordinates to 1D distance
 * @param {Number} xCoordinate 
 * @param {Number} yCoordinate 
 * @param {Number} squareSideSize 
 * @returns Number distance
 */
export function point2Distance(xCoordinate, yCoordinate, squareSideSize = 65536) {
	let xBit, yBit, distance = 0,
		coordinates = [xCoordinate, yCoordinate];

	for (let side = squareSideSize / 2; side >= 1; side /= 2) {
		xBit = (coordinates[0] & side) > 0;
		yBit = (coordinates[1] & side) > 0;
		distance += side * side * ((3 * xBit) ^ yBit);
		rot(side, coordinates, xBit, yBit);
	}
	return distance;
}

/**
 * convert 1D distance to 2D coordinates
 * @param {Number} distance 
 * @param {Number} squareSideSize 
 * @returns Array [x, y]
 */
export function distance2Point(distance) {
	const squareSideSize = 65536;
	let xCoordinate, yCoordinate, currentDistance = distance,
		coordinates = [0, 0];

	for (let side = 1; side < squareSideSize; side *= 2) {
		xCoordinate = 1 & (currentDistance / 2);
		yCoordinate = 1 & (currentDistance ^ xCoordinate);
		rot(side, coordinates, xCoordinate, yCoordinate);

		coordinates[0] += (side * xCoordinate);
		coordinates[1] += (side * yCoordinate);
		currentDistance /= 4;
	}
	return coordinates;
}



const checkGridExists = (grid, x, y) => {
	return grid.hasOwnProperty(x) && grid[x].hasOwnProperty(y);
};

const getGridValue = (grid, x, y) => {
	if (checkGridExists(grid, x, y)) {
		return grid[x][y];
	}
	return false;
};
const setGridValue = (grid, outlineStart, x, y, value) => {
	if (!grid[x]) {
		grid[x] = {};
	}
	grid[x][y] = value;

	if (value === 2) {
		if (!outlineStart.x) {
			outlineStart.x = x;
			outlineStart.y = y;
		}
	}
};

/**
 * get the outline of a set of points
 * @param {Array} points [x, y]
 * @returns Array [[x, y]...]
 */
export function outlinePoints(points, margin = 0.05) {
	let grid = {};
	const outlineStart = { x: false, y: false };

	// fill in the grid
	for (let index = 0; index < points.length; index++) {
		const point = points[index];
		const [x, y] = point;
		setGridValue(grid, outlineStart, x, y, 1);
	}

	for (let index = 0; index < points.length; index++) {
		const point = points[index];
		const currentPoint = {
			x: point[0],
			y: point[1]
		}
		for (let i = 0; i < allDirections.length; i++) {
			const direction = allDirections[i];
			const x = currentPoint.x + direction.x;
			const y = currentPoint.y + direction.y;
			if (getGridValue(grid, x, y) !== 1) setGridValue(grid, outlineStart, x, y, 2);
		}
	}

	// find the path the border forms
	const outline = [];

	const currentPoint = { x: outlineStart.x, y: outlineStart.y };

	while (true) {
		// find a point set to 2 which is adjacent to the current point
		let nextPoint = false;
		for (let index = 0; index < allDirections.length; index++) {
			const direction = allDirections[index];
			const x = currentPoint.x + direction.x;
			const y = currentPoint.y + direction.y;
			if (getGridValue(grid, x, y) === 2) {
				nextPoint = { x, y };
				setGridValue(grid, outlineStart, x, y, 3);
				break;
			}
		}

		// if we didn't find a point, we're done
		if (!nextPoint) {
			break;
		}

		// add the point to the outline
		outline.push([nextPoint.x, nextPoint.y]);

		// set the current point to the next point
		currentPoint.x = nextPoint.x;
		currentPoint.y = nextPoint.y;
	}

	// "shrink wrap" the grid by moving each point 0.5 away from the nearest empty space
	for (let i = 0; i < outline.length; i++) {
		const point = outline[i];

		const direction = new Vector2(0, 0);

		for (let index = 0; index < allDirections.length; index++) {
			const checkDirection = allDirections[index];

			const x = point[0] + checkDirection.x;
			const y = point[1] + checkDirection.y;

			if (getGridValue(grid, x, y) === 1) {
				direction.x += checkDirection.x;
				direction.y += checkDirection.y;
			}
		}

		if (direction.x < 0) direction.x = -(0.5 + margin);
		if (direction.x > 0) direction.x = (0.5 + margin);
		if (direction.y < 0) direction.y = -(0.5 + margin);
		if (direction.y > 0) direction.y = (0.5 + margin);

		point[0] += direction.x;
		point[1] += direction.y;
	}

	// remove any points which are on the same axis as the previous and next points
	for (let i = outline.length - 2; i >= 1; i--) {
		const point = outline[i];
		const prevPoint = outline[i - 1] || outline[outline.length - 1];
		const nextPoint = outline[i + 1] || outline[0];

		if (prevPoint[0] === point[0] && nextPoint[0] === point[0]) {
			outline.splice(i, 1);
		}
		if (prevPoint[1] === point[1] && nextPoint[1] === point[1]) {
			outline.splice(i, 1);
		}
	}


	return outline;
}

const cardinalDirections = [
	{ x: 1, y: 0 },
	{ x: -1, y: 0 },
	{ x: 0, y: 1 },
	{ x: 0, y: -1 },
];
const diagonalDirections = [
	{ x: 1, y: 1 },
	{ x: -1, y: -1 },
	{ x: 1, y: -1 },
	{ x: -1, y: 1 },
];
const allDirections = cardinalDirections.concat(diagonalDirections);

/**
 * Builds a ShapeGeometry for a range of points on a Hilbert curve
 * @param {*} start 
 * @param {*} end 
 */
export function hilbertGeometry(start, end, geometryOptions = {}) {
	const points = [];

	for (let i = start; i <= end; i++) {
		points.push(distance2Point(i));
	}

	const outline = outlinePoints(points);
	const shape = new Shape();

	for (let index = 0; index < outline.length; index++) {
		const element = outline[index];
		if (index === 0) {
			shape.moveTo(element[0], element[1]);
		} else {
			shape.lineTo(element[0], element[1]);
		}
	}

	const geometry = new ExtrudeGeometry(shape, {
		depth: 1,
		bevelEnabled: false,
		...geometryOptions,
	});

	return geometry;
}