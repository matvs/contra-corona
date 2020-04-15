import Phaser from "phaser";
import reticleImg from "./assets/reticle.png";
import coronaBullet from './assets/corona-bullet.png'
import redPlayerImg from './assets/chlop-czerwony.png'
import bluePlayerImg from './assets/chlop-niebieski.png'
import background from './assets/background-0.png'
import background1 from './assets/background-1.png'
import toiletPaper from './assets/1F9FB_black.png'
import fence from './assets/fence.png'
import table from './assets/table.png'
import box from './assets/box.png'
import Socket from './socket-client';
import Bullet from './bullet';


export default class MainScene extends Phaser.Scene {
  playerId;
  playerMap;
  reticle;
  playerBullets;
  enemyBullets;
  allEnemyBullets;
  speed = 800;
  arenaWidth = 1920 * 2;
  arenaHeight = 1080;
  moveKeys;
  text;
  lives;
  obstacles;
  textPointsBlue;
  textPointsRed
  points = {
    'red': 0,
    'blue': 0
  }
  playerData;

  static houses = {
    'blue': {
      x: 0,
      y: 0,
      width: 360,
      height: 300,
    },
    'red': {
      x: 3475,
      y: 0,
      width: 360,
      height: 300,
    }
  }

  get player() {
    if (this.playerId && this.playerId in this.playerMap) {
      return this.playerMap[this.playerId];
    }

    return null;
  }

  constructor() {
    super({ key: 'mainScene', active: false })
  }

  init(data) {
    this.listenToSocketEvents();
    this.playerData = data;
  }
  
  preload() {
    const playerFrameSize = { frameWidth: 76, frameHeight: 98 }; // spacing: 20
    this.load.spritesheet('blueTeam', bluePlayerImg,
      playerFrameSize
  );

    this.load.spritesheet('redTeam', redPlayerImg,
    playerFrameSize);

    this.load.image('background', background);
    this.load.image('background1', background1);


    this.load.image('target', reticleImg);
    this.load.image('bullet', coronaBullet);
    this.load.image('toiletPaper', toiletPaper);
    this.load.image('fence', fence);
    this.load.image('table', table);
    this.load.image('box', box);


  }

  create() {
    this.playerMap = {};
    this.add.image(1920 / 2, 1080 / 2, 'background');
    this.add.image(1920 + 1920 / 2, 1080 / 2, 'background1');

    this.physics.world.setBounds(0, 0, 1920 * 2, 1080);


    this.playerBullets = this.physics.add.group({ classType: Bullet, runChildUpdate: true });
    this.enemyBullets = this.physics.add.group({ classType: Bullet, runChildUpdate: true });
    this.obstacles = this.physics.add.group({ classType: Obstacle, runChildUpdate: true });

    this.physics.add.collider(this.playerBullets, this.obstacles, (bullet, obstacle) => {
      bullet.destroy();
    });

    this.text = this.add.text(10, 10, 'Lives: ', { color: 'white', fontFamily: 'Arial', fontSize: '42px' });
    this.text.setScrollFactor(0);

    this.lives = new Array(3).fill(0).map((x, i) => {
      const img = this.add.image(150 + 55 * i, 35, 'toiletPaper').setScrollFactor(0).setDisplaySize(70, 70);
      return img;
    })


    this.add.text(10, 60, 'Points:', { color: 'white', fontFamily: 'Arial', fontSize: '42px' }).setScrollFactor(0);
    this.textPointsBlue = this.add.text(10, 110, 'Blue: 0', { color: 'white', fontFamily: 'Arial', fontSize: '42px', /*color: '#0392cf' */ }).setScrollFactor(0);
    this.textPointsRed = this.add.text(10, 160, 'Red: 0', { color: 'white', fontFamily: 'Arial', fontSize: '42px', /*color: '#ff6f69'*/ }).setScrollFactor(0);

    this.buildHouses();
    this.buildObstacles();

    this.anims.create({
      key: 'walkblueTeam',
      frames: this.anims.generateFrameNumbers('blueTeam', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'walkredTeam',
      frames: this.anims.generateFrameNumbers('redTeam', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });

    this.bindUserInput();

    Socket.askNewPlayer(this.playerData);
  }

  update() {
    const player = this.player;
    const reticle = this.reticle;
    if (player && reticle) {
      const angle = Phaser.Math.Angle.Between(player.x, player.y, reticle.x, reticle.y);
      if (this.moveKeys.up.isDown) {
        player.setAcceleration(this.speed * Math.cos(angle), this.speed * Math.sin(angle))
      }

      player.rotation = Phaser.Math.Angle.Normalize(angle + Math.PI / 2);
      reticle.body.velocity.x = player.body.velocity.x;
      reticle.body.velocity.y = player.body.velocity.y;
      this.player.textName.x = player.x;
      this.player.textName.y = player.y - 60;

      this.constrainVelocity(player, 500);
      this.constrainReticle(reticle, 450);
    }

  }

  addNewPlayer({ id, x, y, angle, health, name, team }) {
    this.playerMap[id] = this.physics.add.sprite(x, y, team == 'blue' ? 'blueTeam' : 'redTeam'); //.setActive(true).setVisible(true);
    this.playerMap[id].textName = this.add.text(x, y - 60, name, { color: 'white', fontFamily: 'Arial', fontSize: '20px'});
    this.playerMap[id].rotation = angle;
    this.playerMap[id].health = health;
    this.playerMap[id].id = id;
    this.playerMap[id].name = name;
    this.playerMap[id].team = team;

    this.physics.add.collider(this.playerMap[id], this.obstacles);
    if (id != this.playerId) {
      this.physics.add.collider(this.playerMap[id], this.playerBullets, this.enemyHitCallback.bind(this));
    } else {
       this.cameras.main.startFollow(this.playerMap[this.playerId]);
       this.addTarget();
       // this.player.setCollideWorldBounds(true)
       this.playerMap[this.playerId].setCollideWorldBounds(true)
    }
  }

  removePlayer(id) {
    if (this.playerMap[id]) {
      this.playerMap[id].destroy();
      delete this.playerMap[id];
    }
  }

  addTarget() {
    const player = this.playerMap[this.playerId];
    this.reticle = this.physics.add.sprite(player.x, player.y + 20, 'target');
    this.reticle.setDisplaySize(25, 25).setCollideWorldBounds(true);

  }

  constrainVelocity(sprite, maxVelocity) {
    if (!sprite || !sprite.body)
      return;

    var angle, currVelocitySqr, vx, vy;
    vx = sprite.body.velocity.x;
    vy = sprite.body.velocity.y;
    currVelocitySqr = vx * vx + vy * vy;

    if (currVelocitySqr > maxVelocity * maxVelocity) {
      angle = Math.atan2(vy, vx);
      vx = Math.cos(angle) * maxVelocity;
      vy = Math.sin(angle) * maxVelocity;
      sprite.body.velocity.x = vx;
      sprite.body.velocity.y = vy;
    }
  }

  constrainReticle(reticle, radius) {
    const player = this.player;
    if (!(player && reticle)) {
      return;
    }
    const minDist = 80;

    var distBetween = Phaser.Math.Distance.Between(player.x, player.y, reticle.x, reticle.y);
    if (distBetween > radius) {
      var scale = distBetween / radius;

      reticle.x = player.x + (reticle.x - player.x) / scale;
      reticle.y = player.y + (reticle.y - player.y) / scale;
    } else if (distBetween < minDist) {
      var scale = distBetween / minDist;

      reticle.x = player.x + (reticle.x - player.x) / scale;
      reticle.y = player.y + (reticle.y - player.y) / scale;
    }
  }

  enemyHitCallback(enemyHit, bulletHit) {
    if (bulletHit.active === true && enemyHit.active === true) {
      if (enemyHit.health > 0) {
        Socket.hit(enemyHit.id);
      }
      bulletHit.setActive(false).setVisible(false);
    }
  }

  listenToSocketEvents() {
    Socket.listen('allplayers', (data) => {
      console.log(data);
      const { yoursId, players } = data;
      this.playerId = yoursId;
      for (var i = 0; i < players.length; i++) {
        this.addNewPlayer(players[i]);

      }
    });

    Socket.listen('newplayer', (data) => {
      this.addNewPlayer(data);
    });

    Socket.listen('currentPos', (data) => {
      if (this.playerId) {
        const players = data.players;
        let allEnemyBullets = [];
        for (var i = 0; i < players.length; i++) {
          const player = this.playerMap[players[i].id];
          if (player) {
            if (players[i].id == this.playerId) {
              const diff = player.health - players[i].health;
              if (diff > 0) {
                for (let counter = 0; counter < diff; ++counter) {
                  const life = this.lives.pop();
                  if (life) {
                    life.destroy();
                    if (this.lives.length == 0) {
                      this.moveToQuarantine(player)
                    }
                  }
                }
              }
              player.health = players[i].health;
            }

            if (players[i].id == this.playerId) {
              continue;
            }

            if (players[i].moving) {
              player.team == 'blue' ? player.anims.play('walkblueTeam', true) : player.anims.play('walkredTeam', true)
            } else {
              player.team == 'blue' ? player.anims.stop('walkblueTeam') : player.anims.stop('walkredTeam')

            }

            player.x = players[i].x;
            player.y = players[i].y;
            player.textName.x = player.x;
            player.textName.y = player.y - 60;
            
            player.rotation = players[i].angle
            const bullets = players[i].bullets
            if (bullets && bullets.length) {
              allEnemyBullets = [...allEnemyBullets, ...bullets];
            }
          }
        }

        for (let socketBullet of allEnemyBullets) {
          const bullet = this.enemyBullets.get().setActive(true).setVisible(true);
          bullet.fireWith(socketBullet);
        }

        const pointsRed = data.points.red;
        const pointsBlue = data.points.blue;
        if (this.textPointsRed && pointsRed != this.points.red) {
          this.textPointsRed.setText('Red: ' + pointsRed)
        }
        if (this.textPointsBlue && pointsBlue != this.points.blue) {
          this.textPointsBlue.setText('Blue: ' + pointsBlue)
        }


      }
    });

    Socket.listen('remove', (id) => {
      this.removePlayer(id);
    });

    setInterval(() => {
      const player = this.player;
      if (player) {
        // const activePLayerBullets = this.playerBullets.getChildren().filter(bullet => bullet.active).map(bullet => ({ x: bullet.x, y: bullet.y, rotation: bullet.rotation }));
        Socket.updateCoords({ x: player.x, y: player.y, angle: player.rotation, moving: this.moveKeys && this.moveKeys.up.isDown });
      }
    }, 10);
  }

  moveToQuarantine(player) {
    player.isQuarantined = true;
    setTimeout(() => {
      player.isQuarantined = false;
      this.lives = new Array(3).fill(0).map((x, i) => {
        const img = this.add.image(150 + 55 * i, 35, 'toiletPaper').setScrollFactor(0).setDisplaySize(70, 70);;
        return img;
      });
    }, 5000);
    player.x = player.team == 'blue' ?  randomInt(100, 400) :  randomInt(3475, 3775);
    player.y = randomInt(100, 350);
  }

  bindUserInput() {

    this.moveKeys = this.input.keyboard.addKeys({
      'up': Phaser.Input.Keyboard.KeyCodes.W,
      'down': Phaser.Input.Keyboard.KeyCodes.S,
      'left': Phaser.Input.Keyboard.KeyCodes.A,
      'right': Phaser.Input.Keyboard.KeyCodes.D
    });

    this.input.keyboard.on('keydown_W', event => {
      const player = this.player;
      if (player) {
        player.team == 'blue' ? player.anims.play('walkblueTeam', true) : player.anims.play('walkredTeam', true)
      }
    });

    // this.input.keyboard.on('keydown_S', event => {
    //   if(this.reticle){this.reticle.rotation = Phaser.Math.Angle.Normalize(this.reticle.rotation + Math.PI);} 
    // });
    // this.input.keyboard.on('keydown_A', event => {
    //   if(this.reticle){this.reticle.rotation = Phaser.Math.Angle.Normalize(this.reticle.rotation - Math.PI / 2);}
    // });
    // this.input.keyboard.on('keydown_D', event => {
    //   if(this.reticle){this.reticle.rotation = Phaser.Math.Angle.Normalize(this.reticle.rotation + Math.PI / 2);}
    // });

    this.input.keyboard.on('keyup_W', event => {
      const player = this.player;
      if (player) {
        player.setAcceleration(0, 0);
        player.body.velocity.x = 0;
        player.body.velocity.y = 0;
        player.team == 'blue' ? player.anims.stop('walkblueTeam') : player.anims.stop('walkredTeam')
      }

    });

    this.input.on('pointerdown', (pointer, time, lastFired) => {
      const player = this.player;
      if (player && player.active) {
        const bullet = this.playerBullets.get().setActive(true).setVisible(true);

        const socketBullet = bullet.fire(player, this.reticle);
        Socket.fireBullet(socketBullet);
      }
    });


    const game = this.scene.scene.game;
    game.canvas.addEventListener('mousedown', function () {
      game.input.mouse.requestPointerLock();
    });
    this.input.keyboard.on('keydown_Q', event => {
      if (game.input.mouse.locked)
        game.input.mouse.releasePointerLock();
    }, 0);

    this.input.on('pointermove', pointer => {
      if (this.input.mouse.locked) {
        if (this.reticle) {
          this.reticle.x += pointer.movementX;
          this.reticle.y += pointer.movementY;
        }
      }
    });
  }

  buildHouses() {
    const fenceWidth = 60;
    for (let team in MainScene.houses) {
      const house = MainScene.houses[team];
      const numberOfFences = Math.floor(house.width / 60);
      for (let i = 0; i < numberOfFences; ++i) {
        const topFence = this.obstacles.get(house.x + fenceWidth / 2 + i * fenceWidth, house.y, 'fence');
        topFence.body.setImmovable()
        const bottomFence = this.obstacles.get(house.x + fenceWidth / 2 + i * fenceWidth, house.y + house.height, 'fence').setActive(true).setVisible(true);
        bottomFence.body.setImmovable()
      }
      this.add.image(house.x + 30, house.y + 50, 'table');
    }
  }

  buildObstacles() {
    const coords = [{ x: 431, y: 581 },
    { x: 1439, y: 610 },
    { x: 1419, y: 262 },
    { x: 517, y: 230 },
    { x: 685, y: 666 },
    { x: 1257, y: 908 },
    { x: 954, y: 612 },
    { x: 1323, y: 890 },
    { x: 1596, y: 489 },
    { x: 644, y: 191 },

    { x: 3320, y: 350 },
    { x: 3009, y: 599 },
    { x: 2501, y: 382 },
    { x: 2229, y: 770 },
    { x: 3221, y: 647 },
    { x: 2949, y: 423 },
    { x: 3067, y: 153 },
    { x: 2019, y: 424 },
    { x: 3375, y: 386 },
    { x: 3410, y: 691 }
    ]
    for (let coord of coords) {
      const obstacle = this.obstacles.get(coord.x, coord.y, 'box').setActive(true).setVisible(true);;
      obstacle.body.setImmovable()
    }
  }
}


function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}

class Obstacle extends Phaser.GameObjects.Image {
  constructor(scene, x = 0, y = 0, key = 'fence') {
    super(scene, x, y, key)
  }
}
