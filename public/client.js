const socket = io("https://omegle-clone-9vbl.onrender.com/");

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
let localStream, peerConnection;

const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localStream = stream;
    localVideo.srcObject = stream;
  });

socket.on("matched", async ({ room }) => {
  document.getElementById("status").innerText = "Connected!";

  peerConnection = new RTCPeerConnection(config);

  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.onicecandidate = e => {
    if (e.candidate) {
      socket.emit("signal", { room, data: { type: "candidate", candidate: e.candidate } });
    }
  };

  peerConnection.ontrack = e => {
    remoteVideo.srcObject = e.streams[0];
  };

  socket.on("signal", async data => {
    if (data.type === "offer") {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit("signal", { room, data: answer });
    } else if (data.type === "answer") {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data));
    } else if (data.type === "candidate") {
      await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  });

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("signal", { room, data: offer });
});
