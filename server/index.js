const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const cors = require("cors");

const { addUser, removeUser, getUser, getUsersByRoom } = require("./users.js");

const PORT = process.env.PORT || 5000;

const router = require("./router");

const app = express();
const server = http.createServer(app);
const corsOptions = {
  cors: true,
  origins: ["http://localhost:3000"],
};
const io = socketio(server, corsOptions);

app.use(router);
app.use(cors());

io.on("connect", (socket) => {
  socket.on("join", ({ name, room }, callback) => {
    const { error, user } = addUser({
      id: socket.id,
      name,
      room,
    });

    if (error) return callback(error);

    // admin-generated messages (emit from the backend to the frontend)
    socket.emit("message", {
      user: "admin",
      text: `${user.name}, welcome to the room ${user.room}`,
    });

    socket.broadcast.to(user.room).emit("message", {
      user: "admin",
      text: `${user.name} has joined the chat`,
    });

    socket.join(user.room);

    // track users in room
    io.to(user.room).emit('roomData', { 
      room: user.room,
      users: getUsersByRoom(user.room) 
    });

    callback();
  });

  // user-generated messages (expects messsages from the frontend to the backend)
  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit("message", {
      user: user.name,
      text: message,
    });

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersByRoom(user.room),
    });

    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit("message", {
        user: "admin",
        text: `${user.name} has left.`,
      });
    }
  });
});

app.use(router);

server.listen(PORT, () => console.log(`Server running on port ${PORT}.`));
