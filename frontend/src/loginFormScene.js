import Phaser from "phaser";
import loginForm from './loginForm.template.html'
import Socket from './socket-client';


export default class LoginFormScene extends Phaser.Scene {

  constructor() {
    super({ key: 'loginForm', active: true })
  }

  init() {

  }
  preload() {
    this.load.html('loginForm', loginForm);
  }

  create() {
    const element = this.add.dom(400, 300).createFromCache('loginForm');

    element.addListener('click');
    const errorMessage = element.getChildByID('errorMessage')
    const nameInput = element.getChildByID('name')

    nameInput.addEventListener('keydown', (e) => {
      e.stopPropagation();
    });

    nameInput.addEventListener('keyup', (e) => {
      e.stopPropagation();
    })

    event.stopPropagation();
    element.on('click', (event) => {
      errorMessage.style.display = 'none';
      if (event.target.id === 'join') {
        event.preventDefault();
        const name = nameInput.value;
        let team = event.target.parentElement.elements.team.value;
        if (!(team && name)) {
          errorMessage.style.display = 'block';
        } else {
         
          // this.scene.remove(this.scene.key);
          this.scene.manager.start('mainScene', {name, team});
          this.scene.remove(this.scene.key);
          // Socket.askNewPlayer({ team, name });
        }
      }
    });
  }

  update() {

  }

}
