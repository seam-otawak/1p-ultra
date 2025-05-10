/**
 * Domain Coordinator - Mid-level agent for domain-specific tasks
 */
const Agent = require('../core/agent');
const HelperAgent = require('./helper');
const events = require('../core/events');

class DomainCoordinator extends Agent {
  /**
   * Create a new domain coordinator
   * @param {object} c - Configuration object
   */
  constructor(c) {
    super({ ...c, type: 'domain' });
    this.domain = c.domain;
    this.helperAgents = new Map();
    this.tokenBudget = c.tokenBudget || 6800;
    
    this.initializeHelpers(c.helpers || []);
  }

  /**
   * Initialize helper agents
   * @param {array} h - Helper agent configurations
   */
  initializeHelpers(h) {
    h.forEach(c => {
      const a = new HelperAgent({
        ...c,
        domains: [this.domain]
      });
      
      this.helperAgents.set(a.id, a);
    });
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
    
    // Analyze task for decomposition
    const { requiresDecomposition, subtasks } = this.analyzeTask(t);
    
    // Process task based on complexity
    return requiresDecomposition
      ? await this.processSubtasks(t, subtasks)
      : await this.executeSingleTask(t);
  }

  /**
   * Analyze task to determine if decomposition is needed
   * @param {object} t - Task to analyze
   * @returns {object} Analysis result
   */
  analyzeTask(t) {
    const c = t.complexity || 0.5;
    const r = c > 0.4; // Decompose if complexity > 0.4
    
    if (!r) return { requiresDecomposition: false };
    
    // Create subtasks for decomposition
    const s = [
      {
        id: `${t.id}_sub1`,
        parentId: t.id,
        type: 'analysis',
        input: t.input,
        complexity: c * 0.7
      },
      {
        id: `${t.id}_sub2`,
        parentId: t.id,
        type: 'execution',
        input: t.input,
        complexity: c * 0.8
      }
    ];
    
    return { requiresDecomposition: true, subtasks: s };
  }

  /**
   * Process subtasks in parallel
   * @param {object} p - Parent task
   * @param {array} s - Subtasks
   * @returns {Promise<object>} Combined result
   */
  async processSubtasks(p, s) {
    const r = s.map(t => {
      return new Promise((r, j) => {
        const h = this.findSuitableHelper(t);
        
        if (!h) {
          j(new Error(`No suitable helper found for task: ${t.id}`));
          return;
        }
        
        // Subscribe to task completion
        const u = events.subscribe(
          'task:completed',
          e => {
            if (e.taskId === t.id) {
              u();
              r(e.result);
            }
          },
          e => e.taskId === t.id
        );
        
        // Subscribe to task failure
        const f = events.subscribe(
          'task:failed',
          e => {
            if (e.taskId === t.id) {
              f();
              j(new Error(e.error));
            }
          },
          e => e.taskId === t.id
        );
        
        // Assign task to helper
        events.publish({
          type: 'task:assign',
          task: t,
          assignedTo: h.id
        });
      });
    });
    
    // Wait for all subtasks to complete
    const rs = await Promise.all(r);
    
    // Combine results
    return this.combineSubtaskResults(p, rs);
  }

  /**
   * Find a suitable helper for a task
   * @param {object} t - Task to find helper for
   * @returns {object|null} Suitable helper agent
   */
  findSuitableHelper(t) {
    for (const [_, h] of this.helperAgents) {
      if (h.canHandleTask(t)) return h;
    }
    return null;
  }

  /**
   * Execute a single task without decomposition
   * @param {object} t - Task to execute
   * @returns {Promise<object>} Task result
   */
  async executeSingleTask(t) {
    // Extract domain-specific knowledge
    const d = this.extractDomainKnowledge();
    
    return {
      type: 'domain_result',
      domain: this.domain,
      content: `Processed in ${this.domain} domain: ${t.input}`,
      taskId: t.id
    };
  }

  /**
   * Extract domain-specific knowledge from context
   * @returns {object} Domain knowledge
   */
  extractDomainKnowledge() {
    return {
      domain: this.domain,
      patterns: this.currentContext.L1.c.filter(c => c.includes(`domain:${this.domain}`)),
      rules: this.currentContext.L2.c.filter(c => c.includes(`domain:${this.domain}`))
    };
  }

  /**
   * Combine results from subtasks
   * @param {object} p - Parent task
   * @param {array} r - Subtask results
   * @returns {object} Combined result
   */
  combineSubtaskResults(p, r) {
    return {
      type: 'combined_result',
      domain: this.domain,
      content: r.map(r => r.content).join('\n'),
      subResults: r,
      taskId: p.id
    };
  }

  /**
   * Shut down this coordinator and its helpers
   */
  shutdown() {
    super.shutdown();
    
    // Shut down all helper agents
    for (const [_, h] of this.helperAgents) {
      h.shutdown();
    }
    
    this.helperAgents.clear();
  }
}

module.exports = DomainCoordinator; 