const {IoMessageStatus, IoMessage } = require("../models/ioMessage.js");
const LobbyTree = require("../models/lobbyTree.js");

const createRoom = (io, socket, _receivedMsg) => {
  var roomCode = LobbyTree.GenerateRoomCode();
  var msg = LobbyTree.AddPlayerToLobby(roomCode, socket.id);
  msg.data = {event: "createRoom"};
  socket.join(roomCode);
  io.to(socket.id).emit("message", msg);
};

const joinRoom = (io, socket, receivedMsg) => {
  // If selected lobby exists
  if (LobbyTree.IsExistingRoomCode(receivedMsg.data.roomCode)) {
    var msg = LobbyTree.AddPlayerToLobby(receivedMsg.data.roomCode, socket.id);
    msg.data = {event: "joinRoom"};
    socket.join(data.roomCode);
    io.to(socket.id).emit("message", msg);
  } else {
    var msg = new IoMessage();
    msg.status = IoMessageStatus.Fail;
    msg.message = "Room code does not exist. Please try another room code or create a lobby.";
    msg.data = {event: "joinRoom"};
    io.to(socket.id).emit("message", msg);
  }
};

const disconnectPlayer = (socket) => {
  LobbyTree.RemovePlayerFromLobby(socket.id);
}

const ioSocketListener = (io, socket) => {
  socket.on("create-room", (msg) => {
    createRoom(io, socket, msg);
  });

  socket.on("join-room", (msg) => {
    joinRoom(io, socket, msg);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    disconnectPlayer(socket);
  });
}

module.exports = {
  ioSocketListener,
};
