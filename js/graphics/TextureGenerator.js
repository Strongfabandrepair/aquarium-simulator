// PROCEDURAL CANVAS TEXTURE GENERATOR
import * as THREE from 'three';

const CACHE = new Map();

function hexToRgb(hex) {
    const n = typeof hex === 'number' ? hex : parseInt(hex, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbStr(c, a) {
    if (a === undefined) a = 1;
    return "rgba(" + c.r + "," + c.g + "," + c.b + "," + a + ")";
}

function lerpColor(a, b, t) {
    const ca = hexToRgb(a);
    const cb = hexToRgb(b);
    return { r: ca.r + (cb.r - ca.r) * t, g: ca.g + (cb.g - ca.g) * t, b: ca.b + (cb.b - ca.b) * t };
}

function makeCanvas(w, h) {
    w = w || 256; h = h || 256;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return { canvas: c, ctx: c.getContext('2d') };
}

function finalizeTexture(canvas, key) {
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.anisotropy = 4;
    if ('sRGBEncoding' in THREE) tex.encoding = THREE.sRGBEncoding;
    tex.needsUpdate = true;
    if (key) CACHE.set(key, tex);
    return tex;
}

function cached(key, builder) {
    if (CACHE.has(key)) return CACHE.get(key);
    return finalizeTexture(builder(), key);
}

function addSpeckle(ctx, w, h, count, baseAlpha) {
    if (baseAlpha === undefined) baseAlpha = 0.06;
    for (let i = 0; i < count; i++) {
        const shade = Math.random() < 0.5 ? 0 : 255;
        ctx.fillStyle = "rgba(" + shade + "," + shade + "," + shade + "," + (Math.random() * baseAlpha) + ")";
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = 0.5 + Math.random() * 1.5;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
}

function addCounterShading(ctx, w, h, topColor, bottomColor, strength) {
    if (strength === undefined) strength = 0.5;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, rgbStr(hexToRgb(topColor), strength));
    grad.addColorStop(0.55, rgbStr(hexToRgb(topColor), 0));
    grad.addColorStop(0.85, rgbStr(hexToRgb(bottomColor), strength * 0.7));
    grad.addColorStop(1, rgbStr(hexToRgb(bottomColor), strength));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
}

export function stripeTexture(key, baseColor, stripes, opts) {
    opts = opts || {};
    return cached(key, function () {
        const cv = makeCanvas(opts.w || 256, opts.h || 128);
        const canvas = cv.canvas, ctx = cv.ctx;
        const w = canvas.width, h = canvas.height;
        ctx.fillStyle = rgbStr(hexToRgb(baseColor));
        ctx.fillRect(0, 0, w, h);

        stripes.forEach(function (s) {
            const cx = s.x * w;
            const sw = s.width * w;
            if (s.borderColor) {
                ctx.fillStyle = rgbStr(hexToRgb(s.borderColor));
                ctx.fillRect(cx - sw / 2 - (s.borderWidth || 3), 0, sw + (s.borderWidth || 3) * 2, h);
            }
            ctx.fillStyle = rgbStr(hexToRgb(s.color));
            ctx.fillRect(cx - sw / 2, 0, sw, h);
        });

        if (opts.counterShade) addCounterShading(ctx, w, h, opts.counterShade[0], opts.counterShade[1]);
        addSpeckle(ctx, w, h, opts.speckle == null ? 400 : opts.speckle, opts.speckleAlpha);
        return canvas;
    });
}

export function lengthStripeTexture(key, baseColor, colors, count, opts) {
    opts = opts || {};
    return cached(key, function () {
        const cv = makeCanvas(opts.w || 256, opts.h || 128);
        const canvas = cv.canvas, ctx = cv.ctx;
        const w = canvas.width, h = canvas.height;
        ctx.fillStyle = rgbStr(hexToRgb(baseColor));
        ctx.fillRect(0, 0, w, h);

        const bandH = h / (count * 2);
        for (let i = 0; i < count; i++) {
            const color = colors[i % colors.length];
            const y = (i + 0.5) * (h / count) - bandH / 2;
            ctx.fillStyle = rgbStr(hexToRgb(color));
            ctx.fillRect(0, y, w, bandH);
        }
        addSpeckle(ctx, w, h, opts.speckle == null ? 300 : opts.speckle, opts.speckleAlpha);
        return canvas;
    });
}

export function mazeTexture(key, baseColor, lineColors, opts) {
    opts = opts || {};
    return cached(key, function () {
        const cv = makeCanvas(opts.w || 256, opts.h || 256);
        const canvas = cv.canvas, ctx = cv.ctx;
        const w = canvas.width, h = canvas.height;
        ctx.fillStyle = rgbStr(hexToRgb(baseColor));
        ctx.fillRect(0, 0, w, h);

        const lines = opts.lineCount || 14;
        for (let i = 0; i < lines; i++) {
            const startY = Math.random() * h;
            ctx.beginPath();
            ctx.moveTo(-10, startY);
            let y = startY;
            for (let x = 0; x <= w + 10; x += w / 8) {
                y += (Math.random() - 0.5) * h * 0.25;
                y = Math.max(4, Math.min(h - 4, y));
                ctx.lineTo(x, y);
            }
            ctx.lineWidth = 10;
            ctx.strokeStyle = rgbStr(hexToRgb(lineColors.outer));
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.stroke();
            ctx.lineWidth = 5;
            ctx.strokeStyle = rgbStr(hexToRgb(lineColors.inner[i % lineColors.inner.length]));
            ctx.stroke();
        }
        addSpeckle(ctx, w, h, 150, 0.04);
        return canvas;
    });
}

export function spotTexture(key, baseColor, dotColor, count, opts) {
    opts = opts || {};
    return cached(key, function () {
        const cv = makeCanvas(opts.w || 256, opts.h || 256);
        const canvas = cv.canvas, ctx = cv.ctx;
        const w = canvas.width, h = canvas.height;
        ctx.fillStyle = rgbStr(hexToRgb(baseColor));
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = rgbStr(hexToRgb(dotColor));
        const minR = opts.minR == null ? 2 : opts.minR;
        const maxR = opts.maxR == null ? 4 : opts.maxR;
        for (let i = 0; i < count; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            const r = minR + Math.random() * maxR;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
        addSpeckle(ctx, w, h, opts.speckle == null ? 200 : opts.speckle, 0.04);
        return canvas;
    });
}

export function mottleTexture(key, baseColor, blotchColors, opts) {
    opts = opts || {};
    return cached(key, function () {
        const cv = makeCanvas(opts.w || 256, opts.h || 256);
        const canvas = cv.canvas, ctx = cv.ctx;
        const w = canvas.width, h = canvas.height;
        ctx.fillStyle = rgbStr(hexToRgb(baseColor));
        ctx.fillRect(0, 0, w, h);

        const count = opts.count || 40;
        const alpha = opts.alpha == null ? 0.55 : opts.alpha;
        for (let i = 0; i < count; i++) {
            const color = blotchColors[i % blotchColors.length];
            ctx.fillStyle = rgbStr(hexToRgb(color), alpha);
            const x = Math.random() * w;
            const y = Math.random() * h;
            const rx = 8 + Math.random() * 24;
            const ry = 6 + Math.random() * 16;
            ctx.beginPath();
            ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }
        addSpeckle(ctx, w, h, opts.speckle == null ? 300 : opts.speckle, 0.05);
        return canvas;
    });
}

export function diagonalSplitTexture(key, colorA, colorB, splitAt, opts) {
    if (splitAt === undefined) splitAt = 0.45;
    opts = opts || {};
    return cached(key, function () {
        const cv = makeCanvas(opts.w || 256, opts.h || 128);
        const canvas = cv.canvas, ctx = cv.ctx;
        const w = canvas.width, h = canvas.height;
        const grad = ctx.createLinearGradient(0, 0, w, 0);
        const soft = opts.softness == null ? 0.08 : opts.softness;
        grad.addColorStop(0, rgbStr(hexToRgb(colorA)));
        grad.addColorStop(Math.max(0, splitAt - soft), rgbStr(hexToRgb(colorA)));
        grad.addColorStop(Math.min(1, splitAt + soft), rgbStr(hexToRgb(colorB)));
        grad.addColorStop(1, rgbStr(hexToRgb(colorB)));
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        addSpeckle(ctx, w, h, opts.speckle == null ? 250 : opts.speckle, 0.05);
        return canvas;
    });
}

export function concentricRingTexture(key, baseColor, ringColor, rings, opts) {
    opts = opts || {};
    return cached(key, function () {
        const cv = makeCanvas(opts.w || 256, opts.h || 256);
        const canvas = cv.canvas, ctx = cv.ctx;
        const w = canvas.width, h = canvas.height;
        const cx = w / 2, cy = h / 2, maxR = Math.min(w, h) / 2;
        ctx.fillStyle = rgbStr(hexToRgb(baseColor));
        ctx.fillRect(0, 0, w, h);
        for (let i = rings; i > 0; i--) {
            const t = i / rings;
            const col = lerpColor(baseColor, ringColor, (i % 2 === 0) ? 0.6 : 0.15);
            ctx.beginPath();
            ctx.arc(cx, cy, maxR * t, 0, Math.PI * 2);
            ctx.fillStyle = rgbStr(col, 0.8);
            ctx.fill();
        }
        ctx.strokeStyle = rgbStr(hexToRgb(ringColor), 0.35);
        ctx.lineWidth = 1;
        const spokes = opts.spokes || 48;
        for (let i = 0; i < spokes; i++) {
            const a = (i / spokes) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR);
            ctx.stroke();
        }
        return canvas;
    });
}

export function polypFieldTexture(key, baseColor, polypColor, count, opts) {
    opts = opts || {};
    return cached(key, function () {
        const cv = makeCanvas(opts.w || 128, opts.h || 128);
        const canvas = cv.canvas, ctx = cv.ctx;
        const w = canvas.width, h = canvas.height;
        ctx.fillStyle = rgbStr(hexToRgb(baseColor));
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < count; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            const r = 1.5 + Math.random() * 2.5;
            const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
            grad.addColorStop(0, rgbStr(hexToRgb(polypColor), 0.9));
            grad.addColorStop(1, rgbStr(hexToRgb(polypColor), 0));
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
        return canvas;
    });
}

export function bubbleSprite() {
    return cached('bubble-sprite', function () {
        const cv = makeCanvas(64, 64);
        const canvas = cv.canvas, ctx = cv.ctx;
        const g = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
        g.addColorStop(0, 'rgba(255,255,255,0.95)');
        g.addColorStop(0.4, 'rgba(200,235,255,0.5)');
        g.addColorStop(0.8, 'rgba(150,210,255,0.15)');
        g.addColorStop(1, 'rgba(150,210,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(32, 32, 31, 0, Math.PI * 2);
        ctx.fill();
        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.arc(24, 22, 6, 0, Math.PI * 2);
        ctx.fill();
        return canvas;
    });
}

export function causticsTexture(key) {
    return cached(key || 'caustics', function () {
        const cv = makeCanvas(256, 256);
        const canvas = cv.canvas, ctx = cv.ctx;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 256, 256);
        // Interference pattern from several ripple centers
        ctx.globalCompositeOperation = 'lighter';
        const centers = 7;
        for (let n = 0; n < centers; n++) {
            const cx = Math.random() * 256;
            const cy = Math.random() * 256;
            for (let r = 8; r < 90; r += 7) {
                const a = 0.10 * (1 - r / 90);
                ctx.strokeStyle = 'rgba(120,220,255,' + a.toFixed(3) + ')';
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        ctx.globalCompositeOperation = 'source-over';
        return canvas;
    });
}

export function gradientTexture(key, colorStops, opts) {
    opts = opts || {};
    return cached(key, function () {
        const vertical = !!opts.vertical;
        const cv = makeCanvas(
            opts.w || (vertical ? 64 : 256),
            opts.h || (vertical ? 256 : 64)
        );
        const canvas = cv.canvas, ctx = cv.ctx;
        const w = canvas.width, h = canvas.height;
        const grad = vertical
            ? ctx.createLinearGradient(0, 0, 0, h)
            : ctx.createLinearGradient(0, 0, w, 0);
        colorStops.forEach(function (stop) { grad.addColorStop(stop[0], rgbStr(hexToRgb(stop[1]))); });
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        addSpeckle(ctx, w, h, opts.speckle == null ? 200 : opts.speckle, 0.04);
        return canvas;
    });
}

export const TextureGenerator = {
    stripeTexture: stripeTexture,
    lengthStripeTexture: lengthStripeTexture,
    mazeTexture: mazeTexture,
    spotTexture: spotTexture,
    mottleTexture: mottleTexture,
    diagonalSplitTexture: diagonalSplitTexture,
    concentricRingTexture: concentricRingTexture,
    polypFieldTexture: polypFieldTexture,
    gradientTexture: gradientTexture,
    bubbleSprite: bubbleSprite,
    causticsTexture: causticsTexture
};

export default TextureGenerator;
