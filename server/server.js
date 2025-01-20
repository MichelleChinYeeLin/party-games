const express = require("express");
const cors = require("cors");
const http = require("http");
const Lobby = require("./modules/lobby.js");

// Socket IO setup
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5000;
var server = http.createServer(app);
const io = require("socket.io")(server, { cors: { origin: "*" } });
app.use(cors());

io.on("connection", function (socket) {
  Lobby.ioSocketListener(io, socket);
  Lobby.apiHelper(app, io);
});

// Start the server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
