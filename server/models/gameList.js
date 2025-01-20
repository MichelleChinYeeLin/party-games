const { IoMessage, IoMessageStatus } = require("./ioMessage");

class GameList {
  static gameList = [];

  static GetGameInformation(gameName) {
    for (var i = 0; i < this.gameList.length; i++) {
      if (this.gameList[i].name == gameName) {
        var msg = new IoMessage();
        msg.status = IoMessageStatus.Success;
        msg.message = "Game information retrieved successfully.";
        msg.data = this.gameList[i];
        return msg;
      }
    }

    var msg = new IoMessage();
    msg.status = IoMessageStatus.Fail;
    msg.message = "Game information not found.";
    return msg;
  }

  static ReadGameInfoJson() {
    var fs = require("fs"),
      json;
    var filePath = __dirname + "/../data/gameInformation.json";
    var gameInfoFile = fs.readFileSync(filePath, "utf8");
    this.gameList = JSON.parse(gameInfoFile);
  }

  static VerifyGameExists(gameName) {
    var games = this.gameList.filter((game) => game.name == gameName);
    if (games.length > 0) {
      return true;
    } else {
      return false;
    }
  }
}

module.exports = GameList;
