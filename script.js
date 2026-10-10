// Edit your projects here.
const projects = [
  { name: 'Phish',         role: 'Design, Dev', year: '2026', url: 'https://phishyness.vercel.app', image: 'assets/images/p1.jpg' },
  { name: 'Project Two',   role: 'Dev',         year: '2025', url: 'https://example.com', image: 'assets/images/p2.jpg' },
];

const $ = (id) => document.getElementById(id);
const body = document.body;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const touch = matchMedia('(hover: none), (max-width: 767px)');
const menuBtn = $('menuBtn'), panel = $('panel'), home = $('home');
const list = $('works'), pNum = $('pNum'), pTitle = $('pTitle'), shot = $('pShot');

/* ---------- Intro ---------- */
function intro() {
  const steps = ['ui-in', 'logo-in', 'placed', 'text-in', 'status-in'];
  if (reduce) return body.classList.add(...steps);
  // Snap to the start state, then measure how far the logo sits from the viewport centre.
  body.classList.add('no-anim');
  const logo = $('logo');
  logo.style.setProperty('--dx', '0px');
  logo.style.setProperty('--dy', '0px');
  const r = logo.getBoundingClientRect();
  logo.style.setProperty('--dx', `${innerWidth / 2 - (r.left + r.width / 2)}px`);
  logo.style.setProperty('--dy', `${innerHeight / 2 - (r.top + r.height / 2)}px`);
  body.offsetWidth; // commit start state before re-enabling transitions
  body.classList.remove('no-anim');
  // ui dot + logo fade in, logo holds in the centre, glides left, then text, then the status line.
  [[150, 'ui-in'], [250, 'logo-in'], [1000, 'placed'], [1650, 'text-in'], [2200, 'status-in']]
    .forEach(([t, c]) => setTimeout(() => body.classList.add(c), t));
}
document.fonts.ready.then(intro);

/* ---------- Menu ---------- */
function setMenu(open) {
  body.classList.toggle('is-open', open);
  menuBtn.setAttribute('aria-expanded', open);
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  panel.inert = !open;
  home.inert = open;
  if (!open) setActive(-1);
}
menuBtn.addEventListener('click', () => setMenu(!body.classList.contains('is-open')));
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && body.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); }
});

/* ---------- Project list ---------- */
list.innerHTML = projects.map((p, i) => `
  <li data-i="${i}">
    <a class="row" href="${p.url}" target="_blank" rel="noopener">
      <span>${p.name}</span>
      <span class="meta"><span class="meta-in"><span>${p.role}</span><span>${p.year}</span></span></span>
    </a>
  </li>`).join('');
const items = [...list.children];

let active = -1, swapTimer;
function setActive(i) {
  if (i === active) return;
  const was = active;
  active = i;
  items.forEach((li, j) => li.classList.toggle('is-active', j === i));
  body.classList.toggle('has-active', i >= 0);
  if (i < 0) return;
  const show = () => {
    pNum.textContent = String(i + 1).padStart(2, '0');
    pTitle.textContent = projects[i].name;
    body.classList.remove('swapping');
    pixelReveal(projects[i]);
  };
  clearTimeout(swapTimer);
  // Row to row: fade the old title out fast, then bring the new one in (no idle flash between).
  if (was >= 0 && !reduce) { body.classList.add('swapping'); swapTimer = setTimeout(show, 150); }
  else show();
}

list.addEventListener('mouseover', (e) => {
  const li = e.target.closest('li');
  if (li && !touch.matches) setActive(+li.dataset.i);
});
list.addEventListener('mouseleave', () => { if (!touch.matches) setActive(-1); });
// On touch/mobile there is no preview: a tap just opens the project link.
list.addEventListener('focusin', (e) => { if (!touch.matches) setActive(+e.target.closest('li').dataset.i); });
list.addEventListener('focusout', (e) => { if (!list.contains(e.relatedTarget)) setActive(-1); });

/* ---------- Screenshot: mosaic that resolves to full detail ---------- */
const ctx = shot.getContext('2d');
const tiny = document.createElement('canvas');
const cache = {};
let revealId = 0;
function pixelReveal(p) {
  const id = ++revealId;
  const dpr = Math.min(devicePixelRatio, 2);
  const w = shot.width = Math.round(shot.clientWidth * dpr) || 1;
  const h = shot.height = Math.round(shot.clientHeight * dpr) || 1;
  ctx.fillStyle = '#EDEDED';
  ctx.fillRect(0, 0, w, h);
  const img = cache[p.image] || (cache[p.image] = Object.assign(new Image(), { src: p.image }));
  const run = () => {
    if (id !== revealId || !img.naturalWidth) return; // superseded, or image missing → keep grey fill
    // Fit the whole image (no cropping) and pad with its own corner colour so the box looks filled.
    const k0 = Math.min(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * k0, dh = img.naturalHeight * k0, dx = (w - dw) / 2, dy = (h - dh) / 2;
    tiny.width = tiny.height = 1;
    tiny.getContext('2d').drawImage(img, 0, 0, 1, 1, 0, 0, 1, 1);
    const [r, g, b] = tiny.getContext('2d').getImageData(0, 0, 1, 1).data;
    const bg = `rgb(${r},${g},${b})`;
    const sizes = reduce ? [1] : [40, 24, 14, 8, 4, 1];
    sizes.forEach((block, k) => setTimeout(() => {
      if (id !== revealId) return;
      ctx.imageSmoothingEnabled = block === 1;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      if (block === 1) return ctx.drawImage(img, dx, dy, dw, dh);
      tiny.width = Math.ceil(dw / (block * dpr));
      tiny.height = Math.ceil(dh / (block * dpr));
      tiny.getContext('2d').drawImage(img, 0, 0, tiny.width, tiny.height);
      ctx.drawImage(tiny, dx, dy, dw, dh);
    }, k * 90));
  };
  img.complete ? run() : img.addEventListener('load', run, { once: true });
}
