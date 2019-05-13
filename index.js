'use strict';


(() => {
	
	if (typeof THREE !== 'object') {
		console.warn('Import this file after THREE.JS');
		return;
	}
	
	const vertexShader = `
		varying vec2 varUv;
		void main() {
			varUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}
	`;
	
	const getFragmentShader = fragment => `
		precision highp float;
		uniform sampler2D _grain;
		varying vec2 varUv;
		
		#define M_PI 3.141592653
		#define M_2PI 2.0 * M_PI
		#define M_PI2 0.5 * M_PI
		
		vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
		vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
		
		int mod(int x, int m) {
			return int(mod(float(x), float(m)));
		}
		
		float random5(vec3 co) {
			return fract(sin(dot(co.xyz ,vec3(12.9898,78.233,1.23456))) * 43758.5453);
		}
		
		
		float random4(float x, float y, float z) {
			return random5(vec3(x, y, z));
		}
		
		float random4(int x, int y, int z) {
			return random4(float(x), float(y), float(z));
		}
		
		float interpolation(float a, float b, float x) {
			float ft = x * M_PI;
			float f = (1.0 - cos(ft)) * 0.5;
			return a * (1.0 - f) + b * f;
		}
		
		float tricosine(vec3 coordFloat) {
			vec3 coord0 = vec3(floor(coordFloat.x), floor(coordFloat.y), floor(coordFloat.z));
			vec3 coord1 = vec3(coord0.x + 1.0, coord0.y + 1.0, coord0.z + 1.0);
			float xd = (coordFloat.x - coord0.x) / max(1.0, (coord1.x - coord0.x));
			float yd = (coordFloat.y - coord0.y) / max(1.0, (coord1.y - coord0.y));
			float zd = (coordFloat.z - coord0.z) / max(1.0, (coord1.z - coord0.z));
			float c00 = interpolation(random4(coord0.x, coord0.y, coord0.z), random4(coord1.x, coord0.y, coord0.z), xd);
			float c10 = interpolation(random4(coord0.x, coord1.y, coord0.z), random4(coord1.x, coord1.y, coord0.z), xd);
			float c01 = interpolation(random4(coord0.x, coord0.y, coord1.z), random4(coord1.x, coord0.y, coord1.z), xd);
			float c11 = interpolation(random4(coord0.x, coord1.y, coord1.z), random4(coord1.x, coord1.y, coord1.z), xd);
			float c0 = interpolation(c00, c10, yd);
			float c1 = interpolation(c01, c11, yd);
			float c = interpolation(c0, c1, zd);
			
			return c;
		}
		
		float helper(vec3 pos, float resolution) {
			vec3 coordFloat = (pos + vec3(1.0)) / 2.0 * resolution;
			float interpolated = tricosine(coordFloat);
			return interpolated;
		}
		
		float noise(vec3 pos) {
			float resolution1 = 4.0;
			float resolution2 = 16.0;
			float resolution3 = 32.0;
			float resolution4 = 64.0;
			float resolution5 = 128.0;
			float resolutionMax = 256.0;
			
			float level1 = helper(pos, resolution1);
			float level2 = helper(pos, resolution2);
			float level3 = helper(pos, resolution3);
			float level4 = helper(pos, resolution4);
			float level5 = helper(pos, resolution5);
			float levelMax = helper(pos, resolutionMax);
			
			float c = 0.1;
			c *= 1.0 + level1 * 4.5;
			c *= 1.0 + level2 * 0.3;
			c *= 1.0 + level3 * 0.2;
			c *= 1.0 + level4 * 0.1;
			c *= 1.0 + level5 * 0.05;
			c *= 1.0 + levelMax * 0.025;
			return c;
			
		}
		
		float getSign(float x) {
			return x < 0.0 ? -1.0 : 1.0;
		}
		
		vec3 getUv3(vec2 uv) {
			vec2 uvSubmerged1 = uv - vec2(0.5); // -0.5 - 0 - 0.5
			vec2 uvSubmerged1Abs = abs(uvSubmerged1); // 0.5 - 0 - 0.5
			vec2 uvSubmerged2 = uvSubmerged1Abs - vec2(0.25); // 0.25 - -0.25 - 0.25
			vec2 uvSubmerged2Abs = vec2(0.25) - abs(uvSubmerged2);
			vec2 uvFinal = vec2(
				uvSubmerged2Abs.x * getSign(uvSubmerged1.x),
				uvSubmerged2Abs.y * getSign(uvSubmerged1.y)
			);
			return vec3(uvSubmerged1Abs * 2.0, uvFinal.x + uvFinal.y);
		}
		
		${fragment}
		
	`;
	
	
	const grain = `
		void main() {
			vec3 uv3 = getUv3(varUv);
			
			float grainR = noise(uv3 * 2000.0);
			float grainG = noise((uv3.yxz + 2.0) * 2000.0);
			float grainB = noise(-uv3.zyx * 2000.0);
			float grainAvgR = mix(grainR, 1.0, (grainG + grainB) * 0.7);
			float grainAvgG = mix(grainG, 1.0, (grainR + grainB) * 0.6);
			float grainAvgB = mix(grainB, 1.0, (grainR + grainG) * 0.5);
			vec3 grain = vec3(grainAvgR, grainAvgG, grainAvgB);
			
			gl_FragColor = vec4(grain, 1.0);
		}
	`;
	
	let baseTexture = undefined;
	
	THREE.generateTexture = ({
		renderer,
		resolution = 1024,
		uniforms = {},
		fragment = 'void main() {gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);}',
		noconsole = true,
		nodebug = false,
		mipmaps = true,
		anisotropy,
	}) => {
		
		anisotropy = anisotropy !== undefined ?
			anisotropy : renderer.capabilities.getMaxAnisotropy();
		
		if (baseTexture === undefined) {
			baseTexture = null;
			const { texture } = THREE.generateTexture({ renderer, fragment : grain });
			baseTexture = texture;
		}
		
		const reshalf = Math.round(resolution * 0.5);
		
		const renderTarget = new THREE.WebGLRenderTarget(
			resolution,
			resolution,
			{
				minFilter : THREE.LinearFilter,
				magFilter : THREE.LinearFilter,
				format    : THREE.RGBAFormat,
			}
		);
		
		const textureCamera = new THREE.OrthographicCamera(
			-reshalf, reshalf,
			reshalf, -reshalf,
			-100, 100
		);
		textureCamera.position.z = 10;
		
		const textureScene = new THREE.Scene();
		
		const finalUniforms = Object.assign(
			{},
			uniforms,
			{ _grain : { type: 't', value: baseTexture } }
		);
		const plane = new THREE.Mesh(
			new THREE.PlaneGeometry(resolution, resolution),
			new THREE.ShaderMaterial({
				uniforms       : finalUniforms,
				vertexShader   : vertexShader,
				fragmentShader : getFragmentShader(fragment),
				transparent    : true,
				depthWrite     : false,
			})
		);
		plane.position.z = -10;
		textureScene.add(plane);
		
		const prevRt = renderer.getRenderTarget();
		renderer.setRenderTarget(renderTarget);
		renderer.clear();
		
		// SUPPRESS console?
		const c1 = console.log;
		const c2 = console.info;
		const c3 = console.error;
		const c4 = console.debug;
		const c5 = console.warn;
		const d = renderer.debug && renderer.debug.checkShaderErrors;
		if (noconsole) {
			console.log = () => {};
			console.info = () => {};
			console.error = () => {};
			console.debug = () => {};
			console.warn = () => {};
		}
		if (renderer.debug && ! nodebug) {
			renderer.debug.checkShaderErrors = true;
		}
		renderer.render(textureScene, textureCamera);
		if (renderer.debug && ! nodebug) {
			renderer.debug.checkShaderErrors = d;
		}
		if (noconsole) {
			console.log = c1;
			console.info = c2;
			console.error = c3;
			console.debug = c4;
			console.warn = c5;
		}
		
		if (
			plane.material.program.diagnostics &&
			! plane.material.program.diagnostics.runnable
		) {
			renderer.setRenderTarget(prevRt);
			const error = plane.material.program.diagnostics.fragmentShader.log;
			return { buffer: null, texture: null, error };
		}
		
		const buffer = new Uint8Array(resolution * resolution * 4);
		const gl = renderer.getContext();
		gl.readPixels(0, 0, resolution, resolution, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
		
		renderer.setRenderTarget(prevRt);
		
		const texture = new THREE.DataTexture(
			buffer, resolution, resolution, THREE.RGBAFormat, THREE.UnsignedByteType,
			THREE.UVMapping, THREE.RepeatWrapping, THREE.RepeatWrapping,
			THREE.LinearFilter, THREE.LinearMipMapLinearFilter,
			anisotropy
		);
		texture.generateMipmaps = mipmaps;
		texture.needsUpdate = true;
		
		return { buffer, texture, error: null };
		
	};
	
})();
