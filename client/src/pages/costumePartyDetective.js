import React, { useEffect } from "react";
import { useState } from "react";
import { IoMessage, IoMessageStatus } from "../models/ioMessage.js";
import { DiceIcon, RoleIcon, ProfileIcon } from "../assets/assetLibrary.jsx";
import "../css/costumePartyDetective.css";

const CostumePartyDetective = ({ socket }) => {
  const [playerCharacter, setPlayerCharacter] = useState("");
  const [roomList, setRoomList] = useState([]);
  const [isShowingPlayerCharacter, setIsShowingPlayerCharacter] = useState(true);
  const [diceRollResult, setDiceRollResult] = useState("");
  const [currentPlayerTurn, setCurrentPlayerTurn] = useState("");
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState("");
  const [randomEliminationCount, setRandomEliminationCount] = useState(3);
  const [roomCharacterCount, setRoomCharacterCount] = useState(0);
  const [isShowingEndGameContainer, setIsShowingEndGameContainer] = useState(false);
  const [endGameMessage, setEndGameMessage] = useState("");
  const [isEliminated, setIsEliminated] = useState(false);
  const [isShowingNotificationModal, setIsShowingNotificationModal] = useState(false);
  const [notificationText, setNotificationText] = useState("");

  useEffect(() => {
    var msg = new IoMessage();
    msg.status = IoMessageStatus.Normal;
    msg.message = "Requesting to initialise game.";

    socket.emit("initialise-game-alert", msg);
    socket.on("update-game-alert", (receivedMsg) => {
      if (receivedMsg.data.gameStatus == "game-end") {
        setIsShowingEndGameContainer(true);
        setEndGameMessage(receivedMsg.message);
      } else {
        setPlayerCharacter(receivedMsg.data.character.name);
        setRoomList(receivedMsg.data.roomList);
        setCurrentPlayerTurn(receivedMsg.data.currentPlayerTurn.playerNickname);
        setIsPlayerTurn(receivedMsg.data.currentPlayerTurn.playerSocketId == socket.id);

        if (receivedMsg.data.currentPlayerTurn.playerSocketId == socket.id) {
          setNotificationText("Your Turn");
        } else {
          setNotificationText(`${currentPlayerTurn}'s Turn`);
        }
        setDiceRollResult(receivedMsg.data.diceRollResult);
        setRoomCharacterCount(receivedMsg.data.roomCharacterCount);
        setIsEliminated(receivedMsg.data.isEliminated);
        setIsShowingNotificationModal(true);
      }
    });

    socket.on("error-message", (msg) => {
      console.log(msg.message);
    });
  }, []);

  useEffect(() => {
    if (isShowingNotificationModal) {
      const notificationTimer = setTimeout(() => {
        setIsShowingNotificationModal(false);
      }, 7000);

      return () => clearTimeout(notificationTimer);
    }
  }, [isShowingNotificationModal]);

  function MoveCharacter(character, room) {
    var msg = new IoMessage();
    msg.status = IoMessageStatus.Normal;
    msg.message = "Requesting to move character.";
    msg.data = {
      event: "move-character",
      character: character,
      room: room,
    };
    socket.emit("game-event", msg);
  }

  function ClickShowingPlayerCharacterButton() {
    setIsShowingPlayerCharacter(!isShowingPlayerCharacter);
  }

  function ClickCharacterButton(event) {
    if (!isPlayerTurn || isEliminated) {
      return;
    }

    var character = event.target.getAttribute("data-character");
    setSelectedCharacter(character);
  }

  function ClickRoomArea(event) {
    if (!isPlayerTurn || isEliminated) {
      return;
    }

    var room = event.target.getAttribute("data-room");

    if (selectedCharacter != "" && room != null) {
      MoveCharacter(selectedCharacter, room);
      setSelectedCharacter("");
    }
  }

  function ClickEliminateSelectedCharacter() {
    var msg = new IoMessage();
    msg.status = IoMessageStatus.Normal;
    msg.message = "Requesting to eliminate character";
    msg.data = {
      event: "eliminate-character",
      character: selectedCharacter,
    };

    socket.emit("game-event", msg);
  }

  function ClickEliminateRandomCharacter() {
    if (randomEliminationCount < 1) {
      return;
    }
    var msg = new IoMessage();
    msg.status = IoMessageStatus.Normal;
    msg.message = "Requesting to eliminate random character";
    msg.data = {
      event: "eliminate-random-character",
    };

    socket.emit("game-event", msg);
    setRandomEliminationCount(randomEliminationCount - 1);
  }

  return (
    <div className="h-full w-full flex flex-col items-center">
      <div className="h-[5rem] w-full flex justify-start items-center px-5 py-3 mt-5">
        <div className="h-full flex">
          <div
            className={`h-full ${
              diceRollResult == "Black"
                ? "text-black"
                : diceRollResult == "Red"
                ? "text-red-700"
                : diceRollResult == "Green"
                ? "text-lime-700"
                : diceRollResult == "Blue"
                ? "text-blue-700"
                : "text-yellow-700"
            }`}>
            <DiceIcon />
          </div>
          <div className="h-full flex flex-col ml-3 justify-between">
            <span className="text-md font-light">Dice Roll Result</span>
            <span className="text-2xl font-bold">{diceRollResult}</span>
          </div>
        </div>
        <div className="h-full flex ml-10">
          <div className="text-black">
            <ProfileIcon />
          </div>
          <div className="h-full flex flex-col ml-3 justify-between">
            <span className="text-md font-light">Current Player Turn</span>
            <span className="text-2xl font-bold">{currentPlayerTurn}</span>
          </div>
        </div>
      </div>
      <button
        className="h-[3rem] absolute fixed right-10 top-5 rounded text-white"
        onClick={ClickShowingPlayerCharacterButton}>
        <RoleIcon />
      </button>
      {isShowingPlayerCharacter ? (
        <div className="h-[25%] w-[10%] absolute fixed right-5 top-20 bg-white text-black rounded-lg border border-black px-3 py-2 flex flex-col items-center justify-center shadow">
          <div className="h-[50%]">
            <ProfileIcon />
          </div>
          <span className="text-black text-xl mt-3 text-center">{playerCharacter}</span>
        </div>
      ) : (
        <></>
      )}
      <div className="h-[70%] w-[70%] grid grid-cols-3 gap-0 mt-10">
        {roomList.map((room, _index) => (
          <div
            key={room.name}
            data-room={room.name}
            className={`flex flex-wrap justify-center items-center content-center border border-black z-1 ${
              room.name === "Red"
                ? "col-span-2 bg-red-300"
                : room.name === "Green"
                ? "row-span-2 bg-lime-300"
                : room.name === "Blue"
                ? "row-span-2 bg-blue-300"
                : room.name === "Mid"
                ? "bg-gray-300"
                : "col-span-2 bg-yellow-300"
            }`}
            onClick={ClickRoomArea}>
            {room.characterList.map((character) => (
              <button
                key={character.name}
                className={`h-[5rem] min-w-[5rem] max-w-[10rem] text-lg border border-black rounded-lg flex justify-center items-center m-2 text-center px-3 py-2 
                  ${
                    selectedCharacter === character.name ? "bg-gray-300" : "bg-white"
                  } shadow z-10 ${isEliminated ? "cursor-not-allowed" : "cursor-pointer"}`}
                disabled={isEliminated}
                data-character={character.name}
                onClick={ClickCharacterButton}>
                {character.name}
              </button>
            ))}
          </div>
        ))}
      </div>
      {isShowingEndGameContainer ? (
        <div className="w-full">
          <span className="w-full text-center">{endGameMessage}</span>
        </div>
      ) : diceRollResult == "Black" && isPlayerTurn ? (
        <div className="h-[5rem] w-[70%] flex justify-center mt-10">
          <div className="w-[30%] flex flex-col items-center justify-start ml-10 mr-10">
            <button
              className={`h-[3rem] w-full bg-black text-white rounded-lg font-bold text-xl ${
                randomEliminationCount < 1 ? "disabled" : "enabled"
              }`}
              onClick={ClickEliminateRandomCharacter}>
              Eliminate Random
            </button>
            <span className="text-md">Remaining Count: {randomEliminationCount}/3</span>
          </div>
          <button
            className="h-[3rem] w-[30%] bg-red-700 text-white rounded-lg ml-10 mr-10 font-bold text-xl"
            onClick={ClickEliminateSelectedCharacter}>
            {roomCharacterCount > 1 ? "Eliminate Selected" : "Eliminate Ownself"}
          </button>
        </div>
      ) : (
        <></>
      )}

      {/* Notification Modal */}
      {isShowingNotificationModal ? (
        <div className="h-full w-full flex justify-center items-center absolute">
          <div className="notification-modal-backdrop"></div>
          <div className="notification-modal">
            <span>{notificationText}</span>
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

export default CostumePartyDetective;
