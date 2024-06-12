const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB connection
const dbConnect = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/chet");
    console.log("DB conntect")
    const db = mongoose.connection;
    db.on("error", console.error.bind(console, "connection error:"));
    db.once("open", () => {
      console.log("Connected to MongoDB");
    });
  } catch (error) {
    console.log(error);
  }
};

dbConnect();
// Message Schema
const messageSchema = new mongoose.Schema({
  senderId: String,
  recipientId: String,
  timestamp: Date,
  content: String,
  status: String,
  conversationId: String,
  reactions: [String],
  threadId: String,
  forwardedFrom: String,
});

const Message = mongoose.model("Message", messageSchema);

// Routes


app.get("/messages/:conversationId", async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
    });
    res.json(messages);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Socket.io
io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("sendMessage", async (msg) => {
    const newMessage = new Message(msg);
    try {
      const savedMessage = await newMessage.save();
      io.emit("message", savedMessage);
    } catch (error) {
      console.error("Error saving message", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
