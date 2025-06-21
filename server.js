const WebSocket = require('ws');
const fetch = require('node-fetch').default;

const wss = new WebSocket.Server({ port: 8081 }); // Use a different port for WebSocket to avoid conflict with HTTP server if any
const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook-test/70b7b23c-5128-44ce-91df-0c7791900f3f';
let latestMessage = null; // Variable to store the latest message

wss.on('connection', ws => {
    console.log('Client connected');

    ws.on('message', message => {
        console.log(`Received message: ${message}`);
        latestMessage = message.toString(); // Store the latest message
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

// Send data to n8n every 9 seconds
setInterval(async () => {
    if (latestMessage) {
        try {
            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: latestMessage }),
            });

            if (response.ok) {
                console.log('Data successfully sent to n8n webhook.');
            } else {
                console.error(`Failed to send data to n8n: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error sending data to n8n:', error);
        }
    }
}, 9000); // 9000 milliseconds = 9 seconds

console.log('WebSocket server started on port 8081');
