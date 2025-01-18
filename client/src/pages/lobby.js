import React, { useState, useEffect } from "react";
import "../index.css";
const {IoMessageStatus, IoMessage } = require("../models/ioMessage.js");

const Lobby = ({ socket }) => {
  const gameInformationList = [
    {
      name: "Costume Party Detective",
      description:
        "You have been invited to a costume party. Because of the elaborate costumers, you do not know anyone's identity except your own. Be the last player standing.",
      imageUrl: "/assets/images/costume-party-detective-background.png",
    },
  ];

  const [isShowingJoinDetails, setIsShowingJoinDetails] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Socket event listeners
  useEffect(() => {
    socket.on("message", (msg) => {
      if (msg.data.event === "joinRoom") {
        setIsLoading(false)
        if (msg.status == IoMessageStatus.Success) {
          // TODO Redirect to room lobby page
          console.log(msg.message);
        }
        else {
          console.log(msg.message);
          // TODO Add notification message for error
        }
      }
      else if (msg.data.event === "createRoom") {
        setIsLoading(false);
        if (msg.status == IoMessageStatus.Success) {
          // TODO Redirect to room lobby page
          console.log(msg.message);
        }
        else {
          console.log(msg.message);
        }
      }
    });
  }, []);

  function ToggleDetailsContainer(event) {
    const containerType = event.target.getAttribute("data-buttontype");
    if (containerType === "create") {
      setIsShowingJoinDetails(false);
    } else {
      setIsShowingJoinDetails(!isShowingJoinDetails);
      setRoomCode("");
    }
  }

  function ClickBtnCreateRoom() {
    setIsLoading(true);
    var msg = new IoMessage();
    msg.message = "Requesting to create new lobby.";
    msg.status = IoMessageStatus.Normal;
    socket.emit("create-room", msg);
  }

  function ClickBtnJoinRoom() {
    setIsLoading(true);
    var msg = new IoMessage();
    msg.message = "Requesting to join a lobby.";
    msg.status = IoMessageStatus.Normal;
    msg.data = {
      roomCode: roomCode
    }
    socket.emit("join-room", msg);
  }

  function InputLobbyRoomCode(event) {
    const code = event.target.value;
    setRoomCode(code.toUpperCase());
  }

  return (
    <div className={`h-full w-full flex flex-col justify-center items-center overflow-auto`}>
      <h1 className="cursive">Party Games</h1>
      <div className="content">
        <h2>
          <span>LOBBY</span>
        </h2>
        <div className="w-1/2 flex justify-center items-center my-3">
          <button
            className="w-[10rem] bg-green-700 py-3 px-5 mx-1 rounded-lg text-white text-lg"
            type="button"
            data-buttontype="create"
            onClick={ClickBtnCreateRoom}>
            CREATE
          </button>
          <button
            className="w-[10rem] bg-blue-600 py-3 px-5 mx-1 rounded-lg text-white text-lg"
            type="button"
            data-buttontype="join"
            onClick={ToggleDetailsContainer}>
            JOIN
          </button>
          <div className="h-[2rem] w-[2rem] absolute bg-white rounded-full flex justify-center items-center">
            or
          </div>
        </div>
        <h2>
          <span>GAME INFORMATION</span>
        </h2>
        <div id="gameInformationContainer" className="w-3/4 flex flex-wrap justify-center">
          {gameInformationList.map((gameInfo, index) => (
            <div
              className="h-[25rem] w-[25rem] shadow items-center flex flex-col rounded-xl mx-5 my-3 bg-white"
              key={index}>
              <div className="h-[50%] w-full">
                <img
                  src={gameInfo.imageUrl}
                  className="h-full w-full rounded-tl-xl rounded-tr-xl object-cover"></img>
              </div>
              <div className="h-[50%] w-full px-4 py-5 flex flex-col">
                <span className="card-title text-lg font-bold text-left py-1">{gameInfo.name}</span>
                <span className="card-description text-md text-left py-1">
                  {gameInfo.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {isShowingJoinDetails ? (
        <div className="h-screen w-screen absolute flex justify-center items-center">
          <div className="modal-backdrop"></div>
          <div className="w-[40%] bg-[#F5F5F5] p-5 rounded-lg z-[200] relative flex flex-col">
            <button
              className="absolute p-3 top-0 right-0"
              data-buttontype="close"
              onClick={ToggleDetailsContainer}>
              &#10006;
            </button>
            <span className="w-full text-center font-bold text-3xl mt-5 mb-8">LOBBY DETAILS</span>
            <div className="h-fit-content w-full flex flex-col">
              <span className="font-bold text-lg px-3 py-2">ROOM CODE</span>
              <input
                type="text"
                className="h-fit-content w-full bg-white py-2 px-3 border border-gray-400 rounded-lg focus:outline-none"
                placeholder="ENTER ROOM CODE"
                onChange={InputLobbyRoomCode}
                value={roomCode}></input>
            </div>
            <button
              className="w-full font-bold text-lg text-white px-5 py-2 bg-blue-600 mt-4 rounded-lg"
              onClick={ClickBtnJoinRoom}>
              JOIN
            </button>
          </div>
        </div>
      ) : (
        <></>
      )}

      {/* Loading Screen */}
      {isLoading ? (
        <div className="loader-backdrop">
          <div className="loader"></div>
          <div className="modal-backdrop"></div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

export default Lobby;
