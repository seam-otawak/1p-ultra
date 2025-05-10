/**
 * Initialization script for Promptify Ultra
 */
const fs = require('fs');
const path = require('path');
const promptify = require('./index');

/**
 * Initialize the framework
 */
async function initFramework() {
  console.log('Initializing Promptify Ultra...');
  
  // Create necessary directories
  const d = [
    '.cursor/promptify/schemas',
    '.cursor/promptify/core',
    '.cursor/promptify/agents',
    '.cursor/promptify/domains'
  ];
  
  for (const r of d) {
    const p = path.join(process.cwd(), r);
    if (!fs.existsSync(p)) {
      fs.mkdirSync(p, { recursive: true });
      console.log(`Created directory: ${r}`);
    }
  }
  
  // Check for schema files
  const s = ['patterns.json', 'domains.json', 'agents.json'];
  for (const f of s) {
    const p = path.join(process.cwd(), '.cursor/promptify/schemas', f);
    if (!fs.existsSync(p)) {
      console.warn(`Missing schema file: ${f}`);
    }
  }
  
  // Initialize and test
  try {
    await promptify.initialize();
    console.log('Framework initialized successfully.');
    
    // Run a simple test task
    const r = await promptify.submitTask({
      input: 'Test task',
      complexity: 0.1
    });
    
    console.log('Test task executed successfully.');
  } catch (e) {
    console.error('Initialization failed:', e.message);
  } finally {
    promptify.shutdown();
  }
}

// Run initialization
initFramework(); 