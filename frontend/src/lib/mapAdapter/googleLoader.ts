// Dynamic Loader for Google Maps JavaScript API
declare global {
  interface Window {
    google?: any;
    gm_authFailure?: () => void;
    __googleMapsLoadedPromise?: Promise<boolean>;
  }
}

let authFailureDetected = false;

export function isGoogleMapsAuthFailed(): boolean {
  return authFailureDetected;
}

export function loadGoogleMapsScript(apiKey: string): Promise<boolean> {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    return Promise.resolve(false);
  }

  if (window.__googleMapsLoadedPromise) {
    return window.__googleMapsLoadedPromise;
  }

  window.__googleMapsLoadedPromise = new Promise((resolve) => {
    // Check if already present on window
    if (window.google && window.google.maps) {
      return resolve(true);
    }

    // Intercept Google Maps Auth Failure (e.g. invalid key or billing issue)
    window.gm_authFailure = () => {
      console.warn('⚠️ Google Maps API autentifikatsiya xatosi (gm_authFailure). Avtomatik OSM zaxira tizimiga o\'tilmoqda.');
      authFailureDetected = true;
      resolve(false);
    };

    const script = document.createElement('script');
    script.id = 'google-maps-sdk';
    script.type = 'text/javascript';
    script.async = true;
    script.defer = true;
    // Loading currently supported libraries: marker (for AdvancedMarkerElement), geometry (for spherical math), places
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey.trim()
    )}&libraries=marker,geometry,places&loading=async&language=uz&region=UZ`;

    const timeout = setTimeout(() => {
      console.warn('⚠️ Google Maps yuklanishi vaqt chegarasidan oshdi. OSM zaxirasiga o\'tilmoqda.');
      resolve(false);
    }, 7000);

    script.onload = () => {
      clearTimeout(timeout);
      if (window.google && window.google.maps) {
        resolve(true);
      } else {
        resolve(false);
      }
    };

    script.onerror = (err) => {
      clearTimeout(timeout);
      console.warn('⚠️ Google Maps skriptini yuklashda xatolik:', err);
      resolve(false);
    };

    document.head.appendChild(script);
  });

  return window.__googleMapsLoadedPromise;
}
