const { Server } = require("socket.io");

let io;
const userSockets = new Map();

function setupSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PATCH", "DELETE"],
    },
  });

  io.on("connection", (socket) => {
    console.log("[Socket] Client connected:", socket.id);

    socket.on("join", (userId) => {
      console.log("[Socket] join received:", userId);

      if (!userId) return;

      socket.userId = userId.toString();
      userSockets.set(socket.userId, socket.id);
      socket.join(socket.userId);

      console.log("[Socket] User joined room:", socket.userId);
    });

    socket.on("disconnect", () => {
      if (socket.userId) {
        userSockets.delete(socket.userId);
        console.log("[Socket] User offline:", socket.userId);
      }

      console.log("[Socket] Client disconnected:", socket.id);
    });
  });
}

function getIO() {
  if (!io) {
    throw new Error(
      "Socket.io chưa được khởi tạo. Gọi setupSocket(server) trước."
    );
  }
  return io;
}

module.exports = {
  setupSocket,
  getIO,
};
