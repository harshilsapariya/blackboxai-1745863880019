const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 8000;

app.use(express.static(path.join(__dirname)));

let players = [];
let gameState = {
  board: null,
  turn: 'white',
  players: {}
};

wss.on('connection', function connection(ws) {
  if (players.length >= 2) {
    ws.send(JSON.stringify({ type: 'error', message: 'Game is full' }));
    ws.close();
    return;
  }

  const playerColor = players.length === 0 ? 'white' : 'black';
  players.push(ws);
  gameState.players[playerColor] = ws;

  ws.send(JSON.stringify({ type: 'init', color: playerColor }));

  ws.on('message', function incoming(message) {
    // Broadcast the move to the other player
    players.forEach(player => {
      if (player !== ws && player.readyState === WebSocket.OPEN) {
        player.send(message);
      }
    });
  });

  ws.on('close', () => {
    players = players.filter(player => player !== ws);
    if (playerColor in gameState.players) {
      delete gameState.players[playerColor];
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started on http://0.0.0.0:${PORT}`);
});
