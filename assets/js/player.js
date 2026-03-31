/*
(function () {
  const playerShell = document.createElement("div");
  playerShell.className = "audio-player-shell";

  const titleDiv = document.createElement("div");
  titleDiv.id = "player-title";
  titleDiv.className = "audio-player-title";
  titleDiv.textContent = "Nothing playing";

  const audio = document.createElement("audio");
  audio.controls = true;
  audio.preload = "metadata";
  audio.className = "audio-player";

  playerShell.appendChild(titleDiv);
  playerShell.appendChild(audio);
  document.body.appendChild(playerShell);

  window.player = {
    load(src, title = "Playing...") {
      if (!src) {
        return;
      }
      audio.src = src;
      titleDiv.textContent = title;
      playerShell.classList.add("is-visible");
      audio.load();
    },
    play() {
      audio.play().catch((error) => {
        console.warn("player play fail", error);
      });
    },
    pause() {
      audio.pause();
    }
  };
})();
*/
