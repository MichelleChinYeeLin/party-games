const { IoMessageStatus, IoMessage } = require("./ioMessage.js");
const GameList = require("./gameList.js");
const { Player } = require("./player.js");

class LobbyNode {
  constructor(lobbyRoomCode) {
    this.lobbyRoomCode = lobbyRoomCode;
    this.playerList = [];
    this.hostSocketId = null;
    this.selectedGame = "";
    this.logs = [];
  }

  GetPlayerInformation(playerSocketId) {
    for (var i = 0; i < this.playerList.length; i++) {
      if (this.playerList[i].playerSocketId == playerSocketId) {
        var msg = new IoMessage();
        msg.status = IoMessageStatus.Success;
        msg.message = "Player information succeessfully retrieved.";
        msg.data = {
          playerNickname: this.playerList[i].playerNickname,
          isHost: this.playerList[i].playerSocketId == this.hostSocketId,
        };
        return msg;
      }
    }

    var msg = new IoMessage();
    msg.status = IoMessageStatus.Fail;
    msg.message = "Player information not found.";
    return msg;
  }

  GetPlayerNicknameList() {
    var data = [];
    for (var i = 0; i < this.playerList.length; i++) {
      var player = this.playerList[i];
      var isHost = this.hostSocketId == player.playerSocketId;

      var playerData = {
        playerNickname: player.playerNickname,
        isHost: isHost,
      };
      data.push(playerData);
    }

    var msg = new IoMessage();
    msg.status = IoMessageStatus.Success;
    msg.message = "Player list data retrieved successfully.";
    msg.data = data;
    return msg;
  }

  GetLobbyGame() {
    var msg = new IoMessage();
    msg.status = IoMessageStatus.Success;
    msg.message = "Lobby game retrieved successfully.";
    msg.data = {
      selectedGame: this.selectedGame,
    };
    return msg;
  }

  AddPlayer(playerSocketId, playerNickname = "") {
    if (playerNickname == "") {
      playerNickname = "Player " + (this.playerList.length + 1);
    }

    // Set player as host if the player created the room
    if (this.playerList.length < 1) {
      this.hostSocketId = playerSocketId;
    }
    this.playerList.push(new Player(playerSocketId, playerNickname));
    this.logs.push(playerNickname + " has joined the room!");
  }

  RemovePlayer(playerSocketId) {
    var playerNickname = "";

    for (var i = 0; i < this.playerList.length; i++) {
      if (this.playerList[i].playerSocketId == playerSocketId) {
        this.logs.push(this.playerList[i].playerNickname + " has left the room.");
        playerNickname = this.playerList[i].playerNickname;
        break;
      }
    }

    this.playerList = this.playerList.filter((playerNode) => {
      return playerNode.playerSocketId != playerSocketId;
    });

    var msg = new IoMessage();
    msg.status = IoMessageStatus.Success;
    msg.message = playerNickname + " has left the room.";
    msg.data = {
      lobbyRoomCode: this.lobbyRoomCode,
    };
    return msg;
  }

  UpdatePlayerNickname(playerSocketId, playerNickname) {
    // Check if nickname is empty string or null
    if (playerNickname == null || playerNickname == "") {
      var msg = new IoMessage();
      msg.status = IoMessage.Fail;
      msg.message = "Player nickname cannot be empty. Player nickname is not updated.";
      msg.data = null;
      return msg;
    }

    // Check if another player in the lobby has the same nickname
    const samePlayerNicknameArr = this.playerList.filter((player) => {
      return player.playerNickname == playerNickname;
    });

    // If a player with the same nickname already exists
    if (samePlayerNicknameArr.length > 0) {
      var msg = new IoMessage();
      msg.status = IoMessage.Fail;
      msg.message =
        "Player nickname already used by another player. Player nickname is not updated.";
      msg.data = null;
      return msg;
    }

    for (var i = 0; i < this.playerList.length; i++) {
      if (this.playerList[i].playerSocketId == playerSocketId) {
        this.logs.push(
          this.playerList[i].playerNickname + "'s nickname has been updated to " + playerNickname
        );
        this.playerList[i].playerNickname = playerNickname;
        var msg = new IoMessage();
        msg.status = IoMessageStatus.Success;
        msg.message = "Player nickname updated.";
        msg.data = {
          lobbyRoomCode: this.lobbyRoomCode,
        };
        return msg;
      }
    }
  }

  UpdateLobbyGame(gameName) {
    this.selectedGame = gameName;
    if (gameName == "") {
      this.logs.push("Lobby game selection has been removed.");
    } else {
      this.logs.push("Lobby game has been updated to " + gameName);
    }

    var msg = new IoMessage();
    msg.status = IoMessageStatus.Success;
    msg.message = "Lobby game updated successfully.";
    msg.data = {
      lobbyRoomCode: this.lobbyRoomCode,
      gameName: gameName,
    };
    return msg;
  }

  IsExistingPlayerSocketId(playerSocketId) {
    for (var i = 0; i < this.playerList.length; i++) {
      if (this.playerList[i].playerSocketId == playerSocketId) {
        return true;
      }
    }
    return false;
  }

  IsEmptyPlayerList() {
    return this.playerList.length < 1;
  }
}

class LobbyTree {
  static lobbyRoomList = [];
  static lobbyGameMap = new Map();

  static InitialiseGameList() {
    GameList.ReadGameInfoJson();
  }

  static GetPlayerInformation(playerSocketId, lobbyRoomCode = null) {
    for (var i = 0; i < this.lobbyRoomList.length; i++) {
      if (lobbyRoomCode !== null) {
        if (this.lobbyRoomList[i].lobbyRoomCode == lobbyRoomCode) {
          return this.lobbyRoomList[i].GetPlayerInformation(playerSocketId);
        }
      } else {
        if (this.lobbyRoomList[i].IsExistingPlayerSocketId(playerSocketId)) {
          return this.lobbyRoomList[i].GetPlayerInformation(playerSocketId);
        }
      }
    }

    var msg = new IoMessage();
    msg.status = IoMessageStatus.Fail;
    msg.message = "Player information not found.";
    return msg;
  }

  static GetPlayerNicknameList(lobbyRoomCode) {
    for (var i = 0; i < this.lobbyRoomList.length; i++) {
      if (this.lobbyRoomList[i].lobbyRoomCode == lobbyRoomCode) {
        return this.lobbyRoomList[i].GetPlayerNicknameList();
      }
    }

    var msg = new IoMessage();
    msg.status = IoMessageStatus.Fail;
    msg.message = "Lobby with room code not found.";
    return msg;
  }

  static GetLobbyLogs(lobbyRoomCode) {
    for (var i = 0; i < this.lobbyRoomList.length; i++) {
      if (this.lobbyRoomList[i].lobbyRoomCode == lobbyRoomCode) {
        var msg = new IoMessage();
        msg.status = IoMessageStatus.Success;
        msg.message = "Lobby logs retrieved successfully.";
        msg.data = this.lobbyRoomList[i].logs;
        return msg;
      }
    }

    var msg = new IoMessage();
    msg.status = IoMessageStatus.Fail;
    msg.message = "Lobby room code not found.";
    return msg;
  }

  static GetLobbyGame(lobbyRoomCode) {
    for (var i = 0; i < this.lobbyRoomList.length; i++) {
      if (this.lobbyRoomList[i].lobbyRoomCode == lobbyRoomCode) {
        return this.lobbyRoomList[i].GetLobbyGame();
      }
    }

    var msg = new IoMessage();
    msg.status = IoMessageStatus.Fail;
    msg.message = "Lobby not found.";
    return msg;
  }

  static GetLobbyPlayerList(lobbyRoomCode) {
    for (var i = 0; i < this.lobbyRoomList.length; i++) {
      if (this.lobbyRoomList[i].lobbyRoomCode == lobbyRoomCode) {
        var msg = new IoMessage();
        msg.status = IoMessageStatus.Success;
        msg.message = "Lobby player number retrieved successfully.";
        msg.data = this.lobbyRoomList[i].playerList;
        return msg;
      }
    }

    var msg = new IoMessage();
    msg.status = IoMessageStatus.Fail;
    msg.message = "Lobby not found.";
    return msg;
  }

  static GetGameInformation(gameName) {
    var msg = GameList.GetGameInformation(gameName);
    return msg;
  }

  static AddPlayerToLobby(lobbyRoomCode, playerSocketId) {
    // Check if player socket id already exists
    for (var i = 0; i < this.lobbyRoomList.length; i++) {
      if (this.lobbyRoomList[i].IsExistingPlayerSocketId(playerSocketId)) {
        var msg = new IoMessage();
        msg.status = IoMessageStatus.Fail;
        msg.message = "Player Id already exists in a lobby. Please refresh the page and try again.";
        return msg;
      }
    }

    // Add lobby if lobby does not exist
    if (!this.IsExistingRoomCode(lobbyRoomCode)) {
      this.lobbyRoomList.push(new LobbyNode(lobbyRoomCode));
    }

    // Add player to selected lobby
    for (var i = 0; i < this.lobbyRoomList.length; i++) {
      if (this.lobbyRoomList[i].lobbyRoomCode == lobbyRoomCode) {
        this.lobbyRoomList[i].AddPlayer(playerSocketId);
        var msg = new IoMessage();
        msg.status = IoMessageStatus.Success;
        msg.message = "Player successfully added to lobby.";
        return msg;
      }
    }
  }

  static AddGameDataToLobby(lobbyRoomCode, gameData) {
    this.lobbyGameMap.set(lobbyRoomCode, gameData);
    var msg = new IoMessage();
    msg.status = IoMessageStatus.Success;
    msg.message = "Game data added successfully.";
    return msg;
  }

  static RemovePlayerFromLobby(playerSocketId) {
    for (var i = 0; i < this.lobbyRoomList.length; i++) {
      for (var j = 0; j < this.lobbyRoomList[i].playerList.length; j++) {
        if (this.lobbyRoomList[i].IsExistingPlayerSocketId(playerSocketId)) {
          var msg = this.lobbyRoomList[i].RemovePlayer(playerSocketId);
        }

        // If lobby does not contain other players, remove lobby and game var
        if (this.lobbyRoomList[i].IsEmptyPlayerList()) {
this.lobbyGameMap.delete(this.lobbyRoomList[i].lobbyRoomCode);
          msg.message = " Lobby removed due to inactivity.";
        }

        // Set next player as host
        else {
          this.lobbyRoomList[i].hostSocketId = this.lobbyRoomList[i].playerList[0].playerSocketId;
        }
        return msg;
      }
    }

    var msg = new IoMessage();
      msg.status = IoMessageStatus.Fail;
      msg.message = "Player not found.";
    return msg;
  }

  static UpdatePlayerNickname(playerSocketId, playerNickname) {
    for (var i = 0; i < this.lobbyRoomList.length; i++) {
      if (this.lobbyRoomList[i].IsExistingPlayerSocketId(playerSocketId)) {
        return this.lobbyRoomList[i].UpdatePlayerNickname(playerSocketId, playerNickname);
      }
    }
  }

  static UpdateLobbyGame(lobbyRoomCode, gameName) {
    // Verify game is in game list
    if (gameName != "" && !GameList.VerifyGameExists(gameName)) {
      var msg = new IoMessage();
      msg.status = IoMessageStatus.Fail;
      msg.message = "Selected game not found.";
      return msg;
    }

    for (var i = 0; i < this.lobbyRoomList.length; i++) {
      if (this.lobbyRoomList[i].lobbyRoomCode == lobbyRoomCode) {
        var msg = this.lobbyRoomList[i].UpdateLobbyGame(gameName);
        return msg;
      }
    }
  }

  static IsExistingRoomCode(lobbyRoomCode) {
    if (this.root === null) {
      return false;
    }

    const lobbyArr = this.lobbyRoomList.filter((lobbyNode) => {
      return lobbyNode.lobbyRoomCode == lobbyRoomCode;
    });

    if (lobbyArr.length > 0) {
      return true;
    } else {
      return false;
    }
  }

  static InitialiseGameData(playerSocketId) {
    for (var i = 0; i < this.lobbyRoomList.length; i++) {
      if (this.lobbyRoomList[i].IsExistingPlayerSocketId(playerSocketId)) {
        console.log("test");
        var lobbyRoomCode = this.lobbyRoomList[i].lobbyRoomCode;
        return this.lobbyGameMap.get(lobbyRoomCode).InitialiseGameData(playerSocketId);
      }
    }
    
    var msg = new IoMessage();
    msg.status = IoMessageStatus.Fail;
    msg.message = "Player not found.";
    return msg;
  }

  static GenerateRoomCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var isRoomCodeValid = true;
    var roomCode = "";

    do {
      // Generate room code (4 alphabets)
      isRoomCodeValid = true;
      for (var i = 0; i < 4; i++) {
        roomCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Check if room code already exists
      if (this.IsExistingRoomCode(roomCode)) {
        isRoomCodeValid = false;
      }
    } while (!isRoomCodeValid);

    return roomCode;
  }
}

module.exports = LobbyTree;
