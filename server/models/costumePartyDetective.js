const GameList = require("./gameList");
const { IoMessage, IoMessageStatus } = require("./ioMessage.js");

class Character {
  constructor(name, playerSocketId = null) {
    this.name = name;
    this.playerSocketId = playerSocketId;
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
      while (this.characterList[randomNum].playerSocketId != undefined) {
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
        tempCharacterList = tempCharacterList.filter(
          (character) => character.name != tempCharacterList[randomNum].name
        );
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

        // Check if there are other characters in the room
        var isFound = false;
        // console.log(this.playerSequence[0]);
        for (var roomIndex = 0; roomIndex < this.roomList.length; roomIndex++) {
          for (
            var characterIndex = 0;
            characterIndex < this.roomList[roomIndex].characterList.length;
            characterIndex++
          ) {
            if (
              this.roomList[roomIndex].characterList[characterIndex].playerSocketId ==
              this.playerSequence[0].playerSocketId
            ) {
              msg.data.roomCharacterCount = this.roomList[roomIndex].characterList.length;
              isFound = true;
              break;
            }
          }

          if (isFound) {
            break;
          }
        }
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
      case "eliminate-character":
        msg = this.EliminateCharacter(data);
        break;
      case "eliminate-random-character":
        msg = this.EliminateRandomCharacter();
        break;
      default:
        msg = new IoMessage();
        msg.status = IoMessageStatus.Fail;
        msg.message = "Event invalid.";
        break;
    }

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
          if (
            connectingRooms.includes(newRoom) &&
            (newRoom == this.diceRollResult || this.roomList[i].name == this.diceRollResult)
          ) {
            character = this.roomList[i].characterList[j];
            currentRoom = this.roomList[i].name;
            characterIndex = j;
            msg.status = IoMessageStatus.Success;
            msg.message = "Character moved successfully.";
            msg.data = {
              gameStatus: "game-continue",
            };
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
    } else if (isFound && !isValidMove) {
      msg.status = IoMessageStatus.Fail;
      msg.message =
        "Character's current room is not connected to the selected room. Please try again.";
    } else {
      msg.status = IoMessageStatus.Fail;
      msg.message = "Character not found.";
    }
    return msg;
  }

  EliminateCharacter(data) {
    var currentPlayerTurn = this.playerSequence[0];
    var selectedCharacter = data.character;

    // If the selected character is ownself, return error
    if (currentPlayerTurn.name == selectedCharacter) {
      var msg = new IoMessage();
      msg.status = IoMessageStatus.Fail;
      msg.message = "Character selected is ownself! Please choose a different character.";
      return msg;
    }

    // Find current player's room
    for (var i = 0; i < this.roomList.length; i++) {
      var roomCharacterList = this.roomList[i].characterList.filter(
        (character) =>
          character.playerSocketId != null &&
          character.playerSocketId == currentPlayerTurn.playerSocketId
      );

      // If its the player's room
      if (roomCharacterList.length > 0) {
        // Find the character to be eliminated
        for (
          var characterIndex = 0;
          characterIndex < this.roomList[i].characterList.length;
          characterIndex++
        ) {
          if (this.roomList[i].characterList[characterIndex].name == selectedCharacter) {
            // Remove eliminated player from the player sequence
            if (this.roomList[i].characterList[characterIndex].playerSocketId != undefined) {
              this.playerSequence = this.playerSequence.filter(
                (player) =>
                  player.playerSocketId !=
                  this.roomList[i].characterList[characterIndex].playerSocketId
              );

              // All players other than the current player are eliminated
              if (this.playerSequence.length == 1) {
                var msg = new IoMessage();
                msg.status = IoMessageStatus.Success;
                msg.message = "The last player has been eliminated!";
                msg.data = {
                  winnerSocketId: this.playerSequence[0].playerSocketId,
                  gameStatus: "game-end",
                };
                return msg;
              }
            }

            var msg = new IoMessage();
            msg.status = IoMessageStatus.Success;
            msg.message = "Character eliminated successfully.";
            msg.data = {
              eliminatedCharacter: selectedCharacter,
              eliminatedPlayerSocketId:
                this.roomList[i].characterList[characterIndex].playerSocketId,
              gameStatus: "game-continue",
            };

            // Remove character from room
            this.roomList[i].characterList.splice(characterIndex, 1);
            this.FinishPlayerTurn();
            return msg;
          }
        }
      }
    }

    var msg = new IoMessage();
    msg.status = IoMessageStatus.Fail;
    msg.message = "Player character not found.";
    return msg;
  }

  EliminateRandomCharacter() {
    var tempList = [];

    // Combine all characters in all rooms
    this.roomList.forEach((room) => {
      room.characterList.forEach((character) => {
        if (character.playerSocketId == null) {
          tempList.push(character);
        }
      });
    });

    // Get random character
    var randomIndex = Math.floor(Math.random() * tempList.length);
    var eliminatedCharacter = tempList[randomIndex];

    // Eliminate random character
    for (var i = 0; i < this.roomList.length; i++) {
      for (
        var characterIndex = 0;
        characterIndex < this.roomList[i].characterList.length;
        characterIndex++
      ) {
        if (this.roomList[i].characterList[characterIndex].name == eliminatedCharacter.name) {
          this.roomList[i].characterList.splice(characterIndex, 1);
          this.FinishPlayerTurn();

          var msg = new IoMessage();
          msg.status = IoMessageStatus.Success;
          msg.message = "Random character eliminated successfully.";
          return msg;
        }
      }
    }

    var msg = new IoMessage();
    msg.status = IoMessageStatus.Fail;
    msg.message = "Unexpected error occurred.";
    return msg;
  }

  FinishPlayerTurn() {
    this.diceRollResult = this.RollDice();

    // Remove the first player in the sequence and add it as the last player
    var player = this.playerSequence.splice(0, 1);
    this.playerSequence.push(player[0]);
  }

  RollDice() {
    var randomDiceIndex = Math.floor(Math.random() * this.diceRolls.length);
    return this.diceRolls[randomDiceIndex];
  }
}

module.exports = {
  CostumePartyDetective,
};
