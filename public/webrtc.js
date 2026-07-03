const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

let localStream;
let peerConnection;

const config = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
        }
    ]
};

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
})
.then(stream => {

    localStream = stream;

    localVideo.srcObject = stream;

})
.catch(err => {

    console.error(err);

});

socket.on("user-joined", () => {

    startConnection(true);

});

socket.on("signal", async(signal)=>{

    if(signal.type==="offer"){

        startConnection(false,signal);

    }

    else if(signal.type==="answer"){

        await peerConnection.setRemoteDescription(signal);

    }

    else if(signal.candidate){

        await peerConnection.addIceCandidate(signal);

    }

});

function startConnection(isCaller,offer=null){

    peerConnection=new RTCPeerConnection(config);

    localStream.getTracks().forEach(track=>{

        peerConnection.addTrack(track,localStream);

    });

    peerConnection.ontrack=(event)=>{

        remoteVideo.srcObject=event.streams[0];

    };

    peerConnection.onicecandidate=(event)=>{

        if(event.candidate){

            socket.emit("signal",{

                room,

                signal:event.candidate

            });

        }

    };

    if(isCaller){

        peerConnection.createOffer()

        .then(offer=>peerConnection.setLocalDescription(offer))

        .then(()=>{

            socket.emit("signal",{

                room,

                signal:peerConnection.localDescription

            });

        });

    }

    else{

        peerConnection.setRemoteDescription(offer)

        .then(()=>peerConnection.createAnswer())

        .then(answer=>peerConnection.setLocalDescription(answer))

        .then(()=>{

            socket.emit("signal",{

                room,

                signal:peerConnection.localDescription

            });

        });

    }

}