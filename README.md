# ซอร์สโค้ดนี้ ใช้สำหรับเป็นตัวอย่างเท่านั้น ถ้านำไปใช้งานจริง ผู้ใช้ต้องจัดการเรื่องความปลอดภัย และ ประสิทธิภาพด้วยตัวเอง

# SchoolCheck System Overview

This repository contains components for a real-time student tracking system, "SchoolCheck," which integrates a React frontend, a Node.js WebSocket backend, and an n8n workflow for notifications. The system is designed to simulate RFID-based student location tracking and send alerts via Telegram.

---

## System Architecture

The "SchoolCheck" system comprises three main parts:

1.  **Frontend (`wanderlust-campus-tracker/`)**: A React application that simulates an RFID student tracking interface. It sends real-time location updates to the backend via WebSockets.
2.  **Backend (`backend/server.js`)**: A Node.js WebSocket server that acts as an intermediary. It receives location data from the frontend and forwards it to an n8n webhook for further processing.
3.  **n8n Flow**: An n8n workflow that processes the incoming location data from the backend and sends notifications (e.g., via Telegram) based on the configured logic.

**Data Flow:**
Frontend (simulated RFID data) --> WebSocket (Backend Server) --> HTTP POST (n8n Webhook) --> Telegram Notification

---

## Backend (`backend/server.js`)

This Node.js server is responsible for:
*   Establishing a WebSocket server on port `8081`.
*   Receiving real-time messages (location updates) from connected frontend clients.
*   Storing the latest received message.
*   Periodically (every 9 seconds) sending the `latestMessage` as a JSON payload to a pre-configured n8n webhook URL.

**Key Configuration:**
*   `WebSocket.Server` listens on port `8081`.
*   `N8N_WEBHOOK_URL`: `http://localhost:5678/webhook/your-endpoint-here` (This URL should match your n8n webhook configuration).

---

## Frontend (`wanderlust-campus-tracker/`)

This is a modern web application built with:
*   **Vite**: A fast build tool for modern web projects.
*   **React**: A JavaScript library for building user interfaces.
*   **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript.
*   **Tailwind CSS**: A utility-first CSS framework for rapidly building custom designs.
*   **Shadcn UI**: A collection of reusable components built with Radix UI and Tailwind CSS.

The frontend simulates an RFID student tracking system, providing an interface to generate and send student location data to the backend WebSocket server.

---

## n8n Flow

This n8n flow, "SchoolCheck," is designed to receive location updates (presumably from a child or student's device), process the data, and then send a notification via Telegram.

### How it Works

The flow consists of three main nodes:

1.  **Webhook:** This node acts as the entry point for the data. It's configured to listen for POST requests at a specific path. When data is sent to this webhook, it triggers the rest of the workflow.

2.  **Code:** This node is responsible for parsing and transforming the incoming data. It expects a JSON string within the webhook's payload, specifically at `$input.first().json.body.message`. This JSON string is then parsed into a JavaScript array of objects. Each object in this array is then prepared as a separate item for the next node in the workflow. This allows the flow to handle multiple location updates in a single incoming request if needed.

    *   **Input Expected:** A JSON object with a `body` property, which itself contains a `message` property. The `message` property should be a **stringified JSON array** of objects, where each object represents a location update and is expected to have `telegram`, `name`, `location`, and `lastUpdate` properties.

    *   **Example Input for Webhook Body:**
        ```json
        {
          "body": {
            "message": "[{\"telegram\": \"YOUR_TELEGRAM_CHAT_ID\", \"name\": \"John Doe\", \"location\": \"School A\", \"lastUpdate\": \"2025-06-21 10:30:00\"}, {\"telegram\": \"ANOTHER_CHAT_ID\", \"name\": \"Jane Smith\", \"location\": \"Library B\", \"lastUpdate\": \"2025-06-21 11:00:00\"}]"
          }
        }
        ```

    * **Code inside the "Code" node**
    ```javascript
    // 1. Get the JSON string from the input.
    //    Assuming your Webhook output structure is $input.first().json.body.message
    const messageString = $input.first().json.body.message;

    // 2. Parse the JSON string into a JavaScript array of objects.
    const parsedItems = JSON.parse(messageString);

    // 3. Transform the array of objects into the format n8n expects for output.
    //    Each object in the 'parsedItems' array should become a new n8n item.
    const outputItems = [];
    for (const item of parsedItems) {
        outputItems.push({
            json: item // Wrap each parsed object in a 'json' property
        });
    }

    // 4. Return the array of n8n items.
    return outputItems;
```

3.  **Telegram:** This node sends a message to a specified Telegram chat. It uses data extracted from the previous "Code" node to construct the message.

    *   **Message Format:** `น้อง {{ $json.name }} อยู่ที่ {{ $json.location }} เมื่อเวลา {{ $json.lastUpdate }}` (Translated: "Nong {{ name }} is at {{ location }} at {{ lastUpdate }}")
    *   **`chatId`:** This is dynamically set using the `telegram` property from the processed JSON data (`={{ $json.telegram }}`). This means each incoming location update can be routed to a different Telegram chat ID.

---

## Setup and Running Instructions

To get the "SchoolCheck" system up and running, follow these steps:

### 1. n8n Flow Setup

1.  **Create the Flow:** 
2.  **Configure Telegram Credentials:**
    *   In the "Telegram" node, click on the "Credentials" section.
    *   Click "Create New" for "Telegram API".
    *   Provide your Telegram Bot Token. If you don't have one, you'll need to create a new bot via BotFather on Telegram and obtain your token.
3.  **Activate the Workflow:** Once the Telegram credentials are set up, activate the workflow by toggling the "Active" switch in the top right corner of the n8n editor.
4.  **Get Webhook URL:** After activating, you can find the webhook URL by opening the "Webhook" node and copying the "Webhook URL." This is the URL you will use in your backend configuration.

### 2. Backend Server Setup (`backend/`)
```sh
https://github.com/warathepj/n8n-SchoolCheck-backend.git
```

1.  **Navigate to Backend Directory:**
    ```sh
    cd n8n-SchoolCheck-backend
    ```
2.  **Install Dependencies:**
    ```sh
    npm install
    ```
3.  **Run the Backend Server:**
    ```sh
    npm start 
    or
    node server.js
    ```
    The WebSocket server will start on `ws://localhost:8081`. Ensure this port is open and not in use by other applications.

### 3. Frontend Application Setup (`wanderlust-campus-tracker/`)
```sh
https://github.com/warathepj/wanderlust-campus-tracker.git
```

1.  **Navigate to Frontend Directory:**
    ```sh
    cd wanderlust-campus-tracker/
    ```
2.  **Install Dependencies:**
    ```sh
    npm install
    ```
3.  **Start the Development Server:**
    ```sh
    npm run dev
    ```
    This will start the Vite development server, usually on `http://localhost:5173` (or another available port). Open this URL in your browser to access the RFID Student Tracking System.

---

## Data Structure for Incoming Webhook (n8n)

The n8n webhook expects a POST request with a JSON body that contains a `message` field. The `message` field should be a **stringified JSON array** of objects. Each object in this array must contain the following keys:

*   `telegram`: The Telegram chat ID where the message should be sent.
*   `name`: The name of the person (e.g., "John Doe").
*   `location`: The current location of the person (e.g., "School A").
*   `lastUpdate`: The timestamp of the last update (e.g., "2025-06-21 10:30:00").

**Example Payload to Send to Webhook:**

```json
{
  "body": {
    "message": "[{\"telegram\": \"YOUR_TELEGRAM_CHAT_ID\", \"name\": \"Alice\", \"location\": \"Home\", \"lastUpdate\": \"2025-06-21 15:00:00\"}]"
  }
}
```

You can send multiple updates in a single request by adding more objects to the `message` array.

---

## Troubleshooting

*   **No Telegram Message:**
    *   Check if the n8n workflow is active.
    *   Verify your Telegram API credentials in the "Telegram" node within n8n.
    *   Ensure the `telegram` chat ID in your incoming JSON data is correct and that your bot has permission to send messages to that chat.
    *   Check the "Code" node's execution in n8n to ensure the JSON parsing is successful and the data is being passed correctly to the Telegram node.
*   **n8n Webhook Not Triggering:**
    *   Double-check that the backend server is running and sending POST requests to the correct n8n webhook URL.
    *   Ensure your incoming JSON payload from the backend matches the expected structure, especially the `body.message` path and the stringified JSON array format.
*   **Frontend Not Connecting to Backend:**
    *   Verify that the backend WebSocket server (`server.js`) is running on port `8081`.
    *   Check the frontend's code (`RFIDTrackingSystem.tsx` or related files) to ensure it's attempting to connect to `ws://localhost:8081`.
    *   Look for any WebSocket connection errors in your browser's developer console.
