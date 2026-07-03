const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

let localStream;
let peerConnection;

const room = "pareja1";

const config = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
    ]
};

// ----------------------------
// 1. CAMARA PRIMERO (OBLIGATORIO)
// ----------------------------
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
.then(stream => {

    localStream = stream;
    localVideo.srcObject = stream;

    // 🔥 SOLO DESPUÉS entrar a sala
    socket.emit("join-room", room);

})
.catch(err => {
    console.error("Error cámara/micrófono:", err);
});

// ----------------------------
// 2. USER JOINED
// ----------------------------
socket.on("user-joined", () => {

    if (!localStream) {
        setTimeout(() => startConnection(true), 1000);
        return;
    }

    startConnection(true);

});

// ----------------------------
// 3. SIGNAL
// ----------------------------
socket.on("signal", async (data) => {

    if (!peerConnection) return;

    try {

        if (data.type === "offer") {

            await startConnection(false, data);

        }

        else if (data.type === "answer") {

            await peerConnection.setRemoteDescription(data);

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
// 4. WEBRTC CORE
// ----------------------------
function startConnection(isCaller, offer = null) {

    if (!localStream) return;

    peerConnection = new RTCPeerConnection(config);

    // enviar audio/video
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    // recibir video
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