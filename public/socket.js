const socket = io();
const room = "pareja1";

socket.emit("join-room", room);