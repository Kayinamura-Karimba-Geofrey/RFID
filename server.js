// server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mqtt = require('mqtt');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// ================= CONFIG =================
const TEAM_ID = 'batidao';               // Must match your ESP8266
const MQTT_BROKER = '157.173.101.159';   // MQTT broker IP
const MQTT_PORT = 1883;

const STATUS_TOPIC  = `rfid/${TEAM_ID}/card/status`;   // Card status (e.g., online/offline)
const BALANCE_TOPIC = `rfid/${TEAM_ID}/card/balance`;  // Balance updates
const TOPUP_TOPIC   = `rfid/${TEAM_ID}/card/topup`;    // Top-up commands

// ================ BALANCE STORE ================
/*
  Keeps track of each card's balance.
  In production, you could replace this with a database.
*/
const balances = {};  // { uid1: 100, uid2: 50, ... }

// ================ MQTT CLIENT =================
const mqttClient = mqtt.connect(`mqtt://${MQTT_BROKER}:${MQTT_PORT}`, {
  clientId: `backend_${TEAM_ID}_${Math.random().toString(16).slice(3)}`
});

mqttClient.on('connect', () => {
  console.log('MQTT connected to broker');

  // Subscribe to topics for receiving updates from ESP
  mqttClient.subscribe([STATUS_TOPIC, BALANCE_TOPIC], (err) => {
    if (!err) console.log(`Subscribed to ${STATUS_TOPIC} and ${BALANCE_TOPIC}`);
  });
});

mqttClient.on('message', (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    console.log(`[MQTT] Message on ${topic}:`, payload);

    // Handle balance deduction if ESP reports usage
    if (topic === BALANCE_TOPIC && payload.uid && typeof payload.deduct === 'number') {
      balances[payload.uid] = (balances[payload.uid] || 0) - payload.deduct;

      // Send updated balance back to dashboard
      const update = { uid: payload.uid, balance: balances[payload.uid] };
      broadcast(BALANCE_TOPIC, update);
      console.log(`[BALANCE] Deducted ${payload.deduct} from ${payload.uid}. New balance: ${balances[payload.uid]}`);
      return;
    }

    // Broadcast all other MQTT messages to WebSocket clients
    broadcast(topic, payload);

  } catch (e) {
    console.error('Invalid MQTT message:', e);
  }
});

mqttClient.on('error', (err) => console.error('MQTT error:', err));

// ================ EXPRESS MIDDLEWARE ================
app.use(express.json());

// ================ TOP-UP ROUTE =================
app.post('/topup', (req, res) => {
  const { uid, amount } = req.body;

  if (!uid || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid uid or amount (>0)' });
  }

  // Update backend balance
  balances[uid] = (balances[uid] || 0) + amount;
  const payload = { uid, balance: balances[uid] };

  // Publish top-up to ESP
  mqttClient.publish(TOPUP_TOPIC, JSON.stringify({ uid, amount }));
  console.log(`[TOPUP] UID: ${uid}, Amount: ${amount}, New balance: ${balances[uid]}`);

  // Broadcast new balance to all WebSocket clients
  broadcast(BALANCE_TOPIC, payload);

  res.json({ success: true, message: 'Top-up completed', balance: balances[uid] });
});

// ================ WEBSOCKET UTILITY ================
function broadcast(topic, data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ topic, data }));
      console.log(`[WS] Sent to client:`, { topic, data });
    }
  });
}

// ================ WEBSOCKET CONNECTION ================
wss.on('connection', (ws) => {
  console.log('Dashboard connected via WebSocket');

  // Send welcome message
  ws.send(JSON.stringify({ message: 'Connected to real-time updates' }));

  // Optionally send current balances on connect
  Object.entries(balances).forEach(([uid, balance]) => {
    ws.send(JSON.stringify({ topic: BALANCE_TOPIC, data: { uid, balance } }));
  });

  ws.on('close', () => console.log('Dashboard disconnected'));
});

// ================ STATIC FILES =================
app.use(express.static(__dirname)); // Serve index.html if needed

// ================ START SERVER =================
const PORT = process.env.PORT || 8247;
server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
