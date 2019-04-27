'use strict';


module.exports = {
	
	sand: `
		void main() {
			
			vec3 uv3 = getUv3(varUv);
			vec2 suv = varUv * 32.0;
			
			float wave = abs(sin(M_PI * (suv.x + suv.y + 2.3 * noise(uv3 * 5.0))));
			
			float waveMask = noise(uv3 * 2.0);
			
			vec3 baseColor = texture2D(_grain, varUv).xyz * 0.9;
			baseColor.z *= 0.6;
			
			vec3 grainColor = texture2D(_grain, varUv * 2.0).xyz;
			
			vec3 color = vec3(0.3 + wave * 0.7, 0.3 + wave * 0.7, wave * 0.6);
			
			vec3 mixed1 = mix(color, baseColor, min(0.97, 0.6 + waveMask * 0.8));
			vec3 mixed2 = mix(mixed1, grainColor, 0.65);
			
			gl_FragColor = vec4(mixed2, 1.0);
			
		}
	`,
	
	dirt: `
		void main() {
			
			vec3 uv3 = getUv3(varUv);
			
			vec3 baseColor = texture2D(_grain, varUv).xyz * 0.6;
			baseColor.y *= 0.8;
			baseColor.z *= 0.6;
			
			vec3 grainColor = texture2D(_grain, varUv * 2.0).xyz * 0.4;
			
			float wave = noise(uv3 * 7.0) * 0.5;
			
			vec3 mixed1 = mix(vec3(wave), grainColor, 0.8);
			vec3 mixed2 = mix(baseColor, mixed1, 0.3);
			
			gl_FragColor = vec4(mixed2, 1.0);
			
		}
	`,
	
	stone: `
		void main() {
			
			vec3 uv3 = getUv3(varUv);
			
			vec3 grainColor = texture2D(_grain, varUv * 2.0).xyz * 0.5;
			
			float wave = noise(uv3 * 3.0);
			vec3 back = mix(vec3(wave * 0.3), grainColor, 0.9);
			
			float crackMask1 = pow(min(1.0, noise(vec3(uv3.zxy + 4.0) * 2.5) * 1.5), 18.0);
			float crackMask2 = pow(min(1.0, noise(vec3(uv3.xzy - 4.0) * 2.5) * 1.5), 18.0);
			
			vec2 crackUv = -varUv.yx * 6.0;
			float crackLine1 = 1.0 - min(
				1.0,
				abs(sin(M_PI * (abs(crackUv.x - crackUv.y) + 3.0 * wave))) * 4.0
			);
			float crackLine2 = 1.0 - min(
				1.0,
				abs(sin(M_PI * (abs(crackUv.x + crackUv.y) + 2.0 * wave))) * 4.0
			);
			
			crackLine1 = 1.0 - 0.3 * crackLine1 * crackMask1;
			crackLine2 = crackLine2 * crackMask2;
			
			vec3 cracks = vec3(mix(crackLine1, crackLine2, 0.4));
			
			gl_FragColor = vec4(mix(back, cracks, 0.2), 1.0);
			
		}
	`,
	
	asphalt: `
		void main() {
			
			vec3 uv3 = getUv3(varUv);
			
			vec3 grainColor = texture2D(_grain, varUv * 2.0).xyz;
			grainColor.x *= 0.88;
			grainColor.y *= 0.93;
			
			vec3 mixed = min(vec3(1.0), pow(1.1 * grainColor, vec3(8.0)));
			
			gl_FragColor = vec4(mixed, 1.0);
			
		}
	`,
	
};
