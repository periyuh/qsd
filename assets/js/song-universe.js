async function loadAlbums() {
  const albumContainer = document.getElementById("albums-track");
  if (!albumContainer) return;

  // 1. Load all album JSONs dynamically
  const albumFiles = [
    "qsd1-emoslay.json",
    "qsd2-idhat.json",
    "qsd3-sissypuss.json",
    "qsd4-thecandidates.json",
    "qsd5-psychward.json",
    "jw-heelz.json",
    "jw-theiconicpop.json",
    "py-thesoundtrack.json",
    "qsd-khakishorts.json"
  ]; // you can also fetch filenames dynamically if you have a backend

  // 2. Load all songs JSONs
  const songFiles = [
    // put all JSON filenames from assets/albums/songs
  ];
  const songData = {};
  await Promise.all(songFiles.map(async file => {
    const res = await fetch(`assets/albums/songs/${file}`);
    const song = await res.json();
    songData[file.replace(".json", "")] = song;
  }));

  // 3. Render albums
  await Promise.all(albumFiles.map(async file => {
    const res = await fetch(`assets/albums/${file}`);
    const album = await res.json();

    const div = document.createElement("div");
    div.className = "album-card";
    div.innerHTML = `
      <img src="${album.coverArt || 'assets/images/albumcovers/placeholder.jpg'}" alt="${album.title}">
      <h3>${album.title}</h3>
      <p>${album.description}</p>
    `;
    div.addEventListener("click", () => showAlbumModal(album, songData));
    albumContainer.appendChild(div);
  }));
}

function showAlbumModal(album, songData) {
  const modal = document.createElement("div");
  modal.id = "album-modal";
  modal.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);color:#fff;padding:20px;overflow:auto;z-index:10000;";
  
  modal.innerHTML = `
    <button onclick="this.parentElement.remove()" style="position:absolute;top:10px;right:20px;">Close</button>
    <h2>${album.title}</h2>
    <p>${album.description}</p>
    <div id="tracklist"></div>
  `;

  const tracklistDiv = modal.querySelector("#tracklist");
  album.tracklist.forEach(trackFile => {
    const songKey = trackFile.replace(".json","");
    const song = songData[songKey];
    if (!song) return;

    const trackDiv = document.createElement("div");
    trackDiv.className = "track";
    trackDiv.innerHTML = `<p>${song.title} ${song.feature ? `(feat. ${song.feature.join(", ")})` : ""}</p>`;
    trackDiv.addEventListener("click", () => playSong(song));
    tracklistDiv.appendChild(trackDiv);
  });

  document.body.appendChild(modal);
}

function playSong(song){
  let player = document.getElementById("audio-player");
  if(!player){
    player = document.createElement("audio");
    player.id = "audio-player";
    player.controls = true;
    player.style = "position:fixed;bottom:10px;left:10px;z-index:10001;";
    document.body.appendChild(player);
  }
  player.src = `assets/audio/${song.title.toLowerCase().replace(/ /g,"")}.opus`;
  player.play();
}

document.addEventListener("DOMContentLoaded", loadAlbums);
