require('dotenv').config();
const path = require("path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const db = require('./utils/db');

const app = express();
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/build');
  app.use(express.static(clientBuildPath));

  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    return res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions,
});

db.connect().finally(() => {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 CollabCode Server is running on port ${PORT}`);
  });
});

const rooms = {};
const MAX_ROOM_IDLE_TIME = 1800000; // 30 minutes
const MIN_USERNAME_LENGTH = 2;
const MAX_USERNAME_LENGTH = 20;
const ROOM_ID_PATTERN = /^[a-zA-Z0-9]{6,12}$/;

// Validation helpers
const validateUsername = (username) => {
  if (!username || typeof username !== "string") return false;
  const trimmed = username.trim();
  return trimmed.length >= MIN_USERNAME_LENGTH && trimmed.length <= MAX_USERNAME_LENGTH;
};

const validateRoomId = (roomId) => {
  return roomId && ROOM_ID_PATTERN.test(roomId);
};

// Clean up empty rooms periodically
setInterval(() => {
  Object.keys(rooms).forEach(roomId => {
    if (rooms[roomId].users.length === 0) {
      delete rooms[roomId];
      console.log(`🧹 Cleaned up empty room: ${roomId}`);
    }
  });
}, 60000); // Check every minute

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("join_room", ({ roomId, username }, callback) => {
    try {
      // Validate inputs
      if (!validateRoomId(roomId)) {
        return callback({ error: "Invalid room ID format" });
      }
      if (!validateUsername(username)) {
        return callback({ error: "Username must be 2-20 characters" });
      }

      const cleanUsername = username.trim();
      socket.join(roomId);

      if (!rooms[roomId]) {
        rooms[roomId] = {
          code: "// Start coding here...",
          language: "javascript",
          theme: "vs-dark",
          users: [],
          messages: [],
          files: {
            "main.js": { content: "// Start coding here...\n\nconsole.log('Hello, World!');", language: "javascript" },
            "styles.css": { content: "/* Your styles here */\n\nbody {\n  margin: 0;\n  padding: 20px;\n  font-family: Arial, sans-serif;\n}", language: "css" },
            "index.html": { content: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>CollabCode</title>\n  <link rel=\"stylesheet\" href=\"styles.css\">\n</head>\n<body>\n  <h1>Hello, World!</h1>\n  <script src=\"main.js\"></script>\n</body>\n</html>", language: "html" }
          },
          currentFile: "main.js",
          createdAt: new Date(),
          lastActivity: new Date()
        };
      }

      // Check for duplicate username
      const existingUser = rooms[roomId].users.find(u => u.username === cleanUsername);
      if (existingUser && existingUser.id !== socket.id) {
        return callback({ error: "Username already taken in this room" });
      }

      if (existingUser && existingUser.id === socket.id) {
        existingUser.joinedAt = new Date();
      } else {
        rooms[roomId].users.push({ id: socket.id, username: cleanUsername, joinedAt: new Date() });
      }
      rooms[roomId].lastActivity = new Date();

      // Send current state to the new user
      socket.emit("code_update", {
        code: rooms[roomId].files[rooms[roomId].currentFile].content,
        file: rooms[roomId].currentFile
      });
      socket.emit("language_update", rooms[roomId].language);
      socket.emit("theme_update", rooms[roomId].theme);

      // Send existing messages
      rooms[roomId].messages.forEach(msg => {
        socket.emit("chat_message", msg);
      });

      io.to(roomId).emit("user_list", rooms[roomId].users);
      socket.emit("user_joined", { user: cleanUsername, timestamp: new Date() });

      console.log(`👤 ${cleanUsername} joined room ${roomId} | Total: ${rooms[roomId].users.length}`);
      callback({ success: true });
    } catch (err) {
      console.error("Error in join_room:", err);
      callback({ error: "Failed to join room" });
    }
  });

  socket.on("code_change", ({ roomId, code, file }, callback) => {
    try {
      if (!validateRoomId(roomId) || !rooms[roomId]) {
        return callback?.({ error: "Invalid room" });
      }
      if (!rooms[roomId].files[file]) {
        return callback?.({ error: "File not found" });
      }
      rooms[roomId].files[file].content = code;
      rooms[roomId].lastActivity = new Date();
      socket.to(roomId).emit("code_update", { code, file });
      callback?.({ success: true });
    } catch (err) {
      console.error("Error in code_change:", err);
      callback?.({ error: "Failed to update code" });
    }
  });

  socket.on("language_change", ({ roomId, language }, callback) => {
    try {
      if (!validateRoomId(roomId) || !rooms[roomId]) {
        return callback?.({ error: "Invalid room" });
      }
      rooms[roomId].language = language;
      rooms[roomId].lastActivity = new Date();
      socket.to(roomId).emit("language_update", language);
      callback?.({ success: true });
    } catch (err) {
      console.error("Error in language_change:", err);
      callback?.({ error: "Failed to update language" });
    }
  });

  socket.on("theme_change", ({ roomId, theme }, callback) => {
    try {
      if (!validateRoomId(roomId) || !rooms[roomId]) {
        return callback?.({ error: "Invalid room" });
      }
      rooms[roomId].theme = theme;
      rooms[roomId].lastActivity = new Date();
      socket.to(roomId).emit("theme_update", theme);
      callback?.({ success: true });
    } catch (err) {
      console.error("Error in theme_change:", err);
      callback?.({ error: "Failed to update theme" });
    }
  });

  socket.on("file_update", ({ roomId, fileData }, callback) => {
    try {
      if (!validateRoomId(roomId) || !rooms[roomId]) {
        return callback?.({ error: "Invalid room" });
      }
      if (!fileData || !fileData.name) {
        return callback?.({ error: "Invalid file data" });
      }
      rooms[roomId].files[fileData.name] = fileData;
      rooms[roomId].lastActivity = new Date();
      socket.to(roomId).emit("file_update", fileData);
      callback?.({ success: true });
    } catch (err) {
      console.error("Error in file_update:", err);
      callback?.({ error: "Failed to update file" });
    }
  });

  socket.on("chat_message", ({ roomId, message }, callback) => {
    try {
      if (!validateRoomId(roomId) || !rooms[roomId]) {
        return callback?.({ error: "Invalid room" });
      }
      if (!message || !message.text || !message.user) {
        return callback?.({ error: "Invalid message" });
      }
      const sanitizedMsg = {
        ...message,
        text: message.text.trim().slice(0, 500),
        timestamp: new Date()
      };
      rooms[roomId].messages.push(sanitizedMsg);
      if (rooms[roomId].messages.length > 100) {
        rooms[roomId].messages = rooms[roomId].messages.slice(-100);
      }
      rooms[roomId].lastActivity = new Date();
      socket.to(roomId).emit("chat_message", sanitizedMsg);
      callback?.({ success: true });
    } catch (err) {
      console.error("Error in chat_message:", err);
      callback?.({ error: "Failed to send message" });
    }
  });

  socket.on("disconnecting", () => {
    try {
      socket.rooms.forEach((roomId) => {
        if (rooms[roomId]) {
          const user = rooms[roomId].users.find(u => u.id === socket.id);
          rooms[roomId].users = rooms[roomId].users.filter(u => u.id !== socket.id);
          if (user) {
            console.log(`👋 ${user.username} left room ${roomId}`);
          }
          io.to(roomId).emit("user_list", rooms[roomId].users);
        }
      });
    } catch (err) {
      console.error("Error in disconnecting:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.json({ 
    status: "online",
    message: "🚀 CollabCode Server is running",
    rooms: Object.keys(rooms).length,
    timestamp: new Date()
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", uptime: process.uptime() });
});
