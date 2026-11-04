import { describe, it, expect } from 'vitest';
import { escapeHTML } from '../js/ui/escapeHTML.js';
import { GameState } from '../js/engine/GameState.js';
describe('saved input boundaries', () => {
    it('encodes markup and attribute delimiters while preserving visible text', () => {
        expect(escapeHTML('<img src=x onerror="alert(1)"> & \'')).toBe(
            '&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &#39;'
        );
    });
    it('does not apply prototype keys from older browser snapshots', () => {
        const state = new GameState();
        state.loadFromSnapshot(
            JSON.parse(
                '{"__proto__":{"polluted":true},"equipment":{"__proto__":{"heater":true}},"water":{"constructor":{"prototype":{"polluted":true}}}}'
            )
        );
        expect(state.state.polluted).toBeUndefined();
        expect(state.state.equipment.heater).toBe(false);
        expect(Object.prototype.polluted).toBeUndefined();
    });
});
