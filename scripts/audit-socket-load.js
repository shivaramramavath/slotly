// scripts/audit-socket-load.js
const { io } = require('../node_modules/.pnpm/socket.io-client@4.8.4_supports-color@8.1.1/node_modules/socket.io-client');
const { createHash } = require('crypto');

const secret = process.env.JWT_ACCESS_SECRET || 'slotly-dev-super-secure-access-token-secret-32-chars';

function generateTestToken(userId, sessionId, role = 'DESIGNER') {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    sid: sessionId,
    role: role,
    name: 'Audit Load Test User',
    exp: Math.floor(Date.now() / 1000) + 3600
  })).toString('base64url');
  const signature = createHash('sha256').update(`${header}.${payload}.${secret}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

async function runLoadTest(numClients = 50, eventsPerClient = 10) {
  console.log(`Starting socket load test: ${numClients} clients, ${eventsPerClient} events each...`);

  // First we need a valid session in Redis so the gateway doesn't disconnect us
  const Redis = require('../node_modules/.pnpm/ioredis@6.0.0_supports-color@8.1.1/node_modules/ioredis');
  const redis = new Redis({ host: 'localhost', port: 6379 });

  const sessionId = 'audit-load-session-' + Date.now();
  const userId = 'audit-load-user-' + Date.now();
  await redis.set(`slotly:session:${sessionId}`, JSON.stringify({
    sessionId,
    userId,
    status: 'active',
    role: 'DESIGNER',
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
  }), 'EX', 300);

  const token = generateTestToken(userId, sessionId);
  const projectId = 'audit-test-project-1';

  const clients = [];
  let connectedCount = 0;
  let errorCount = 0;
  const latencies = [];

  const startTime = Date.now();

  for (let i = 0; i < numClients; i++) {
    const socket = io('http://localhost:4000/blueprint', {
      auth: { token: `Bearer ${token}` },
      transports: ['websocket'],
      reconnection: false
    });

    socket.on('connect', () => {
      connectedCount++;
      socket.emit('project:join', { projectId });
    });

    socket.on('connect_error', (err) => {
      errorCount++;
    });

    clients.push(socket);
  }

  // Wait 1.5s for connections
  await new Promise(r => setTimeout(r, 1500));

  console.log(`Connected: ${connectedCount}/${numClients}, Connection Errors: ${errorCount}`);

  // Send move events
  let sentEvents = 0;
  for (const socket of clients) {
    if (!socket.connected) continue;
    for (let e = 0; e < eventsPerClient; e++) {
      const t0 = Date.now();
      socket.emit('node:move', {
        projectId,
        nodeId: `node-${e % 5}`,
        position: { x: 100 + e * 10, y: 200 + e * 10 },
      });
      sentEvents++;
      latencies.push(Date.now() - t0);
    }
  }

  // Allow events to be processed
  await new Promise(r => setTimeout(r, 1000));

  for (const socket of clients) {
    socket.disconnect();
  }
  await redis.del(`slotly:session:${sessionId}`);
  await redis.quit();

  const totalTime = Date.now() - startTime;
  const avgLatency = latencies.length > 0 ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2) : 0;
  const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;

  console.log('--- Socket Load Test Summary ---');
  console.log(`Total Clients: ${numClients}`);
  console.log(`Connected Clients: ${connectedCount}`);
  console.log(`Connection Errors: ${errorCount}`);
  console.log(`Total Events Sent: ${sentEvents}`);
  console.log(`Avg Emit Latency: ${avgLatency} ms`);
  console.log(`Max Emit Latency: ${maxLatency} ms`);
  console.log(`Total Test Duration: ${totalTime} ms`);
  console.log(`Dropped Connections: ${numClients - connectedCount}`);
}

runLoadTest().catch(console.error);
