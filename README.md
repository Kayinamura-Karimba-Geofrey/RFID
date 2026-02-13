# RFID Card Top-Up System

A real-time RFID card management system featuring an edge controller (ESP8266/MicroPython) and a central web dashboard (Node.js/Express/WebSocket).

## 🚀 Live Dashboard
Check out the live web dashboard here:
**[http://157.173.101.159:8247](http://157.173.101.159:8247)**

## 📋 Project Overview
This system allows users to top up and manage RFID card balances in real-time. It uses MQTT for communication between the hardware edge (ESP8266) and the backend server.

### Key Features
- **Real-time Updates**: Live balance tracking via WebSockets.
- **Hardware Integration**: Seamless interface with MFRC522 RFID reader.
- **Scalable Backend**: Built with Express and MQTT to handle multiple tags and clients.

## 🛠️ Tech Stack
- **Backend**: Node.js, Express, `mqtt`, `ws`
- **Frontend**: HTML5, Tailwind CSS, Font Awesome
- **Edge Controller**: MicroPython on ESP8266
- **Protocol**: MQTT for edge-to-cloud communication

## 🔧 Installation & Setup

### Backend (Dashboard)
1. Navigate to the project directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
   *Note: Default port is 8247.*

### Hardware (ESP8266)
1. Flash `main.py` and `mfrc522.py` to your ESP8266 using Thonny or ampy.
2. Ensure you update `WIFI_SSID` and `WIFI_PASSWORD` in `main.py`.

## 👥 Team
- **Team ID**: batidao
