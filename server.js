const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

const PORT = process.env.PORT || 3000;

// ----------------------------
// Archivos públicos
// ----------------------------

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// ----------------------------
// MULTER
// ----------------------------

const storage = multer.diskStorage({

    destination(req, file, cb) {

        cb(null, "uploads/");

    },

    filename(req, file, cb) {

        cb(null, Date.now() + path.extname(file.originalname));

    }

});

const upload = multer({
    storage
});

// ----------------------------
// Estado de cada sala
// ----------------------------

const rooms = {};

// ----------------------------
// Upload
// ----------------------------

app.post("/upload", upload.single("video"), (req, res) => {

    if (!req.file) {

        return res.json({
            success: false
        });

    }

    res.json({

        success: true,

        url: "/uploads/" + req.file.filename

    });

});

// ----------------------------
// SOCKET
// ----------------------------

io.on("connection", socket => {

    console.log("Nuevo usuario:", socket.id);

    socket.on("join-room", room => {

        socket.join(room);

        if (!rooms[room]) {

            rooms[room] = {
                currentVideo: null
            };

        }

        socket.to(room).emit("user-joined");

        if (rooms[room].currentVideo) {

            socket.emit(
                "video-selected",
                rooms[room].currentVideo
            );

        }

    });

    socket.on("signal", data => {

        socket.to(data.room).emit("signal", data);

    });

    socket.on("video-selected", data => {

        rooms[data.room].currentVideo = data.url;

        socket.to(data.room).emit(
            "video-selected",
            data.url
        );

    });

    socket.on("video-event", data => {

        socket.to(data.room).emit(
            "video-event",
            data.event
        );

    });

    socket.on("chat-message", data => {

        socket.to(data.room).emit(
            "chat-message",
            data.message
        );

    });

    socket.on("disconnect", () => {

        console.log("Desconectado:", socket.id);

    });

});

server.listen(PORT, () => {

    console.log("Servidor iniciado en puerto", PORT);

});