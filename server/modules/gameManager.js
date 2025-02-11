const { IoMessage, IoMessageStatus } = require("../models/ioMessage.js");
const LobbyTree = require("../models/lobbyTree.js");

const initaliseGame = (io, socket) => {
  var msg = LobbyTree.GetGameDetails(socket.id);
  io.to(socket.id).emit("update-game-alert", msg);
}

const gameEvent = (io, socket, receivedMsg) => {
  var lobbyRoomCode = LobbyTree.GetPlayerLobby(socket.id).data.lobbyRoomCode;
  var msg = LobbyTree.TriggerGameDataEvent(lobbyRoomCode, receivedMsg.data);
  
  if (msg.status == IoMessageStatus.Success) {
    var updateMsg = LobbyTree.GetGameDetails(socket.id);
    io.to(lobbyRoomCode).emit("update-game-alert", updateMsg);
  }
  else {
    io.to(socket.id).emit("error-message", msg);
  }
}

const ioSocketListener = (io, socket) => {
  socket.on("initialise-game-alert", (_receivedMsg) => {
    initaliseGame(io, socket);
  });

  socket.on("game-event", (receivedMsg) => {
    gameEvent(io, socket, receivedMsg);
  });
};

module.exports = {
  ioSocketListener,
};
