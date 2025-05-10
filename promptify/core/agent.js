/**
 * Base Agent - Foundation for all agent types
 */
const events = require('./events');
const context = require('./context');

class Agent {
  /**
   * Create a new agent
   * @param {object} c - Configuration object
   */
  constructor(c) {
    this.id = c.id || `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.type = c.type || 'helper';
    this.domains = c.domains || [];
    this.capabilities = c.capabilities || [];
    this.taskQueue = [];
    this.processing = false;
    this.currentContext = null;
    this.maxConcurrent = c.maxConcurrent || 1;
    this.active = 0;
    this.subscriptions = [];
    
    this.setupEventSubscriptions();
  }

  /**
   * Set up event subscriptions
   */
  setupEventSubscriptions() {
    // Listen for task assignments that this agent can handle
    this.subscriptions.push(
      events.subscribe(
        'task:assign',
        this.handleTaskAssignment.bind(this),
        e => this.canHandleTask(e.task)
      )
    );
    
    // Listen for context updates in relevant domains
    this.subscriptions.push(
      events.subscribe(
        'context:update',
        this.handleContextUpdate.bind(this),
        e => e.domains.some(d => this.domains.includes(d))
      )
    );
  }

  /**
   * Check if this agent can handle a task
   * @param {object} t - Task to check
   * @returns {boolean} Whether this agent can handle the task
   */
  canHandleTask(t) {
    const d = !t.domain || this.domains.includes(t.domain);
    const c = !t.requiredCapabilities || t.requiredCapabilities.every(c => this.capabilities.includes(c));
    const h = this.active < this.maxConcurrent;
    return d && c && h;
  }

  /**
   * Handle task assignment event
   * @param {object} e - Event object
   */
  async handleTaskAssignment(e) {
    const { task } = e;
    this.taskQueue.push(task);
    
    if (!this.processing) this.processQueue();
  }

  /**
   * Process the task queue
   */
  async processQueue() {
    if (this.taskQueue.length === 0 || this.active >= this.maxConcurrent) {
      this.processing = false;
      return;
    }
    
    this.processing = true;
    const t = this.taskQueue.shift();
    this.active++;
    
    try {
      await this.loadContextForTask(t);
      const r = await this.executeTask(t);
      
      events.publish({
        type: 'task:completed',
        taskId: t.id,
        agentId: this.id,
        result: r
      });
    } catch (e) {
      events.publish({
        type: 'task:failed',
        taskId: t.id,
        agentId: this.id,
        error: e.message
      });
    } finally {
      this.active--;
      this.processQueue();
    }
  }

  /**
   * Load context for a task
   * @param {object} t - Task object
   * @returns {Promise<object>} Loaded context
   */
  async loadContextForTask(t) {
    const q = {
      tags: [...(t.tags || []), ...(t.domain ? [`domain:${t.domain}`] : [])],
      expand: true,
      relationTypes: ['requires', 'implements', 'references']
    };
    
    this.currentContext = await context.getMultiLevelContext(q, this.type);
    
    events.publish({
      type: 'context:loaded',
      agentId: this.id,
      taskId: t.id,
      contextSize: this.currentContext.totalTokens
    });
    
    return this.currentContext;
  }

  /**
   * Execute a task - must be implemented by subclasses
   * @param {object} t - Task to execute
   * @returns {Promise<object>} Task result
   */
  async executeTask(t) {
    throw new Error('executeTask must be implemented by subclasses');
  }

  /**
   * Handle context update event
   * @param {object} e - Event object
   */
  handleContextUpdate(e) {
    // Can be overridden by subclasses
  }

  /**
   * Clear the current context
   */
  clearContext() {
    this.currentContext = null;
  }

  /**
   * Shut down this agent
   */
  shutdown() {
    // Unsubscribe from all events
    this.subscriptions.forEach(u => u());
    this.subscriptions = [];
    
    // Clear context
    this.clearContext();
    
    // Cancel queued tasks
    this.taskQueue.forEach(t => {
      events.publish({
        type: 'task:cancelled',
        taskId: t.id,
        agentId: this.id,
        reason: 'Agent shutdown'
      });
    });
    
    this.taskQueue = [];
    this.processing = false;
    this.active = 0;
  }
}

module.exports = Agent; 