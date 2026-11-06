// Dynamic Loader for Yandex Maps JavaScript API 2.1
declare global {
  interface Window {
    ymaps?: any;
    __yandexMapsLoadedPromise?: Promise<boolean>;
  }
}

export function loadYandexMapsScript(apiKey: string): Promise<boolean> {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    return Promise.resolve(false);
  }

  if (window.__yandexMapsLoadedPromise) {
    return window.__yandexMapsLoadedPromise;
  }

  window.__yandexMapsLoadedPromise = new Promise((resolve) => {
    // Check if already present on window
    if (window.ymaps && window.ymaps.Map) {
      window.ymaps.ready(() => resolve(true));
      return;
    }

    const script = document.createElement('script');
    script.id = 'yandex-maps-sdk';
    script.type = 'text/javascript';
    script.async = true;
    script.defer = true;
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(
      apiKey.trim()
    )}&lang=uz_UZ`;

    const timeout = setTimeout(() => {
      console.warn('⚠️ Yandex Maps yuklanishi vaqt chegarasidan oshdi. Zaxiraga o\'tilmoqda.');
      resolve(false);
    }, 7000);

    script.onload = () => {
      clearTimeout(timeout);
      if (window.ymaps) {
        window.ymaps.ready(() => resolve(true));
      } else {
        resolve(false);
      }
    };

    script.onerror = (err) => {
      clearTimeout(timeout);
      console.warn('⚠️ Yandex Maps skriptini yuklashda xatolik:', err);
      resolve(false);
    };

    document.head.appendChild(script);
  });

  return window.__yandexMapsLoadedPromise;
}

