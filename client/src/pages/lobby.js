import React, { useState, useEffect } from "react";
import { Route, useLocation, useNavigate } from "react-router-dom";
import { IoMessageStatus, IoMessage } from "../models/ioMessage";

const Lobby = ({ socket }) => {
  var navigate = useNavigate();
  var lobbyData = useLocation();
  const [roomCode, setRoomCode] = useState("");
  const [gameInformationList, setGameInformationList] = useState([]);
  const [selectedGame, setSelectedGame] = useState("");
  const [selectedGameIndex, setSelectedGameIndex] = useState(-1);
  const [playerList, setPlayerList] = useState([]);
  const [playerNickname, setPlayerNickname] = useState("");
  const [defaultPlayerNickname, setDefaultPlayerNickname] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [isUpdateRequired, setIsUpdateRequired] = useState(false);
  const [isPlayerAction, setIsPlayerAction] = useState(false);

  const [lobbyLogs, setLobbyLogs] = useState([]);
  const [isShowingLobbyLogs, setIsShowingLobbyLogs] = useState(true);

  useEffect(() => {
    if (lobbyData.state == null || lobbyData.state == undefined) {
      navigate("/");
    } else {
      setRoomCode(lobbyData.state.roomCode);
      fetch("/data/gameInformation.json")
        .then((response) => response.json())
        .then((data) => setGameInformationList(data))
        .catch((error) => console.error(error));
    }
  }, []);

  useEffect(() => {
    if (roomCode != "") {
      GetPlayerInformation();
      GetPlayerList();
      GetLobbyLogs();
      GetLobbyGame();

      socket.on("lobby-update-alert", (_msg) => {
        setIsUpdateRequired(true);
      });

      socket.on("start-game-alert", (msg) => {
        var url = msg.data.url;
        navigate(url);
      })
    }
  }, [roomCode, gameInformationList]);

  useEffect(() => {
    if (roomCode != "") {
      if (isUpdateRequired) {
        GetPlayerList();
        GetLobbyLogs();
        GetLobbyGame();
        setIsUpdateRequired(false);
      }
    }
  }, [isUpdateRequired]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      var msg = new IoMessage();
      msg.status = IoMessageStatus.Normal;
      msg.data = {
        playerSocketId: socket.id,
        playerNickname: playerNickname,
      };
      msg.message = "Requesting to update player nickname.";

      fetch("/lobby/api/set-player-nickname", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(msg),
      }).catch((error) => console.error(error));

      setIsPlayerAction(false);
    }, 3000);

    return () => clearTimeout(delayDebounceFn);
  }, [playerNickname]);

  useEffect(() => {
    if (isPlayerAction) {
      var msg = new IoMessage();
      msg.status = IoMessageStatus.Normal;
      msg.data = {
        lobbyRoomCode: roomCode,
        gameName: selectedGame,
      };
      msg.message = "Requesting to update lobby game.";

      fetch("/lobby/api/set-lobby-game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(msg),
      }).catch((error) => console.error(error));

      setIsPlayerAction(false);
    }
  }, [selectedGame]);

  function GetPlayerList() {
    fetch(`/lobby/api/get-player-list/${roomCode}`)
      .then((response) => response.json())
      .then((msg) => setPlayerList(msg.data))
      .catch((error) => console.error(error));
  }

  function GetPlayerInformation() {
    fetch(`/lobby/api/get-player-information/${socket.id}`)
      .then((response) => response.json())
      .then((msg) => {
        setDefaultPlayerNickname(msg.data.playerNickname);
        setIsHost(msg.data.isHost);
      })
      .catch((error) => console.error(error));
  }

  function GetLobbyLogs() {
    fetch(`/lobby/api/get-lobby-logs/${roomCode}`)
      .then((response) => response.json())
      .then((msg) => setLobbyLogs(msg.data))
      .catch((error) => console.error(error));
  }

  function GetLobbyGame() {
    fetch(`/lobby/api/get-lobby-game/${roomCode}`)
      .then((response) => response.json())
      .then((msg) => {
        setSelectedGame(msg.data.selectedGame);

        if (msg.data.selectedGame == "") {
          setSelectedGameIndex(-1);
        } else {
          for (var index = 0; index < gameInformationList.length; index++) {
            if (gameInformationList[index].name == msg.data.selectedGame) {
              setSelectedGameIndex(index);
              break;
            }
          }
        }
      })
      .catch((error) => console.error(error));
  }

  function ToggleActivityContainer() {
    setIsShowingLobbyLogs(!isShowingLobbyLogs);
  }

  function InputPlayerNickname(event) {
    const nickname = event.target.value;
    setPlayerNickname(nickname);
    setIsPlayerAction(true);
  }

  function SelectGame(event) {
    var gameIndex = parseInt(event.target.value);
    setSelectedGameIndex(gameIndex);

    if (event.target.value != -1) {
      gameIndex = gameIndex + 1;
      setSelectedGame(event.target[gameIndex].getAttribute("data-name"));
    } else {
      setSelectedGame("");
    }
    setIsPlayerAction(true);
  }

  function ClickStartGameButton() {
    var msg = new IoMessage();
    msg.status = IoMessageStatus.Normal;
    msg.message = "Requesting to start game.";
    msg.data = {
      roomCode: roomCode,
    };

    socket.emit("start-game", msg);
  }

  return (
    <div className="h-full w-full flex">
      <div
        className={`h-full ${
          isShowingLobbyLogs ? "w-[80%]" : "w-full"
        } flex flex-col items-center px-5 py-10`}>
        <div className="w-full flex flex-col items-center">
          <h2>
            <span>ROOM CODE</span>
          </h2>
          <span className="text-[5rem]">{roomCode}</span>
        </div>
        <div className="h-[80%] w-full overflow-auto">
          <div className="w-full flex flex-col items-center mt-10">
            <h2>
              <span>YOUR INFORMATION</span>
            </h2>
            <span className="text-xl">Enter Your Name</span>
            <input
              type="text"
              className="w-[25%] border border-black rounded rounded-lg text-center py-2 px-5 mt-2 focus:outline-none"
              placeholder={defaultPlayerNickname}
              onChange={InputPlayerNickname}
            />
          </div>
          <div className="w-full flex flex-col items-center mt-10">
            <h2>
              <span>LOBBY INFORMATION</span>
            </h2>
            <div className="h-[15rem] w-full flex justify-between">
              <div className="w-[48%] flex flex-col justify-between">
                <select
                  className="max-h-[25%] w-full border border-gray-300 px-5 py-2"
                  onChange={SelectGame}
                  value={selectedGameIndex}
                  disabled={!isHost}>
                  <option key={-1} value={-1} data-name={-1}>
                    Select Game
                  </option>
                  {gameInformationList.map((gameInfo, index) => (
                    <option key={index} value={index} data-name={gameInfo.name}>
                      {gameInfo.name}
                    </option>
                  ))}
                </select>
                {selectedGameIndex != -1 ? (
                  <div className="h-[70%] w-full flex relative bg-white border border-gray-300">
                    <div className="h-full w-full absolute bg-white opacity-25">
                      <img
                        src={gameInformationList[selectedGameIndex].imageUrl}
                        className="h-full w-full object-cover"></img>
                    </div>
                    <span className="w-full absolute self-center text-center py-3 px-5">
                      {gameInformationList[selectedGameIndex].description}
                    </span>
                  </div>
                ) : (
                  <></>
                )}
              </div>
              <div className="h-full w-[48%] flex flex-col border border-gray-300">
                <span className="h-fit-content w-full bg-white shadow font-bold text-xl px-5 py-2 z-10">
                  PLAYER LIST
                </span>
                {playerList.map((player, index) => (
                  <span
                    key={index}
                    className={`w-full ${index % 2 == 0 ? "bg-gray-200" : "bg-white"} ${
                      player.isHost ? "italic" : "not-italic"
                    } text-md px-2 py-3 z-1`}>
                    {player.playerNickname + (player.isHost ? " (Host)" : "")}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {isHost ? (
        <button
          className={`h-[10%] w-[20%] absolute fixed right-0 bottom-0 ${
            selectedGameIndex != -1 ? "bg-green-700 enabled hover:bg-green-800" : "bg-gray-300"
          } text-white text-2xl`}
          disabled={selectedGameIndex == -1}
          onClick={ClickStartGameButton}>
          START GAME
        </button>
      ) : (
        <></>
      )}
      {isShowingLobbyLogs ? (
        <div
          className={`${
            isHost ? "h-[90%]" : "h-full"
          } w-[20%] bg-white flex flex-col border border-l-2 border-gray-300`}>
          <div className="flex justify-between px-4 py-2 shadow z-10">
            <span className="font-bold text-xl">ACTIVITY</span>
            <button type="button" className="self-center" onClick={ToggleActivityContainer}>
              &#10006;
            </button>
          </div>

          <div className="w-full flex flex-col overflow-auto">
            {lobbyLogs.map((logs, index) => (
              <span
                key={index}
                className={`${index % 2 == 0 ? "bg-gray-200" : "bg-white"} text-md px-2 py-3 z-1`}>
                {logs}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="bg-red-700 rounded rounded-lg rounded-tr-none rounded-br-none absolute fixed right-0 top-5 px-5 py-3"
          onClick={ToggleActivityContainer}>
          <span className="self-center text-white">Activity</span>
        </button>
      )}
    </div>
  );
};

export default Lobby;
