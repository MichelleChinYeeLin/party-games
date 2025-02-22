const { IoMessage, IoMessageStatus } = require("../models/ioMessage.js");
const LobbyTree = require("../models/lobbyTree.js");

const initaliseGame = (io, socket) => {
  var msg = LobbyTree.GetGameDetails(socket.id);
  io.to(socket.id).emit("update-game-alert", msg);
};

const gameEvent = (io, socket, receivedMsg) => {
  var lobbyRoomCode = LobbyTree.GetPlayerLobby(socket.id).data.lobbyRoomCode;
  var msg = LobbyTree.TriggerGameDataEvent(lobbyRoomCode, receivedMsg.data);

  if (msg.status == IoMessageStatus.Success) {
    var gameStatus = msg.data.gameStatus;

    if (gameStatus == "game-end") {
      winningPlayerSocketId = msg.data.winnerSocketId;
      var playerInformationDetailsMsg = LobbyTree.GetPlayerInformation(winningPlayerSocketId);
      msg.message += " The winner is " + playerInformationDetailsMsg.data.playerNickname;

      io.to(lobbyRoomCode).emit("update=game-alert", msg);
    } else {
      // Emit update alerts to all sockets (must be updated individually due to difference in data displayed)
      var gameLobbyMsg = LobbyTree.GetLobbyPlayerList(lobbyRoomCode);
      var playerList = gameLobbyMsg.data;

      playerList.forEach((player) => {
        var updateMsg = LobbyTree.GetGameDetails(player.playerSocketId);
        io.to(player.playerSocketId).emit("update-game-alert", updateMsg);
      });
    }
  } else {
    io.to(socket.id).emit("error-message", msg);
  }
};

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
