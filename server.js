const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ----------------------------
// PUERTO RENDER
// ----------------------------

const PORT = process.env.PORT || 3000;

// ----------------------------
// MULTER (UPLOAD VIDEOS)
// ----------------------------

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// ----------------------------
// MIDDLEWARE
// ----------------------------

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// ----------------------------
// UPLOAD VIDEO
// ----------------------------

app.post("/upload", upload.single("video"), (req, res) => {

    if (!req.file) {
        return res.status(400).json({ success: false });
    }

    const url = "/uploads/" + req.file.filename;

    res.json({
        success: true,
        url
    });

});

// ----------------------------
// SOCKET.IO
// ----------------------------

io.on("connection", (socket) => {

    console.log("Conectado:", socket.id);

    // entrar a sala
    socket.on("join-room", (room) => {

        socket.join(room);

        socket.to(room).emit("user-joined");

    });

    // ----------------------------
    // 🔥 WEBRTC SIGNAL (CORREGIDO)
    // ----------------------------

    socket.on("signal", (data) => {

        // reenviar TODO sin romperlo
        socket.to(data.room).emit("signal", data);

    });

    // ----------------------------
    // SINCRONIZAR VIDEO
    // ----------------------------

    socket.on("video-event", ({ room, event }) => {

        socket.to(room).emit("video-event", event);

    });

    // ----------------------------
    // CHAT
    // ----------------------------

    socket.on("chat-message", ({ room, message }) => {

        socket.to(room).emit("chat-message", message);

    });

    // ----------------------------
    // VIDEO SELECCIONADO
    // ----------------------------

    socket.on("video-selected", ({ room, url }) => {

        socket.to(room).emit("video-selected", url);

    });

});

// ----------------------------
// START SERVER (RENDER)
// ----------------------------

server.listen(PORT, () => {
    console.log("Servidor corriendo en puerto " + PORT);
});