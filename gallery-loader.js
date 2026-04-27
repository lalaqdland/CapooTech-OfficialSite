(async () => {
  try {
    const response = await fetch('/data/photos.json');
    if (!response.ok) throw new Error("Failed to load photos.json");

    const data = await response.json();
    let rawGallery = data.gallery || [];

    const photos = rawGallery.map(item => {
      if (typeof item === 'string') return item;
      return item.url || item.image || item.src;
    }).filter(Boolean);

    if (photos.length === 0) return;

    const floatingCatsNode = document.querySelector('.floating-cats');
    if (floatingCatsNode) {
      floatingCatsNode.innerHTML = '';
      photos.forEach((photoUrl, index) => {
        const animationVariant = (index % 4) + 1;
        const img = document.createElement('img');
        img.src = photoUrl;
        img.className = `orb orb${animationVariant}`;
        img.alt = "";
        floatingCatsNode.appendChild(img);
      });
    }

    const createMarqueeGroup = () => {
      const group = document.createElement('div');
      group.className = 'marquee-group';
      const groupMultiplier = Math.max(6, Math.ceil(40 / photos.length));

      let htmlString = '';
      for (let i = 0; i < groupMultiplier; i++) {
        photos.forEach(url => {
          htmlString += `<img src="${url}" alt="" />`;
        });
      }
      group.innerHTML = htmlString;
      return group;
    };

    const attachToTrack = (selector) => {
      const track = document.querySelector(selector);
      if (track) {
        track.innerHTML = '';
        track.appendChild(createMarqueeGroup());
        track.appendChild(createMarqueeGroup());
      }
    };

    attachToTrack('.edge-top .edge-track');
    attachToTrack('.edge-bottom .edge-track');

    setupGalleryZoom();

  } catch (err) {
    console.error("Gallery Loader Error:", err);
  }
})();

function setupGalleryZoom() {
  let zoomOverlay = document.getElementById('gallery-zoom-overlay');
  let zoomImage = document.getElementById('gallery-zoom-image');

  if (!zoomOverlay) {
    zoomOverlay = document.createElement('div');
    zoomOverlay.id = 'gallery-zoom-overlay';
    zoomOverlay.className = 'gallery-zoom-overlay';
    document.body.appendChild(zoomOverlay);
  }

  if (!zoomImage) {
    zoomImage = document.createElement('img');
    zoomImage.id = 'gallery-zoom-image';
    zoomImage.className = 'gallery-zoom-image';
    zoomImage.alt = "";
    document.body.appendChild(zoomImage);
  }

  let activeSource = null;
  let hoverTimeout = null;

  function showZoom(img) {
    const rect = img.getBoundingClientRect();
    const imgCenterX = rect.left + rect.width / 2;
    const imgCenterY = rect.top + rect.height / 2;

    zoomImage.src = img.src;

    const previewWidth = Math.min(400, window.innerWidth * 0.6);
    const previewHeight = Math.min(400, window.innerHeight * 0.6);

    let previewX = imgCenterX - previewWidth / 2;
    let previewY;

    const isTopEdge = imgCenterY < window.innerHeight / 2;
    if (isTopEdge) {
      previewY = rect.bottom + 20;
    } else {
      previewY = rect.top - previewHeight - 20;
    }

    previewX = Math.max(20, Math.min(window.innerWidth - previewWidth - 20, previewX));
    previewY = Math.max(20, Math.min(window.innerHeight - previewHeight - 20, previewY));

    zoomImage.style.left = `${previewX}px`;
    zoomImage.style.top = `${previewY}px`;
    zoomImage.style.maxWidth = `${previewWidth}px`;
    zoomImage.style.maxHeight = `${previewHeight}px`;

    requestAnimationFrame(() => {
      zoomOverlay.classList.add('visible');
      zoomImage.classList.add('visible');
    });

    activeSource = img;
  }

  function hideZoom() {
    zoomOverlay.classList.remove('visible');
    zoomImage.classList.remove('visible');
    activeSource = null;
  }

  function debouncedShow(img) {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    hoverTimeout = setTimeout(() => {
      showZoom(img);
    }, 150);
  }

  function handleMouseEnter(e) {
    const img = e.target;
    if (img.tagName === 'IMG' && (
      img.classList.contains('orb') ||
      img.closest('.marquee-group')
    )) {
      debouncedShow(img);
    }
  }

  function handleMouseLeave(e) {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
    if (activeSource) {
      hideZoom();
    }
  }

  function handleMouseMove(e) {
    if (!activeSource) return;

    const img = activeSource;
    const rect = img.getBoundingClientRect();
    const previewWidth = parseInt(zoomImage.style.maxWidth) || 400;
    const previewHeight = parseInt(zoomImage.style.maxHeight) || 400;

    let previewX = e.clientX - previewWidth / 2;
    let previewY;

    const isTopEdge = rect.top + rect.height / 2 < window.innerHeight / 2;
    if (isTopEdge) {
      previewY = rect.bottom + 20;
    } else {
      previewY = rect.top - previewHeight - 20;
    }

    previewX = Math.max(20, Math.min(window.innerWidth - previewWidth - 20, previewX));
    previewY = Math.max(20, Math.min(window.innerHeight - previewHeight - 20, previewY));

    zoomImage.style.left = `${previewX}px`;
    zoomImage.style.top = `${previewY}px`;
  }

  document.addEventListener('mouseenter', handleMouseEnter, true);
  document.addEventListener('mouseleave', handleMouseLeave, true);
  document.addEventListener('mousemove', handleMouseMove, true);
}
