var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);


server.listen(8081, function () {
    console.log('Listening on ' + server.address().port);
});


server.lastPlayderID = 0;
server.points = {
    'red': 0,
    'blue': 0
}

io.on('connection', function (socket) {
    console.log('connected')
    socket.on('newplayer', function (data) {
        const x = data.team == 'blue' ?  randomInt(100, 400) :  randomInt(3475, 3775);
        socket.player = {
            id: server.lastPlayderID++,
            x: x,
            y: randomInt(100, 350),
            health: 3,
            name: data.name,
            team: data.team,
            bullets: [], 
            angle: 0,
        };
        socket.emit('allplayers', getAllPlayers(socket.player.id));
        socket.broadcast.emit('newplayer', socket.player);

        socket.on('disconnect', function () {
            console.log('Disonnected')
            io.emit('remove', socket.player.id);
        });
    });

    socket.on('updateCoords', function (pos) {
        if (socket.player) {
            // socket.player.moving = pos.x != socket.player.x || pos.y != socket.player.y;
            socket.player.moving = pos.moving;
            socket.player.x = pos.x;
            socket.player.y = pos.y;
            socket.player.angle = pos.angle;
        }

    });

    socket.on('fireBullet', function (bullet) {
        if (socket.player) {
            socket.player.bullets.push(bullet);
        }
    });



    socket.on('hit', function (playerId) {
        const hitSocket = Object.values(io.sockets.connected).find(function (s) {
            if (s.player) {
                return s.player.id == playerId;
            }
            return false;
        });


        if (hitSocket) {
            hitSocket.player.health = hitSocket.player.health - 1;
            if (hitSocket.player.team != socket.player.team) {
                server.points[socket.player.team] = server.points[socket.player.team] + 1
            } else {
                server.points[socket.player.team] = server.points[socket.player.team] - 1
            }

        }

    });
});

setInterval(function () {
    if (io && io.sockets) {
        io.emit('currentPos', getAllPlayers(null))
        Object.keys(io.sockets.connected).forEach(function (socketID) {
            var player = io.sockets.connected[socketID].player;
            if (player) {
                player.bullets = [];
            }
        });
    }
}, 10)

function getAllPlayers(yoursId) {
    var players = [];
    Object.keys(io.sockets.connected).forEach(function (socketID) {
        var player = io.sockets.connected[socketID].player;
        if (player) {
            players.push(player);
        }
    });
    return { players, yoursId, points: server.points }
}

function randomInt(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}