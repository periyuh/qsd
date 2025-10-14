async function loadProducts() {
  try {
    const res = await fetch('assets/data/products.json');
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();

    const gallery = document.getElementById('product-gallery');
    if (!gallery) return;

    // Sections
    const elasticSection = document.createElement('div');
    elasticSection.className = 'product-section';
    elasticSection.innerHTML = `<h3>ElasticStage Releases</h3>`;
    gallery.appendChild(elasticSection);

    const kunakiSection = document.createElement('div');
    kunakiSection.className = 'product-section';
    kunakiSection.innerHTML = `<h3>Kunaki Releases</h3>`;
    gallery.appendChild(kunakiSection);

    // Add products
    data.products.forEach(album => {
      album.items.forEach(item => {
        const card = document.createElement('a');
        card.className = 'product';
        card.href = item.link;
        card.target = '_blank';
        card.innerHTML = `
          <img src="${item.image}" alt="${album.album} - ${item.format}">
          <p><strong>${album.album}</strong><br>${item.format}</p>
        `;

        if (album.store.toLowerCase() === 'elasticstage') {
          elasticSection.appendChild(card);
        } else if (album.store.toLowerCase() === 'kunaki') {
          kunakiSection.appendChild(card);
        }
      });
    });

  } catch (err) {
    console.error("Failed to load products.json:", err);
  }
}

document.addEventListener('DOMContentLoaded', loadProducts);
<script src="assets/js/site.js"></script>
