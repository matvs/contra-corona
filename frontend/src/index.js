import Phaser from "phaser";
import LoginFormScene from './loginFormScene'
import MainScene from './mainScene'

const config = {
  type: Phaser.AUTO,
  backgroundColor: '#2ab7ca',
  width: 1920,
  height: 1080,
  parent: 'domContainer',
  dom: {
    createContainer: true
},
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [LoginFormScene,  MainScene]
};

const game = new Phaser.Game(config);
