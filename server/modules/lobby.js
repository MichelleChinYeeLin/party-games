const { IoMessageStatus, IoMessage } = require("../models/ioMessage.js");
const GameList = require("../models/gameList.js");
const LobbyTree = require("../models/lobbyTree.js");
const { CostumePartyDetective } = require("../models/costumePartyDetective.js");

LobbyTree.InitialiseGameList();

const createRoom = (io, socket, _receivedMsg) => {
  var roomCode = LobbyTree.GenerateRoomCode();
  var msg = LobbyTree.AddPlayerToLobby(roomCode, socket.id);
  msg.data = { event: "createRoom", roomCode: roomCode };
  socket.join(roomCode);
  io.to(socket.id).emit("message", msg);
  sendUpdateAlert(io, roomCode);
};

const joinRoom = (io, socket, receivedMsg) => {
  // If selected lobby exists
  if (LobbyTree.IsExistingRoomCode(receivedMsg.data.roomCode)) {
    var msg = LobbyTree.AddPlayerToLobby(receivedMsg.data.roomCode, socket.id);
    msg.data = { event: "joinRoom", roomCode: receivedMsg.data.roomCode };
    socket.join(receivedMsg.data.roomCode);
    io.to(socket.id).emit("message", msg);
    sendUpdateAlert(io, receivedMsg.data.roomCode);
  } else {
    var msg = new IoMessage();
    msg.status = IoMessageStatus.Fail;
    msg.message = "Room code does not exist. Please try another room code or create a lobby.";
    msg.data = { event: "joinRoom" };
    io.to(socket.id).emit("message", msg);
  }
};

const sendUpdateAlert = (io, roomCode) => {
  var msg = new IoMessage();
  msg.status = IoMessageStatus.Normal;
  msg.message = "Lobby details have been updated";
  io.to(roomCode).emit("lobby-update-alert", msg);
};

const disconnectPlayer = (io, socket) => {
  var msg = LobbyTree.RemovePlayerFromLobby(socket.id);
  if (msg.data !== null) {
    var lobbyRoomCode = msg.data.lobbyRoomCode;
    sendUpdateAlert(io, lobbyRoomCode);
  }
};

const startGame = (io, roomCode) => {
  var lobbyGameMsg = LobbyTree.GetLobbyGame(roomCode);
  if (lobbyGameMsg.status == IoMessageStatus.Success) {
    var gameUrlMsg = GameList.GetGameUrl(lobbyGameMsg.data.selectedGame);
    var playerListMsg = LobbyTree.GetLobbyPlayerList(roomCode);
    var lobbyGame = lobbyGameMsg.data.selectedGame;
    var playerList = playerListMsg.data;
    var gameData;

    // Determine which type of game data to initialise
    switch (lobbyGame) {
      case "Costume Party Detective":
        gameData = new CostumePartyDetective(playerList);
        break;
      default:
        gameData = null;
    }

    // If selected game is found, redirect to the game's url
    if (gameData != null) {
      var gameDataMsg = LobbyTree.AddGameDataToLobby(roomCode, gameData);
      gameDataMsg.data.url = gameUrlMsg.data.url;
      io.to(roomCode).emit("start-game-alert", gameDataMsg);
    }
  }
}

const ioSocketListener = (io, socket) => {
  socket.on("create-room", (msg) => {
    createRoom(io, socket, msg);
  });

  socket.on("join-room", (msg) => {
    joinRoom(io, socket, msg);
  });

  socket.on("update-player-nickname", (msg) => {
    updatePlayerNickname(io, socket, msg);
  });

  socket.on("start-game", (msg) => {
    startGame(io, msg.data.roomCode);
  })

  // Handle disconnect
  socket.on("disconnect", () => {
    disconnectPlayer(io, socket);
  });
};

const apiHelper = (app, io) => {
  app.get("/lobby/api/get-player-information/:playerSocketId", (req, res) => {
    var playerSocketId = req.params.playerSocketId;
    var msg = LobbyTree.GetPlayerInformation(playerSocketId);
    res.json(msg);
  });

  app.get("/lobby/api/get-player-list/:lobbyRoomCode", (req, res) => {
    var lobbyRoomCode = req.params.lobbyRoomCode;
    var msg = LobbyTree.GetPlayerNicknameList(lobbyRoomCode);
    res.json(msg);
  });

  app.get("/lobby/api/get-lobby-logs/:lobbyRoomCode", (req, res) => {
    var lobbyRoomCode = req.params.lobbyRoomCode;
    var msg = LobbyTree.GetLobbyLogs(lobbyRoomCode);
    res.json(msg);
  });

  app.get("/lobby/api/get-lobby-game/:lobbyRoomCode", (req, res) => {
    var lobbyRoomCode = req.params.lobbyRoomCode;
    var msg = LobbyTree.GetLobbyGame(lobbyRoomCode);
    res.json(msg);
  })

  app.post("/lobby/api/set-player-nickname", (req, res) => {
    var receivedMsg = req.body;
    var msg = LobbyTree.UpdatePlayerNickname(
      receivedMsg.data.playerSocketId,
      receivedMsg.data.playerNickname
    );
    res.send(msg);

    if (msg.data != null) {
      var lobbyRoomCode = msg.data.lobbyRoomCode;
      sendUpdateAlert(io, lobbyRoomCode);
    }
  });

  app.post("/lobby/api/set-lobby-game", (req, res) => {
    var receivedMsg = req.body;
    var msg = LobbyTree.UpdateLobbyGame(receivedMsg.data.lobbyRoomCode, receivedMsg.data.gameName);
    res.send(msg);

    if (msg.data != null) {
      sendUpdateAlert(io, receivedMsg.data.lobbyRoomCode);
    }
  });
};

module.exports = {
  ioSocketListener,
  apiHelper,
};
