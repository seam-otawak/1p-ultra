/**
 * Utility functions for the Promptify framework
 */
const fs = require('fs');
const path = require('path');
const minify = require('./minify');
const patterns = require('./patterns');

/**
 * Timestamp Engine - For file metadata management
 */
class TimestampEngine {
  constructor() {
    this.f = "YYYY-MM-DDTHH:mm:ssZ";
    this.r = /^(Created|Modified):\s\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
  }

  /**
   * Get current timestamp in ISO format
   * @returns {string} ISO timestamp
   */
  g() {
    return new Date().toISOString().replace(/\.\d{3}/, "");
  }

  /**
   * Update timestamps in a file
   * @param {string} p - File path
   * @param {boolean} x - Whether to add created timestamp if missing
   * @returns {boolean} Success
   */
  u(p, x = 1) {
    let c = fs.readFileSync(p, "utf8"),
        m = c.match(/^---\n([\s\S]*?)\n---/m),
        n = m ? m[1] : "",
        o = this.g();
    
    if (x && !n.includes("created:")) {
      n = n ? n + "\ncreated: " + o : "created: " + o;
    }
    
    n = n.replace(/updated:.*$/m, "updated: " + o);
    
    fs.writeFileSync(
      p,
      c.replace(/^---\n[\s\S]*?\n---/m, `---\n${n}\n---`)
    );
    
    return true;
  }
}

// Create timestamp engine instance
const timestamp = new TimestampEngine();

/**
 * Utilities for content processing
 */
const utils = {
  /**
   * Minify content using various techniques
   * @param {string} content - Content to minify
   * @param {string} type - Content type (js, md, etc.)
   * @param {object} options - Minification options
   * @returns {string} Minified content
   */
  minifyContent(content, type = '', options = {}) {
    const {
      removeArticles = true,
      removeFillers = true,
      usePatterns = true
    } = options;
    
    // Apply minification steps in sequence
    let result = content;
    
    // Apply source minification
    result = minify.s(result, type);
    
    // Remove articles and determiners
    if (removeArticles) {
      result = minify.a(result);
    }
    
    // Remove filler text
    if (removeFillers) {
      result = minify.t(result);
    }
    
    // Apply pattern encoding
    if (usePatterns) {
      result = patterns.encode(result);
    }
    
    return result;
  },
  
  /**
   * Expand minified content
   * @param {string} content - Minified content
   * @param {object} options - Expansion options
   * @returns {string} Expanded content
   */
  expandContent(content, options = {}) {
    const {
      expandPatterns = true
    } = options;
    
    let result = content;
    
    // Expand pattern references
    if (expandPatterns) {
      result = patterns.expand(result);
    }
    
    return result;
  },
  
  /**
   * Estimate token count for content
   * @param {string} content - Content to estimate
   * @returns {number} Estimated token count
   */
  estimateTokens(content) {
    // Simple estimation: ~4 chars per token on average
    return Math.ceil(content.length / 4);
  },
  
  /**
   * Generate unique ID
   * @param {string} prefix - ID prefix
   * @returns {string} Unique ID
   */
  generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },
  
  /**
   * Update file timestamps
   * @param {string} filePath - Path to the file
   * @param {boolean} addCreated - Whether to add created timestamp if missing
   * @returns {boolean} Success
   */
  updateTimestamps(filePath, addCreated = true) {
    return timestamp.u(filePath, addCreated);
  },
  
  /**
   * Get current timestamp
   * @returns {string} ISO timestamp
   */
  getTimestamp() {
    return timestamp.g();
  }
};

module.exports = {
  ...utils,
  timestamp
}; 