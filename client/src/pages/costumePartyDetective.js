import React, { useEffect } from "react";
import { useState } from "react";
import { IoMessage, IoMessageStatus } from "../models/ioMessage.js";
import { DiceIcon, RoleIcon, ProfileIcon } from "../assets/assetLibrary.jsx";

const CostumePartyDetective = ({ socket }) => {
  const [playerCharacter, setPlayerCharacter] = useState("");
  const [roomList, setRoomList] = useState([]);
  const [isShowingPlayerCharacter, setIsShowingPlayerCharacter] = useState(true);
  const [diceRollResult, setDiceRollResult] = useState("");

  useEffect(() => {
    var msg = new IoMessage();
    msg.status = IoMessageStatus.Normal;
    msg.message = "Requesting to initialise game.";

    socket.emit("initialise-game-alert", msg);
    socket.on("initialise-game", (msg) => {
      setPlayerCharacter(msg.data.character.name);
      setRoomList(msg.data.roomList);
    });

    socket.on("player-turn", (msg) => {});
  }, []);

  function ClickShowingPlayerCharacterButton () {
    setIsShowingPlayerCharacter(!isShowingPlayerCharacter);
  }

  return (
    <div className="h-full w-full flex justify-center items-center">
      <div className="h-[5rem] w-fit-content absolute fixed left-10 top-5 flex items-center">
        <div className="h-[3rem]">
          <DiceIcon />
        </div>
      </div>
      <button className="h-[3rem] absolute fixed right-10 top-5 rounded text-white" onClick={ClickShowingPlayerCharacterButton}>
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
      <div className="h-[60%] w-[60%] grid grid-cols-3 gap-0">
        {roomList.map((room, index) => (
          <div
            key={index}
            room-name={room.name}
            className={`flex flex-wrap justify-center items-center content-center border border-black ${
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
            // onClick={onRoomSelected}
          >
            {room.characterList.map((character) => (
              <div
                key={character.id}
                className={`h-[5rem] min-w-[5rem] max-w-[10rem] text-lg border border-black rounded-lg flex justify-center items-center m-2 text-center px-3 py-2"
                }`}
                character-id={character.id}
                // onClick={onCharacterSelected}
              >
                {character.name}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CostumePartyDetective;
