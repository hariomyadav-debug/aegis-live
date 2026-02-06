/**
 * Central place for all Redis keys
 * Use functions to avoid hard-coded strings across the codebase
 */

const REDIS_PREFIX = "live";
const REDIS_PREFIX2 = "audio";

module.exports = {
  // -------- live keys --------
  liveStream: (socketId) => `${REDIS_PREFIX}:stream:${socketId}`,
  hostHeartbeat: (socketId) => `${REDIS_PREFIX}:host:heartbeat:${socketId}`,

  // -------- stream keys --------
  audioStream: (socketId) => `${REDIS_PREFIX2}:stream:${socketId}`,

  //--------- Common keys -------
  hostDisconnectTimer: (socketId) => `${REDIS_PREFIX}:host:disconnect_timer:${socketId}`,



  // -------- Locks --------
  lock: (name) => `lock:${name}`,
};
