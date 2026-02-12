export function getApiBaseUrl() {
  // @ts-ignore
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    return "https://api.eduke.com";
  }

  // @ts-ignore
  if (typeof window !== "undefined" && (window.process?.type || window.__ELECTRON_ID__)) {
    // Electron
    return "http://localhost:8000";
  }

  // Web
  return "https://api.eduke.com";
}
