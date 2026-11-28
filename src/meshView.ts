import { byId, components, edges, tiles, type Ev } from './model';

export function mountMesh(host: HTMLElement, inspect: (id: string) => void) {
  const point = (id: string) => {
    const tile = tiles[byId.get(id)!.tileId!];
    return { x: (tile.x + 0.5) * 100, y: (tile.y + 0.5) * 100 };
  };
  const lines = edges.filter(e => e.kind === 'mesh').map(e => {
    const a = point(e.a), b = point(e.b);
    return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`;
  });
  host.innerHTML = `<h2 class="mesh-title">2D network</h2>
    <div class="mesh-map"><svg viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true">${lines.join('')}</svg>
    ${tiles.map(t => `<button type="button" data-tile="${t.id}" style="grid-area:${t.y+1}/${t.x+1}"><b>Tile ${t.id}</b>${t.name}</button>`).join('')}
    <span class="mesh-packet" aria-hidden="true" hidden></span></div>
    <p class="mesh-location" role="status"></p>
    <ol class="fallback-route" aria-label="Packet route in travel order"></ol>
    <label>Inspect a component <select class="mesh-parts"><option value="">Choose a block</option></select></label>`;
  const parts = host.querySelector<HTMLSelectElement>('select')!;
  components.forEach(c => parts.add(new Option(c.name + (c.tileId == null ? '' : ' · Tile ' + c.tileId), c.id)));
  parts.onchange = () => { if (parts.value) inspect(parts.value); };
  const route = host.querySelector('ol')!;
  const tilesUI = Array.from(host.querySelectorAll<HTMLButtonElement>('[data-tile]'));
  const mark = host.querySelector<HTMLElement>('.mesh-packet')!;
  const caption = host.querySelector<HTMLElement>('.mesh-location')!;
  let lastEvent: string | undefined, lastIndex = -2;
  function render(e: Ev | null, progress: number) {
    if (lastEvent !== (e?.id ?? 'setup')) {
      lastEvent = e?.id ?? 'setup'; lastIndex = -2;
      route.replaceChildren(...(e?.path ?? []).map(id => {
        const li = document.createElement('li'), b = document.createElement('button');
        b.type = 'button'; b.dataset.sel = id; b.textContent = byId.get(id)!.name;
        li.append(b); return li;
      }));
    }
    if (!e) {
      mark.hidden = true; caption.textContent = 'Tile 3 has a grant. Tile 0 has no grant.';
      tilesUI.forEach(b => b.classList.remove('carrying')); return '';
    }
    const pos = progress * (e.path.length - 1), index = Math.round(pos), id = e.path[index];
    const start = point(e.path[Math.floor(pos)]), end = point(e.path[Math.ceil(pos)]);
    const fraction = pos - Math.floor(pos);
    mark.hidden = false; mark.dataset.kind = e.vc;
    mark.style.left = ((start.x + (end.x - start.x) * fraction) / 3) + '%';
    mark.style.top = ((start.y + (end.y - start.y) * fraction) / 2) + '%';
    if (index !== lastIndex) {
      lastIndex = index;
      Array.from(route.children).forEach((item,i) => item.setAttribute('aria-current',i === index ? 'step' : 'false'));
      tilesUI.forEach(b => b.classList.toggle('carrying', Number(b.dataset.tile) === byId.get(id)!.tileId));
      caption.textContent = (e.vc === 'local' ? 'Local request' : e.id === 'acc-2' ? 'ACK' : e.label) + ' · ' + byId.get(id)!.name;
    }
    return id;
  }
  return {render, select(id: string | null) {parts.value = id ?? ''; tilesUI.forEach(b => b.setAttribute('aria-pressed',String(Number(b.dataset.tile) === byId.get(id ?? '')?.tileId)));}};
}
