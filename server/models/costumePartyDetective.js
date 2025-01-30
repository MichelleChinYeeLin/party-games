const GameList = require("./gameList");

class Character {
  constructor(name, playerSocketId = null) {
    this.name = name;
    this.playerSocketId = playerSocketId;
    this.isAlive = true;
  }
}

class Room {
  constructor(name, connectingRooms) {
    this.name = name;
    this.characterList = [];
    this.connectingRooms = connectingRooms;
  }

  AddCharacter(character) {
    this.characterList.push(character);
  }

  RemoveCharacter(removeCharacter) {
    this.characterList = this.characterList.filter(
      (character) => character.name != removeCharacter.name
    );
  }
}

class CostumePartyDetective {
  constructor(playerList) {
    // Get Costume Party Detective game details
    var gameInfoMsg = GameList.GetGameInformation("Costume Party Detective");
    this.diceRolls = gameInfoMsg.data.details.diceRolls;
    this.playerList = playerList;
    this.characterList = [];
    this.roomList = [];
    var characterNameList = gameInfoMsg.data.details.characterList;
    var roomNameList = gameInfoMsg.data.details.roomList;

    // Randomise player sequence
    this.playerSequence = [];
    var tempPlayerList = playerList;
    while (tempPlayerList.length > 0) {
      var randomNum = Math.floor(Math.random() * tempPlayerList.length);
      var player = tempPlayerList[randomNum];
      this.playerSequence.push(player);
      tempPlayerList = tempPlayerList.filter(
        (tempPlayer) => tempPlayer.playerSocketId != player.playerSocketId
      );
    }

    // Initialise characters
    characterNameList.forEach((character) => {
      var newCharacter = new Character(character);
      this.characterList.push(newCharacter);
    });

    // Randomise players' characters
    playerList.forEach((player) => {
      var randomNum = Math.floor(Math.random() * this.characterList.length);

      // If character is already assigned to another player
      while (this.characterList[randomNum].playerSocketId != null) {
        randomNum = Math.floor(Math.random() * this.characterList.length);
      }
      this.characterList[randomNum].playerSocketId = player.playerSocketId;
    });

    // Randomise characters' room
    var tempCharacterList = this.characterList;
    var roomCharacterNum = tempCharacterList.length / roomNameList.length;
    roomNameList.forEach((room) => {
      var connectingRooms = [];
      switch (room) {
        case "Red":
          connectingRooms = ["Blue", "Green", "Mid"];
          break;
        case "Yellow":
          connectingRooms = ["Blue", "Green", "Mid"];
          break;
        case "Blue":
          connectingRooms = ["Red", "Yellow", "Mid"];
          break;
        case "Green":
          connectingRooms = ["Red", "Yellow", "Mid"];
          break;
        case "Mid":
          connectingRooms = ["Blue", "Green", "Red", "Yellow"];
          break;
      }

      var newRoom = new Room(room, connectingRooms);

      while (newRoom.characterList.length < roomCharacterNum) {
        var randomNum = Math.floor(Math.random() * tempCharacterList.length);
        newRoom.characterList.push(tempCharacterList[randomNum]);
        tempCharacterList = tempCharacterList.filter((character) => character.name != tempCharacterList[randomNum].name);
      }

      this.roomList.push(newRoom);
    });
  }

  EventHandler(msg) {
    var data = msg.data;
    var event = data.event;

    switch (event) {
      case "move-character":
        MoveCharacter(data);
        break;
      default:
        break;
    }
  }

  MoveCharacter(data) {}
}

module.exports = {
  CostumePartyDetective,
};
