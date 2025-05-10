/**
 * Helper Agent - Junior level agent for specialized tasks
 */
const Agent = require('../core/agent');
const events = require('../core/events');

class HelperAgent extends Agent {
  /**
   * Create a new helper agent
   * @param {object} c - Configuration object
   */
  constructor(c) {
    super({ ...c, type: 'helper' });
    this.specialization = c.specialization || 'general';
    this.tokenBudget = c.tokenBudget || 2000;
  }

  /**
   * Execute a task
   * @param {object} t - Task to execute
   * @returns {Promise<object>} Task result
   */
  async executeTask(t) {
    if (!this.currentContext) {
      throw new Error('Context not loaded');
    }
    
    // Check token budget
    if (this.currentContext.totalTokens > this.tokenBudget) {
      events.publish({
        type: 'warning',
        message: `Token budget exceeded: ${this.currentContext.totalTokens}/${this.tokenBudget}`,
        agentId: this.id,
        taskId: t.id
      });
    }
    
    // Extract facts based on task complexity
    const f = this.extractRelevantFacts(t);
    
    // Execute based on specialization
    let r;
    switch (this.specialization) {
      case 'code':
        r = await this.executeCodeTask(t, f);
        break;
      case 'ui':
        r = await this.executeUITask(t, f);
        break;
      case 'doc':
        r = await this.executeDocTask(t, f);
        break;
      default:
        r = await this.executeGeneralTask(t, f);
    }
    
    // Clear context after execution
    this.clearContext();
    
    return r;
  }

  /**
   * Extract relevant facts based on task complexity
   * @param {object} t - Task object
   * @returns {array} Relevant facts
   */
  extractRelevantFacts(t) {
    const f = [...this.currentContext.L1.c];
    
    // Add L2 content for medium+ complexity
    if (t.complexity > 0.3) {
      f.push(...this.currentContext.L2.c);
    }
    
    // Add L3 content for high complexity
    if (t.complexity > 0.7) {
      f.push(...this.currentContext.L3.c);
    }
    
    return f;
  }

  /**
   * Execute code-specific task
   * @param {object} t - Task object
   * @param {array} f - Relevant facts
   * @returns {Promise<object>} Task result
   */
  async executeCodeTask(t, f) {
    return {
      type: 'code',
      content: `// Code implementation for: ${t.input}`,
      taskId: t.id
    };
  }

  /**
   * Execute UI-specific task
   * @param {object} t - Task object
   * @param {array} f - Relevant facts
   * @returns {Promise<object>} Task result
   */
  async executeUITask(t, f) {
    return {
      type: 'ui',
      content: `<!-- UI implementation for: ${t.input} -->`,
      taskId: t.id
    };
  }

  /**
   * Execute documentation task
   * @param {object} t - Task object
   * @param {array} f - Relevant facts
   * @returns {Promise<object>} Task result
   */
  async executeDocTask(t, f) {
    return {
      type: 'doc',
      content: `# Documentation for: ${t.input}`,
      taskId: t.id
    };
  }

  /**
   * Execute general task
   * @param {object} t - Task object
   * @param {array} f - Relevant facts
   * @returns {Promise<object>} Task result
   */
  async executeGeneralTask(t, f) {
    return {
      type: 'general',
      content: `General implementation for: ${t.input}`,
      taskId: t.id
    };
  }
}

module.exports = HelperAgent; 