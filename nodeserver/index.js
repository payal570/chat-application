const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');

// App Setup
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "http://127.0.0.1:5500",
        methods: ["GET", "POST"]
    }
});

// MongoDB Connection
mongoose.connect('mongodb+srv://payal:dbchat03@cluster0.vtk61ux.mongodb.net/userchat?retryWrites=true&w=majority')
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log("DB Connection Error:", err));

// Define Schemas
const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

const messageSchema = new mongoose.Schema({
    name: String,
    message: String,
    time: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);

// Registeration form
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.json({ success: false, message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ username, password: hashedPassword });

        res.json({ success: true, message: "User registered successfully" });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Login form
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) return res.json({ success: false, message: "User not found" });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.json({ success: false, message: "Incorrect password" });

        res.json({ success: true, message: "Login successful" });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Chat Handling
const users = {};

io.on('connection', (socket) => {
    console.log('New connection:', socket.id);

    socket.on('new-user-joined', async (name) => {
        users[socket.id] = name;
        socket.broadcast.emit('user-joined', name);

        // Send previous messages
        const oldMessages = await Message.find().sort({ time: 1 }).limit(20);
        socket.emit('chat-history', oldMessages);
    });


 socket.on('send', async (data) => {
    // Save message in MongoDB
    const newMsg = new Message({
        name: data.name,
        message: data.message
    });
    await newMsg.save();

    // Broadcast message to others
    socket.broadcast.emit('receive', data);
});



    socket.on('disconnect', () => {
        socket.broadcast.emit('left', users[socket.id]);
        delete users[socket.id];
    });
});

// Start Server
server.listen(8000, () => {
    console.log("Server running on http://localhost:8000");
});
