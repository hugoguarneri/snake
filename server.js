const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public')); // Sirve archivos estáticos desde la carpeta 'public'
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/snake.html');
});

const players = {}; // Almacenar la posición de cada serpiente por ID de socket

io.on('connection', (socket) => {
    console.log('Nuevo jugador conectado:', socket.id);
    
    // Asignar posición inicial al nuevo jugador
    players[socket.id] = {
        x: Math.floor(Math.random() * 20), // Posición aleatoria en el grid (20x20)
        y: Math.floor(Math.random() * 20),
        tailLength: 1,
        segments: [{ x: Math.floor(Math.random() * 20), y: Math.floor(Math.random() * 20) }]
    };

    // Enviar estado inicial a todos los jugadores
    io.emit('playerUpdate', players);

    // Recibir movimiento del ratón del cliente
    socket.on('mouseMove', (data) => {
        const player = players[socket.id];
        if (player) {
            player.targetX = data.x / 20; // Normalizar a grid (20x20)
            player.targetY = data.y / 20;
        }
    });

    // Gestionar desconexión
    socket.on('disconnect', () => {
        console.log('Jugador desconectado:', socket.id);
        delete players[socket.id];
        io.emit('playerUpdate', players); // Actualizar a todos los jugadores
    });

    // Generar comida (puedes mejorar esto para que sea más dinámica)
    const food = {
        x: Math.floor(Math.random() * 20),
        y: Math.floor(Math.random() * 20)
    };

    // Actualizar juego en el servidor (simulación básica cada 16ms ~ 60 FPS)
    setInterval(() => {
        for (let id in players) {
            const player = players[id];
            if (player.targetX !== undefined && player.targetY !== undefined) {
                let dx = player.targetX - player.segments[0].x;
                let dy = player.targetY - player.segments[0].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 0) {
                    dx = (dx / distance) * 0.2; // Velocidad
                    dy = (dy / distance) * 0.2;
                }

                let newX = player.segments[0].x + dx;
                let newY = player.segments[0].y + dy;

                // Limitar movimiento dentro del canvas (evitar bordes)
                newX = Math.max(0, Math.min(19, newX)); // Límite en un grid 20x20
                newY = Math.max(0, Math.min(19, newY));

                // Mover serpiente
                const newHead = { x: newX, y: newY };
                player.segments.unshift(newHead);

                // Comprobar comida
                if (Math.abs(newX - food.x) < 0.5 && Math.abs(newY - food.y) < 0.5) {
                    player.tailLength++;
                    food.x = Math.floor(Math.random() * 20);
                    food.y = Math.floor(Math.random() * 20);
                    io.emit('foodUpdate', food); // Notificar a todos la nueva comida
                }

                // Mantener longitud
                while (player.segments.length > player.tailLength) {
                    player.segments.pop();
                }
            }
        }
        io.emit('playerUpdate', players); // Enviar actualización a todos los clientes
    }, 1000 / 60);
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});