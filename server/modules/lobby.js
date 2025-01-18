const LobbyTree = require("../models/lobbyTree.js");

const createRoom = (io, socket) => {
  var roomCode = LobbyTree.GenerateRoomCode();
  var playerData = {
    playerSocketId: socket.id,
  };

  LobbyTree.AddPlayerToLobby(roomCode, playerData);
  socket.join(roomCode);

  io.to(socket.id).emit("message", {
    message: "Room created!",
    status: 1,
    eventName: "create-room",
  });
};

const joinRoom = (io, socket, data) => {
  // If selected lobby exists
  if (LobbyTree.IsExistingRoomCode(data.roomCode)) {
    socket.join(data.roomCode);
    io.to(socket.id).emit("message", {
      message: "Room joined!",
      status: 1,
      eventName: "join-room",
    });
  } else {
    io.to(socket.id).emit("message", {
      message: "Room code not found!",
      status: 0,
      eventName: "join-room",
    });
  }
};

const disconnectPlayer = (socket) => {
  LobbyTree.RemovePlayerFromLobby(socket.id);
}

const ioSocketListener = (io, socket) => {
  socket.on("create-room", () => {
    createRoom(io, socket);
    console.log(LobbyTree);
  });

  socket.on("join-room", (data) => {
    joinRoom(io, socket, data);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    disconnectPlayer(socket);
  });
}

module.exports = {
  ioSocketListener,
};
