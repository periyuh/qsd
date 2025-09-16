/* modal.js — QSD Archive Track Modal */

const modal = document.getElementById('track-modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');
const prevBtn = document.getElementById('prev-track');
const nextBtn = document.getElementById('next-track');

let currentTracks = [];
let currentTrackIndex = 0;

/** Open track modal */
export async function openTrackModal(tracks, index) {
  currentTracks = tracks;
  currentTrackIndex = index;

  await renderTrack(index);

  if (modal) {
    modal.classList.add('show');
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
  }
  document.body.style.overflow = 'hidden';
}

/** Close modal */
function closeModal() {
  if (modal) {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    setTimeout(() => (modal.style.display = 'none'), 250);
  }
  document.body.style.overflow = '';
}

/** Render track info */
async function renderTrack(index) {
  const t = currentTracks[index];
  if (!t) return;

  const base = t.filename.replace('.json', '');
  const audioSrc = `assets/audio/${base}.opus`;

  let lyricsBlock = '';
  if (Array.isArray(t.lyrics) && t.lyrics.length > 0) {
    if (t.lyrics.length === 1 && t.lyrics[0].toLowerCase().includes('instrumental')) {
      lyricsBlock = `<p class="muted">This song is an instrumental.</p>`;
    } else {
      lyricsBlock = `<button id="lyrics-btn" class="btn small">📖 Lyrics</button>`;
    }
  } else {
    lyricsBlock = `<p class="muted">Lyrics for this song aren't available.</p>`;
  }

  // Related songs section placeholder
  let relatedBlock = '';
  if (t.related && t.related.length) {
    relatedBlock = `
      <h4>Related Songs</h4>
      <ul class="related-list">
        ${t.related.map(r => `<li>${r.title} — <span class="muted tiny">${r.reason}</span></li>`).join('')}
      </ul>
    `;
  }

  modalBody.innerHTML = `
    <h3>${t.title}${t.version ? ' — ' + t.version : ''}</h3>
    <p class="muted tiny">
      ${t.feature ? `feat. ${Array.isArray(t.feature) ? t.feature.join(', ') : t.feature}` : ''}
      ${t.length ? ` • ${t.length}` : ''}
    </p>
    <div style="margin:10px 0">${lyricsBlock}</div>
    <p>${t.bio || ''}</p>
    ${relatedBlock}
    <audio id="modal-audio" controls preload="none" style="width:100%;margin-top:10px">
      <source src="${audioSrc}" type="audio/ogg">
    </audio>
  `;

  // Lyrics popup
  const lyricsBtn = document.getElementById('lyrics-btn');
  if (lyricsBtn) {
    lyricsBtn.addEventListener('click', () => {
      const win = window.open('', '_blank');
      win.document.write(`<pre style="white-space:pre-wrap;font-family:monospace;padding:20px">${t.lyrics.join('\n')}</pre>`);
      win.document.title = `${t.title} — Lyrics`;
    });
  }

  // Hook into global player
  const audioEl = document.getElementById('modal-audio');
  if (audioEl) {
    audioEl.addEventListener('play', () => {
      import('./player.js').then(({ setNowPlaying }) => {
        setNowPlaying(t, audioEl);
      });
    });
  }
}

/* Controls */
modalClose?.addEventListener('click', closeModal);

prevBtn?.addEventListener('click', () => {
  currentTrackIndex = (currentTrackIndex - 1 + currentTracks.length) % currentTracks.length;
  renderTrack(currentTrackIndex);
});

nextBtn?.addEventListener('click', () => {
  currentTrackIndex = (currentTrackIndex + 1) % currentTracks.length;
  renderTrack(currentTrackIndex);
});

document.addEventListener('keydown', (e) => {
  if (!modal || modal.getAttribute('aria-hidden') === 'true') return;
  if (e.key === 'Escape') closeModal();
  if (e.key === 'ArrowLeft') prevBtn?.click();
  if (e.key === 'ArrowRight') nextBtn?.click();
});
