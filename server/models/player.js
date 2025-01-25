class Player {
  constructor(playerSocketId, playerNickname) {
    this.playerSocketId = playerSocketId;
    this.playerNickname = playerNickname;
  }
}

module.exports = {
  Player,
};
