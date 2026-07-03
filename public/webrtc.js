const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

let localStream;
let peerConnection;

// ----------------------------
// ROOM (OBLIGATORIO)
// ----------------------------
const room = "pareja1";
socket.emit("join-room", room);

// ----------------------------
// CONFIG WEBRTC
// ----------------------------
const config = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" }
    ]
};

// ----------------------------
// CAMARA Y AUDIO
// ----------------------------
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
.then(stream => {

    localStream = stream;
    localVideo.srcObject = stream;

})
.catch(err => {
    console.error("Error cámara/micrófono:", err);
});

// ----------------------------
// CUANDO ALGUIEN ENTRA
// ----------------------------
socket.on("user-joined", () => {
    startConnection(true);
});

// ----------------------------
// SIGNAL (CORREGIDO)
// ----------------------------
socket.on("signal", async (data) => {

    if (!peerConnection) return;

    try {

        // OFFER
        if (data.type === "offer") {

            await startConnection(false, data);

        }

        // ANSWER
        else if (data.type === "answer") {

            await peerConnection.setRemoteDescription(data);

        }

        // ICE CANDIDATE
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

    // enviar audio/video
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    // recibir audio/video
    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    // ICE candidates (CORREGIDO)
    peerConnection.onicecandidate = (event) => {

        if (event.candidate) {

            socket.emit("signal", {
                room,
                candidate: event.candidate
            });

        }

    };

    // ----------------------------
    // CALLER
    // ----------------------------
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

    // ----------------------------
    // RECEIVER
    // ----------------------------
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