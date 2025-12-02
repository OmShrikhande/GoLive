const WebSocket = require('ws');

// Replace <TOKEN> with what /getToken returns
const wsUrl = 'ws://194.163.178.69:7880/rtc?access_token=eyJhbGciOiJIUzI1NiJ9.eyJ2aWRlbyI6eyJyb29tSm9pbiI6dHJ1ZSwicm9vbSI6InF1aWNrc3RhcnQtcm9vbSJ9LCJpc3MiOiJBUElla0pkQkJuVUMzSzYiLCJleHAiOjE3NjQ2Nzg0NTksIm5iZiI6MCwic3ViIjoidXNlci01NTA3In0.JIKL8c-3voAXvog3yIzWaGxSaQnHarwqg2VNXpdk2O8';

const ws = new WebSocket(wsUrl);

ws.on('open', () => console.log('✅ Connected to LiveKit!'));
ws.on('message', (msg) => console.log('📥 Received:', msg.toString()));
ws.on('error', (err) => console.error('❌ Connection error:', err.message));
