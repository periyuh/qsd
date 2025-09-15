/* script.js — QSD albums & tracks (client-side) */

const DATA_DIR = 'assets/data';
const SONGS_DIR = `${DATA_DIR}/qsd-songs`;
const AUDIO_DIR = 'assets/audio';

const ALBUM_FILES = [
  'qsd1-emoslay.json',
  'qsd2-idhat.json',
  'qsd3-sissypuss.json',
  'qsd4-thecandidates.json',
  'qsd5-psychward.json',
  'qsd-khakishorts.json'
];

function logEgg() {
  console.log(
    '%cQSD REBORN — look in the corners, little secrets hide ✨',
    'color:#ff2ea6;font-weight:700'
  );
}
logEgg();

async function fetchJSON(path) {
  try {
    const r = await fetch(path);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch (err) {
    console.warn('fetchJSON error', path, err.message);
    return null;
  }
}

/* ----- UI elements ----- */
const gridEl = document.getElementById('grid');
const emptyEl = document.getElementById('empty');
const detailEl = document.getElementById('album-detail');
const detailInner = document.getElementById('detail-inner');
const detailBack = document.getElementById('detail-back');

const modal = document.getElementById('track-modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');
const prevBtn = document.getElementById('prev-track');
const nextBtn = document.getElementById('next-track');

let currentAlbum = null;
let currentTracks = [];
let currentTrackIndex = 0;

/* ----- Albums grid ----- */
async function loadAlbums() {
  if (!gridEl) return;
  gridEl.innerHTML = '';
  const searchInput = document.getElementById('search');

  let any = false;
  for (const file of ALBUM_FILES) {
    const album = await fetchJSON(`${DATA_DIR}/${file}`);
    if (!album) continue;
    any = true;

    const safeName = file.replace('.json', '').replace(/^qsd\d?-/, '');
    const localCover = `assets/images/albumcovers/${safeName}.jpg`;

    const card = document.createElement('div');
    card.className = 'album-card';
    card.title = `${album.title} — ${album.artist}`;

    const img = document.createElement('img');
    img.className = 'cover';
    img.src = localCover;
    img.alt = album.title;
    img.onerror = () => {
      img.src = album.coverArt || 'assets/images/albumcovers/thecandidates.jpg';
    };
    card.appendChild(img);

    const meta = document.createElement('div');
    meta.className = 'album-meta';
    meta.innerHTML = `
      <h3>${album.title}</h3>
      <p>${album.artist}</p>
      <small>${album.releaseDate || ''}</small>`;
    card.appendChild(meta);

    card.addEventListener('click', () => showAlbum(file, album));
    gridEl.appendChild(card);
  }

  emptyEl && (emptyEl.style.display = any ? 'none' : 'block');

  searchInput?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    Array.from(gridEl.children).forEach((card) => {
      const txt = card.textContent.toLowerCase();
      card.style.display = txt.includes(q) ? '' : 'none';
    });
  });
}

/* ----- Album detail ----- */
async function showAlbum(albumFile, albumData = null) {
  const album = albumData || (await fetchJSON(`${DATA_DIR}/${albumFile}`));
  if (!album || !detailEl) return;

  currentAlbum = { file: albumFile, ...album };
  detailEl.classList.remove('hidden');

  const safeName = albumFile.replace('.json', '').replace(/^qsd\d?-/, '');
  const localCover = `assets/images/albumcovers/${safeName}.jpg`;

  detailInner.innerHTML = `
    <h2 class="section-title">${album.title}</h2>
    <div class="album-detail-header">
      <img class="cover-large" src="${localCover}" 
           onerror="this.src='${album.coverArt || 'assets/images/albumcovers/thecandidates.jpg'}'" 
           alt="${album.title}">
      <div class="album-text">
        <p class="muted tiny"><b>Released:</b> ${album.releaseDate || 'Unknown'}</p>
        <p>${album.description || ''}</p>
        <div class="links"></div>
      </div>
    </div>
    <h3>Tracklist</h3>
    <ul id="tracklist" class="tracklist"></ul>
    <h3>Buy / Support</h3>
    <div id="buy-links" class="links"></div>
  `;

  const linksEl = detailInner.querySelector('.links');
  linksEl.innerHTML = album.links
    ? Object.entries(album.links)
        .map(([p, u]) => `<a href="${u}" target="_blank">${p}</a>`)
        .join(' • ')
    : '<span class="muted tiny">No streaming links</span>';

  const buyEl = document.getElementById('buy-links');
  buyEl.innerHTML = album.buy
    ? Object.entries(album.buy)
        .map(([p, u]) => `<a href="${u}" target="_blank">${p}</a>`)
        .join(' • ')
    : '<span class="muted tiny">No purchase links</span>';

  const tracklistEl = document.getElementById('tracklist');
  tracklistEl.innerHTML = '<li class="muted tiny">Loading tracks…</li>';

  const tracks = await Promise.all(
    (album.tracklist || []).map(async (fn) => {
      const t = await fetchJSON(`${SONGS_DIR}/${fn}`);
      return t ? { ...t, filename: fn } : null;
    })
  );

  currentTracks = tracks.filter(Boolean);
  tracklistEl.innerHTML = '';

  if (!currentTracks.length) {
    tracklistEl.innerHTML = '<li class="muted tiny">No tracks found.</li>';
  } else {
    currentTracks.forEach((t, idx) => {
      const li = document.createElement('li');
      li.className = 'track-item';
      li.dataset.index = idx;
      li.innerHTML = `<span>${idx + 1}. ${t.title || 'Untitled'}</span>`;
      li.addEventListener('click', () => openTrackModal(idx));
      tracklistEl.appendChild(li);
    });
  }

  if (window.innerWidth < 900) {
    document.getElementById('album-grid')?.classList.add('hidden');
  }
}

/* ----- Track modal ----- */
async function openTrackModal(index) {
  currentTrackIndex = index;
  await renderTrack(currentTrackIndex);
  if (modal) {
    modal.classList.add('show');
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
  }
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  if (modal) {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  }
  document.body.style.overflow = '';
}

async function renderTrack(index) {
  const t = currentTracks[index];
  if (!t) return;
  const base = t.filename.replace('.json', '');
  const audioSrc = `${AUDIO_DIR}/${base}.opus`;

  modalBody.innerHTML = `
    <h3>${t.title}${t.version ? ' — ' + t.version : ''}</h3>
    <p class="muted tiny">
      ${t.feature ? `feat. ${Array.isArray(t.feature) ? t.feature.join(', ') : t.feature}` : ''}
      ${t.length ? ` • ${t.length}` : ''}
    </p>
    <div style="display:flex;gap:12px;align-items:flex-start;margin-top:8px">
      ${t.coverArt ? `<img src="${t.coverArt}" style="width:132px;height:132px;object-fit:cover;border-radius:8px">` : ''}
      <div>
        <p>${t.bio || ''}</p>
        <div id="audio-wrap" style="margin-top:10px"></div>
      </div>
    </div>
  `;

  const audioWrap = document.getElementById('audio-wrap');
  audioWrap.innerHTML = `<audio controls preload="none" style="width:100%">
    <source src="${audioSrc}" type="audio/ogg">
  </audio>`;
}

/* ----- Controls ----- */
detailBack?.addEventListener('click', () => {
  detailEl?.classList.add('hidden');
  document.getElementById('album-grid')?.classList.remove('hidden');
});

modalClose?.addEventListener('click', closeModal);
prevBtn?.addEventListener('click', async () => {
  currentTrackIndex = (currentTrackIndex - 1 + currentTracks.length) % currentTracks.length;
  await renderTrack(currentTrackIndex);
});
nextBtn?.addEventListener('click', async () => {
  currentTrackIndex = (currentTrackIndex + 1) % currentTracks.length;
  await renderTrack(currentTrackIndex);
});

document.addEventListener('keydown', (e) => {
  if (modal?.classList.contains('hidden')) return;
  if (e.key === 'Escape') closeModal();
  if (e.key === 'ArrowLeft') prevBtn?.click();
  if (e.key === 'ArrowRight') nextBtn?.click();
});

/* ----- Init ----- */
document.addEventListener('DOMContentLoaded', loadAlbums);
