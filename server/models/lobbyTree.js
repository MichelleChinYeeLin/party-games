class PlayerNode {
  constructor(playerSocketId, playerNickname) {
    this.playerSocketId = playerSocketId;
    this.playerNickname = playerNickname;
  }
}

class LobbyNode {
  constructor(lobbyRoomCode) {
    this.lobbyRoomCode = lobbyRoomCode;
    this.playerList = [];
  }

  AddPlayer(playerSocketId, playerNickname = "") {
    if (playerNickname == "") {
      playerNickname = "Player " + (this.playerList.length + 1);
    }
    this.playerList.push(new PlayerNode(playerSocketId, playerNickname));
  }

  RemovePlayer(playerSocketId) {
    this.playerList = this.playerList.filter((playerNode) => {
      return playerNode.playerSocketId != playerSocketId;
    });
  }

  SetPlayerNickname(playerSocketId, playerNickname) {
    // Check if another player in the lobby has the same nickname
    const samePlayerNicknameArr = this.playerList.filter((player) => {
      return player.playerNickname == playerNickname;
    });

    // If a player with the same nickname already exists
    if (samePlayerNicknameArr.length > 0) {
      return false;
    }

    for (var i = 0; i < this.playerList.length; i++) {
      if (this.playerList[i].playerSocketId == playerSocketId) {
        this.playerList[i].playerNickname = playerNickname;
        return true;
      }
    }
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

  static AddPlayerToLobby(lobbyRoomCode, playerData) {
    // Check if player socket id already exists
    for (var i = 0; i < this.lobbyRoomList.length; i++) {
        if (this.lobbyRoomList[i].IsExistingPlayerSocketId) {
            return false;
        }
    }

    // Add lobby if lobby does not exist
    if (!this.IsExistingRoomCode(lobbyRoomCode)) {
      this.lobbyRoomList.push(new LobbyNode(lobbyRoomCode));
    }

    // Add player to selected lobby
    for (var i = 0; i < this.lobbyRoomList.length; i++) {
      if (this.lobbyRoomList[i].lobbyRoomCode == lobbyRoomCode) {
        this.lobbyRoomList[i].AddPlayer(playerData.playerSocketId);
        return;
      }
    }
  }

  static RemovePlayerFromLobby(playerSocketId) {
    var isLobbyEmpty = false;

    for (var i = 0; i < this.lobbyRoomList.length; i++) {
      for (var j = 0; j < this.lobbyRoomList[i].playerList.length; j++) {
        if (this.lobbyRoomList[i].IsExistingPlayerSocketId(playerSocketId)) {
          this.lobbyRoomList[i].RemovePlayer(playerSocketId);
        }

        if (this.lobbyRoomList[i].IsEmptyPlayerList()) {
          isLobbyEmpty = true;
        }
        break;
      }
    }

    // If the last player has left, remove the lobby
    if (isLobbyEmpty) {
      this.lobbyRoomList = this.lobbyRoomList.filter((lobbyNode) => {
        return lobbyNode.playerList.length > 0;
      });
    }
  }

  static UpdatePlayerNickname(lobbyRoomCode, playerSocketId, playerNickname) {
    for (var i = 0; i < this.lobbyRoomList.length; i++) {
      if (this.lobbyRoomList[i].lobbyRoomCode == lobbyRoomCode) {
        return this.lobbyRoomList[i].SetPlayerNickname(playerSocketId, playerNickname);
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
