# 3D Hilbert Visualizer

An embed to visualize ranges of one dimensional data, in 3D space. An example of this is visualizing IP addresses.


![](./hilbert-preview.png)

# Running example code

Download this repo, run NPM install, then start the example server using `npm run dev`.

# installing
Add to your project by running 
```npm i --save https://github.com/CircleClick/3D-Hilbert-Visualization```

# usage

```js
import HilbertVisualizer from '3DHilbertVisualizer';

const visualizer = new HilbertVisualizer({
	hilbertSize: 10,
});
```

`hilbertSize` indicates how big your "grid" is going to be, `32` covers all of IPv4 space. The number is fed into Math.pow(2, hilbertSize) to inform the hilbert curve algorithm on where to place elements.

---
# other
...

Old example, for reference: 

[https://ipv4-hilbert.netlify.app/?ip_block=194&focus=194.15.120.0](https://ipv4-hilbert.netlify.app/?ip_block=194&focus=194.15.120.0)