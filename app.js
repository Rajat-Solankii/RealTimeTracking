// Import necessary modules
const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');

// Initialize Express app and create an HTTP server
const app = express();
const server = http.createServer(app);
const io = socketio(server);

// --- NEW: Array for random colors (name arrays removed) ---
const colors = ["#FF5733", "#33FF57", "#3357FF", "#FF33A1", "#A133FF", "#33FFA1", "#FFC300", "#FF3333", "#33FFFF", "#C70039"];

// Set the view engine to EJS
app.set("view engine", "ejs");
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Handle Socket.IO connections
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    // --- NEW: Assign only a random color to the user ---
    socket.color = colors[Math.floor(Math.random() * colors.length)];
    
    // Listen for 'send-location' event from a client
    socket.on("send-location", function(data) {
        // Broadcast the received location to all clients, including only the new color
        io.emit("receive-location", { 
            id: socket.id, 
            color: socket.color, // Add color
            ...data 
        });
    });

    // Handle client disconnection
    socket.on("disconnect", function() {
        console.log(`User disconnected: ${socket.id}`);
        // Notify all clients that a user has disconnected
        io.emit("user-disconnected", socket.id);
    });
});

// Define the root route to render the main page
app.get("/", function(req, res) {
    res.render("index");
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});