import * as THREE from 'three';
import { applyCoralPlacement } from './CoralPlacement.js';
import {
    applySurfaceTransform,
    snapRotation,
    validatePlacement
} from './PlacementRules.js';

// Owns temporary preview state only. Hover/rotation never alter the saved aquarium.
export class PlacementController {
    constructor({
        scene,
        camera,
        canvas,
        getState,
        getMeshes,
        getHabitat,
        onCommit = () => {},
        onStatus = () => {}
    }) {
        Object.assign(this, {
            scene,
            camera,
            canvas,
            getState,
            getMeshes,
            getHabitat,
            onCommit,
            onStatus
        });
        this.enabled = false;
        this.ray = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        this.moveHandler = (event) => this.pointerMove(event);
        this.clickHandler = (event) => this.click(event);
        this.keyHandler = (event) => {
            if (!this.enabled) return;
            if (event.key === 'Escape') this.cancel();
            if (
                this.selection &&
                ['ArrowLeft', 'ArrowRight'].includes(event.key)
            ) {
                event.preventDefault();
                this.rotate(event.key === 'ArrowLeft' ? -15 : 15);
            }
        };
        canvas.addEventListener('pointermove', this.moveHandler);
        canvas.addEventListener('click', this.clickHandler);
        globalThis.window?.addEventListener('keydown', this.keyHandler);
    }

    setEnabled(enabled) {
        this.enabled = Boolean(enabled);
        if (!enabled) this.cancel();
        else
            this.status(
                'Select a purchased rock or coral, then click its new surface.'
            );
    }

    allMeshes() {
        const meshes = this.getMeshes?.() || {};
        const rocks = meshes.rockMeshes
            ? [...meshes.rockMeshes.values()]
            : this.getHabitat().rocks;
        return { corals: [...(meshes.coralMeshes?.values() || [])], rocks };
    }

    begin(selection) {
        this.cancel();
        const state = this.getState();
        const { corals, rocks } = this.allMeshes();
        let mesh, item;
        if (selection.kind === 'coral') {
            if (
                !state.corals.some(
                    (coral) => coral.id === selection.livestockId
                )
            )
                return false;
            mesh = corals.find(
                (object) => object.userData.id === selection.livestockId
            );
            item = state.placedItems?.find(
                (entry) =>
                    entry.kind === 'coral' &&
                    entry.livestockId === selection.livestockId
            );
        } else if (selection.kind === 'rock') {
            item = state.placedItems?.find(
                (entry) => entry.kind === 'rock' && entry.id === selection.id
            );
            if (!item) return false;
            if (
                state.placedItems.some((entry) => entry.supportId === item.id)
            ) {
                this.status(
                    'Move attached corals or supported rocks before moving this rock.'
                );
                return false;
            }
            mesh = rocks.find(
                (object) => object.userData.placedItemId === item.id
            );
        }
        if (!mesh) return false;
        this.enabled = true;
        this.selection = {
            ...selection,
            id: item?.id || `coral-${selection.livestockId}`
        };
        this.original = mesh;
        this.originalPlacement = item;
        this.originalScale = mesh.scale.clone();
        this.originalSize = item?.size || 0;
        this.baseSize = item?.baseSize || this.originalSize;
        this.scalePercent = this.baseSize
            ? Math.round((this.originalSize / this.baseSize) * 100)
            : 100;
        this.rotation = snapRotation(((item?.rotation || 0) * 180) / Math.PI);
        this.previewMaterial = new THREE.MeshBasicMaterial({
            color: 0x42e6a4,
            transparent: true,
            opacity: 0.45,
            depthWrite: false
        });
        this.preview = mesh.clone(true);
        this.preview.visible = true;
        this.preview.traverse((part) => {
            if (part.isMesh) part.material = this.previewMaterial;
        });
        this.preview.userData.isPlacementPreview = true;
        this.scene.add(this.preview);
        const bounds = new THREE.Box3().setFromObject(mesh);
        this.radius =
            selection.kind === 'coral'
                ? mesh.userData.placementRadius
                : item.size / 2;
        this.height =
            selection.kind === 'coral'
                ? mesh.userData.coralHeight * mesh.scale.x
                : bounds.max.y - bounds.min.y;
        this.originalHeight = this.height;
        this.baseOffset =
            selection.kind === 'coral'
                ? mesh.userData.coralBaseOffset * mesh.scale.x - 0.001
                : 0;
        this.status(
            'Point at sand or a stable rock ledge. Rotate in 15° steps.'
        );
        return true;
    }

    setScale(percent) {
        if (
            this.selection?.kind !== 'rock' ||
            !Number.isFinite(Number(percent))
        )
            return false;
        const min = Math.max(25, Math.ceil((0.025 / this.baseSize) * 100));
        const max = Math.min(200, Math.floor((0.5 / this.baseSize) * 100));
        this.scalePercent = Math.max(min, Math.min(max, Number(percent)));
        const size = (this.baseSize * this.scalePercent) / 100;
        const factor = size / this.originalSize;
        this.radius = size / 2;
        this.height = this.originalHeight * factor;
        this.preview.scale.copy(this.originalScale).multiplyScalar(factor);
        const saved = this.originalPlacement;
        this.setPreview(
            this.pending?.point || saved.position,
            this.pending?.normal || saved.normal || { x: 0, y: 1, z: 0 },
            this.pending?.supportId ?? saved.supportId ?? null
        );
        return true;
    }

    setRotation(degrees) {
        if (!this.selection || !Number.isFinite(Number(degrees))) return;
        this.rotation = ((snapRotation(Number(degrees)) % 360) + 360) % 360;
        if (this.pending)
            this.setPreview(
                this.pending.point,
                this.pending.normal,
                this.pending.supportId
            );
        else this.status('Point at a surface to preview placement.');
    }

    rotate(step = 15) {
        this.setRotation(this.rotation + step);
    }

    rayFromEvent(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.pointer.set(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            (-(event.clientY - rect.top) / rect.height) * 2 + 1
        );
        this.ray.setFromCamera(this.pointer, this.camera);
    }

    pointerMove(event) {
        if (!this.enabled || !this.selection) return;
        this.rayFromEvent(event);
        const habitat = this.getHabitat();
        const surfaces = habitat.surfaces.filter(
            (mesh) => mesh.userData.placedItemId !== this.selection.id
        );
        const hit = this.ray.intersectObjects(surfaces, true)[0];
        if (hit) {
            let owner = hit.object;
            while (owner && !owner.userData.placedItemId) owner = owner.parent;
            const normal = hit.face.normal
                .clone()
                .applyMatrix3(
                    new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld)
                )
                .normalize();
            this.setPreview(
                hit.point,
                normal,
                owner?.userData.placedItemId ?? null
            );
        } else {
            const point = this.ray.ray.intersectPlane(
                new THREE.Plane(new THREE.Vector3(0, 1, 0), -habitat.floorY),
                new THREE.Vector3()
            );
            if (point) this.setPreview(point, new THREE.Vector3(0, 1, 0), null);
            else {
                this.pending = null;
                this.preview.visible = false;
                this.status('Point at a solid aquarium surface.');
            }
        }
    }

    setPreview(point, normal, supportId = null) {
        if (!this.selection) return;
        const { corals, rocks } = this.allMeshes();
        const occupied = [...corals, ...rocks]
            .filter((mesh) => mesh.visible)
            .map((mesh) => {
                const bounds = new THREE.Box3().setFromObject(mesh);
                const item = this.getState().placedItems?.find(
                    (entry) => entry.id === mesh.userData.placedItemId
                );
                return {
                    id: mesh.userData.placedItemId,
                    kind: mesh.userData.isCoral ? 'coral' : 'rock',
                    x: mesh.position.x,
                    z: mesh.position.z,
                    radius:
                        mesh.userData.placementRadius ||
                        (item?.size || bounds.max.x - bounds.min.x) / 2,
                    minY: bounds.min.y,
                    maxY: bounds.max.y
                };
            });
        const result = validatePlacement({
            point,
            normal,
            radius: this.radius,
            height: this.height,
            spec: this.getHabitat().spec,
            occupied,
            selectedId: this.selection.id,
            kind: this.selection.kind,
            supportId
        });
        const contact = this.getHabitat().sample(point.x, point.z, {
            excludeId:
                this.selection.kind === 'rock' ? this.selection.id : undefined
        });
        if (Math.abs(contact.y - point.y) > 0.003) {
            result.valid = false;
            result.reason = 'Place the object directly on a solid surface.';
        }
        if (supportId && result.valid) {
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI) / 4;
                const dx = Math.cos(angle) * this.radius * 0.6;
                const dz = Math.sin(angle) * this.radius * 0.6;
                const edge = this.getHabitat().sample(
                    point.x + dx,
                    point.z + dz,
                    { excludeId: this.selection.id }
                );
                const expectedY =
                    point.y - (normal.x * dx + normal.z * dz) / normal.y;
                if (
                    edge.surfaceId !== supportId ||
                    Math.abs(edge.y - expectedY) > 0.015
                ) {
                    result.valid = false;
                    result.reason =
                        'Choose a wider supporting ledge for this size.';
                    break;
                }
            }
        }
        this.pending = {
            point: { x: point.x, y: point.y, z: point.z },
            normal: { x: normal.x, y: normal.y, z: normal.z },
            supportId,
            ...result
        };
        this.preview.visible = true;
        applySurfaceTransform(
            this.preview,
            point,
            normal,
            (this.rotation * Math.PI) / 180,
            this.baseOffset
        );
        this.previewMaterial.color.set(result.valid ? 0x42e6a4 : 0xff526c);
        this.status(result.reason);
        return result;
    }

    click(event) {
        if (!this.enabled) return;
        if (this.selection) {
            this.pointerMove(event);
            this.commit();
            return;
        }
        this.rayFromEvent(event);
        const { corals, rocks } = this.allMeshes();
        const hit = this.ray.intersectObjects(
            [...corals, ...rocks].filter((mesh) => mesh.visible),
            true
        )[0];
        let mesh = hit?.object;
        while (mesh && !mesh.userData.isCoral && !mesh.userData.placedItemId)
            mesh = mesh.parent;
        if (!mesh) return;
        this.begin(
            mesh.userData.isCoral
                ? { kind: 'coral', livestockId: mesh.userData.id }
                : { kind: 'rock', id: mesh.userData.placedItemId }
        );
    }

    commit() {
        if (!this.selection || !this.pending?.valid) return false;
        this.setPreview(
            this.pending.point,
            this.pending.normal,
            this.pending.supportId
        );
        if (!this.pending.valid) return false;
        const state = this.getState();
        // Re-check ownership at commit, so a removed/purchased object cannot be cloned.
        if (
            this.selection.kind === 'coral' &&
            !state.corals.some(
                (coral) => coral.id === this.selection.livestockId
            )
        )
            return false;
        state.placedItems ||= [];
        let item = state.placedItems.find(
            (entry) => entry.id === this.selection.id
        );
        if (this.selection.kind === 'rock' && !item) return false;
        if (!item) {
            item = { ...this.selection };
            state.placedItems.push(item);
        }
        Object.assign(item, {
            position: { ...this.pending.point },
            normal: { ...this.pending.normal },
            rotation: (this.rotation * Math.PI) / 180,
            size: this.radius * 2,
            supportId: this.pending.supportId
        });
        if (item.kind === 'rock') {
            item.baseSize = this.baseSize;
            this.original.scale.copy(this.preview.scale);
        }
        if (item.kind === 'coral') applyCoralPlacement(this.original, item);
        else
            applySurfaceTransform(
                this.original,
                item.position,
                item.normal,
                item.rotation
            );
        this.original.visible = true;
        const committed = item;
        this.cancel();
        this.onCommit(committed);
        this.status(
            'Placement saved. Select another purchased object to move it.'
        );
        return true;
    }

    status(reason) {
        this.onStatus({
            enabled: this.enabled,
            active: Boolean(this.selection),
            valid: Boolean(this.pending?.valid),
            reason,
            rotation: this.rotation || 0,
            scalePercent: this.scalePercent || 100,
            sizeMeters: this.radius * 2 || 0,
            minScale: this.baseSize
                ? Math.max(25, Math.ceil((0.025 / this.baseSize) * 100))
                : 25,
            maxScale: this.baseSize
                ? Math.min(200, Math.floor((0.5 / this.baseSize) * 100))
                : 200,
            selection: this.selection || null
        });
    }

    cancel() {
        if (this.preview) this.scene.remove(this.preview);
        this.previewMaterial?.dispose();
        this.preview =
            this.previewMaterial =
            this.selection =
            this.original =
            this.pending =
                null;
        this.status(
            this.enabled
                ? 'Select a purchased rock or coral to move.'
                : 'Placement editor closed.'
        );
    }

    dispose() {
        this.cancel();
        this.canvas.removeEventListener('pointermove', this.moveHandler);
        this.canvas.removeEventListener('click', this.clickHandler);
        globalThis.window?.removeEventListener('keydown', this.keyHandler);
    }
}
