
/**
 * Takes a string, hashes it, and returns a HSL color
 * @param {string} name 
 */
export default function getCompanyColor (name) {
	const hash = name.split('').reduce((acc, char) => {
		return acc + char.charCodeAt(0);
	}, 0);

	const hue = hash * 0.2 % 360;
	const saturation = 75;
	const lightness = 60;

	return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}