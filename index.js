'use strict';


(function () {
	
	if (typeof THREE !== 'object') {
		console.warn('Import this file after THREE.JS');
		return;
	}
	
	var vertexShader = '' +
	'	varying vec2 varUv;\n' +
	'	void main() {\n' +
	'		varUv = uv;\n' +
	'		gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n' +
	'	}\n' +
	'';
	
	var getFragmentShader = function (fragment) { return '' +
	'	precision highp float;\n' +
	'	uniform sampler2D _grain;\n' +
	'	varying vec2 varUv;\n' +
	'	\n' +
	'	#define M_PI 3.141592653\n' +
	'	#define M_2PI 2.0 * M_PI\n' +
	'	#define M_PI2 0.5 * M_PI\n' +
	'	\n' +
	'	vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}\n' +
	'	vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}\n' +
	'	\n' +
	'	int mod(int x, int m) {\n' +
	'		return int(mod(float(x), float(m)));\n' +
	'	}\n' +
	'	\n' +
	'	float random5(vec3 co) {\n' +
	'		return fract(sin(dot(co.xyz ,vec3(12.9898,78.233,1.23456))) * 43758.5453);\n' +
	'	}\n' +
	'	\n' +
	'	\n' +
	'	float random4(float x, float y, float z) {\n' +
	'		return random5(vec3(x, y, z));\n' +
	'	}\n' +
	'	\n' +
	'	float random4(int x, int y, int z) {\n' +
	'		return random4(float(x), float(y), float(z));\n' +
	'	}\n' +
	'	\n' +
	'	float interpolation(float a, float b, float x) {\n' +
	'		float ft = x * M_PI;\n' +
	'		float f = (1.0 - cos(ft)) * 0.5;\n' +
	'		return a * (1.0 - f) + b * f;\n' +
	'	}\n' +
	'	\n' +
	'	float tricosine(vec3 coordFloat) {\n' +
	'		vec3 coord0 = vec3(floor(coordFloat.x), floor(coordFloat.y), floor(coordFloat.z));\n' +
	'		vec3 coord1 = vec3(coord0.x + 1.0, coord0.y + 1.0, coord0.z + 1.0);\n' +
	'		float xd = (coordFloat.x - coord0.x) / max(1.0, (coord1.x - coord0.x));\n' +
	'		float yd = (coordFloat.y - coord0.y) / max(1.0, (coord1.y - coord0.y));\n' +
	'		float zd = (coordFloat.z - coord0.z) / max(1.0, (coord1.z - coord0.z));\n' +
	'		float c00 = interpolation(random4(coord0.x, coord0.y, coord0.z), random4(coord1.x, coord0.y, coord0.z), xd);\n' +
	'		float c10 = interpolation(random4(coord0.x, coord1.y, coord0.z), random4(coord1.x, coord1.y, coord0.z), xd);\n' +
	'		float c01 = interpolation(random4(coord0.x, coord0.y, coord1.z), random4(coord1.x, coord0.y, coord1.z), xd);\n' +
	'		float c11 = interpolation(random4(coord0.x, coord1.y, coord1.z), random4(coord1.x, coord1.y, coord1.z), xd);\n' +
	'		float c0 = interpolation(c00, c10, yd);\n' +
	'		float c1 = interpolation(c01, c11, yd);\n' +
	'		float c = interpolation(c0, c1, zd);\n' +
	'		\n' +
	'		return c;\n' +
	'	}\n' +
	'	\n' +
	'	float helper(vec3 pos, float resolution) {\n' +
	'		vec3 coordFloat = (pos + vec3(1.0)) / 2.0 * resolution;\n' +
	'		float interpolated = tricosine(coordFloat);\n' +
	'		return interpolated;\n' +
	'	}\n' +
	'	\n' +
	'	float noise(vec3 pos) {\n' +
	'		float resolution1 = 4.0;\n' +
	'		float resolution2 = 16.0;\n' +
	'		float resolution3 = 32.0;\n' +
	'		float resolution4 = 64.0;\n' +
	'		float resolution5 = 128.0;\n' +
	'		float resolutionMax = 256.0;\n' +
	'		\n' +
	'		float level1 = helper(pos, resolution1);\n' +
	'		float level2 = helper(pos, resolution2);\n' +
	'		float level3 = helper(pos, resolution3);\n' +
	'		float level4 = helper(pos, resolution4);\n' +
	'		float level5 = helper(pos, resolution5);\n' +
	'		float levelMax = helper(pos, resolutionMax);\n' +
	'		\n' +
	'		float c = 0.1;\n' +
	'		c *= 1.0 + level1*4.5;\n' +
	'		c *= 1.0 + level2*0.3;\n' +
	'		c *= 1.0 + level3*0.2;\n' +
	'		c *= 1.0 + level4*0.1;\n' +
	'		c *= 1.0 + level5*0.05;\n' +
	'		c *= 1.0 + levelMax*(0.025);\n' +
	'		return c;\n' +
	'		\n' +
	'	}\n' +
	'	\n' +
	'	float getSign(float x) {\n' +
	'		return x < 0.0 ? -1.0 : 1.0;\n' +
	'	}\n' +
	'	\n' +
	'	vec3 getUv3(vec2 uv) {\n' +
	'		vec2 uvSubmerged1 = uv - vec2(0.5);\n' +
	'		vec2 uvSubmerged1Abs = abs(uvSubmerged1);\n' +
	'		vec2 uvSubmerged2 = uvSubmerged1Abs - vec2(0.25);\n' +
	'		vec2 uvSubmerged2Abs = vec2(0.25) - abs(uvSubmerged2);\n' +
	'		vec2 uvFinal2 = vec2(\n' +
	'			uvSubmerged2Abs.x * getSign(uvSubmerged1.x),\n' +
	'			uvSubmerged2Abs.y * getSign(uvSubmerged1.y)\n' +
	'		);\n' +
	'		float z = uvFinal2.x + uvFinal2.y;\n' +
	'		vec2 uv2 = abs(uvSubmerged1 * 2.0); // 1 - 0 - 1\n' +
	'		return vec3(uv2, z);\n' +
	'	}\n' +
	'	\n' +
	'	\n' +
	fragment + '\n' +
	'	\n' +
	''; };
	
	
	var grain = '' +
	'	void main() {\n' +
	'		vec3 uv3 = getUv3(varUv);\n' +
	'		\n' +
	'		float grainR = noise(uv3 * 2000.0);\n' +
	'		float grainG = noise((uv3.yxz + 2.0) * 2000.0);\n' +
	'		float grainB = noise(-uv3.zyx * 2000.0);\n' +
	'		float grainAvgR = mix(grainR, 1.0, (grainG + grainB) * 0.7);\n' +
	'		float grainAvgG = mix(grainG, 1.0, (grainR + grainB) * 0.6);\n' +
	'		float grainAvgB = mix(grainB, 1.0, (grainR + grainG) * 0.5);\n' +
	'		vec3 grain = vec3(grainAvgR, grainAvgG, grainAvgB);\n' +
	'		\n' +
	'		gl_FragColor = vec4(grain, 1.0);\n' +
	'	}\n' +
	'';
	
	var baseTexture = undefined;
	
	THREE.generateTexture = function (opts) {
		
		var renderer = opts.renderer;
		var resolution = opts.resolution || 1024;
		var uniforms = opts.uniforms || {};
		var fragment = opts.fragment || 'void main() {gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);}';
		
		if (baseTexture === undefined) {
			baseTexture = null;
			var result = THREE.generateTexture({ renderer : renderer, fragment : grain });
			baseTexture = result.texture;
		}
		
		var reshalf = 512;
		
		var renderTarget = new THREE.WebGLRenderTarget(
			resolution,
			resolution,
			{
				minFilter : THREE.LinearFilter,
				magFilter : THREE.LinearFilter,
				format    : THREE.RGBFormat,
			}
		);
		
		var textureCamera = new THREE.OrthographicCamera(
			-reshalf,
			reshalf,
			reshalf,
			-reshalf,
			-100,
			100
		);
		textureCamera.position.z = 10;
		
		var textureScene = new THREE.Scene();
		
		var finalUniforms = Object.assign(
			{},
			uniforms,
			{ _grain : { type: 't', value: baseTexture } }
		);
		var plane = new THREE.Mesh(
			new THREE.PlaneGeometry(resolution, resolution),
			new THREE.ShaderMaterial({
				uniforms: finalUniforms,
				vertexShader: vertexShader,
				fragmentShader: getFragmentShader(fragment),
				transparent: true,
				depthWrite: false,
			})
		);
		plane.position.z = -10;
		textureScene.add(plane);
		
		renderer.setRenderTarget(renderTarget);
		renderer.clear();
		
		// SUPPRESS console
		var c1 = console.log;
		var c2 = console.info;
		var c3 = console.error;
		var c4 = console.debug;
		var c5 = console.warn;
		console.log = () => {};
		console.info = () => {};
		console.error = () => {};
		console.debug = () => {};
		console.warn = () => {};
		renderer.render(textureScene, textureCamera);
		console.log = c1;
		console.info = c2;
		console.error = c3;
		console.debug = c4;
		console.warn = c5;
		
		if (
			plane.material.program.diagnostics &&
			! plane.material.program.diagnostics.runnable
		) {
			renderer.setRenderTarget(null);
			var error = plane.material.program.diagnostics.fragmentShader.log;
			return { buffer: null, texture: null, error: error };
		}
		
		var buffer = new Uint8Array(resolution * resolution * 4);
		var gl = renderer.getContext();
		gl.readPixels(0, 0, resolution, resolution, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
		
		renderer.setRenderTarget(null);
		
		var texture = new THREE.DataTexture(
			buffer, resolution, resolution, THREE.RGBAFormat, THREE.UnsignedByteType,
			THREE.UVMapping, THREE.RepeatWrapping, THREE.RepeatWrapping,
			THREE.LinearFilter, THREE.LinearMipMapLinearFilter,
			renderer.capabilities.getMaxAnisotropy()
		);
		texture.generateMipmaps = true;
		texture.needsUpdate = true
		
		return { buffer: buffer, texture: texture };
		
	};
	
})();
