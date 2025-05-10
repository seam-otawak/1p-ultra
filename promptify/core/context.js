/**
 * ContextLoader - Manages context loading with token budgeting
 */
const knowledge = require('./knowledge');

class ContextLoader {
  constructor() {
    this.c = new Map(); // Cache
    this.p = new Map(); // Promises (in-flight requests)
  }

  /**
   * Get context based on query parameters
   * @param {object} q - Query parameters
   * @param {object} o - Options
   * @returns {Promise<object>} Context object
   */
  async getContext(q, o = {}) {
    const {
      d = 2,                   // depth
      l = 1000,                // limit
      b = 2000,                // token budget
      f = false,               // force refresh
      m = [],                  // domains
      v = 1                    // context level
    } = o;
    
    const k = JSON.stringify({ q, o }); // Cache key
    
    // Check cache unless force refresh is true
    if (!f && this.c.has(k)) return this.c.get(k);
    
    // If already loading this context, return the promise
    if (this.p.has(k)) return this.p.get(k);
    
    // Function to fetch and process context
    const h = async () => {
      // Build tag query
      const a = m.length ? m.map(d => `domain:${d}`) : [];
      const g = `level:${v}`;
      const t = [...(q.tags || []), ...a, g];
      
      // Search for facts
      const i = knowledge.searchByTags(t, q.operator || 'AND');
      
      // Expand relationships if requested
      let e = [...i];
      if (q.expand) {
        for (const d of i) {
          e.push(...knowledge.expand(d, q.relationTypes, d));
        }
        e = [...new Set(e)]; // Deduplicate
      }
      
      // Sort by priority
      e.sort((a, b) => {
        const A = knowledge.a.get(a) || '';
        const B = knowledge.a.get(b) || '';
        const pA = (A.match(/priority:(\\d+)/) || [0, 0])[1];
        const pB = (B.match(/priority:(\\d+)/) || [0, 0])[1];
        return pB - pA;
      });
      
      // Apply token budget and limit
      let s = [];
      let u = 0;
      for (const i of e) {
        const c = knowledge.a.get(i);
        if (!c) continue;
        
        const n = c.split(/\\s+/).length * 0.75; // Estimate tokens
        if (u + n <= b) {
          s.push(i);
          u += n;
        } else break;
      }
      
      // Apply limit
      s = s.slice(0, l);
      
      // Build result
      const r = {
        c: knowledge.getContent(s), // content
        f: s,                       // fact ids
        t: u,                       // token count
        q,                          // query
        ts: Date.now()              // timestamp
      };
      
      // Cache result
      this.c.set(k, r);
      this.p.delete(k);
      
      return r;
    };
    
    // Store promise in flight map
    this.p.set(k, h());
    
    return h();
  }

  /**
   * Get context for all three levels (L1, L2, L3)
   * @param {object} q - Query parameters
   * @param {string} a - Agent type (helper, domain, strategy)
   * @returns {Promise<object>} Multi-level context
   */
  async getMultiLevelContext(q, a = 'helper') {
    // Token budgets by agent type and level
    const b = {
      helper: { L1: 500, L2: 1000, L3: 500 },
      domain: { L1: 800, L2: 3000, L3: 3000 },
      strategy: { L1: 1500, L2: 7000, L3: 9000 }
    };
    
    const g = b[a] || b.helper;
    
    // Load all context levels in parallel
    const [c1, c2, c3] = await Promise.all([
      this.getContext(q, { contextLevel: 1, tokenBudget: g.L1 }),
      this.getContext(q, { contextLevel: 2, tokenBudget: g.L2 }),
      this.getContext(q, { contextLevel: 3, tokenBudget: g.L3 })
    ]);
    
    return {
      L1: c1,
      L2: c2, 
      L3: c3,
      combinedContent: [...c1.c, ...c2.c, ...c3.c],
      totalTokens: c1.t + c2.t + c3.t
    };
  }

  /**
   * Clear context cache
   * @param {function} f - Filter function (null = clear all)
   */
  clearCache(f = null) {
    if (!f) {
      this.c.clear();
      return;
    }
    
    for (const [k, c] of this.c.entries()) {
      if (f(c)) this.c.delete(k);
    }
  }
}

// Create singleton instance
const context = new ContextLoader();

module.exports = context; 