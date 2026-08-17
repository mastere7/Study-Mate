// StudyMate Service Worker - Offline Study Companion
const CACHE_VERSION = 'studymate-v1.2';
const STATIC_CACHE = `studymate-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `studymate-dynamic-${CACHE_VERSION}`;
const RESOURCE_CACHE = `studymate-resources-${CACHE_VERSION}`;

// Essential study app shell assets to precache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.webmanifest',
];

// Maximum items to keep in dynamic caches to prevent boundless storage growth
const MAX_DYNAMIC_ITEMS = 80;

async function limitCacheSize(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      await cache.delete(keys[0]);
      limitCacheSize(cacheName, maxItems);
    }
  } catch (err) {
    console.warn('[SW] Cache pruning error:', err);
  }
}

// 1. Install Event: Pre-cache core shell
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing, precaching essential study resources...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      try {
        await cache.addAll(PRECACHE_ASSETS);
        console.log('[SW] Pre-cached core assets successfully.');
      } catch (err) {
        console.warn('[SW] Precache non-blocking failure:', err);
      }
      return self.skipWaiting();
    })
  );
});

// 2. Activate Event: Clean up outdated caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating, clearing old caches...');
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, RESOURCE_CACHE];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log('[SW] Deleting obsolete cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event Strategy:
// - Navigation requests (HTML SPA): Network-first with Cache fallback to /index.html
// - Static build assets (.js, .css, .woff2, .svg, images): Stale-While-Revalidate
// - API calls: Network-first with offline fallback json
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests (e.g., POST/PUT for AI API) or Chrome extensions / non-HTTP
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // A. Navigation Request (SPA Page Routing)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          console.log('[SW] Offline navigation requested, serving cached app shell for:', url.pathname);
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const fallback = await caches.match('/index.html');
          return fallback || new Response(
            `<!DOCTYPE html><html><head><title>StudyMate Offline</title></head><body style="font-family:sans-serif;text-align:center;padding:40px;"><h2>⚡ StudyMate Offline Mode</h2><p>You are currently offline. Please reconnect or open cached StudyMate resources.</p></body></html>`,
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // B. API Calls (/api/*)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response;
        })
        .catch(async () => {
          console.log('[SW] API offline fallback for:', url.pathname);
          return new Response(
            JSON.stringify({
              error: 'Offline Mode Active',
              message: 'You are currently offline. AI cloud generation requires internet, but your local study notes, saved flashcards, mock quizzes, Pomodoro timer, and curriculum mind map remain fully functional.',
              isOffline: true,
            }),
            {
              status: 503,
              statusText: 'Service Unavailable (Offline)',
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
    );
    return;
  }

  // C. Static JS, CSS, Font, and Media Assets (Stale-While-Revalidate)
  const isStaticAsset =
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff2?|ttf|eot|ico|json)$/) ||
    url.pathname.startsWith('/assets/') ||
    url.origin === self.location.origin;

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
                limitCacheSize(DYNAMIC_CACHE, MAX_DYNAMIC_ITEMS);
              });
            }
            return networkResponse;
          })
          .catch((err) => {
            // Network failure is fine if we have cachedResponse
            return cachedResponse;
          });

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // D. General Requests: Cache First with Network Fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && request.method === 'GET') {
          const responseClone = networkResponse.clone();
          caches.open(RESOURCE_CACHE).then((cache) => {
            cache.put(request, responseClone);
            limitCacheSize(RESOURCE_CACHE, MAX_DYNAMIC_ITEMS);
          });
        }
        return networkResponse;
      });
    })
  );
});

// 4. Notification Click & Close Events (Background & Desktop Native Alerts)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a StudyMate window is already open, focus it and navigate
      for (const client of windowClients) {
        if (client.url && client.url.startsWith(self.location.origin) && 'focus' in client) {
          if (targetUrl !== '/' && client.navigate) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // If no window is currently open, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification dismissed:', event.notification.tag);
});

// 5. Background Reminders State & Checking Engine
let cachedReminders = {
  assignments: [],
  schedules: [],
  sentTags: [],
};

async function checkScheduledReminders() {
  if (!cachedReminders.assignments.length && !cachedReminders.schedules.length) {
    return;
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const tomorrow = new Date(now.getTime() + 86400000);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const sentTagsSet = new Set(cachedReminders.sentTags || []);

  // 1. Check Assignments
  for (const assignment of cachedReminders.assignments) {
    if (assignment.status === 'Completed') continue;

    const tagDueToday = `assign_today_${assignment.id}_${todayStr}`;
    const tagDueTomorrow = `assign_tomorrow_${assignment.id}_${todayStr}`;
    const tagOverdue = `assign_overdue_${assignment.id}_${todayStr}`;

    if (assignment.dueDate === todayStr && !sentTagsSet.has(tagDueToday)) {
      sentTagsSet.add(tagDueToday);
      cachedReminders.sentTags.push(tagDueToday);

      await self.registration.showNotification(`⚠️ Due Today: ${assignment.title}`, {
        body: `Priority: ${assignment.priority || 'Medium'} | Due date is today! Don't forget to submit your work.`,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: tagDueToday,
        vibrate: [200, 100, 200],
        data: { url: '/?tab=study_planner', assignmentId: assignment.id },
      });
    } else if (assignment.dueDate === tomorrowStr && !sentTagsSet.has(tagDueTomorrow)) {
      sentTagsSet.add(tagDueTomorrow);
      cachedReminders.sentTags.push(tagDueTomorrow);

      await self.registration.showNotification(`⏰ Due Tomorrow: ${assignment.title}`, {
        body: `Upcoming assignment "${assignment.title}" is due tomorrow (${assignment.dueDate}).`,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: tagDueTomorrow,
        vibrate: [150, 100, 150],
        data: { url: '/?tab=study_planner', assignmentId: assignment.id },
      });
    } else if (assignment.dueDate < todayStr && !sentTagsSet.has(tagOverdue)) {
      sentTagsSet.add(tagOverdue);
      cachedReminders.sentTags.push(tagOverdue);

      await self.registration.showNotification(`🚨 Overdue Assignment: ${assignment.title}`, {
        body: `This assignment was due on ${assignment.dueDate}. Check your tasks and submit when ready!`,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: tagOverdue,
        vibrate: [250, 150, 250],
        data: { url: '/?tab=study_planner', assignmentId: assignment.id },
      });
    }
  }

  // 2. Check Study Sessions
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const session of cachedReminders.schedules) {
    if (session.isCompleted || session.date !== todayStr) continue;

    if (!session.startTime) continue;
    const [startHour, startMin] = session.startTime.split(':').map(Number);
    const sessionStartTotalMins = startHour * 60 + startMin;
    const minutesUntilStart = sessionStartTotalMins - currentMinutes;

    const tagSessionStart = `session_start_${session.id}_${todayStr}`;
    const tagSessionUpcoming = `session_15m_${session.id}_${todayStr}`;

    if (minutesUntilStart > 0 && minutesUntilStart <= 15 && !sentTagsSet.has(tagSessionUpcoming)) {
      sentTagsSet.add(tagSessionUpcoming);
      cachedReminders.sentTags.push(tagSessionUpcoming);

      await self.registration.showNotification(`📚 Study Session Starting in ${minutesUntilStart}m!`, {
        body: `"${session.title}" starts at ${session.startTime}. Get your notes ready to focus.`,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: tagSessionUpcoming,
        vibrate: [200, 100, 200],
        data: { url: '/?tab=study_planner', sessionId: session.id },
      });
    } else if (minutesUntilStart <= 0 && minutesUntilStart >= -10 && !sentTagsSet.has(tagSessionStart)) {
      sentTagsSet.add(tagSessionStart);
      cachedReminders.sentTags.push(tagSessionStart);

      await self.registration.showNotification(`🔔 Study Session Starting Now!`, {
        body: `"${session.title}" scheduled for ${session.startTime} - ${session.endTime} is starting now!`,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: tagSessionStart,
        vibrate: [300, 150, 300],
        data: { url: '/?tab=study_planner', sessionId: session.id },
      });
    }
  }
}

// Check every 60 seconds while Service Worker is active
setInterval(() => {
  checkScheduledReminders().catch((err) => console.warn('[SW] Reminder loop check error:', err));
}, 60000);

// 6. Periodic Background Sync Event
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'studymate-deadline-check' || event.tag === 'studymate-reminders') {
    console.log('[SW] Periodic background reminder sync triggered:', event.tag);
    event.waitUntil(checkScheduledReminders());
  }
});

// 7. Web Push Event (Native Push Server / External Push)
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'StudyMate Notification', body: event.data ? event.data.text() : 'You have a study update!' };
  }

  const title = data.title || '🔔 StudyMate Alert';
  const options = {
    body: data.body || 'You have an upcoming study reminder or assignment deadline.',
    icon: data.icon || '/favicon.svg',
    badge: data.badge || '/favicon.svg',
    tag: data.tag || `push_${Date.now()}`,
    vibrate: [200, 100, 200],
    data: data.data || { url: '/?tab=notifications' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 8. Message Event: Handle cache controls, reminder sync, and manual triggers
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'SYNC_REMINDERS') {
    cachedReminders = {
      assignments: event.data.assignments || [],
      schedules: event.data.schedules || [],
      sentTags: event.data.sentTags || [],
    };
    checkScheduledReminders().catch((err) => console.warn('[SW] Reminder sync check error:', err));
  }

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, {
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        vibrate: [200, 100, 200],
        ...options,
      })
    );
  }

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(keys.map((k) => caches.delete(k)));
      }).then(() => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ cleared: true });
        }
      })
    );
  }

  if (event.data.type === 'GET_VERSION') {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ version: CACHE_VERSION });
    }
  }
});

