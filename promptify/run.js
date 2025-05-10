/**
 * Command line runner for Promptify Ultra
 */
const promptify = require('./index');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Run the command prompt
 */
async function run() {
  // Initialize the framework
  await promptify.initialize();
  
  // Prompt for input
  rl.question('Enter task (or "exit" to quit): ', async (i) => {
    // Exit condition
    if (i.toLowerCase() === 'exit') {
      rl.close();
      promptify.shutdown();
      return;
    }
    
    try {
      console.log('Processing...');
      
      // Submit task
      const r = await promptify.submitTask({
        input: i,
        complexity: 0.5
      });
      
      // Output result
      console.log('Result:', r);
    } catch (e) {
      console.error('Error:', e.message);
    }
    
    // Continue with next prompt
    run();
  });
}

// Start the command prompt
run();

// Handle Ctrl+C
process.on('SIGINT', () => {
  rl.close();
  promptify.shutdown();
  process.exit(0);
}); 