/* browser.js — QSD Archive Browser */

const ALBUM_DIR = 'assets/albums';
const SONG_DIR = `${ALBUM_DIR}/songs`;
const ARTIST_DIR = 'assets/artists';

/* DOM refs */
const albumCarousel = document.getElementById('album-carousel');
const artistCarousel = document.getElementById('artist-carousel');
const extraCarousel = document.getElementById('extra-carousel');
const topTracksList = document.getElementById('top-tracks');

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

function createCarouselItem(imgSrc, title, subtitle) {
  const div = document.createElement('div');
  div.className = 'carousel-item';
  div.innerHTML = `
    <img src="${imgSrc}" alt="${title}">
    <h4>${title}</h4>
    <p class="muted tiny">${subtitle || ''}</p>
  `;
  return div;
}

/* --- Albums (main discography) --- */
async function loadAlbums(files) {
  if (!albumCarousel) return;
  albumCarousel.innerHTML = '';

  for (const file of files) {
    const album = await fetchJSON(`${ALBUM_DIR}/${file}`);
    if (!album) continue;

    const safeName = file.replace('.json', '').replace(/^qsd\d?-/, '');
    const cover = `assets/images/albumcovers/${safeName}.jpg`;

    const item = createCarouselItem(cover, album.title, album.artist);
    item.addEventListener('click', () => openAlbumModal(album, file));
    albumCarousel.appendChild(item);
  }
}

/* --- Artists --- */
async function loadArtists(files) {
  if (!artistCarousel) return;
  artistCarousel.innerHTML = '';

  for (const file of files) {
    const artist = await fetchJSON(`${ARTIST_DIR}/${file}`);
    if (!artist) continue;

    const thumb = artist.gallery?.length
      ? `assets/images/artists/${artist.folder}/${artist.gallery[0]}`
      : 'assets/images/QSD.png';

    const item = createCarouselItem(thumb, artist.name, artist.bio?.slice(0, 50) + '…');
    item.addEventListener('click', () => openArtistModal(artist, file));
    artistCarousel.appendChild(item);
  }
}

/* --- Other Notable Albums --- */
async function loadExtras(files) {
  if (!extraCarousel) return;
  extraCarousel.innerHTML = '';

  for (const file of files) {
    const album = await fetchJSON(`${ALBUM_DIR}/${file}`);
    if (!album) continue;

    const safeName = file.replace('.json', '');
    const cover = `assets/images/albumcovers/${safeName}.jpg`;

    const item = createCarouselItem(cover, album.title, album.artist);
    item.addEventListener('click', () => openAlbumModal(album, file));
    extraCarousel.appendChild(item);
  }
}

/* --- Top Tracks (Apple Music style) --- */
async function loadTopTracks(files) {
  if (!topTracksList) return;
  topTracksList.innerHTML = '';

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const song = await fetchJSON(`${SONG_DIR}/${file}`);
    if (!song) continue;

    const li = document.createElement('li');
    li.className = 'top-track';
    li.innerHTML = `
      <span class="track-num">${i + 1}</span>
      <div class="track-info">
        <div class="track-title">${song.title}</div>
        <div class="track-sub muted tiny">${song.artist || 'QSD'}</div>
      </div>
      <span class="track-length">${song.length || ''}</span>
    `;
    li.addEventListener('click', () => openTrackModal(song, file));
    topTracksList.appendChild(li);
  }
}

/* --- Init --- */
document.addEventListener('DOMContentLoaded', () => {
  const albumFiles = [
    'qsd1-emoslay.json',
    'qsd2-idhat.json',
    'qsd-khakishorts.json',
    'qsd3-sissypuss.json',
    'qsd4-thecandidates.json',
    'qsd5-psychward.json'
  ];
  const topTrackFiles = [
    'dontbeshy.json',
    'dourthing.json',
    'thenewbreakingpoint.json',
    'sissypuss.json',
    'cinematicoutro.json',
    'heelzremix.json',
    'icon.json'
  ];
  const artistFiles = ['cameronreid.json'];
  const extraFiles = ['jw-heelz.json', 'jw-theiconicpop.json', 'py-thesoundtrack.json'];

  loadAlbums(albumFiles);
  loadArtists(artistFiles);
  loadExtras(extraFiles);
  loadTopTracks(topTrackFiles);
});
