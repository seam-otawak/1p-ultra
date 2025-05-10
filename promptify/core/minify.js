/**
 * Enhanced Minification Engine - For token optimization
 */
const M = {
  /**
   * Exclusion settings
   */
  x: {
    meta: true,        // Keep metadata sections
    header: true,      // Keep doc headers
    thirdParty: true,  // Preserve third-party code blocks
    regex: true,       // Preserve regex patterns
    schema: true,      // Preserve schema definitions
    config: true,      // Preserve config blocks
    docTags: ["@preserve", "@nomin"] // Tags to preserve
  },
  
  /**
   * Minify source code
   * @param {string} c - Content to minify
   * @param {string} type - Content type (js, py, etc.)
   * @returns {string} Minified content
   */
  s: (c, type = "") => {
    // Extract and preserve metadata
    let meta = "", rest = c;
    if (M.x.meta) {
      const m = c.match(/^(---\n[\s\S]*?\n---)/m);
      if (m) {
        meta = m[1];
        rest = c.substring(meta.length);
      }
    }
    
    // Extract and preserve header
    let header = "", body = rest;
    if (M.x.header) {
      const p = {
        js: /^\/\*\*[\s\S]*?\*\//,
        py: /^("""|''')[\s\S]*?\1/,
        mdc: /^#\s[^\n]+\n/,
        default: /^(\/\*[\s\S]*?\*\/|\/\/[^\n]*\n|#[^\n]*\n)+/
      };
      
      const h = p[type] || p.default;
      const m = body.match(h);
      if (m) {
        header = m[0];
        body = body.substring(header.length);
      }
    }
    
    // Preserve third-party code blocks
    if (M.x.thirdParty) {
      body = body.replace(
        /\/\/ THIRD-PARTY API START[\s\S]*?\/\/ THIRD-PARTY API END/g,
        m => `/*TPX*/${Buffer.from(m).toString('base64')}/*TPX*/`
      );
    }
    
    // Preserve regex patterns
    if (M.x.regex) {
      body = body.replace(
        /\/([^\/\n]*(?:\\.[^\/\n]*)*)\/[gimuy]*/g,
        m => `/*RGX*/${Buffer.from(m).toString('base64')}/*RGX*/`
      );
    }
    
    // Perform minification
    body = body
      // Remove comments
      .replace(/\/\*(?!TPX|RGX)[\s\S]*?\*\/|\/\/.*$/gm, "")
      // Transform headings to §-notation
      .replace(/#{1,6}\s+/gm, m => `#§${m.trim().length-1} `)
      // Collapse whitespace
      .replace(/[ \t]+/g, " ")
      // Reduce consecutive line breaks
      .replace(/\n{3,}/g, "\n\n")
      // Trim whitespace
      .trim();
    
    // Restore preserved sections
    body = body
      .replace(/\/\*TPX\*\/(.*?)\/\*TPX\*\//g, (_, b) => Buffer.from(b, 'base64').toString())
      .replace(/\/\*RGX\*\/(.*?)\/\*RGX\*\//g, (_, b) => Buffer.from(b, 'base64').toString());
    
    return meta + header + body;
  },
  
  /**
   * Minify articles and determiners
   * @param {string} c - Content to minify
   * @returns {string} Minified content
   */
  a: (c) => c
    // Remove articles
    .replace(/\b(a|an|the)\b\s*/gi, "")
    // Remove forms of "to be"
    .replace(/\s*\b(is|are|was|were|will be|has been|have been|should be|could be|would be)\b\s*/gi, " ")
    // Remove intensifiers
    .replace(/\b(very|really|quite|extremely|actually|basically|essentially|virtually)\b\s*/gi, "")
    // Normalize whitespace
    .replace(/\s{2,}/g, " "),
  
  /**
   * Minify text by removing filler phrases
   * @param {string} c - Content to minify
   * @returns {string} Minified content
   */
  t: (c) => c
    // Remove hedge phrases
    .replace(/(?:^|\s+)I think|(?:^|\s+)I believe|(?:^|\s+)In my opinion|(?:^|\s+)It seems|In general|Generally speaking/gi, "")
    // Remove hedging words
    .replace(/\s*\b(probably|possibly|maybe|perhaps|potentially|seemingly|apparently)\b\s*/gi, "")
    // Simplify complex phrases
    .replace(/\s*\b(in order to|due to the fact that|in spite of the fact that|on the grounds that)\b\s*/gi, " ")
    // Simplify time references
    .replace(/\s*\b(at this point in time|at the present time|at this moment)\b\s*/gi, " now")
};

module.exports = M; 