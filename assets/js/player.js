/* player.js — Global Audio Player */

const playerBar = document.createElement('div');
playerBar.id = 'player-bar';
playerBar.innerHTML = `
  <div id="player-info" class="player-info">Nothing playing</div>
  <audio id="global-player" controls preload="none"></audio>
`;
document.body.appendChild(playerBar);

const infoEl = document.getElementById('player-info');
const globalAudio = document.getElementById('global-player');

let nowPlaying = null;

/** Called by modal.js when a track is opened */
export function setNowPlaying(track, audioEl) {
  nowPlaying = track;
  infoEl.textContent = `${track.title}${track.feature ? ' (feat. ' + track.feature + ')' : ''}`;
  globalAudio.src = audioEl.querySelector('source').src;
  globalAudio.play().catch(() => {});
}

/** Optional shuffle/random control (future feature) */
export function shufflePlay(tracks) {
  if (!tracks.length) return;
  const r = tracks[Math.floor(Math.random() * tracks.length)];
  setNowPlaying(r, { querySelector: () => ({ src: `assets/audio/${r.filename.replace('.json', '')}.opus` }) });
}
