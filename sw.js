/* ============================================================
   JAC Seguros CRM — trabajador de servicio (service worker)
   ------------------------------------------------------------
   PARA QUE SIRVE

   Solo para dos cosas, y a proposito ninguna mas:

   1. Que el CRM se pueda INSTALAR en el telefono (pantalla de
      inicio). En el iPhone eso no es un adorno: es el unico modo
      en que Apple permite que una pagina web mande
      notificaciones. En una pestana normal de Safari, el permiso
      ni siquiera se puede pedir.

   2. Mostrar las notificaciones. En iOS el aviso NO se puede
      crear con new Notification(): tiene que salir de aqui, con
      registration.showNotification().

   LO QUE NO HACE, Y POR QUE

   NO guarda copias de las paginas (cache). Un CRM que muestra
   una version guardada en vez de la de verdad es peor que uno
   lento: ensena datos viejos sin avisar. Todas las peticiones
   pasan derecho a la red.
   ============================================================ */

var VERSION = 'jac-sw-2026-08-24';

self.addEventListener('install', function (e) {
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (llaves) {
      /* por si alguna version anterior dejo copias guardadas */
      return Promise.all(llaves.map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Nada de cache: siempre a la red. */
self.addEventListener('fetch', function (e) { /* se deja pasar */ });

/* Aviso enviado desde la pagina */
self.addEventListener('message', function (e) {
  var d = e.data || {};
  if (d.tipo !== 'aviso') return;
  var titulo = d.titulo || 'JAC Seguros';
  var opciones = {
    body: d.cuerpo || '',
    tag: d.etiqueta || 'jac',
    renotify: false,
    data: { url: d.url || './index.html' }
  };
  e.waitUntil(self.registration.showNotification(titulo, opciones));
});

/* Aviso empujado desde el servidor, si algun dia se usa */
self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { cuerpo: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.titulo || 'JAC Seguros', {
    body: d.cuerpo || '',
    data: { url: d.url || './index.html' }
  }));
});

/* Al tocar el aviso: traer al frente la ventana que ya este abierta */
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var destino = (e.notification.data && e.notification.data.url) || './index.html';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (lista) {
      for (var i = 0; i < lista.length; i++) {
        if ('focus' in lista[i]) return lista[i].focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(destino);
    })
  );
});
