const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// ----------------------------
// VIDEO STATE
// ----------------------------
let currentVideo = {};

// ----------------------------
// MULTER
// ----------------------------
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) =>
        cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

// ----------------------------
// STATIC
// ----------------------------
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// ----------------------------
// UPLOAD VIDEO
// ----------------------------
app.post("/upload", upload.single("video"), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false });

    res.json({
        success: true,
        url: "/uploads/" + req.file.filename
    });
});

// ----------------------------
// SOCKET.IO
// ----------------------------
io.on("connection", (socket) => {

    console.log("Conectado:", socket.id);

    // JOIN ROOM
    socket.on("join-room", (room) => {
        socket.join(room);

        // avisar a TODOS en la sala (más estable)
        socket.to(room).emit("user-joined");

        // sync video si existe
        if (currentVideo[room]) {
            socket.emit("video-selected", currentVideo[room]);
        }
    });

    // ----------------------------
    // WEBRTC SIGNAL (IMPORTANTE)
    // ----------------------------
    socket.on("signal", (data) => {
        socket.to(data.room).emit("signal", data);
    });

    // ----------------------------
    // VIDEO SYNC
    // ----------------------------
    socket.on("video-selected", ({ room, url }) => {
        currentVideo[room] = url;
        socket.to(room).emit("video-selected", url);
    });

    socket.on("video-event", ({ room, event }) => {
        socket.to(room).emit("video-event", event);
    });

});

server.listen(PORT, () => {
    console.log("Servidor en puerto", PORT);
});