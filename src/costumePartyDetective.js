import React, { useEffect } from "react";
import { useState } from "react";

class Character {
  constructor(id) {
    this.id = id;
    this.isPlayer = false;
    this.playerId = -1;
    this.isAlive = true;
    this.currentRoom = "";
  }
}

class Room {
  constructor(id) {
    this.id = id;
    this.color = "";
    this.capacity = 0;
    this.characterList = [];
  }
}

const CostumePartyDetective = () => {
  const [isSetup, setIsSetup] = useState(true);
  const maxPlayerNum = 8;
  const maxPlayerList = [];
  const [selectedPlayerNum, setSelectedPlayerNum] = useState(2);
  const gameProps = { playerNum: selectedPlayerNum };

  for (let i = 2; i <= maxPlayerNum; i++) {
    maxPlayerList.push(i);
  }

  function onSelectedPlayerNumChange(event) {
    let value = parseInt(event.target.value);
    setSelectedPlayerNum(value);
  }

  return (
    <div className="h-full w-full">
      {isSetup === true ? (
        <div className="h-full w-full flex justify-center items-center bg-gray-200">
          {/* TODO: Insert background image here */}
          {/* <img
            className="h-full w-full absolute top-0 left-0 opacity-40"
            src={require("./assets/costume-party-detective-background.png")}></img> */}
          <div className="h-1/4 w-2/6 bg-white p-5 rounded flex flex-col items-center shadow rounded-xl absolute opacity-90">
            <span className="text-lg font-bold p-2">Select Number of Players</span>
            <select className="w-1/2 p-1" onChange={onSelectedPlayerNumChange}>
              {maxPlayerList.map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
            <button
              className="w-1/2 p-2 text-center absolute bottom-5 rounded bg-red-700 text-white"
              onClick={() => setIsSetup(false)}>
              Start Game
            </button>
          </div>
        </div>
      ) : (
        <Game props={gameProps} />
      )}
    </div>
  );
};

function Game({ props }) {
  let playerNum = props.playerNum;
  const maxCharacters = 20;
  const [characterList, setCharacterList] = useState(
    Array.from({ length: maxCharacters }, (_value, index) => new Character(index))
  );
  const [playerList, setPlayerList] = useState([]);
  const [allCharacterList, setAllCharacterList] = useState([]);
  const roomColorList = ["red", "green", "blue", "mid", "yellow"];
  const [roomList, setRoomList] = useState([]);
  const [gameStatus, setGameStatus] = useState("setup");
  const [currentPlayerCardReveal, setCurrentPlayerCardReveal] = useState(undefined);
  const [playerSequence, setPlayerSequence] = useState(
    Array.from({ length: playerNum }, (_value, index) => index)
  );

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  useEffect(() => {
    if (playerList.length < playerNum) {
      // Setting players' characters
      let tempPlayerList = [];
      let tempCharacterList = [...characterList];

      while (tempPlayerList.length < playerNum) {
        let rng = Math.floor(Math.random() * tempCharacterList.length);
        let selectedCharacter = { ...tempCharacterList[rng] };
        selectedCharacter.isPlayer = true;
        selectedCharacter.playerId = tempPlayerList.length;
        tempPlayerList.push(selectedCharacter);
        tempCharacterList.splice(rng, 1);
      }

      setPlayerList(tempPlayerList);
      setCharacterList(tempCharacterList);
      setAllCharacterList([...tempPlayerList, ...tempCharacterList]);
    }
  }, [playerNum]);

  useEffect(() => {
    // Initialize rooms when all characters are set
    if (allCharacterList.length > 0) {
      let availableRoomList = Array.from(roomColorList, (_value, index) => new Room(index));
      let tempRoomList = [];
      let tempCharacterList = [...allCharacterList];
      let roomMaxCapacity = Math.ceil(maxCharacters / roomColorList.length);

      // Assign all characters to rooms
      tempCharacterList.forEach((character) => {
        if (character.currentRoom === "") {
          let rngRoomIndex = Math.floor(Math.random() * availableRoomList.length);
          character.currentRoom = availableRoomList[rngRoomIndex].color;
          availableRoomList[rngRoomIndex].capacity++;
          availableRoomList[rngRoomIndex].characterList.push(character);

          if (availableRoomList[rngRoomIndex].capacity >= roomMaxCapacity) {
            availableRoomList[rngRoomIndex].color = roomColorList[tempRoomList.length];
            tempRoomList.push(availableRoomList[rngRoomIndex]);
            availableRoomList.splice(rngRoomIndex, 1);
          }
        }
      });

      setRoomList(tempRoomList);

      async function pause() {
        await sleep(2000);
        setGameStatus("player card reveal");
        setCurrentPlayerCardReveal(playerList[0]);
      }
      pause();
    }
  }, [allCharacterList]);

  useEffect(() => {
    if (gameStatus === "player card reveal") {
      async function revealWait() {
        for (const player of playerList) {
          setCurrentPlayerCardReveal(player);
          await sleep(5000); // Wait for 5 seconds before moving to the next player
        }
      }

      revealWait();
    }
  }, [gameStatus]);
  // useEffect(() => {
  //   console.log(roomList);
  // }, [roomList]);

  return (
    <div className="h-full w-full flex justify-center items-center bg-gray-200">
      <div className="h-[80%] w-[80%] grid grid-cols-3 gap-0">
        {roomList.map((room) => (
          <div
            key={"room: " + room.color}
            className={`flex flex-wrap justify-center items-center ${
              room.color === "red"
                ? "col-span-2 bg-red-300"
                : room.color === "green"
                ? "row-span-2 bg-lime-300"
                : room.color === "blue"
                ? "row-span-2 bg-blue-300"
                : room.color === "mid"
                ? "bg-gray-300"
                : "col-span-2 bg-yellow-300"
            }`}>
            {room.characterList.map((character) => (
              <div className="h-[3rem] w-[3rem] bg-white text-black text-lg border border-black rounded-lg flex justify-center items-center p-2 m-2 hover:bg-gray-200">
                {character.id}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Player Card Reveal Section */}
      {gameStatus === "player card reveal" ? (
        <div className="h-full w-full absolute top-0 left-0">
          <div className="h-full w-full absolute top-0 left-0 fixed bg-gray-500 opacity-30 z-10"></div>
          <div className="h-full w-full flex flex-col justify-center items-center p-10">
            <span className="text-[3rem] font-bold z-[20]">
              Player {currentPlayerCardReveal.playerId + 1} Card Reveal
            </span>
            <div className="h-[75%] w-[30%] bg-white rounded-xl z-[20] m-10 flex justify-center items-center">
              <span className="text-[10rem] font-bold">{currentPlayerCardReveal.id}</span>
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}

export default CostumePartyDetective;
