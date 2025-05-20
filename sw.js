// MelodyLab Service Worker
const CACHE_NAME = 'melodylab-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/chat.html',
  '/styles.css',
  '/script.js',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/logo.svg',
  '/assets/profile-placeholder.png'
];

// Service Workerのインストール時に静的アセットをキャッシュする
self.addEventListener('install', event => {
  console.log('[Service Worker] インストール中');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] キャッシュを開いています');
        return cache.addAll(ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] すべてのアセットをキャッシュしました');
        return self.skipWaiting();
      })
  );
});

// Service Workerのアクティブ化時に古いキャッシュを削除する
self.addEventListener('activate', event => {
  console.log('[Service Worker] アクティブ化中');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          console.log(`[Service Worker] 古いキャッシュを削除: ${cacheName}`);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('[Service Worker] クライアントの制御を要求');
      return self.clients.claim();
    })
  );
});

// ネットワークリクエストの処理（キャッシュファーストの戦略）
self.addEventListener('fetch', event => {
  // APIリクエストやオンライン操作の場合はキャッシュをバイパス
  if (event.request.url.includes('/api/') || 
      event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // キャッシュにある場合はそれを返す
        if (cachedResponse) {
          return cachedResponse;
        }

        // キャッシュになければネットワークから取得
        return fetch(event.request)
          .then(response => {
            // レスポンスが有効でない場合はそのまま返す
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // レスポンスをクローンしてキャッシュに保存（ストリームは一度だけ使用可能）
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                console.log(`[Service Worker] 新しいリソースをキャッシュ: ${event.request.url}`);
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.log(`[Service Worker] フェッチに失敗: ${error}`);
            
            // HTMLファイルのリクエストの場合はオフラインページを表示
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
            
            return new Response('オフラインです。インターネット接続を確認してください。', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// プッシュ通知の処理
self.addEventListener('push', event => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: 'assets/icon-192.png',
    badge: 'assets/badge.png',
    data: {
      url: data.url || '/'
    },
    actions: [
      {
        action: 'view',
        title: '詳細表示'
      },
      {
        action: 'close',
        title: '閉じる'
      }
    ],
    vibrate: [100, 50, 100],
    timestamp: data.timestamp || Date.now()
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 通知クリック時の処理
self.addEventListener('notificationclick', event => {
  const notification = event.notification;
  const action = event.action;
  const url = notification.data.url;

  notification.close();

  // 「詳細表示」アクションの場合、またはアクションなしでクリックされた場合
  if (action === 'view' || action === '') {
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then(windowClients => {
          // すでに開いているウィンドウがあれば、それをアクティブにして適切なURLにフォーカス
          for (const client of windowClients) {
            if (client.url === url && 'focus' in client) {
              return client.focus();
            }
          }
          // 新しいウィンドウを開く
          return clients.openWindow(url);
        })
    );
  }
});

// バックグラウンド同期処理の実装
self.addEventListener('sync', event => {
  if (event.tag === 'sync-reservations') {
    event.waitUntil(syncReservations());
  } else if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

// 予約データの同期処理（オフライン時に行われた予約を同期）
async function syncReservations() {
  try {
    const db = await openDB();
    const pendingReservations = await db.getAll('pending-reservations');
    
    if (pendingReservations.length === 0) {
      return;
    }
    
    // 各保留中の予約を処理
    for (const reservation of pendingReservations) {
      try {
        const response = await fetch('/api/reservations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(reservation)
        });
        
        if (response.ok) {
          // 成功した場合はDBから削除
          await db.delete('pending-reservations', reservation.id);
          
          // 成功通知を表示
          self.registration.showNotification('予約が同期されました', {
            body: `${reservation.teacherName}との${reservation.dateTime}のレッスン予約が完了しました。`,
            icon: 'assets/icon-192.png'
          });
        }
      } catch (error) {
        console.error('予約の同期に失敗しました:', error);
      }
    }
  } catch (error) {
    console.error('データベースアクセスに失敗しました:', error);
  }
}

// メッセージの同期処理（オフライン時に送信されたメッセージを同期）
async function syncMessages() {
  try {
    const db = await openDB();
    const pendingMessages = await db.getAll('pending-messages');
    
    if (pendingMessages.length === 0) {
      return;
    }
    
    // 各保留中のメッセージを処理
    for (const message of pendingMessages) {
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(message)
        });
        
        if (response.ok) {
          // 成功した場合はDBから削除
          await db.delete('pending-messages', message.id);
        }
      } catch (error) {
        console.error('メッセージの同期に失敗しました:', error);
      }
    }
  } catch (error) {
    console.error('データベースアクセスに失敗しました:', error);
  }
}

// IndexedDBを開く補助関数
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('melodylab-db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      
      // 保留中の予約用ストア
      if (!db.objectStoreNames.contains('pending-reservations')) {
        db.createObjectStore('pending-reservations', { keyPath: 'id' });
      }
      
      // 保留中のメッセージ用ストア
      if (!db.objectStoreNames.contains('pending-messages')) {
        db.createObjectStore('pending-messages', { keyPath: 'id' });
      }
    };
  });
}