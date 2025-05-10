/**
 * Promptify Ultra - Scalable AI Agent Framework
 */
const fs = require('fs');
const path = require('path');
const events = require('./core/events');
const knowledge = require('./core/knowledge');
const context = require('./core/context');
const patterns = require('./core/patterns');
const StrategyDirector = require('./agents/strategy');
const DomainCoordinator = require('./agents/domain');
const HelperAgent = require('./agents/helper');

class Promptify {
  /**
   * Create a new Promptify instance
   * @param {object} c - Configuration
   */
  constructor(c = {}) {
    this.config = this.loadConfig(c);
    this.initialized = false;
    this.agents = new Map();
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.submitTask = this.submitTask.bind(this);
    this.shutdown = this.shutdown.bind(this);
  }

  /**
   * Load configuration
   * @param {object} c - Configuration overrides
   * @returns {object} Merged configuration
   */
  loadConfig(c) {
    const p = path.join(process.cwd(), '.cursor', '.promptifyrc');
    let r = {};
    
    if (fs.existsSync(p)) {
      try {
        r = JSON.parse(fs.readFileSync(p, 'utf8'));
      } catch (e) {
        console.warn('Failed to parse .promptifyrc:', e.message);
      }
    }
    
    return { ...r, ...c };
  }

  /**
   * Initialize the framework
   * @returns {Promise<Promptify>} This instance
   */
  async initialize() {
    if (this.initialized) return this;
    
    // Load knowledge from schemas
    await knowledge.loadFromSchemas();
    
    // Load patterns
    await patterns.loadFromSchema();
    
    // Initialize agents
    this.initializeAgents();
    
    // Set up event listeners
    this.setupEventListeners();
    
    this.initialized = true;
    return this;
  }

  /**
   * Initialize agents based on configuration
   */
  initializeAgents() {
    // Create Strategy Director
    const s = this.config.strategyDirector || {};
    const d = new StrategyDirector({
      ...s,
      domains: this.config.domains || []
    });
    
    this.agents.set(d.id, d);
    
    // Create standalone Domain Coordinators (if any)
    if (this.config.domainCoordinators) {
      this.config.domainCoordinators.forEach(c => {
        const o = new DomainCoordinator(c);
        this.agents.set(o.id, o);
      });
    }
    
    // Create standalone Helper Agents (if any)
    if (this.config.helperAgents) {
      this.config.helperAgents.forEach(c => {
        const h = new HelperAgent(c);
        this.agents.set(h.id, h);
      });
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Log warnings
    events.subscribe('warning', e => {
      console.warn(`Warning: ${e.message}`);
    });
    
    // Log task failures
    events.subscribe('task:failed', e => {
      console.error(`Task failed: ${e.error}`);
    });
    
    // Verbose logging if enabled
    if (this.config.verbose) {
      events.subscribe('task:assign', e => {
        console.log(`Task assigned: ${e.task.id} to ${e.assignedTo}`);
      });
      
      events.subscribe('task:completed', e => {
        console.log(`Task completed: ${e.taskId} by ${e.agentId}`);
      });
      
      events.subscribe('context:loaded', e => {
        console.log(`Context loaded: ${e.contextSize} tokens for ${e.taskId}`);
      });
    }
  }

  /**
   * Submit a task for processing
   * @param {object} t - Task to process
   * @returns {Promise<object>} Task result
   */
  async submitTask(t) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Generate task ID if not provided
    if (!t.id) {
      t.id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    return new Promise((r, j) => {
      // Subscribe to task completion
      const u = events.subscribe(
        'task:completed',
        e => {
          if (e.taskId === t.id) {
            u();
            f();
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
            u();
            f();
            j(new Error(e.error));
          }
        },
        e => e.taskId === t.id
      );
      
      // Find a strategy director
      const d = [...this.agents.values()].filter(a => a.type === 'strategy');
      
      if (d.length === 0) {
        j(new Error('No strategy director available'));
        return;
      }
      
      // Assign task to strategy director
      events.publish({
        type: 'task:assign',
        task: t,
        assignedTo: d[0].id
      });
    });
  }

  /**
   * Shutdown the framework
   */
  shutdown() {
    // Shutdown all agents
    for (const [_, a] of this.agents) {
      a.shutdown();
    }
    
    this.agents.clear();
    this.initialized = false;
  }
}

// Create singleton instance
const promptify = new Promptify();

module.exports = promptify; 