/**
 * EventHub - Core event system for agent communication
 */
class EventHub {
  constructor() {
    this.s = new Map(); // Subscribers
    this.h = []; // History
  }

  /**
   * Subscribe to an event type
   * @param {string} t - Event type
   * @param {function} c - Callback function
   * @param {function} f - Filter function (optional)
   * @returns {function} Unsubscribe function
   */
  subscribe(t, c, f = null) {
    if (!this.s.has(t)) this.s.set(t, []);
    this.s.get(t).push({ c, f });
    return () => this.unsubscribe(t, c);
  }

  /**
   * Unsubscribe from an event type
   * @param {string} t - Event type
   * @param {function} c - Callback to remove
   * @returns {boolean} Success
   */
  unsubscribe(t, c) {
    if (!this.s.has(t)) return false;
    const r = this.s.get(t), i = r.findIndex(s => s.c === c);
    if (i !== -1) {
      r.splice(i, 1);
      return true;
    }
    return false;
  }

  /**
   * Publish an event
   * @param {object} e - Event object with type property
   */
  publish(e) {
    const a = {
      ...e,
      ts: Date.now(),
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.h.unshift(a);
    if (this.h.length > 100) this.h.pop();
    
    if (!this.s.has(e.type)) return;
    
    for (const { c, f } of this.s.get(e.type)) {
      if (!f || f(a)) {
        setTimeout(() => c(a), 0);
      }
    }
  }

  /**
   * Get event history
   * @param {function} f - Filter function (optional)
   * @param {number} l - Limit (default: 10)
   * @returns {array} Event history
   */
  getHistory(f = null, l = 10) {
    return f ? this.h.filter(f).slice(0, l) : this.h.slice(0, l);
  }
}

// Create singleton instance
const events = new EventHub();

module.exports = events; 