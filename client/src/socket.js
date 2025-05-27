import { io } from "socket.io-client";

const URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_PRODUCTION_SOCKET_URL
    : "http://localhost:5000";

export const socket = io(URL);
