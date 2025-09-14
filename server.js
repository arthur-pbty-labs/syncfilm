const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

const users = {};

io.on('connection', (socket) => {
  console.log('Un utilisateur est connecté');

  users[socket.id] = { id: socket.id, filename: null };
  io.emit('users', Object.values(users));

  socket.on('videoSelected', (filename) => {
    users[socket.id].filename = filename || null;
    io.emit('users', Object.values(users));
  });

  // Synchronisation des commandes vidéo
  socket.on('videoCommand', (cmd) => {
    io.emit('videoCommand', cmd);
  });

  socket.on('disconnect', () => {
    console.log('Un utilisateur s\'est déconnecté');
    delete users[socket.id];
    io.emit('users', Object.values(users));
  });
});

server.listen(port, () => {
  console.log(`Serveur en ligne sur http://localhost:${port}`);
});