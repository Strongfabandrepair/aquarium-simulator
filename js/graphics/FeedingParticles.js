import * as THREE from 'three';
import { constrainPoint, getTankSpec } from '../model/TankGeometry.js';

export class FeedingParticles {
    constructor(scene) {
        this.positions = new Float32Array(36 * 3);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(this.positions, 3)
        );
        this.mesh = new THREE.Points(
            geometry,
            new THREE.PointsMaterial({
                color: 0xd7a557,
                size: 0.0025,
                transparent: true,
                opacity: 0.9
            })
        );
        this.mesh.visible = false;
        scene.add(this.mesh);
    }
    update(state, delta) {
        const event = state.feedingEvent;
        const key = event ? `${event.id}:${event.timeHours}` : '';
        if (key && key !== this.key) {
            this.key = key;
            const now = state.day * 24 + state.hour + state.minute / 60;
            this.elapsed = now - event.timeHours > 2 ? 60 : 0;
        }
        if (!event) {
            this.mesh.visible = false;
            return;
        }
        this.elapsed = (this.elapsed || 0) + delta;
        this.mesh.visible = this.elapsed < 40;
        if (!this.mesh.visible) return;
        const spec = getTankSpec(state);
        this.mesh.material.color.setHex(
            event.diet === 'algae' ? 0x95b95d : 0xddaa75
        );
        for (let i = 0; i < 36; i++) {
            const angle = i * 2.39996;
            const spread = 0.012 + this.elapsed * 0.001;
            const point = constrainPoint(
                spec,
                {
                    x: event.position.x + Math.sin(angle) * spread,
                    y:
                        event.position.y -
                        this.elapsed * (0.006 + (i % 5) * 0.001),
                    z: event.position.z + Math.cos(angle) * spread
                },
                0.003
            );
            this.positions.set([point.x, point.y, point.z], i * 3);
        }
        this.mesh.material.opacity = Math.min(0.9, (40 - this.elapsed) / 8);
        this.mesh.geometry.attributes.position.needsUpdate = true;
    }
}
