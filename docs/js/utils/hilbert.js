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
export function point2Distance(x, y, n = 65536) {
	let rx, ry, d = 0,
		xy = [x, y];

	for (let s = n / 2; s >= 1; s /= 2) {
		rx = (xy[0] & s) > 0;
		ry = (xy[1] & s) > 0;
		d += s * s * ((3 * rx) ^ ry);
		rot(s, xy, rx, ry);
	}
	return d;
}

// d: distance, n: sqrt of num cells (square side size)
export function distance2Point(d, n = 65536) {
	let rx, ry, t = d,
		xy = [0, 0];

	for (let s = 1; s < n; s *= 2) {
		rx = 1 & (t / 2);
		ry = 1 & (t ^ rx);
		rot(s, xy, rx, ry);

		xy[0] += (s * rx);
		xy[1] += (s * ry);
		t /= 4;
	}
	return xy;
}
