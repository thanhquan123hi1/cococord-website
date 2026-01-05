/**
 * CoCoCord Admin - Realtime Presence
 *
 * Real presence layer using WebSocket (/topic/presence) and REST API (/api/presence/users).
 * Falls back to offline for all users if WebSocket is unavailable.
 */

var AdminPresence = window.AdminPresence || (function () {
  'use strict';

  const onlineUsers = new Set();
  const onlineSince = new Map();
  const knownUsers = new Map(); // id -> user snapshot (optional)
  const listeners = new Set();

  let wsConnected = false;
  let wsSubscription = null;

  function emit(event) {
    listeners.forEach((cb) => {
      try {
        cb(event);
      } catch (e) {
        console.error('[AdminPresence] listener error', e);
      }
    });
  }

  function normalizeId(id) {
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  }

  function isOnlineStatus(status) {
    const s = String(status || '').toUpperCase();
    return s && s !== 'OFFLINE' && s !== 'INVISIBLE';
  }

  function setOnline(userId, userSnapshot) {
    const id = normalizeId(userId);
    if (id == null) return;

    if (userSnapshot) {
      knownUsers.set(id, userSnapshot);
    }

    if (!onlineUsers.has(id)) {
      onlineUsers.add(id);
      if (!onlineSince.has(id)) onlineSince.set(id, Date.now());
      emit({ type: 'presence', userId: id, status: 'online' });
    }
  }

  function setOffline(userId) {
    const id = normalizeId(userId);
    if (id == null) return;

    if (onlineUsers.has(id)) {
      onlineUsers.delete(id);
      emit({ type: 'presence', userId: id, status: 'offline' });
    }
  }

  function forceDisconnect(userId) {
    setOffline(userId);
    emit({ type: 'disconnect', userId: normalizeId(userId) });
  }

  function isOnline(userId) {
    const id = normalizeId(userId);
    if (id == null) return false;
    return onlineUsers.has(id);
  }

  function getOnlineUsers() {
    return Array.from(onlineUsers.values());
  }

  function getOnlineSince(userId) {
    const id = normalizeId(userId);
    if (id == null) return null;
    return onlineSince.get(id) || null;
  }

  function getKnownUser(userId) {
    const id = normalizeId(userId);
    if (id == null) return null;
    return knownUsers.get(id) || null;
  }

  /**
   * Seed user snapshots and fetch real presence from backend.
   */
  async function seedUsers(users) {
    if (!Array.isArray(users)) return;

    // Track user snapshots for Active Now modal rendering
    users.forEach((u) => {
      if (u && u.id != null) knownUsers.set(Number(u.id), u);
    });

    // Ensure banned users are always offline
    users.forEach((u) => {
      if (u?.isBanned) {
        setOffline(u.id);
      }
    });

    // Fetch real presence snapshot from backend
    const ids = users.filter((u) => u && u.id != null && !u.isBanned).map((u) => u.id);
    if (ids.length > 0) {
      await hydratePresence(ids);
    }
  }

  /**
   * Fetch presence snapshot from REST API and apply to store.
   */
  async function hydratePresence(userIds) {
    if (!userIds || userIds.length === 0) return;

    try {
      const params = new URLSearchParams();
      userIds.forEach((id) => params.append('ids', String(id)));

      const token = localStorage.getItem('accessToken') || '';
      const resp = await fetch(`/api/presence/users?${params.toString()}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!resp.ok) {
        console.warn('[AdminPresence] Failed to fetch presence:', resp.status);
        return;
      }

      const statusMap = await resp.json();
      if (!statusMap) return;

      // Apply status from backend
      Object.keys(statusMap).forEach((userId) => {
        const status = statusMap[userId];
        if (isOnlineStatus(status)) {
          setOnline(Number(userId), knownUsers.get(Number(userId)));
        } else {
          setOffline(Number(userId));
        }
      });

      // Mark users not in response as offline
      userIds.forEach((id) => {
        const key = String(id);
        if (!(key in statusMap)) {
          setOffline(id);
        }
      });

      console.log('[AdminPresence] Hydrated presence for', Object.keys(statusMap).length, 'users');
    } catch (e) {
      console.error('[AdminPresence] Error fetching presence:', e);
    }
  }

  /**
   * Connect to WebSocket for real-time presence updates.
   */
  async function connectWebSocket() {
    if (wsConnected) return true;

    // Use global CoCoCordRealtime if available (already connected from app.js)
    if (window.CoCoCordRealtime && typeof window.CoCoCordRealtime.subscribe === 'function') {
      try {
        wsSubscription = await window.CoCoCordRealtime.subscribe('/topic/presence', (msg) => {
          handlePresenceMessage(msg.body);
        });
        wsConnected = true;
        console.log('[AdminPresence] Connected via CoCoCordRealtime');
        return true;
      } catch (e) {
        console.warn('[AdminPresence] CoCoCordRealtime subscribe failed:', e);
      }
    }

    // Fallback: connect directly via SockJS/STOMP
    if (window.SockJS && window.Stomp) {
      const token = localStorage.getItem('accessToken');
      if (!token) return false;

      return new Promise((resolve) => {
        try {
          const socket = new SockJS('/ws');
          const stomp = Stomp.over(socket);
          stomp.debug = null;

          stomp.connect(
            { Authorization: 'Bearer ' + token },
            () => {
              wsSubscription = stomp.subscribe('/topic/presence', (msg) => {
                handlePresenceMessage(msg.body);
              });
              wsConnected = true;
              console.log('[AdminPresence] Connected via direct STOMP');
              resolve(true);
            },
            (err) => {
              console.warn('[AdminPresence] STOMP connect failed:', err);
              resolve(false);
            }
          );
        } catch (e) {
          console.warn('[AdminPresence] WebSocket init error:', e);
          resolve(false);
        }
      });
    }

    console.warn('[AdminPresence] No WebSocket library available');
    return false;
  }

  function handlePresenceMessage(body) {
    let data;
    try {
      data = JSON.parse(body);
    } catch (_) {
      return;
    }
    if (!data) return;

    // Handle WebSocketEvent format: { type: 'user.status.changed', payload: { userId, newStatus } }
    if (data.type && data.payload) {
      if (data.type !== 'user.status.changed') return;
      const p = data.payload || {};
      const userId = normalizeId(p.userId);
      const status = p.newStatus || p.status;
      if (userId != null && status) {
        applyPresenceChange(userId, status);
      }
      return;
    }

    // Handle direct format: { userId, newStatus/status }
    const userId = normalizeId(data.userId);
    const status = data.newStatus || data.status;
    if (userId != null && status) {
      applyPresenceChange(userId, status);
    }
  }

  function applyPresenceChange(userId, status) {
    if (isOnlineStatus(status)) {
      setOnline(userId, knownUsers.get(userId));
    } else {
      setOffline(userId);
    }
  }

  function subscribe(cb) {
    if (typeof cb !== 'function') return () => {};
    listeners.add(cb);
    return () => listeners.delete(cb);
  }

  /**
   * Initialize realtime presence (call after seedUsers).
   */
  async function startRealtime() {
    await connectWebSocket();
  }

  // Deprecated mock methods (no-op for backward compatibility)
  function startMockRealtime() {
    console.warn('[AdminPresence] Mock realtime is disabled. Using real WebSocket.');
  }
  function stopMockRealtime() {}

  function countOnline() {
    return onlineUsers.size;
  }

  return {
    seedUsers,
    subscribe,
    startRealtime,
    startMockRealtime,
    stopMockRealtime,
    hydratePresence,
    connectWebSocket,

    setOnline,
    setOffline,
    forceDisconnect,

    isOnline,
    getOnlineUsers,
    getOnlineSince,
    getKnownUser,
    countOnline,
  };
})();
