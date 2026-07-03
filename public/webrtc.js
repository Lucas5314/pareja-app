const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

let localStream;
let peerConnection;

// 🔥 MEJOR STUN CONFIG (más estable en internet)
const config = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" }
    ]
};

// ----------------------------
// CAMARA Y MICROFONO
// ----------------------------

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
})
.then(stream => {

    localStream = stream;
    localVideo.srcObject = stream;

})
.catch(err => {
    console.error("Error getUserMedia:", err);
});

// ----------------------------
// SOCKET EVENTS
// ----------------------------

socket.on("user-joined", () => {

    startConnection(true);

});

socket.on("signal", async (signal) => {

    if (!peerConnection) return;

    try {

        if (signal.type === "offer") {

            startConnection(false, signal);

        } 
        else if (signal.type === "answer") {

            await peerConnection.setRemoteDescription(signal);

        } 
        else if (signal.candidate) {

            await peerConnection.addIceCandidate(signal);

        }

    } catch (err) {
        console.error("Signal error:", err);
    }

});

// ----------------------------
// WEBCRTC CONNECTION
// ----------------------------

function startConnection(isCaller, offer = null) {

    if (!localStream) {
        console.log("No local stream yet");
        return;
    }

    peerConnection = new RTCPeerConnection(config);

    // enviar audio/video
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    // recibir audio/video
    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    // ICE candidates
    peerConnection.onicecandidate = (event) => {

        if (event.candidate) {

            socket.emit("signal", {
                room,
                signal: event.candidate
            });

        }

    };

    // ----------------------------
    // LADO CLIENTE QUE LLAMA
    // ----------------------------

    if (isCaller) {

        peerConnection.createOffer()
        .then(offer => peerConnection.setLocalDescription(offer))
        .then(() => {

            socket.emit("signal", {
                room,
                signal: peerConnection.localDescription
            });

        });

    }

    // ----------------------------
    // LADO QUE RECIBE
    // ----------------------------

    else {

        peerConnection.setRemoteDescription(offer)
        .then(() => peerConnection.createAnswer())
        .then(answer => peerConnection.setLocalDescription(answer))
        .then(() => {

            socket.emit("signal", {
                room,
                signal: peerConnection.localDescription
            });

        });

    }

}