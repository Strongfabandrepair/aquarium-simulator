// =========================================
// SPARKLINE TREND GRAPHING SYSTEM
// =========================================

export const SparklineManager = {
    history: {},

    addReading(key, value) {
        if (!this.history[key]) this.history[key] = [];
        this.history[key].push(value);
        if (this.history[key].length > 48) {
            this.history[key].shift();
        }
    },

    getTrend(key) {
        const h = this.history[key];
        if (!h || h.length < 2) return 'flat';
        const last = h[h.length - 1];
        const prev = h[h.length - 2];
        if (Math.abs(last - prev) < 0.01) return 'flat';
        return last > prev ? 'up' : 'down';
    },

    drawSparkline(key, canvasId, color) {
        const h = this.history[key];
        if (!h || h.length === 0) return;
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h_canvas = canvas.height;
        ctx.clearRect(0, 0, w, h_canvas);

        const min = Math.min(...h) * 0.95;
        const max = Math.max(...h) * 1.05;
        const range = max - min || 1;

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        h.forEach((val, i) => {
            const x = (i / 48) * w;
            const y = h_canvas - ((val - min) / range) * h_canvas;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
    }
};
