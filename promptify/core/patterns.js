/**
 * 2PVE Pattern System - Pattern Vector Encoding
 */
const P = {
  /**
   * Registered patterns
   */
  r: {},
  
  /**
   * Domain definitions
   */
  d: {
    G: "governance",
    D: "design",
    T: "technical"
  },
  
  /**
   * Relationship symbols
   */
  s: {
    a: "→", // applies to
    i: "⊢", // implements
    x: "↔", // relates to
    e: "⊨"  // implies
  },
  
  /**
   * Encode pattern references in text
   * @param {string} t - Text to encode
   * @returns {string} Encoded text
   */
  encode(t) {
    return t.replace(/([GDT])(\\d+)([→⊢↔⊨])([GDT])(\\d+)/g, "@$1$2$3$4$5");
  },
  
  /**
   * Decode pattern references in text
   * @param {string} t - Text to decode
   * @returns {string} Decoded text
   */
  decode(t) {
    return t.replace(/@([GDT])(\\d+)([→⊢↔⊨])([GDT])(\\d+)/g, "$1$2$3$4$5");
  },
  
  /**
   * Register a pattern
   * @param {string} i - Pattern ID
   * @param {string} c - Pattern content
   * @param {string} t - Pattern type
   * @returns {object} The pattern registry
   */
  register(i, c, t) {
    this.r[i] = { c, t, u: 0 };
    return this.r;
  },
  
  /**
   * Reference a pattern
   * @param {string} i - Pattern ID
   * @returns {string} Pattern reference
   */
  ref(i) {
    if (!this.r[i]) return "";
    this.r[i].u++;
    return `@${i}`;
  },
  
  /**
   * Expand references in text
   * @param {string} t - Text with references
   * @returns {string} Expanded text
   */
  expand(t) {
    return t.replace(/@([GDT]\\d+)/g, (m, i) => this.r[i] ? this.r[i].c : "");
  },
  
  /**
   * Load patterns from schema
   * @param {string} p - Path to schema file
   * @returns {Promise<boolean>} Success
   */
  async loadFromSchema(p = '.cursor/promptify/schemas/patterns.json') {
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), p);
      
      if (!fs.existsSync(filePath)) return false;
      
      const patterns = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      for (const pattern of patterns) {
        this.register(
          pattern.id,
          pattern.content,
          pattern.tags.find(t => t.startsWith('type:'))?.replace('type:', '') || 'unknown'
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error loading patterns:', error);
      return false;
    }
  }
};

module.exports = P; 