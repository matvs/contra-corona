export default class Bullet extends Phaser.GameObjects.Image {
    speed = 1;
    born = 0; // Time since new bullet spawned
    direction = 0;
    xSpeed = 0;
    ySpeed = 0;
    constructor(scene, x = 0, y = 0) {
        super(scene, x, y, 'bullet')
    }

    fire(shooter, target) {
        this.setPosition(shooter.x, shooter.y);
        this.direction = Math.atan((target.x - this.x) / (target.y - this.y));

        if (target.y >= this.y) {
            this.xSpeed = this.speed * Math.sin(this.direction);
            this.ySpeed = this.speed * Math.cos(this.direction);
        }
        else {
            this.xSpeed = -this.speed * Math.sin(this.direction);
            this.ySpeed = -this.speed * Math.cos(this.direction);
        }

        this.born = 0;

        return {
            x: this.x,
            y: this.y,
            direction: this.direction,
            xSpeed: this.xSpeed,
            ySpeed: this.ySpeed
        }
    }

    update(time, delta) {
        this.x += this.xSpeed * delta;
        this.y += this.ySpeed * delta;
        this.born += delta;
        if (this.born > 500) {
            this.setActive(false);
            this.setVisible(false);
        }
    }

    fireWith(socketBullet) {
        this.setPosition(socketBullet.x, socketBullet.y);
        this.direction = socketBullet.direction;
        this.xSpeed = socketBullet.xSpeed;
        this.ySpeed = socketBullet.ySpeed;
        this.born = 0;
    }

    static fromSocketBullet(scene, socketBullet) {
        const bullet = new Bullet(scene, socketBullet.x, socketBullet.y).setActive(true).setVisible(true);;
        bullet.direction = socketBullet.direction,
            bullet.xSpeed = socketBullet.xSpeed,
            bullet.ySpeed = socketBullet.ySpeed

        return bullet;
    }
}
