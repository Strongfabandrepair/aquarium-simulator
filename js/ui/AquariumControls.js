import { normalizeTankSpec, tankVolumeLiters } from '../model/TankGeometry.js';

export function setupAquariumControls(engine) {
    const form = document.getElementById('customTankForm');
    const readSpec = () =>
        normalizeTankSpec({
            shape: form.elements.shape.value,
            width: Number(form.elements.width.value) / 100,
            height: Number(form.elements.height.value) / 100,
            depth: Number(form.elements.depth.value) / 100
        });
    form?.addEventListener('input', () => {
        const spec = readSpec();
        const liters = tankVolumeLiters(spec);
        document.getElementById('customTankVolume').textContent =
            `${liters.toFixed(1)} L / ${(liters / 3.785411784).toFixed(1)} US gal at the fill line`;
        form.elements.height.disabled = spec.shape === 'cube';
        form.elements.depth.disabled = ['cube', 'cylinder'].includes(
            spec.shape
        );
    });
    form?.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const spec = readSpec();
        const gallons = tankVolumeLiters(spec) / 3.785411784;
        window.startGame(
            gallons < 35 ? 'nano' : gallons < 85 ? 'medium' : 'large'
        );
        engine.state.tankSpec = spec;
        engine.state.tankGallons = Math.round(gallons * 10) / 10;
        engine.save();
        engine.render();
    });
    const tools = document.getElementById('aquascapeTools');
    if (!tools) return;
    tools.innerHTML = `<p>Move purchased rocks, decorations and coral frags. Click a supported surface to commit; green is valid, red is blocked. Rotation snaps to 15°. Escape cancels.</p>
        <label><input id="placementEnabled" type="checkbox"> Edit placement</label>
        <label>Purchased item <select id="placementItem"><option value="">Select an item</option></select></label>
        <button id="placementBegin">Move selected</button>
        <button id="placementLeft" aria-label="Rotate placement left">↶ 15°</button>
        <button id="placementRight" aria-label="Rotate placement right">↷ 15°</button>
        <button id="placementCancel">Cancel</button>
        <p id="placementStatus" role="status">Enable editing to select an object in the tank.</p>`;
    const enabled = document.getElementById('placementEnabled');
    const select = document.getElementById('placementItem');
    let inventory = '';
    engine.updateAquascapeControls = () => {
        const state = engine.state;
        const rocks = state.placedItems.filter((item) => item.kind === 'rock');
        const signature =
            rocks.map((item) => item.id).join(',') +
            '|' +
            state.corals
                .map((c) => c.id + ':' + c.templateId + ':' + c.alive)
                .join(',');
        if (signature === inventory) return;
        inventory = signature;
        const previous = select.value;
        select.replaceChildren(new window.Option('Select an item', ''));
        rocks.forEach((item, i) =>
            select.add(
                new window.Option(
                    item.name || `Live rock ${i + 1}`,
                    `rock:${item.id}`
                )
            )
        );
        state.corals
            .filter((c) => c.alive !== false)
            .forEach((c) =>
                select.add(new window.Option(c.name, `coral:${c.id}`))
            );
        select.value = previous;
    };
    const enable = () => {
        engine.renderer.placement?.setEnabled(enabled.checked);
        if (engine.renderer.controls)
            engine.renderer.controls.enabled = !enabled.checked;
    };
    enabled.addEventListener('change', enable);
    document.getElementById('placementBegin').addEventListener('click', () => {
        const [kind, ...parts] = select.value.split(':');
        if (!parts.length) return;
        enabled.checked = true;
        enable();
        engine.renderer.placement?.begin(
            kind === 'coral'
                ? { kind, livestockId: Number(parts.join(':')) }
                : { kind, id: parts.join(':') }
        );
    });
    document
        .getElementById('placementLeft')
        .addEventListener('click', () =>
            engine.renderer.placement?.rotate(-15)
        );
    document
        .getElementById('placementRight')
        .addEventListener('click', () => engine.renderer.placement?.rotate(15));
    document
        .getElementById('placementCancel')
        .addEventListener('click', () => engine.renderer.placement?.cancel());
    let lastPlacementSelection = null;
    engine.renderer.onPlacementStatus = (status) => {
        const selectionId = status.selection?.id || null;
        document.getElementById('placementStatus').textContent =
            `${status.reason || ''}${status.selection ? ` Rotation: ${status.rotation || 0}°` : ''}`;
        if (engine.renderer.placement?.enabled) {
            enabled.checked = true;
            if (selectionId && selectionId !== lastPlacementSelection)
                document.getElementById('aquascapePanel').open = true;
            engine.renderer.controls.enabled = false;
        }
        lastPlacementSelection = selectionId;
    };
    engine.renderer.onPlacementCommit = () => {
        engine.save();
        engine.render();
    };
}
