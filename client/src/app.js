import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { socket } from "./socket.js";
import Home from "./pages/home.js";
import Lobby from "./pages/lobby.js";
import CostumePartyDetective from "./pages/costumePartyDetective.js";

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const url = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home socket={socket}/>} />
        <Route path="/home" element={<Home socket={socket}/>} />
        <Route path="/lobby/" element={<Lobby socket={socket} url={url}/>} />
        <Route path="/costume-party-detective/" element={<CostumePartyDetective socket={socket}/>} />
      </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
