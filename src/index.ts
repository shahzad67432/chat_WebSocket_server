import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';

const app = express();
const httpServer = app.listen(8080);

export const wss = new WebSocketServer({ server: httpServer });

const connectedClients: { ws: WebSocket, username?: string }[] = [];

wss.on('connection', function connection(ws) {
  console.log('New client connected');

  // Add the new client to the connectedClients array
  connectedClients.push({ ws });

  ws.on('message', function message(data, isBinary) {
    const parsedData = JSON.parse(data.toString());
    console.log('Received message:', parsedData);

    switch (parsedData.type) {
      case 'setUsername':
        const client = connectedClients.find(client => client.ws === ws);
        if (client) {
          client.username = parsedData.username;
          broadcastConnectedClients();
        }
        break;
      case 'message':
        broadcastMessage(parsedData);
        break;
      default:
        console.log('Unknown message type');
    }
  });

  ws.on('close', function() {
    const index = connectedClients.findIndex(client => client.ws === ws);
    if (index !== -1) {
      connectedClients.splice(index, 1);
      broadcastConnectedClients();
    }
    console.log('Client disconnected');
  });

  function broadcastConnectedClients() {
    const connectedMembers = connectedClients
      .map(client => client.username)
      .filter(Boolean); // Filter out undefined usernames
    const message = JSON.stringify({
      type: 'connectedClients',
      clients: connectedMembers
    });
    connectedClients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    });
    console.log('Broadcasting connected clients:', connectedMembers);
  }
  //@ts-ignore
  function broadcastMessage(message) {
    const broadcastMessage = JSON.stringify({
      type: 'message',
      msg: message.msg,
      sender: message.sender,
    });
    connectedClients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(broadcastMessage);
      }
    });
    console.log('Broadcasting message:', message);
  }
});