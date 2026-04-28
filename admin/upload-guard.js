(function () {
  const GALLERY_PREFIX = '/images/capoo/';
  const IMAGE_EXTENSIONS = /\.(avif|gif|jpe?g|png|svg|webp)$/i;

  const toPlain = (value) => {
    if (!value) return value;
    if (typeof value.toJS === 'function') return value.toJS();
    return value;
  };

  const normalizePath = (value) => {
    if (typeof value !== 'string') return '';
    try {
      const url = new URL(value, window.location.origin);
      return decodeURI(url.pathname);
    } catch {
      try {
        return decodeURI(value.split(/[?#]/)[0]);
      } catch {
        return value.split(/[?#]/)[0];
      }
    }
  };

  const collectMediaPaths = (entry) => {
    const mediaFiles = toPlain(entry.get('mediaFiles')) || [];
    const paths = new Set();

    const visit = (value) => {
      if (!value) return;
      if (typeof value === 'string') {
        paths.add(normalizePath(value));
        return;
      }
      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }
      if (typeof value === 'object') {
        ['path', 'url', 'file', 'name', 'publicPath'].forEach((key) => visit(value[key]));
      }
    };

    visit(mediaFiles);
    return paths;
  };

  const checkExists = async (path) => {
    try {
      const response = await fetch(`${path}?cms-check=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const waitForCMS = () => {
    if (!window.CMS || typeof window.CMS.registerEventListener !== 'function') {
      window.setTimeout(waitForCMS, 100);
      return;
    }

    window.CMS.registerEventListener({
      name: 'preSave',
      handler: async ({ entry }) => {
        const collection = entry.get('collection');

        if (collection !== 'site_data') {
          return entry;
        }

        const data = entry.get('data');
        const galleryValue = typeof data.get === 'function' ? data.get('gallery') : data.gallery;
        const gallery = toPlain(galleryValue) || [];

        if (!Array.isArray(gallery)) {
          return entry;
        }

        const mediaPaths = collectMediaPaths(entry);
        const missing = [];

        for (const value of gallery) {
          const imagePath = normalizePath(value);

          if (!imagePath || !imagePath.startsWith(GALLERY_PREFIX) || !IMAGE_EXTENSIONS.test(imagePath)) {
            missing.push(value);
            continue;
          }

          if (mediaPaths.has(imagePath) || mediaPaths.has(imagePath.replace(/^\//, ''))) {
            continue;
          }

          if (!(await checkExists(imagePath))) {
            missing.push(value);
          }
        }

        if (missing.length > 0) {
          throw new Error(
            [
              '图片还没有真正上传成功，已阻止保存。',
              '请点击图片字段的 Replace/Browse 重新选择本地图片，等待上传完成并出现缩略图后再保存。',
              `缺失资源: ${missing.join(', ')}`,
            ].join('\n'),
          );
        }

        return entry;
      },
    });
  };

  waitForCMS();
})();
