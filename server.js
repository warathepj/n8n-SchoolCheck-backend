const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8081 }); // Use a different port for WebSocket to avoid conflict with HTTP server if any

wss.on('connection', ws => {
    console.log('Client connected');

    ws.on('message', message => {
        console.log(`Received message: ${message}`);
        // Echo the message back to the client
        ws.send(`Server received: ${message}`);
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });

    ws.on('error', error => {
        console.error('WebSocket error:', error);
    });
});

console.log('WebSocket server started on port 8081');
