// ======================================
// WEBRTC V2
// PARTE 1
// ======================================

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

let localStream = null;
let peerConnection = null;

// --------------------------------------
// CONFIG ICE
// --------------------------------------

const rtcConfig = {

    iceServers: [

        {
            urls: "stun:stun.l.google.com:19302"
        },

        {
            urls: "stun:stun1.l.google.com:19302"
        }

    ]

};

// --------------------------------------
// INICIAR CAMARA
// --------------------------------------

async function initCamera() {

    try {

        localStream = await navigator.mediaDevices.getUserMedia({

            video: true,

            audio: true

        });

        localVideo.srcObject = localStream;

        console.log("✅ Cámara iniciada");

        window.socket.emit(

            "join-room",

            window.room

        );

    }

    catch(err){

        console.error(err);

        alert("No fue posible acceder a la cámara o micrófono.");

    }

}

// --------------------------------------
// CREAR CONEXION
// --------------------------------------

function createPeer(){

    peerConnection = new RTCPeerConnection(rtcConfig);

    // enviar cámara

    localStream.getTracks().forEach(track=>{

        peerConnection.addTrack(

            track,

            localStream

        );

    });

    // recibir cámara

    peerConnection.ontrack=(event)=>{

        console.log("📹 Video remoto recibido");

        remoteVideo.srcObject=event.streams[0];

    };

    // candidatos ICE

    peerConnection.onicecandidate=(event)=>{

        if(!event.candidate) return;

        window.socket.emit("signal",{

            room:window.room,

            candidate:event.candidate

        });

    };

}
// ======================================
// WEBRTC V2
// PARTE 2
// ======================================

// --------------------------------------
// INICIAR LLAMADA (CALLER)
// --------------------------------------

async function startCall(){

    createPeer();

    const offer = await peerConnection.createOffer();

    await peerConnection.setLocalDescription(offer);

    window.socket.emit("signal", {

        room: window.room,

        type: "offer",

        sdp: offer

    });

}

// --------------------------------------
// RECIBIR OFERTA
// --------------------------------------

async function handleOffer(offer){

    createPeer();

    await peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
    );

    const answer = await peerConnection.createAnswer();

    await peerConnection.setLocalDescription(answer);

    window.socket.emit("signal", {

        room: window.room,

        type: "answer",

        sdp: answer

    });

}

// --------------------------------------
// RECIBIR RESPUESTA
// --------------------------------------

async function handleAnswer(answer){

    if(!peerConnection) return;

    await peerConnection.setRemoteDescription(
        new RTCSessionDescription(answer)
    );

}
// ======================================
// WEBRTC V2
// PARTE 3
// ======================================

// --------------------------------------
// ESCUCHAR SOCKET SIGNALS
// --------------------------------------

window.socket.on("signal", async (data) => {

    try {

        // --------------------------
        // OFFER
        // --------------------------

        if (data.type === "offer") {

            console.log("📩 Offer recibida");

            await handleOffer(data.sdp);

            return;
        }

        // --------------------------
        // ANSWER
        // --------------------------

        if (data.type === "answer") {

            console.log("📩 Answer recibida");

            await handleAnswer(data.sdp);

            return;
        }

        // --------------------------
        // ICE CANDIDATE
        // --------------------------

        if (data.candidate) {

            if (!peerConnection) return;

            await peerConnection.addIceCandidate(
                new RTCIceCandidate(data.candidate)
            );

        }

    }

    catch(err){

        console.error("Signal error:", err);

    }

});

// --------------------------------------
// CUANDO ENTRA OTRO USUARIO
// --------------------------------------

window.socket.on("user-joined", () => {

    console.log("👤 Usuario conectado -> iniciando llamada");

    // IMPORTANTE: solo uno inicia la llamada
    setTimeout(() => {

        startCall();

    }, 1000);

});

// --------------------------------------
// INICIAR TODO
// --------------------------------------

window.addEventListener("load", () => {

    initCamera();

});