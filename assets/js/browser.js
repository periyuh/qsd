const DATA_DIR = "assets/albums";
const TRACK_DIR = `${DATA_DIR}/songs`;
const ARTIST_DIR = "assets/artists";
// const AUDIO_DIR = "assets/audio";

const QSD_ALBUM_FILES = [
  "qsd1-emoslay.json",
  "qsd2-idhat.json",
  "qsd-khakishorts.json",
  "qsd3-sissypuss.json",
  "qsd4-thecandidates.json",
  "qsd5-psychward.json"
];

const OTHER_ALBUM_FILES = [
  "jw-heelz.json",
  "jw-theiconicpop.json",
  "py-thesoundtrack.json"
];

const ARTIST_FILES = ["cameronreid.json", "periyuh.json"];

let allAlbums = [];
let allTracks = [];
let allArtists = [];

async function fetchJSON(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) {
      throw new Error(res.status);
    }
    return await res.json();
  } catch (err) {
    console.warn("fetchJSON error:", path, err.message);
    return null;
  }
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function getTrackPath(trackFilename) {
  const file = trackFilename.endsWith(".json") ? trackFilename : `${trackFilename}.json`;
  return file.includes("/") ? `${DATA_DIR}/${file}` : `${TRACK_DIR}/${file}`;
}

/*
function getTrackAudio(trackFilename, trackData) {
  if (trackData?.audio) {
    return trackData.audio;
  }
  const baseName = trackFilename.replace(/\.json$/i, "");
  return `${AUDIO_DIR}/${baseName}.opus`;
}
*/

function getDisplayAlbum(albumValue) {
  if (Array.isArray(albumValue)) {
    return albumValue.join(" / ");
  }
  return albumValue || "";
}

function getDisplayFeature(featureValue) {
  if (Array.isArray(featureValue)) {
    return featureValue.join(", ");
  }
  return featureValue || "";
}

function makeCard({ coverArt, title, artist }, clickHandler) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "product browser-card";
  card.innerHTML = `
    <img src="${coverArt}" alt="${title}">
    <p><strong>${title}</strong><br><span class="muted">${artist || "QSD"}</span></p>
  `;
  if (clickHandler) {
    card.addEventListener("click", clickHandler);
  }
  return card;
}

function closeModal(overlay) {
  if (overlay && overlay.parentNode) {
    overlay.parentNode.removeChild(overlay);
  }
}

function buildModalShell(contentClass = "") {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const modal = document.createElement("div");
  modal.className = `detail-modal ${contentClass}`.trim();

  overlay.appendChild(modal);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeModal(overlay);
    }
  });

  return { overlay, modal };
}

function makeActionButton(label, className = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `btn ${className}`.trim();
  button.textContent = label;
  return button;
}

async function loadAlbumInfo(albumFilename) {
  const album = await fetchJSON(`${DATA_DIR}/${albumFilename}`);
  if (!album) {
    return null;
  }

  const trackFiles = Array.isArray(album.tracklist)
    ? album.tracklist
    : Array.isArray(album.tracks)
      ? album.tracks
      : [];

  const tracks = [];
  for (const filename of trackFiles) {
    const track = await fetchJSON(getTrackPath(filename));
    if (track) {
      tracks.push({ filename, data: track });
    }
  }

  return { album, tracks, trackFiles };
}

async function loadTrackInfo(trackFilename) {
  const track = await fetchJSON(getTrackPath(trackFilename));
  if (!track) {
    return null;
  }
  return { filename: trackFilename, data: track };
}

/*
function playTrack(trackFilename, trackData) {
  const audioSrc = getTrackAudio(trackFilename, trackData);
  if (window.player && typeof window.player.load === "function") {
    window.player.load(audioSrc, trackData.title || "Untitled track");
    window.player.play();
  }
}
*/

function renderMetaLine(label, value) {
  if (!value) {
    return "";
  }
  return `<p class="modal-meta"><span>${label}</span> ${value}</p>`;
}

function showTrackInfo(trackFilename) {
  loadTrackInfo(trackFilename)
    .then((entry) => {
      if (!entry) {
        return;
      }

      const { filename, data: track } = entry;
      const { overlay, modal } = buildModalShell("track-modal");
      const featureText = getDisplayFeature(track.feature);
      const albumText = getDisplayAlbum(track.album);

      modal.innerHTML = `
        <div class="modal-copy">
          <p class="modal-kicker">Track</p>
          <h2>${track.title || "Untitled track"}</h2>
          ${renderMetaLine("From", albumText)}
          ${renderMetaLine("Feat.", featureText)}
          ${renderMetaLine("Length", track.length)}
          ${track.bio ? `<p class="modal-description">${track.bio}</p>` : ""}
          ${track.lyrics ? `<pre class="lyrics-block">${track.lyrics.join("\n")}</pre>` : ""}
        </div>
      `;

      const actions = document.createElement("div");
      actions.className = "modal-actions";

      const closeButton = makeActionButton("Close", "btn-secondary");
      closeButton.addEventListener("click", () => {
        closeModal(overlay);
      });

      // const playButton = makeActionButton("Play Track");
      // playButton.addEventListener("click", () => {
      //   playTrack(filename, track);
      // });
      // actions.appendChild(playButton);
      actions.appendChild(closeButton);
      modal.appendChild(actions);

      document.body.appendChild(overlay);
    })
    .catch((err) => {
      console.error("Error loading track info:", err);
    });
}

function formatTrackListItem(trackEntry) {
  const track = trackEntry.data;
  let line = `<strong>${track.title || "Untitled"}</strong>`;
  const featureText = getDisplayFeature(track.feature);

  if (featureText) {
    line += ` (feat. ${featureText})`;
  }
  if (track.version) {
    line += ` - ${track.version}`;
  }
  if (track.length) {
    line += ` <span class="muted">[${track.length}]</span>`;
  }

  return `<li><button type="button" class="track-link" data-track="${trackEntry.filename}">${line}</button></li>`;
}

function showAlbumInfo(albumFilename) {
  loadAlbumInfo(albumFilename)
    .then((data) => {
      if (!data) {
        return;
      }

      const { album, tracks, trackFiles } = data;
      history.pushState({}, "", `?album=${albumFilename}`);

      const { overlay, modal } = buildModalShell("album-modal");
      const artistText = Array.isArray(album.artist) ? album.artist.join(", ") : album.artist || "";

      modal.innerHTML = `
        <div class="modal-cover-wrap">
          ${album.coverArt ? `<img class="modal-cover" src="${album.coverArt}" alt="${album.title || "Album cover"}">` : ""}
        </div>
        <div class="modal-copy">
          <p class="modal-kicker">Album</p>
          <h2>${album.title || "Untitled album"}</h2>
          ${renderMetaLine("Artist", artistText)}
          ${renderMetaLine("Released", album.releaseDate)}
          ${album.description ? `<p class="modal-description">${album.description}</p>` : ""}
          <h3>Tracklist</h3>
          <ol class="tracklist">${tracks.map(formatTrackListItem).join("")}</ol>
        </div>
      `;

      modal.querySelectorAll(".track-link").forEach((button) => {
        button.addEventListener("click", () => {
          showTrackInfo(button.dataset.track);
        });
      });

      const actions = document.createElement("div");
      actions.className = "modal-actions modal-actions-full";

      const closeButton = makeActionButton("Close", "btn-secondary");
      closeButton.addEventListener("click", () => {
        closeModal(overlay);
      });

      // const playButton = makeActionButton("Play Album");
      // playButton.addEventListener("click", () => {
      //   const firstTrackFile = trackFiles[0];
      //   const firstTrack = tracks[0]?.data;
      //   if (firstTrackFile && firstTrack) {
      //     playTrack(firstTrackFile, firstTrack);
      //   }
      // });
      // actions.appendChild(playButton);
      actions.appendChild(closeButton);
      modal.appendChild(actions);

      document.body.appendChild(overlay);
    })
    .catch((err) => {
      console.error("Error loading album info:", err);
    });
}

async function loadArtistInfo(artistFilename) {
  return await fetchJSON(`${ARTIST_DIR}/${artistFilename}`);
}

function showArtistInfo(artistFilename) {
  loadArtistInfo(artistFilename)
    .then((artist) => {
      if (!artist) {
        return;
      }

      const { overlay, modal } = buildModalShell("artist-modal");
      const linksHtml = artist.links
        ? Object.entries(artist.links)
            .map(([label, url]) => `<a href="${url}" target="_blank" rel="noopener">${label}</a>`)
            .join("")
        : "";

      modal.innerHTML = `
        <div class="modal-cover-wrap">
          ${artist.image ? `<img class="modal-cover" src="${artist.image}" alt="${artist.name || "Artist image"}">` : ""}
        </div>
        <div class="modal-copy">
          <p class="modal-kicker">Artist</p>
          <h2>${artist.name || "Unnamed artist"}</h2>
          ${artist.bio ? `<p class="modal-description">${artist.bio}</p>` : ""}
          ${linksHtml ? `<div class="artist-links">${linksHtml}</div>` : ""}
        </div>
      `;

      const actions = document.createElement("div");
      actions.className = "modal-actions modal-actions-full";

      const closeButton = makeActionButton("Close", "btn-secondary");
      closeButton.addEventListener("click", () => {
        closeModal(overlay);
      });

      actions.appendChild(closeButton);
      modal.appendChild(actions);

      document.body.appendChild(overlay);
    })
    .catch((err) => {
      console.error("Error loading artist info:", err);
    });
}

async function loadAlbumsInto(containerId, files) {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }

  for (const file of files) {
    const album = await fetchJSON(`${DATA_DIR}/${file}`);
    if (!album) {
      continue;
    }
    container.appendChild(makeCard(album, () => showAlbumInfo(file)));
  }
}

async function loadQSDAlbums() {
  await loadAlbumsInto("qsd-albums", QSD_ALBUM_FILES);
}

async function loadOtherAlbums() {
  await loadAlbumsInto("other-albums", OTHER_ALBUM_FILES);
}

async function loadRandomTracks() {
  const container = document.getElementById("random-tracks");
  if (!container) {
    return;
  }

  const allRandomTracks = [];

  for (const file of QSD_ALBUM_FILES) {
    const album = await fetchJSON(`${DATA_DIR}/${file}`);
    if (!album || !Array.isArray(album.tracklist)) {
      continue;
    }

    for (const trackFile of album.tracklist) {
      const trackData = await fetchJSON(getTrackPath(trackFile));
      if (!trackData) {
        continue;
      }

      allRandomTracks.push({
        coverArt: album.coverArt || "assets/images/qsdicons/QSD - New Logo.png",
        title: trackData.title || trackFile.replace(".json", ""),
        artist: album.artist || "QSD",
        filename: trackFile
      });
    }
  }

  shuffle(allRandomTracks);
  allRandomTracks.slice(0, 10).forEach((track) => {
    container.appendChild(makeCard(track, () => showTrackInfo(track.filename)));
  });
}

async function loadArtists() {
  const container = document.getElementById("artist-carousel");
  if (!container) {
    return;
  }

  for (const file of ARTIST_FILES) {
    const artist = await fetchJSON(`${ARTIST_DIR}/${file}`);
    if (!artist) {
      continue;
    }

    const image = artist.image || artist.picture || "assets/images/qsdicons/QSD - New Logo.png";
    container.appendChild(
      makeCard(
        { coverArt: image, title: artist.name || file.replace(".json", ""), artist: "" },
        () => showArtistInfo(file)
      )
    );
  }
}

async function indexData() {
  allAlbums = [];
  allTracks = [];
  allArtists = [];

  for (const file of [...QSD_ALBUM_FILES, ...OTHER_ALBUM_FILES]) {
    const album = await fetchJSON(`${DATA_DIR}/${file}`);
    if (!album) {
      continue;
    }
    allAlbums.push({ type: "album", filename: file, data: album });

    if (Array.isArray(album.tracklist)) {
      for (const trackFile of album.tracklist) {
        const trackData = await fetchJSON(getTrackPath(trackFile));
        if (!trackData) {
          continue;
        }
        allTracks.push({ type: "track", filename: trackFile, data: trackData });
      }
    }
  }

  for (const file of ARTIST_FILES) {
    const artist = await fetchJSON(`${ARTIST_DIR}/${file}`);
    if (artist) {
      allArtists.push({ type: "artist", filename: file, data: artist });
    }
  }
}

function performSearch(query) {
  const container = document.getElementById("search-results");
  if (!container) {
    return;
  }

  const searchTerm = query.trim().toLowerCase();
  container.innerHTML = "";

  if (!searchTerm) {
    return;
  }

  const results = [...allAlbums, ...allTracks, ...allArtists].filter((item) => {
    const featureText = getDisplayFeature(item.data.feature);
    return (
      item.data.title?.toLowerCase().includes(searchTerm) ||
      item.data.name?.toLowerCase().includes(searchTerm) ||
      item.data.artist?.toLowerCase().includes(searchTerm) ||
      item.data.bio?.toLowerCase().includes(searchTerm) ||
      featureText.toLowerCase().includes(searchTerm)
    );
  });

  if (!results.length) {
    container.innerHTML = '<div class="search-empty">No results</div>';
    return;
  }

  results.slice(0, 10).forEach((item) => {
    const coverArt = item.data.coverArt || item.data.image || "assets/images/qsdicons/QSD - New Logo.png";
    const label = item.data.title || item.data.name || "Untitled";
    const artist = item.type === "artist" ? "" : item.data.artist;
    const card = makeCard({ coverArt, title: label, artist }, () => {
      if (item.type === "album") {
        showAlbumInfo(item.filename);
      } else if (item.type === "track") {
        showTrackInfo(item.filename);
      } else if (item.type === "artist") {
        showArtistInfo(item.filename);
      }
    });
    container.appendChild(card);
  });
}

async function init() {
  await indexData();
  await loadQSDAlbums();
  await loadRandomTracks();
  await loadOtherAlbums();
  await loadArtists();

  const urlParams = new URLSearchParams(window.location.search);
  const album = urlParams.get("album");
  const track = urlParams.get("track");
  const artist = urlParams.get("artist");

  if (album) {
    showAlbumInfo(album);
  } else if (track) {
    showTrackInfo(track);
  } else if (artist) {
    showArtistInfo(artist);
  }

  const searchInput = document.getElementById("search");
  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      performSearch(event.target.value);
    });
  }
}

document.addEventListener("DOMContentLoaded", init);
