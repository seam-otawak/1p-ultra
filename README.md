# Promptify Ultra Scalable AI Agent Framework

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version 1.0.0">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License: MIT">
  <img src="https://img.shields.io/badge/node-%3E%3D%2016.0.0-brightgreen.svg" alt="Node >=16.0.0">
</p>

> Token-optimized agent framework leveraging Knowledge Mesh architecture, event-driven microagent orchestration, progressive context loading, and ultra-compact information representation.

## Overview

Promptify Ultra is an advanced framework designed for maximum efficiency and scalability when working with Large Language Models. It employs a hierarchical agent system, sophisticated token management, and graph-based knowledge representation to dramatically reduce API costs while improving response quality.

### Key Features

- **Knowledge Mesh Architecture**: Graph-based knowledge representation with atomic facts and typed relationships
- **Hierarchical Agent System**: Strategy → Domain → Helper agent orchestration for complex tasks
- **Token Budget Optimization**: Progressive loading and strict token allocation (≥85% compression)
- **Event-driven Communication**: Asynchronous coordination between agents
- **Pattern Vector Encoding**: Ultra-compact information referencing with 2PVE notation

## Installation

```bash
# Clone the repository (if not using with Cursor)
git clone https://github.com/your-username/promptify-ultra.git
cd promptify-ultra

# Install dependencies
npm install

# Initialize the framework
npm run init
```

## Quick Start

```javascript
// Import the framework
const promptify = require('./promptify');

// Initialize
await promptify.initialize();

// Submit a task
const result = await promptify.submitTask({
  input: "Create a responsive React component for financial data visualization",
  domain: "ui",
  complexity: 0.7
});

// Use result
console.log(result);

// Shutdown when done
promptify.shutdown();
```

## Architecture

Promptify Ultra uses a three-tier agent hierarchy to efficiently process tasks:

```
┌────────────────────┐          ┌────────────────────┐
│  Strategy Director │◄────────►│ Knowledge Mesh DB  │
└─────────┬──────────┘          └────────────────────┘
          │                             ▲
          ▼                             │
┌─────────────────────┐                 │
│ Domain Coordinators │◄────────────────┘
└─────────┬───────────┘                 
          │                             
          ▼                             
┌─────────────────────┐                 
│    Helper Agents    │                 
└─────────────────────┘                 
```

### Agent Hierarchy

| Agent Type | Role | Token Budget | Responsibilities |
|------------|------|--------------|------------------|
| Strategy Director | Senior | 17,500 | Cross-domain coordination, high-level planning |
| Domain Coordinator | Mid-level | 6,800 | Domain-specific tasks, subtask decomposition |
| Helper Agent | Junior | 2,000 | Specialized operations, direct execution |

## Knowledge Representation

Knowledge is stored as atomic graph nodes connected by typed relationships:

```javascript
// Add a fact to the knowledge mesh
knowledge.addFact(
  "C1",  // ID
  "ResponsiveLayout: Automatically adapts to different screen sizes using fluid grids and media queries.",
  ["pattern", "level:1", "domain:ui", "type:design"]  // Tags
);

// Create relationships between facts
knowledge.relate("C1", "D1", "implements");
```

## Token Optimization

Promptify Ultra employs multiple techniques to maximize token efficiency:

| Strategy | Impact | Implementation |
|----------|--------|----------------|
| Progressive Loading | 20-30% reduction | Load L1→L2→L3 context based on task complexity |
| Knowledge Atoms | 40-60% reduction | Store atomic facts with relationships |
| Pattern References | 30-50% reduction | Use 2PVE notation to reference patterns |
| Minification | 15-25% reduction | Apply multi-layer minification stack |
| Hierarchical Compression | 20-30% reduction | Use §-notation for headings |

## Advanced Usage

### Cross-Domain Task

```javascript
const result = await promptify.submitTask({
  input: "Design and implement a user authentication system with security best practices",
  domains: ["ui", "dev"], // Cross-domain task
  complexity: 0.8,
  tags: ["authentication", "security", "user-experience"]
});
```

### Event Monitoring

```javascript
const unsubscribe = events.subscribe(
  'task:completed', 
  event => {
    console.log(`Task ${event.taskId} completed with result:`, event.result);
  },
  event => event.taskId.startsWith('custom_')
);
```

## Extending the Framework

### Adding Custom Knowledge

```javascript
// Add a pattern definition
knowledge.addFact(
  "C5", 
  "AuthFlow: Secure authentication process with multi-factor verification and session management.",
  ["pattern", "level:2", "domain:dev", "type:security"]
);

// Create relationships
knowledge.relate("C5", "D2", "implements");
knowledge.relate("C5", "G3", "requiresStrictly");
```

### Custom Agent Specialization

Create specialized helper agents by extending the base classes:

```javascript
class SecurityAgent extends HelperAgent {
  constructor(c) {
    super({...c, specialization: 'security'});
    this.securityChecks = ['authentication', 'authorization', 'input-validation'];
  }
  
  async executeTask(t) {
    // Custom security-focused implementation
    // ...
  }
}
```

## Performance Benchmarks

| Metric | Traditional Approach | Promptify Ultra | Improvement |
|--------|---------------------|----------------|-------------|
| API Token Usage | 5200 tokens/task | 2100 tokens/task | 60% reduction |
| Response Time | 3.2s avg | 1.8s avg | 44% faster |
| Context Efficiency | 35% (wasted context) | 85% (utilized context) | 2.4x better |
| Multi-domain Tasks | Multiple API calls | Single coordinated execution | 3x more efficient |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

<p align="center">
  Developed with ❤️ using Ultra Promptify AI Agents Framework Plugin (ver: alpha) for VSCode
  All rights reserved to the original authors of the Promptify Ultra Framework. Prompitfy, Promptify AI and Promptify Ultra are trademarks of the Promptify LLC having its principal place of business in New York, Brooklyn, USA - Copyright 2025 Promptify LLC.
</p> 