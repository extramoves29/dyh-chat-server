import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://straightlikethatmedia.com',
      'https://www.straightlikethatmedia.com'
    ],
    methods: ['GET', 'POST']
  }
});

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10
});

app.use(limiter);

app.get('/', (req, res) => {
  res.send('Do Your Homework Media Chat Server - Running! 🎙️');
});

const bannedWords = ['badword1', 'badword2'];

function containsBadWords(text) {
  const lower = text.toLowerCase();
  return bannedWords.some(word => lower.includes(word));
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('message', (data) => {
    try {
      if (!data.name || !data.text) {
        return socket.emit('error', 'Name and message required');
      }

      const name = data.name.trim().slice(0, 30);
      const text = data.text.trim().slice(0, 500);

      if (containsBadWords(text) || containsBadWords(name)) {
        return socket.emit('error', 'Message blocked');
      }

      io.emit('message', {
        name,
        text,
        time: data.time || new Date().toLocaleTimeString()
      });

      console.log(`[${name}]: ${text}`);
    } catch (error) {
      console.error('Message error:', error);
      socket.emit('error', 'Failed to send message');
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`✅ Chat server running on port ${PORT}`);
});