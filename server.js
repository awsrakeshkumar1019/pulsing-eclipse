// Development convenience server
// Runs both Next.js and the signaling server together for local development
// In production, these run separately:
//   - Next.js frontend → Vercel
//   - Signaling server  → Render.com (or similar)

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting MeetUp development servers...\n');

// Start the signaling server
const signaling = spawn('node', [path.join(__dirname, 'signaling-server', 'index.js')], {
  stdio: 'inherit',
  env: { ...process.env, PORT: '3001' },
});

// Start Next.js dev server
const nextDev = spawn('npx', ['next', 'dev'], {
  stdio: 'inherit',
  env: { ...process.env },
});

// Handle process termination
process.on('SIGINT', () => {
  signaling.kill('SIGINT');
  nextDev.kill('SIGINT');
  process.exit();
});

process.on('SIGTERM', () => {
  signaling.kill('SIGTERM');
  nextDev.kill('SIGTERM');
  process.exit();
});

signaling.on('exit', (code) => {
  if (code !== null && code !== 0) {
    console.error(`Signaling server exited with code ${code}`);
  }
});

nextDev.on('exit', (code) => {
  if (code !== null && code !== 0) {
    console.error(`Next.js dev server exited with code ${code}`);
  }
  signaling.kill();
  process.exit(code || 0);
});
