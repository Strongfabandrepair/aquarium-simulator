import * as THREE from 'three';

const cache = new Map();
const palettes = {
    lyretailAnthias: [239, 117, 63],
    greenChromis: [58, 189, 180],
    yellowWatchmanGoby: [242, 209, 35],
    clownfish: [247, 105, 13],
    royalGramma: [139, 35, 202],
    firefishGoby: [239, 228, 204],
    yellowTang: [250, 216, 12],
    blueHippoTang: [22, 97, 235],
    banggaiCardinal: [207, 211, 214],
    tailspotBlenny: [127, 137, 112],
    sixLineWrasse: [199, 71, 43],
    mandarinGoby: [21, 128, 88],
    flameAngel: [246, 76, 15]
};

// Generated once per species. UVs run tail -> nose and continuously around the body.
export function fishTexture(id) {
    if (cache.has(id)) return cache.get(id);
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const pixels = ctx.createImageData(canvas.width, canvas.height);
    for (let y = 0; y < 256; y++) {
        const angle = (y / 255) * Math.PI * 2;
        const side = Math.sin(angle);
        const height = Math.cos(angle);
        for (let x = 0; x < 512; x++) {
            const u = x / 511;
            let rgb = (palettes[id] || palettes.clownfish).slice();
            const black = [17, 22, 29],
                white = [243, 242, 223];
            if (id === 'valentiniPuffer') {
                rgb = [226, 218, 184];
                if (
                    height > -0.1 &&
                    Math.min(
                        Math.abs(u - 0.23),
                        Math.abs(u - 0.48),
                        Math.abs(u - 0.72)
                    ) < 0.065
                )
                    rgb = black;
                if (
                    height < 0.25 &&
                    Math.sin(u * 145) * Math.cos(angle * 29) > 0.8
                )
                    rgb = [106, 74, 39];
            } else if (id === 'orchidDottyback') {
                rgb = [179, 48, 201];
                if (u > 0.76 && Math.abs(height - 0.3) < 0.09) rgb = black;
            } else if (id === 'lyretailAnthias') {
                if (u > 0.77 && Math.abs(height + 0.2) < 0.08)
                    rgb = [167, 65, 167];
                if (height > 0.5) rgb = [233, 75, 130];
            } else if (id === 'greenChromis') {
                rgb = [
                    50 + 30 * u,
                    177 + 25 * Math.abs(side),
                    174 + 38 * Math.abs(side)
                ];
            } else if (id === 'yellowWatchmanGoby') {
                if (Math.sin(u * 109) * Math.cos(angle * 27) > 0.9)
                    rgb = [61, 159, 222];
            } else if (id === 'clownfish') {
                const bend = 0.018 * Math.sin(angle * 2);
                const d = Math.min(
                    Math.abs(u - 0.18 - bend),
                    Math.abs(u - 0.52 + bend),
                    Math.abs(u - 0.83 - bend)
                );
                if (d < 0.075) rgb = black;
                if (d < 0.05) rgb = white;
            } else if (id === 'royalGramma') {
                if (u < 0.48 + Math.sin(angle * 11) * 0.014)
                    rgb = [248, 209, 14];
                if (u > 0.76 && Math.abs(height - (u - 0.83) * 2) < 0.09)
                    rgb = black;
            } else if (id === 'firefishGoby') {
                const t = Math.max(0, 1 - u / 0.7);
                rgb = [239 - 30 * t, 228 - 203 * t, 204 - 181 * t];
                if (u > 0.9 && height > 0.1) rgb = [240, 208, 62];
            } else if (id === 'blueHippoTang') {
                // Black artist's-palette loop enclosing a blue oval on each flank.
                const oval =
                    ((u - 0.49) / 0.29) ** 2 + ((height - 0.24) / 0.52) ** 2;
                if (
                    (oval > 0.55 && oval < 1.3) ||
                    (u < 0.22 && height > -0.15) ||
                    height > 0.86
                )
                    rgb = black;
                if (u < 0.08) rgb = [255, 219, 9];
            } else if (id === 'banggaiCardinal') {
                if (
                    Math.min(
                        Math.abs(u - 0.3),
                        Math.abs(u - 0.57),
                        Math.abs(u - 0.84)
                    ) < 0.055
                )
                    rgb = black;
                const spot = Math.sin(u * 145) * Math.sin(angle * 28);
                if (spot > 0.93 && u < 0.76) rgb = white;
            } else if (id === 'tailspotBlenny') {
                if (u > 0.7) rgb = [187, 126, 65];
                if (((u - 0.17) / 0.065) ** 2 + (height / 0.38) ** 2 < 1)
                    rgb = black;
                if (u > 0.74 && height < -0.16 && height > -0.3)
                    rgb = [249, 215, 57];
                if (u > 0.73 && height < -0.32 && height > -0.43)
                    rgb = [24, 40, 60];
            } else if (id === 'sixLineWrasse') {
                // Six continuous longitudinal blue-violet lines on each flank.
                for (let k = 0; k < 6; k++)
                    if (Math.abs(height - (-0.77 + k * 0.3)) < 0.052)
                        rgb = [82, 55, 153];
                if (u < 0.14) rgb = [42, 164, 97];
                if (
                    ((u - 0.17) / 0.038) ** 2 + ((height - 0.55) / 0.16) ** 2 <
                    1
                )
                    rgb = black;
            } else if (id === 'mandarinGoby') {
                const maze =
                    Math.sin(u * 31 + 2.3 * Math.sin(angle * 3)) +
                    0.7 * Math.cos(angle * 9 + u * 15);
                if (Math.abs(maze) < 0.59) rgb = [231, 111, 21];
                if (Math.abs(maze) < 0.27) rgb = [21, 198, 227];
                if (Math.abs(maze) > 1.5) rgb = [17, 42, 69];
            } else if (id === 'flameAngel') {
                if (
                    u > 0.2 &&
                    u < 0.8 &&
                    Math.sin(u * 42 + height * 0.8) > 0.78
                )
                    rgb = black;
                if (height > 0.88 || height < -0.88) rgb = [29, 83, 196];
            }
            const scale = Math.pow(
                Math.abs(
                    Math.sin(u * 265 + (Math.floor(y / 5) % 2)) *
                        Math.cos(angle * 68)
                ),
                12
            );
            const shade =
                0.82 + 0.14 * Math.abs(side) - 0.07 * height + scale * 0.07;
            const i = (y * 512 + x) * 4;
            for (let c = 0; c < 3; c++)
                pixels.data[i + c] = Math.min(255, rgb[c] * shade);
            pixels.data[i + 3] = 255;
        }
    }
    ctx.putImageData(pixels, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    texture.anisotropy = 4;
    cache.set(id, texture);
    return texture;
}
