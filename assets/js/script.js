/* script.js — QSD albums & tracks (client-side)
   - expects album JSONs in: assets/data/<qsdX-...>.json
   - track JSONs in: assets/data/qsd-songs/<trackfile>.json
   - audio files in: assets/audio/<basename>.opus  (falls back to .mp3)
*/

const DATA_DIR = 'assets/data';
const SONGS_DIR = `${DATA_DIR}/qsd-songs`;
const AUDIO_DIR = 'assets/audio';

// default QSD album JSON filenames (adjust if you add/remove)
const ALBUM_FILES = [
  'qsd1-emoslay.json',
  'qsd2-idhat.json',
  'qsd3-sissypuss.json',
  'qsd4-thecandidates.json',
  'qsd5-psychward.json',
  'qsd-khakishorts.json'
];

function logEgg(){
  console.log('%cQSD REBORN — look in the corners, little secrets hide ✨','color:#ff2ea6;font-weight:700');
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

// try to detect if audio file exists (HEAD)
async function audioExists(path) {
  try {
    const r = await fetch(path, { method: 'HEAD' });
    return r.ok;
  } catch (e) {
    return false;
  }
}

// format single track line like the bot does
function formatTrackLine(track, index) {
  let line = `${index + 1}. ${track.title || 'Untitled'}`;
  if (track.feature) line += ` (feat. ${Array.isArray(track.feature) ? track.feature.join(', ') : track.feature})`;
  if (track.version) line += ` - ${track.version}`;
  return line;
}

/* ----- UI helpers ----- */
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
let currentTracks = []; // array of loaded track objects { ...track, filename }
let currentTrackIndex = 0;

// load & render album cards
async function loadAlbums() {
  gridEl.innerHTML = '';
  const searchInput = document.getElementById('search');

  let any = false;
  for (const file of ALBUM_FILES) {
    const album = await fetchJSON(`${DATA_DIR}/${file}`);
    if (!album) continue;
    any = true;

    const card = document.createElement('div');
    card.className = 'album-card';
    card.title = `${album.title} — ${album.artist}`;

    const img = document.createElement('img');
    img.className = 'cover';
    img.src = album.coverArt || 'assets/images/thecandidates.jpg';
    img.alt = album.title;
    card.appendChild(img);

    const meta = document.createElement('div');
    meta.className = 'album-meta';
    meta.innerHTML = `<h3>${album.title}</h3><p>${album.artist}</p><small>${album.releaseDate || ''}</small>`;
    card.appendChild(meta);

    card.addEventListener('click', () => showAlbum(file, album));
    gridEl.appendChild(card);
  }

  emptyEl.style.display = any ? 'none' : 'block';

  // search filtering
  searchInput?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    Array.from(gridEl.children).forEach(card => {
      const txt = card.textContent.toLowerCase();
      card.style.display = txt.includes(q) ? '' : 'none';
    });
  });
}

// show album detail (load tracks)
async function showAlbum(albumFile, albumData = null) {
  // fetch album if not provided
  const album = albumData || await fetchJSON(`${DATA_DIR}/${albumFile}`);
  if (!album) return alert('Could not load album');

  currentAlbum = { file: albumFile, ...album };
  detailEl.classList.remove('hidden');

  // build header
  detailInner.innerHTML = `
    <h2 class="section-title">${album.title}</h2>
    <img class="cover-large" src="${album.coverArt || 'assets/images/thecandidates.jpg'}" alt="${album.title}">
    <p class="muted tiny"><b>Released:</b> ${album.releaseDate || 'Unknown'}</p>
    <p>${album.description || ''}</p>
    <div class="links"></div>
    <h3>Tracklist</h3>
    <ul id="tracklist" class="tracklist"></ul>
    <h3>Buy / Support</h3>
    <div id="buy-links" class="links"></div>
  `;

  // populate links
  const linksEl = detailInner.querySelector('.links');
  if (album.links && Object.keys(album.links).length) {
    linksEl.innerHTML = Object.entries(album.links).map(([p,u]) => `<a href="${u}" target="_blank">${p}</a>`).join(' • ');
  } else {
    linksEl.innerHTML = '<span class="muted tiny">No streaming links</span>';
  }
  const buyEl = document.getElementById('buy-links');
  if (album.buy && Object.keys(album.buy).length) {
    buyEl.innerHTML = Object.entries(album.buy).map(([p,u]) => `<a href="${u}" target="_blank">${p}</a>`).join(' • ');
  } else {
    buyEl.innerHTML = '<span class="muted tiny">No purchase links</span>';
  }

  // load track JSONs
  const tracklistEl = document.getElementById('tracklist');
  tracklistEl.innerHTML = '<li class="muted tiny">Loading tracks…</li>';

  const tracks = await Promise.all(
    (album.tracklist || []).map(async (fn) => {
      const t = await fetchJSON(`${SONGS_DIR}/${fn}`);
      return t ? { ...t, filename: fn } : null;
    })
  );

  currentTracks = tracks.filter(Boolean);
  if (!currentTracks.length) {
    tracklistEl.innerHTML = '<li class="muted tiny">No tracks found.</li>';
  } else {
    tracklistEl.innerHTML = '';
    currentTracks.forEach((t, idx) => {
      const li = document.createElement('li');
      li.className = 'track-item';
      li.dataset.index = idx;
      li.innerHTML = `<span>${formatTrackLine(t, idx)}</span><small class="muted">${t.length || ''}</small>`;
      li.addEventListener('click', () => openTrackModal(idx));
      tracklistEl.appendChild(li);
    });
  }

  // hide grid on small screens (optional)
  if (window.innerWidth < 900) {
    document.getElementById('album-grid').classList.add('hidden');
  }
}

// back to albums
detailBack?.addEventListener('click', () => {
  detailEl.classList.add('hidden');
  document.getElementById('album-grid').classList.remove('hidden');
});

// open modal for track index
async function openTrackModal(index) {
  currentTrackIndex = index;
  await renderTrack(currentTrackIndex);
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden','false');
  // focus for keyboard nav
  document.body.style.overflow = 'hidden';
}

// render track into modal
async function renderTrack(index) {
  const t = currentTracks[index];
  if (!t) return;
  const base = t.filename.replace('.json','');
  // prefer .opus, fallback .mp3
  const candidateOpus = `${AUDIO_DIR}/${base}.opus`;
  const candidateMp3 = `${AUDIO_DIR}/${base}.mp3`;
  let audioSrc = null;
  if (await audioExists(candidateOpus)) audioSrc = candidateOpus;
  else if (await audioExists(candidateMp3)) audioSrc = candidateMp3;

  modalBody.innerHTML = `
    <h3>${t.title}${t.version ? ' — '+t.version : ''}</h3>
    <p class="muted tiny">Featuring: ${t.feature || '—'}</p>
    <p class="muted tiny">Length: ${t.length || '—'}</p>
    <div style="display:flex;gap:12px;align-items:flex-start;margin-top:8px">
      ${t.coverArt ? `<img src="${t.coverArt}" style="width:132px;height:132px;object-fit:cover;border-radius:8px">` : ''}
      <div>
        <p>${t.bio ? t.bio : ''}</p>
        <div id="lyrics-hint" class="muted tiny">Lyrics available on Genius (link if found)</div>
        <div id="audio-wrap" style="margin-top:10px"></div>
      </div>
    </div>
  `;

  const audioWrap = document.getElementById('audio-wrap');
  if (audioSrc) {
    audioWrap.innerHTML = `<audio controls preload="none" style="width:100%"><source src="${audioSrc}"></audio>`;
  } else {
    audioWrap.innerHTML = `<div class="muted tiny">Audio file not found.</div>`;
  }
}

// modal buttons & keyboard
modalClose?.addEventListener('click', closeModal);
prevBtn?.addEventListener('click', async () => {
  currentTrackIndex = (currentTrackIndex - 1 + currentTracks.length) % currentTracks.length;
  await renderTrack(currentTrackIndex);
});
nextBtn?.addEventListener('click', async () => {
  currentTrackIndex = (currentTrackIndex + 1) % currentTracks.length;
  await renderTrack(currentTrackIndex);
});

function closeModal() {
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
}

// keyboard navigation for modal
document.addEventListener('keydown', (e) => {
  if (modal.classList.contains('hidden')) return;
  if (e.key === 'Escape') closeModal();
  if (e.key === 'ArrowLeft') prevBtn?.click();
  if (e.key === 'ArrowRight') nextBtn?.click();
});

// initialize
document.addEventListener('DOMContentLoaded', () => {
  loadAlbums();
});
