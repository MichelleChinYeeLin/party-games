const { IoMessage, IoMessageStatus } = require("../models/ioMessage.js");
const LobbyTree = require("../models/lobbyTree.js");

const initaliseGame = (io, socket) => {
  console.log(socket.id);
  var msg = LobbyTree.InitialiseGameData(socket.id);
  io.to(socket.id).emit("initialise-game", msg);
}

const ioSocketListener = (io, socket) => {
  socket.on("initialise-game-alert", (_receivedMsg) => {
    initaliseGame(io, socket);
  });
};

module.exports = {
  ioSocketListener,
};
