const GameList = require("./gameList");
const { IoMessage, IoMessageStatus } = require("./ioMessage.js");

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

    // Roll dice for the first player
    this.diceRollResult = this.RollDice();
  }

  GetGameDetails(playerSocketId) {
    for (var i = 0; i < this.characterList.length; i++) {
      if (this.characterList[i].playerSocketId == playerSocketId) {
        var msg = new IoMessage();
        msg.status = IoMessageStatus.Success;
        msg.message = "Game details retrieved successfully.";
        msg.data.character = this.characterList[i];
        msg.data.roomList = this.roomList;
        msg.data.playerSequence = this.playerSequence;
        msg.data.currentPlayerTurn = this.playerSequence[0];
        msg.data.diceRollResult = this.diceRollResult;
        return msg;
      }
    }
    
    var msg = new IoMessage();
    msg.status = IoMessage.Fail;
    msg.message = "Player not found.";
    return msg;
  }

  EventHandler(data) {
    var event = data.event;
    var msg;

    switch (event) {
      case "move-character":
        msg = this.MoveCharacter(data);
        break;
      default:
        msg = new IoMessage();
        msg.status = IoMessageStatus.Fail;
        msg.message = "Event invalid.";
        break;
    }
    
    console.log(msg);
    return msg;
  }

  MoveCharacter(data) {
    var characterName = data.character;
    var character = {};
    var newRoom = data.room;
    var currentRoom = "";
    var characterIndex = -1;
    var isFound = false;
    var isValidMove = false;
    var msg = new IoMessage();

    // Check if dice roll is black
    if (this.diceRollResult == "Black") {
      msg.status = IoMessageStatus.Fail;
      msg.message = "Invalid move. Current dice roll result is black.";
    }

    // Check if the character can be moved to the new room
    // Retrieve values for array splicing
    for (var i = 0; i < this.roomList.length; i++) {
      var connectingRooms = this.roomList[i].connectingRooms;

      for (var j = 0; j < this.roomList[i].characterList.length; j++) {
        if (this.roomList[i].characterList[j].name == characterName) {
          isFound = true;

          // If the current room is connected to the new room
          if (connectingRooms.includes(newRoom) && (newRoom == this.diceRollResult || this.roomList[i].name == this.diceRollResult)) {
            character = this.roomList[i].characterList[j];
            currentRoom = this.roomList[i].name;
            characterIndex = j;
            msg.status = IoMessageStatus.Success;
            msg.message = "Character moved successfully.";
            isValidMove = true;
            break;
          }
        }
      }

      if (isFound) {
        break;
      }
    }

    if (isFound && isValidMove) {
      // Find the previous and new rooms in the room list
      for (var i = 0; i < this.roomList.length; i++) {
        // Add the character to the new room
        if (this.roomList[i].name == newRoom) {
          this.roomList[i].characterList.push(character);
        }
        // Remove the character from the previous room
        else if (this.roomList[i].name == currentRoom) {
          this.roomList[i].characterList.splice(characterIndex, 1);
        }
      }

      this.FinishPlayerTurn();
    }
    else if (isFound && !isValidMove) {
      msg.status = IoMessageStatus.Fail;
      msg.message = "Character's current room is not connected to the selected room. Please try again.";
    }
    else {
      msg.status = IoMessageStatus.Fail;
      msg.message = "Character not found.";
    }
    return msg;
  }

  FinishPlayerTurn() {
    this.diceRollResult = this.RollDice();
  }

  RollDice() {
    var randomDiceIndex = Math.floor(Math.random() * this.diceRolls.length);
    return this.diceRolls[randomDiceIndex];
  }
}

module.exports = {
  CostumePartyDetective,
};
