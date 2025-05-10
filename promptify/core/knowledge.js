/**
 * KnowledgeMesh - Graph-based knowledge representation system
 */
class KnowledgeMesh {
  constructor() {
    this.a = new Map(); // Atomic facts (id -> content)
    this.r = new Map(); // Relations (source -> type -> targets)
    this.t = new Map(); // Tags (tag -> set of ids)
  }

  /**
   * Add a fact to the knowledge mesh
   * @param {string} i - Unique ID for the fact
   * @param {string} c - Content of the fact
   * @param {array} g - Array of tags
   * @returns {boolean} Success
   */
  addFact(i, c, g) {
    if (this.a.has(i)) return false;
    
    this.a.set(i, c);
    
    for (const t of g) {
      if (!this.t.has(t)) this.t.set(t, new Set());
      this.t.get(t).add(i);
    }
    
    this.r.set(i, new Map());
    return true;
  }

  /**
   * Create a relationship between two facts
   * @param {string} s - Source fact ID
   * @param {string} t - Target fact ID
   * @param {string} y - Relationship type
   * @returns {boolean} Success
   */
  relate(s, t, y) {
    if (!this.a.has(s) || !this.a.has(t)) return false;
    
    if (!this.r.get(s).has(y)) this.r.get(s).set(y, new Set());
    this.r.get(s).get(y).add(t);
    
    return true;
  }

  /**
   * Search facts by tags
   * @param {array} g - Array of tags to search for
   * @param {string} o - Operator ('AND' or 'OR')
   * @returns {array} Matching fact IDs
   */
  searchByTags(g, o = 'AND') {
    if (g.length === 0) return [];
    
    let s = g.map(t => this.t.get(t) || new Set());
    
    if (s.some(e => !e.size) && o === 'AND') return [];
    
    let r;
    if (o === 'AND') {
      r = [...s.reduce((a, e) => new Set([...a].filter(i => e.has(i))))];
    } else {
      r = [...new Set(s.flatMap(e => [...e]))];
    }
    
    return r;
  }

  /**
   * Expand a node by following relationships
   * @param {string} i - Fact ID to expand from
   * @param {array} y - Relationship types to follow (empty = all)
   * @param {number} d - Depth of traversal
   * @returns {array} Connected fact IDs
   */
  expand(i, y = [], d = 1) {
    if (!this.a.has(i) || d <= 0) return [];
    
    const r = [i];
    const s = y.length ? y : [...this.r.get(i).keys()];
    
    for (const t of s) {
      const l = this.r.get(i).get(t) || new Set();
      for (const j of l) {
        r.push(j);
        if (d > 1) {
          r.push(...this.expand(j, y, d - 1));
        }
      }
    }
    
    return [...new Set(r)];
  }

  /**
   * Get content of facts by IDs
   * @param {array} i - Array of fact IDs
   * @returns {array} Fact contents
   */
  getContent(i) {
    return i.map(j => this.a.get(j)).filter(Boolean);
  }

  /**
   * Estimate token count for a set of facts
   * @param {array} i - Array of fact IDs
   * @returns {number} Estimated token count
   */
  countTokens(i) {
    return this.getContent(i).reduce((s, c) => s + (c.split(/\\s+/).length * 0.75), 0);
  }

  /**
   * Load from schema files
   * @param {string} d - Directory path
   * @returns {Promise} Loading operation
   */
  async loadFromSchemas(d = '.cursor/promptify/schemas') {
    const fs = require('fs');
    const path = require('path');
    const dir = path.join(process.cwd(), d);
    
    try {
      // Load patterns
      const patternFile = path.join(dir, 'patterns.json');
      if (fs.existsSync(patternFile)) {
        const patterns = JSON.parse(fs.readFileSync(patternFile, 'utf8'));
        for (const p of patterns) {
          this.addFact(p.id, p.content, p.tags);
        }
      }
      
      // Load domains
      const domainFile = path.join(dir, 'domains.json');
      if (fs.existsSync(domainFile)) {
        const domains = JSON.parse(fs.readFileSync(domainFile, 'utf8'));
        for (const d of domains) {
          this.addFact(d.id, d.content, d.tags);
        }
      }
      
      // Load agents
      const agentFile = path.join(dir, 'agents.json');
      if (fs.existsSync(agentFile)) {
        const agents = JSON.parse(fs.readFileSync(agentFile, 'utf8'));
        for (const a of agents) {
          this.addFact(a.id, a.content, a.tags);
        }
      }
      
      // Add relationships
      [patternFile, domainFile, agentFile].forEach(file => {
        if (fs.existsSync(file)) {
          const items = JSON.parse(fs.readFileSync(file, 'utf8'));
          for (const item of items) {
            if (item.relations) {
              for (const rel of item.relations) {
                this.relate(item.id, rel.target, rel.type);
              }
            }
          }
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error loading schemas:', error);
      return false;
    }
  }
}

// Create singleton instance
const knowledge = new KnowledgeMesh();

module.exports = knowledge; 