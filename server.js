require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  path: process.env.SOCKET_IO_PATH || "/socket.io", // Custom socket.io path
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, process.env.STATIC_FILES_PATH || "public")));

let expectedResponses = 0; // Number of connected clients
let receivedResponses = 0; // Number of clients that acknowledged an action
let emitData = {}; // Data to synchronize across clients

// Serve the main HTML file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Handle socket.io connections
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Listen for the user's name
  socket.on("setName", (name) => {
    socket.data.name = name; // Store the user's name in the socket object
    expectedResponses++;
    io.emit("notification", { message: `${name} connected`, color: "green" });
  });

  // Handle actions (e.g., play/pause, seek)
  socket.on("action", (data) => {
    io.emit("make", data); // Broadcast the action to all clients
    emitData = data; // Save the action data
    receivedResponses = 0; // Reset the acknowledgment counter
  });

  // Handle acknowledgment from clients
  socket.on("ok", (receivedData) => {
    if (JSON.stringify(receivedData) === JSON.stringify(emitData)) {
      receivedResponses++;
      if (receivedResponses === expectedResponses) {
        io.emit("allOk", emitData); // Notify all clients that everyone is synchronized
      }
    }
  });

  // Handle disconnections
  socket.on("disconnect", () => {
    const name = socket.data.name || "Unknown User";
    console.log(`User disconnected: ${name}`);
    expectedResponses--;
    io.emit("notification", { message: `${name} disconnected`, color: "red" });
  });
});

// Start the server
server.listen(process.env.PORT || 3000, () => {
  console.log(`Listening on *:${process.env.PORT || 3000}`);
});