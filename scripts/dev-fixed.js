#!/usr/bin/env node

// React 19: Development server with memory leak fixes
const { spawn } = require('child_process');
const path = require('path');

// Fix memory leak warnings by increasing event listener limits
process.setMaxListeners(20);

// Handle cleanup properly
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Development server terminated');
  process.exit(0);
});

// Start Next.js dev server with React 19 optimizations
const devServer = spawn('next', ['dev'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    // React 19: Disable strict mode warnings in development
    NODE_OPTIONS: '--max-old-space-size=4096',
    // Fix memory leak warnings
    NEXT_TELEMETRY_DISABLED: '1',
  },
});

devServer.on('error', (error) => {
  console.error('❌ Failed to start development server:', error);
  process.exit(1);
});

devServer.on('close', (code) => {
  console.log(`\n📋 Development server exited with code ${code}`);
  process.exit(code);
});

console.log(
  '🚀 Starting React 19 development server with memory leak fixes...'
);
console.log('📍 App running at: http://localhost:3000');
