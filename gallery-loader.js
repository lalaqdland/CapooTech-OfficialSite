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
  const ZOOM_SCALE = 2.8;

  function isLayoutA() {
    const html = document.documentElement;
    return html.getAttribute('data-layout') === 'layout-a';
  }

  function showZoom(img) {
    if (isLayoutA()) return;

    const rect = img.getBoundingClientRect();
    const imgWidth = rect.width;
    const imgHeight = rect.height;

    let zoomWidth = imgWidth * ZOOM_SCALE;
    let zoomHeight = imgHeight * ZOOM_SCALE;

    const maxAllowedWidth = window.innerWidth * 0.85;
    const maxAllowedHeight = window.innerHeight * 0.8;

    if (zoomWidth > maxAllowedWidth) {
      const scaleRatio = maxAllowedWidth / zoomWidth;
      zoomWidth = maxAllowedWidth;
      zoomHeight *= scaleRatio;
    }
    if (zoomHeight > maxAllowedHeight) {
      const scaleRatio = maxAllowedHeight / zoomHeight;
      zoomHeight = maxAllowedHeight;
      zoomWidth *= scaleRatio;
    }

    let left = rect.left + (imgWidth - zoomWidth) / 2;

    const viewportCenterY = window.innerHeight / 2;
    const imgCenterY = rect.top + imgHeight / 2;
    const isOnTopHalf = imgCenterY < viewportCenterY;

    let top;
    if (isOnTopHalf) {
      top = rect.bottom + 15;
    } else {
      top = rect.top - zoomHeight - 15;
    }

    const padding = 15;
    left = Math.max(padding, Math.min(left, window.innerWidth - zoomWidth - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - zoomHeight - padding));

    zoomImage.src = img.src;
    zoomImage.style.width = `${zoomWidth}px`;
    zoomImage.style.height = `${zoomHeight}px`;
    zoomImage.style.left = `${left}px`;
    zoomImage.style.top = `${top}px`;
    zoomImage.style.maxWidth = 'none';
    zoomImage.style.maxHeight = 'none';

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
    }, 120);
  }

  function handleMouseEnter(e) {
    const img = e.target;
    if (img.tagName === 'IMG') {
      if (img.closest('.marquee-group')) {
        debouncedShow(img);
      }
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

  document.addEventListener('mouseenter', handleMouseEnter, true);
  document.addEventListener('mouseleave', handleMouseLeave, true);
}
