/* script.js — QSD Archive (albums, artists, tracks) */

const DATA_DIR = 'assets/data';
const SONGS_DIR = `${DATA_DIR}/qsd-songs`;
const ARTISTS_DIR = 'assets/artists';
const AUDIO_DIR = 'assets/audio';

/* Album list in display order */
const ALBUM_FILES = [
  'qsd1-emoslay.json',
  'qsd2-idhat.json',
  'qsd-khakishorts.json', // moved right after IDHAT
  'qsd3-sissypuss.json',
  'qsd4-thecandidates.json',
  'qsd5-psychward.json'
];

/* Easter egg */
console.log(
  '%cQSD ARCHIVE — hidden lore awaits ✨',
  'color:#ff2ea6;font-weight:700'
);

/* Helpers */
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

/* ----- Albums ----- */
const albumGrid = document.getElementById('grid');
const albumEmpty = document.getElementById('empty');
const albumDetail = document.getElementById('album-detail');
const albumInner = document.getElementById('detail-inner');
const albumBack = document.getElementById('detail-back');

let currentAlbum = null;
let currentTracks = [];
let currentTrackIndex = 0;

async function loadAlbums() {
  if (!albumGrid) return;
  albumGrid.innerHTML = '';
  let any = false;

  for (const file of ALBUM_FILES) {
    const album = await fetchJSON(`${DATA_DIR}/${file}`);
    if (!album) continue;
    any = true;

    const safeName = file.replace('.json', '').replace(/^qsd\d?-/, '');
    const cover = `assets/images/albumcovers/${safeName}.jpg`;

    const card = document.createElement('div');
    card.className = 'album-card';
    card.innerHTML = `
      <img src="${cover}" alt="${album.title}" class="cover"
           onerror="this.src='${album.coverArt || 'assets/images/albumcovers/thecandidates.jpg'}'">
      <h3>${album.title}</h3>
      <p class="muted">${album.artist}</p>
    `;

    card.addEventListener('click', () => showAlbum(file, album));
    albumGrid.appendChild(card);
  }

  albumEmpty && (albumEmpty.style.display = any ? 'none' : 'block');
}

async function showAlbum(albumFile, albumData = null) {
  const album = albumData || (await fetchJSON(`${DATA_DIR}/${albumFile}`));
  if (!album || !albumInner) return;

  currentAlbum = { file: albumFile, ...album };
  albumDetail.classList.remove('hidden');

  const safeName = albumFile.replace('.json', '').replace(/^qsd\d?-/, '');
  const cover = `assets/images/albumcovers/${safeName}.jpg`;

  albumInner.innerHTML = `
    <h2>${album.title}</h2>
    <div class="album-detail-header">
      <img class="cover-large" src="${cover}" 
           onerror="this.src='${album.coverArt || 'assets/images/albumcovers/thecandidates.jpg'}'" 
           alt="${album.title}">
      <div class="album-text">
        <p class="muted tiny"><b>Released:</b> ${album.releaseDate || 'Unknown'}</p>
        <p>${album.description || ''}</p>
      </div>
    </div>
    <h3>Tracklist</h3>
    <ul id="tracklist" class="tracklist"></ul>
  `;

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
      li.textContent = `${idx + 1}. ${t.title || 'Untitled'}`;
      li.addEventListener('click', () => openTrackModal(idx));
      tracklistEl.appendChild(li);
    });
  }
}

albumBack?.addEventListener('click', () => {
  albumDetail?.classList.add('hidden');
});

/* ----- Track Modal ----- */
const modal = document.getElementById('track-modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');
const prevBtn = document.getElementById('prev-track');
const nextBtn = document.getElementById('next-track');

async function openTrackModal(index) {
  currentTrackIndex = index;
  await renderTrack(index);
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
    setTimeout(() => (modal.style.display = 'none'), 300);
  }
  document.body.style.overflow = '';
}

async function renderTrack(index) {
  const t = currentTracks[index];
  if (!t) return;
  const base = t.filename.replace('.json', '');
  const audioSrc = `${AUDIO_DIR}/${base}.opus`;

  let lyricsBlock = '';
  if (Array.isArray(t.lyrics) && t.lyrics.length > 0) {
    if (t.lyrics.length === 1 && t.lyrics[0].toLowerCase().includes('instrumental')) {
      lyricsBlock = `<p class="muted">This song is an instrumental.</p>`;
    } else {
      lyricsBlock = `<button id="lyrics-btn" class="btn small">📖 Lyrics</button>`;
    }
  } else if (t.lyrics === null || (Array.isArray(t.lyrics) && t.lyrics.length === 0)) {
    lyricsBlock = `<p class="muted">Lyrics for this song aren't available.</p>`;
  }

  modalBody.innerHTML = `
    <h3>${t.title}${t.version ? ' — ' + t.version : ''}</h3>
    <p class="muted tiny">
      ${t.feature ? `feat. ${Array.isArray(t.feature) ? t.feature.join(', ') : t.feature}` : ''}
      ${t.length ? ` • ${t.length}` : ''}
    </p>
    <div style="margin:10px 0">${lyricsBlock}</div>
    <p>${t.bio || ''}</p>
    <audio controls preload="none" style="width:100%;margin-top:10px">
      <source src="${audioSrc}" type="audio/ogg">
    </audio>
  `;

  const lyricsBtn = document.getElementById('lyrics-btn');
  if (lyricsBtn) {
    lyricsBtn.addEventListener('click', () => {
      const win = window.open('', '_blank');
      win.document.write(`<pre style="white-space:pre-wrap;font-family:monospace;padding:20px">${t.lyrics.join('\n')}</pre>`);
      win.document.title = `${t.title} — Lyrics`;
    });
  }
}

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
  if (!modal || modal.getAttribute('aria-hidden') === 'true') return;
  if (e.key === 'Escape') closeModal();
  if (e.key === 'ArrowLeft') prevBtn?.click();
  if (e.key === 'ArrowRight') nextBtn?.click();
});

/* ----- Artists ----- */
const artistCarousel = document.getElementById('artist-carousel');
const artistEmpty = document.getElementById('artist-empty');
const artistDetail = document.getElementById('artist-detail');
const artistInner = document.getElementById('artist-inner');
const artistBack = document.getElementById('artist-back');

async function loadArtists() {
  if (!artistCarousel) return;
  artistCarousel.innerHTML = '';
  let any = false;

  const files = ['cameronreid.json']; // expand later
  for (const file of files) {
    const artist = await fetchJSON(`${ARTISTS_DIR}/${file}`);
    if (!artist) continue;
    any = true;

    const card = document.createElement('div');
    card.className = 'artist-card';
    card.innerHTML = `
      <div class="artist-name">${artist.name}</div>
      <p class="muted tiny">${artist.bio?.slice(0, 80) || ''}...</p>
    `;
    card.addEventListener('click', () => showArtist(file, artist));
    artistCarousel.appendChild(card);
  }

  artistEmpty && (artistEmpty.style.display = any ? 'none' : 'block');
}

async function showArtist(file, artistData = null) {
  const artist = artistData || (await fetchJSON(`${ARTISTS_DIR}/${file}`));
  if (!artist || !artistInner) return;

  artistDetail.classList.remove('hidden');
  artistInner.innerHTML = `
    <h2>${artist.name}</h2>
    <p>${artist.bio || ''}</p>
    <div class="links">
      ${artist.links ? Object.entries(artist.links).map(([p, u]) => `<a href="${u}" target="_blank">${p}</a>`).join(' • ') : ''}
    </div>
    <div class="artist-gallery">
      ${(artist.gallery || []).map(img => `<img src="assets/images/artists/${artist.folder}/${img}" alt="">`).join('')}
    </div>
  `;
}

artistBack?.addEventListener('click', () => {
  artistDetail?.classList.add('hidden');
});

/* ----- Init ----- */
document.addEventListener('DOMContentLoaded', () => {
  loadAlbums();
  loadArtists();
});
