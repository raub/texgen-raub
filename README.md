# Texgen

This is a part of [Node3D](https://github.com/node-3d) project.

[![NPM](https://nodei.co/npm/texgen-raub.png?compact=true)](https://www.npmjs.com/package/texgen-raub)

![Build Status](https://travis-ci.com/node-3d/texgen-raub.svg?branch=master)

> npm i -s texgen-raub

This works only with **THREE.JS**. [Live DEMO](http://gsom.tech/texgen).


## Synopsis

Method `THREE.generateTexture` is added.

Args:

```js
{
	resolution: number = 1024,
	uniforms   : Object = {},
	fragment   : string = 'void main() {gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);}',
	noconsole  : bool = true,
	nodebug    : bool = false,
	mipmaps    : bool = true,
	floating   : bool = false,
	anisotropy : number = renderer.capabilities.getMaxAnisotropy(),
}
```

* `resolution` The size of the texture. Must be power of 2.
* `uniforms` Passed directly into the `THREE.Material`.
* `fragment` Fragment shader code for texture generation.
* `noconsole` Supress three.js shader logs in console.
* `nodebug` If threejs shader logs are omitted.
* `mipmaps` If mipmaps are generated for the texture.
* `floating` Generate floating-point texture (yay, heightmaps!).
* `anisotropy` Anisotropy filtering level for the texture.

Returns:

```js
{
	texture : ?THREE.Texture,
	buffer  : ?(Uint8Array|Float32Array),
	error   : ?string,
}
```

* `texture` The resulting texture, if any.
* `buffer` The raw texture data. The type depends on the passed `floating` flag.
* `error` If an error has occured, it is passed here.


---

This is a procedural texture generator. You have to provide a piece of
fragment-shader code with at least the `main` function present.

The output is not necesserily seamless. But it is easy to achieve.



## Usage

```js
const fragment = `
void main() {
	vec3 uv3 = getUv3(varUv);
	gl_FragColor = vec4(vec3(pow(noise(uv3 + 9.4) * 1.7, 10.0)), 1.0);
}
`;
const { texture } = THREE.generateTexture({ renderer, fragment });
material.map = texture;
```

The following image is produced. Here it is easy to see the seamless edges:

![Example](example.png)

More texture-like images are achieved with multiple layers of noise.
See [examples](examples.js) here. Also you can practice at the
[Live DEMO](http://gsom.tech/texgen) website.
There you can also download your results as PNG.

### GLSL API Details:

* `void main() {}` Required procedure
* `vec4 gl_FragColor` Output pixel color
* `vec2 varUv` varying UV coords [0; 1]
* `vec3 getUv3(vec2)` 3D seamless noise coords
* `sampler2D _grain` convenience grain texture
* `float noise(vec3)` coherent noise generator
* `float getSign(float)` -1 for negative, +1 otherwise
* `M_PI = 3.141592653`
* `M_2PI = 2.0 * M_PI`
* `M_PI2 = 0.5 * M_PI`
