import io from 'socket.io-client';

class Client {
    socket;
    eventListeners;
    static instance;

    constructor(url = 'http://localhost', port = 8081) {
        if (!Client.instance) {
            Client.instance = this;
            this.eventListeners = {};
            this.socket = io(url + ':' + port);


            this.socket.on('newplayer', (data) => {
                this.fireEvent('newplayer', data);
            });

            this.socket.on('allplayers', (data) => {
                this.fireEvent('allplayers', data)
            });

            this.socket.on('currentPos', (data) => {
                this.fireEvent('currentPos', data)

            });

            this.socket.on('remove', (id) => {
                this.fireEvent('remove', id)
            });

        }
        
        return Client.instance;

    }

    askNewPlayer(data) {
        this.socket.emit('newplayer', data);
    }

    hit(playerId) {
        this.socket.emit('hit', playerId)
    }

    updateCoords(data) {
        this.socket.emit('updateCoords', data);
    }

    fireBullet(data) {
        this.socket.emit('fireBullet', data);
    }

    listen(event, handler) {
        if (!(event in this.eventListeners)) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(handler)
    }

    fireEvent(event, data) {
        if (event in this.eventListeners) {
            for(let handler of this.eventListeners[event]) {
                handler(data);
            }
        }
    }


}



const instance = new Client()
Object.freeze(instance)

export default instance
