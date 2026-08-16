// Service Worker Registration and Offline Management

export function registerServiceWorker(config?: {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
}) {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      const swUrl = "/sw.js";

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log("[SW] ServiceWorker registered with scope:", registration.scope);

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) {
              return;
            }
            installingWorker.onstatechange = () => {
              if (installingWorker.state === "installed") {
                if (navigator.serviceWorker.controller) {
                  console.log("[SW] New study companion update is available; content will update on next refresh.");
                  if (config?.onUpdate) {
                    config.onUpdate(registration);
                  }
                } else {
                  console.log("[SW] Content is cached and ready for offline study!");
                  if (config?.onSuccess) {
                    config.onSuccess(registration);
                  }
                }
              }
            };
          };
        })
        .catch((error) => {
          console.error("[SW] Error during service worker registration:", error);
        });
    });
  }
}

export function unregisterServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
