import { hilbertGeometry } from "./utils/hilbert";

let messageQueue = [];
let timeout = false;
function queueMessage(message) {
	messageQueue.push(message);
	if (!timeout) {
		timeout = true;
		setTimeout(() => {
			checkMessageQueue();
			timeout = false;
		}, 10);
	}
}

function checkMessageQueue() {
	if (messageQueue.length > 0) {
		self.postMessage(messageQueue);
		messageQueue = [];
	}
}

self.onmessage = ({ data: { type, data, id } }) => {
	switch (type) {
		case "hilbert_geometry":
			const result = hilbertGeometry(data.start, data.end, data.geometryOptions);

			const attributes = {};

			for (const key in result.attributes) {
				if (Object.hasOwnProperty.call(result.attributes, key)) {
					const element = result.attributes[key];
					attributes[key] = {
						array: element.array,
						itemSize: element.itemSize,
					};
				}
			}

			queueMessage({
				data: {
					attributes,
					groups: result.groups,
				},
				id: data.id,
			});

			break;
		default:
			console.error("Unknown message type", type);
	}
};