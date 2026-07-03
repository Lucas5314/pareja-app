const socket = io();

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

const room = "pareja1";

let localStream;
let peerConnection;

// ----------------------------
// CONFIG WEBRTC
// ----------------------------
const config = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
    ]
};

// ----------------------------
// INICIAR TODO (IMPORTANTE)
// ----------------------------
async function start() {

    try {

        console.log("Pidiendo cámara...");

        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });

        console.log("Cámara OK");

        localVideo.srcObject = localStream;

        socket.emit("join-room", room);

    } catch (err) {
        console.error("ERROR CAMARA:", err);
    }
}

start();

// ----------------------------
// USER JOINED
// ----------------------------
socket.on("user-joined", () => {

    console.log("Otro usuario conectado");

    if (!localStream) {
        setTimeout(() => startConnection(true), 1000);
        return;
    }

    startConnection(true);
});

// ----------------------------
// SIGNAL
// ----------------------------
socket.on("signal", async (data) => {

    if (!peerConnection) return;

    try {

        if (data.type === "offer") {
            await startConnection(false, data.sdp);
        }

        else if (data.type === "answer") {
            await peerConnection.setRemoteDescription(data.sdp);
        }

        else if (data.candidate) {
            await peerConnection.addIceCandidate(
                new RTCIceCandidate(data.candidate)
            );
        }

    } catch (err) {
        console.error("Signal error:", err);
    }
});

// ----------------------------
// WEBRTC CORE
// ----------------------------
function startConnection(isCaller, offer = null) {

    if (!localStream) return;

    peerConnection = new RTCPeerConnection(config);

    // enviar stream
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    // recibir stream
    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    // ICE
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("signal", {
                room,
                candidate: event.candidate
            });
        }
    };

    // CALLER
    if (isCaller) {

        peerConnection.createOffer()
        .then(o => peerConnection.setLocalDescription(o))
        .then(() => {

            socket.emit("signal", {
                room,
                type: "offer",
                sdp: peerConnection.localDescription
            });

        });

    }

    // RECEIVER
    else {

        peerConnection.setRemoteDescription(offer)
        .then(() => peerConnection.createAnswer())
        .then(a => peerConnection.setLocalDescription(a))
        .then(() => {

            socket.emit("signal", {
                room,
                type: "answer",
                sdp: peerConnection.localDescription
            });

        });

    }
}