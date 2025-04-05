const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
let waitingUser = null;

io.on("connection", (socket) => {
  console.log("New user connected:", socket.id);

  if (waitingUser) {
    const roomID = socket.id + "#" + waitingUser.id;
    socket.join(roomID);
    waitingUser.join(roomID);

    socket.emit("matched", { room: roomID });
    waitingUser.emit("matched", { room: roomID });

    waitingUser = null;
  } else {
    waitingUser = socket;
  }

  socket.on("signal", ({ room, data }) => {
    socket.to(room).emit("signal", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    if (waitingUser === socket) waitingUser = null;
    socket.broadcast.emit("user-disconnected", socket.id);
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
