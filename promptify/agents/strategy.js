/**
 * Strategy Director - Senior level agent for cross-domain orchestration
 */
const Agent = require('../core/agent');
const DomainCoordinator = require('./domain');
const events = require('../core/events');

class StrategyDirector extends Agent {
  /**
   * Create a new strategy director
   * @param {object} c - Configuration object
   */
  constructor(c) {
    super({ ...c, type: 'strategy' });
    this.domainCoordinators = new Map();
    this.tokenBudget = c.tokenBudget || 17500;
    
    this.initializeDomainCoordinators(c.domains || []);
  }

  /**
   * Initialize domain coordinators
   * @param {array} d - Domain configurations
   */
  initializeDomainCoordinators(d) {
    d.forEach(c => {
      const o = new DomainCoordinator({
        ...c,
        domain: c.name
      });
      
      this.domainCoordinators.set(c.name, o);
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
    
    // Create execution plan
    const p = await this.createExecutionPlan(t);
    
    // Execute plan
    const r = await this.executeTaskPlan(t, p);
    
    // Clear context
    this.clearContext();
    
    return r;
  }

  /**
   * Create an execution plan for a task
   * @param {object} t - Task to plan for
   * @returns {Promise<object>} Execution plan
   */
  async createExecutionPlan(t) {
    // Analyze task requirements
    const { domains, crossDomain, complexity } = this.analyzeTaskRequirements(t);
    
    // Generate execution steps
    return {
      taskId: t.id,
      domains,
      crossDomain,
      complexity,
      steps: this.generateExecutionSteps(t, domains, crossDomain, complexity)
    };
  }

  /**
   * Analyze task requirements
   * @param {object} t - Task to analyze
   * @returns {object} Task requirements
   */
  analyzeTaskRequirements(t) {
    // Determine domains (explicitly specified or detect from input)
    const d = t.domains || (t.domain ? [t.domain] : this.detectDomains(t));
    
    // Get complexity
    const x = t.complexity || 0.5;
    
    // Determine if cross-domain
    const c = d.length > 1;
    
    return { domains: d, crossDomain: c, complexity: x };
  }

  /**
   * Detect domains from task input
   * @param {object} t - Task object
   * @returns {array} Detected domains
   */
  detectDomains(t) {
    const a = [...this.domainCoordinators.keys()];
    
    // Simple keyword-based detection
    if (t.input.includes('UI') || t.input.includes('design')) {
      return ['ui'];
    } else if (t.input.includes('code') || t.input.includes('develop')) {
      return ['dev'];
    } else if (t.input.includes('deploy') || t.input.includes('infrastructure')) {
      return ['ops'];
    }
    
    // Default to all domains if cannot detect
    return a;
  }

  /**
   * Generate execution steps for a task
   * @param {object} t - Task object
   * @param {array} d - Domains
   * @param {boolean} c - Cross-domain flag
   * @param {number} x - Complexity
   * @returns {array} Execution steps
   */
  generateExecutionSteps(t, d, c, x) {
    const s = [];
    
    if (c) {
      // For cross-domain tasks: analyze in each domain, combine insights, then integrate
      d.forEach(d => {
        s.push({
          step: 'analyze',
          domain: d,
          taskId: `${t.id}_analyze_${d}`,
          input: t.input,
          complexity: x * 0.7
        });
      });
      
      s.push({
        step: 'combine_insights',
        taskId: `${t.id}_combine`,
        dependsOn: s.map(s => s.taskId),
        complexity: x * 0.6
      });
      
      s.push({
        step: 'integrate',
        taskId: `${t.id}_integrate`,
        dependsOn: [`${t.id}_combine`],
        complexity: x * 0.9
      });
    } else {
      // For single-domain tasks: direct execution
      s.push({
        step: 'execute',
        domain: d[0],
        taskId: `${t.id}_execute`,
        input: t.input,
        complexity: x
      });
    }
    
    return s;
  }

  /**
   * Execute a task plan
   * @param {object} t - Original task
   * @param {object} p - Execution plan
   * @returns {Promise<object>} Task result
   */
  async executeTaskPlan(t, p) {
    return p.crossDomain
      ? await this.executeCrossDomainPlan(t, p)
      : await this.executeSingleDomainPlan(t, p);
  }

  /**
   * Execute a cross-domain plan
   * @param {object} t - Original task
   * @param {object} p - Execution plan
   * @returns {Promise<object>} Task result
   */
  async executeCrossDomainPlan(t, p) {
    const r = new Map();
    
    // Execute steps in order, respecting dependencies
    for (const s of p.steps) {
      // Check dependencies
      if (s.dependsOn && s.dependsOn.length > 0) {
        const d = s.dependsOn.filter(i => !r.has(i));
        if (d.length > 0) {
          throw new Error(`Dependencies not met for step: ${s.taskId}`);
        }
      }
      
      // Execute step based on type
      let x;
      if (s.step === 'analyze') {
        x = await this.delegateToDomain(s.domain, {
          id: s.taskId,
          input: s.input,
          complexity: s.complexity
        });
      } else if (s.step === 'combine_insights') {
        const a = s.dependsOn.map(i => r.get(i));
        x = this.combineInsights(a);
      } else if (s.step === 'integrate') {
        const i = r.get(s.dependsOn[0]);
        x = this.createIntegratedSolution(t, i);
      }
      
      // Store result
      r.set(s.taskId, x);
    }
    
    // Return final result
    const f = p.steps[p.steps.length - 1].taskId;
    return r.get(f);
  }

  /**
   * Execute a single-domain plan
   * @param {object} t - Original task
   * @param {object} p - Execution plan
   * @returns {Promise<object>} Task result
   */
  async executeSingleDomainPlan(t, p) {
    const s = p.steps[0];
    return await this.delegateToDomain(s.domain, {
      id: s.taskId,
      input: s.input,
      complexity: s.complexity
    });
  }

  /**
   * Delegate a task to a domain coordinator
   * @param {string} n - Domain name
   * @param {object} t - Task to delegate
   * @returns {Promise<object>} Task result
   */
  async delegateToDomain(n, t) {
    return new Promise((r, j) => {
      // Get domain coordinator
      const c = this.domainCoordinators.get(n);
      if (!c) {
        j(new Error(`Domain coordinator not found: ${n}`));
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
      
      // Assign task to domain coordinator
      events.publish({
        type: 'task:assign',
        task: t,
        assignedTo: c.id
      });
    });
  }

  /**
   * Combine insights from multiple domains
   * @param {array} r - Domain results
   * @returns {object} Combined insights
   */
  combineInsights(r) {
    return {
      type: 'combined_insights',
      content: r.map(r => r.content).join('\n'),
      domains: r.map(r => r.domain)
    };
  }

  /**
   * Create an integrated solution
   * @param {object} t - Original task
   * @param {object} i - Combined insights
   * @returns {object} Integrated solution
   */
  createIntegratedSolution(t, i) {
    return {
      type: 'integrated_solution',
      taskId: t.id,
      content: `Integrated solution: ${t.input}`,
      insights: i
    };
  }

  /**
   * Shut down this director and all coordinators
   */
  shutdown() {
    super.shutdown();
    
    // Shut down all domain coordinators
    for (const [_, c] of this.domainCoordinators) {
      c.shutdown();
    }
    
    this.domainCoordinators.clear();
  }
}

module.exports = StrategyDirector; 