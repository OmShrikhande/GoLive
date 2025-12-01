const WebSocket = require('ws');

// Replace <TOKEN> with what /getToken returns
const wsUrl = 'ws://194.163.178.69:7880/rtc?access_token=eyJhbGciOiJIUzI1NiJ9.eyJ2aWRlbyI6eyJyb29tSm9pbiI6dHJ1ZSwicm9vbSI6InF1aWNrc3RhcnQtcm9vbSJ9LCJpc3MiOiJBUElla0pkQkJuVUMzSzYiLCJleHAiOjE3NjQ2NzkyMjIsIm5iZiI6MCwic3ViIjoidXNlci03NTE1In0.wlIf_y1k7-GoohMsXZPJmXRA5TyBrNsfR4-cdxvWn2Q';

const ws = new WebSocket(wsUrl);

ws.on('open', () => console.log('✅ Connected to LiveKit!'));
ws.on('message', (msg) => console.log('📥 Received:', msg.toString()));
ws.on('error', (err) => console.error('❌ Connection error:', err.message));
