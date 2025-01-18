const express = require("express");
const cors = require("cors");
const http = require("http");
const Lobby = require("./modules/lobby.js");

// Socket IO setup
const app = express();
const PORT = process.env.PORT || 5000;
var server = http.createServer(app);
const io = require("socket.io")(server, { cors: { origin: "*" } });
app.use(cors());

// API setup
app.get("/api", (req, res) => {
  res.json({ users: ["user1", "user2", "user3"] });
});

io.on("connection", function (socket) {
  Lobby.ioSocketListener(io, socket);
});

// Start the server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
