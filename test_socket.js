const io = require('socket.io-client');
const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected!');
  socket.emit('createRoom');
});

socket.on('roomCreated', (roomId) => {
  console.log('Room created:', roomId);
  socket.emit('startGame', roomId);
});

socket.on('gameStateUpdated', (state) => {
  console.log('gameStateUpdated:', state);
  process.exit(0);
});

socket.on('error', (err) => {
  console.error('Error:', err);
  process.exit(1);
});
