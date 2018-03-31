var sprites = {
    Beer: {
        sx: 512,
        sy: 99,
        w: 23,
        h: 32,
        frames: 1
    },
    Glass: {
        sx: 512,
        sy: 131,
        w: 23,
        h: 32,
        frames: 1
    },
    NPC: {
        sx: 512,
        sy: 66,
        w: 33,
        h: 33,
        frames: 1
    },
    ParedIzda: {
        sx: 0,
        sy: 0,
        w: 512,
        h: 480,
        frames: 1
    },
    Player: {
        sx: 512,
        sy: 0,
        w: 56,
        h: 66,
        frames: 1
    },
    TapperGameplay: {
        sx: 0,
        sy: 480,
        w: 512,
        h: 480,
        frames: 1
    }
};

var OBJECT_PLAYER = 1,
    OBJECT_PLAYER_PROJECTILE = 2,
    OBJECT_ENEMY = 4,
    OBJECT_ENEMY_PROJECTILE = 8,
    OBJECT_POWERUP = 16;

var startGame = function () {
    var ua = navigator.userAgent.toLowerCase();

    Game.setBoard(3, new TitleScreen("Tapper Game",
        "Pulsa la barra para empezar",
        playGame));

    Game.setBoard(6,new GamePoints(maxScore));
};

var myLevel = [
    // Type, Amount, Delay, Frequency
    ['default', 2, 0, 2000],
    ['default', 3, 4000, 2000],
    ['default', 3, 6000, 2000],
    ['default', 1, 8000, 2000]
];

var positionsPlayer = [{x: 325, y: 90}, {x: 357, y: 185}, {x: 389, y: 281}, {x: 421, y: 377}];
var positionsClient = [{x: 120, y: 90}, {x: 91, y: 185}, {x: 56, y: 281}, {x: 24, y: 377}];
var maxScore = 0;

/*var enemies = {
    bar1: {x: positionsClient[0].x, y: positionsClient[0].y},
    bar2: {x: positionsClient[1].x, y: positionsClient[1].y},
    bar3: {x: positionsClient[2].x, y: positionsClient[2].y},
    bar4: {x: positionsClient[3].x, y: positionsClient[3].y}
};*/

var playGame = function () {
    var board1 = new GameBoard();
    board1.add(new Background());

    Game.setBoard(3, board1);
    var board2 = new GameBoard();
    for(var i = 0; i < 4; i++){
        board2.add(new DeadZone(positionsPlayer[i].x + 10, positionsPlayer[i].y));
        board2.add(new DeadZone(positionsClient[i].x - 20, positionsClient[i].y));
    }
    board2.add(new Player());
    //board2.add(new Client());
    for(var j = 0; j < myLevel.length; j++) {
        board2.add(new Spawner(new Client(positionsClient[j]), myLevel[j]));
    };
    Game.setBoard(5, board2);
    Game.points = 0;

};

var GameManager = new function(){
        this.clientes = 0;
        this.jarras = 0;
        this.lives = 3;

        this.jarraRecogida = function(){
            this.jarras--;
            Game.points += 100;
            //Comprobar si has ganado
            if(this.clientes === 0 && this.jarras === 0)
                this.winGame();
        };

        this.clienteServido = function(){
            this.clientes--;
            this.jarras++;
            Game.points += 50;
        };

        this.asignarClientes = function(numClientes){
            this.clientes += numClientes;
        };

        this.loseGame = function(){
            if(Game.points > maxScore)
                maxScore = Game.points;
            Game.points = maxScore;
            Game.setBoard(5, new TitleScreen("You lose!",
                "Press fire to play again",
                playGame));
        };

        this.winGame = function () {
            Game.setBoard(5, new TitleScreen("You win!",
                "Press fire to play again",
                playGame));
        };

        /*this.noLives = function (){
            Game.setBoard(5, new TitleScreen("No more lives left! GAME OVER!"));
        };*/

};

var Background = function () {
    this.setup('TapperGameplay');

    //this.reload = this.reloadTime;
    this.x = 0;
    this.y = 0;

    this.step = function (dt) {
    };
};

Background.prototype = new Sprite();

var Player = function () {
    this.setup('Player', {reloadTime: 0.08, iniPosition: 0});

    this.reload = this.reloadTime;
    this.position = this.iniPosition;
    this.x = positionsPlayer[this.position].x;
    this.y = positionsPlayer[this.position].y;
    this.beer = new Beer();

    this.step = function (dt) {

        this.reload -= dt;

        if (this.reload < 0) {
            if (Game.keys['down']) {
                Game.keys['down'] = false;
                this.position++;
            }
            else if (Game.keys['up']) {
                Game.keys['up'] = false;
                this.position--;
            }

            if (this.position < 0)
                this.position = 3;

            if (this.position > 3)
                this.position = 0;

            this.x = positionsPlayer[this.position].x;
            this.y = positionsPlayer[this.position].y;

            if (Game.keys['fire']) {
                Game.keys['fire'] = false;
                var beer = Object.create(this.beer);
                beer.merge({x: (this.x - 5 - beer.w/2), y: (this.y + this.h/2 - beer.h)});
                this.board.add(beer);
            }

            this.reload = this.reloadTime;
        }
    };
};

Player.prototype = new Sprite();
Player.prototype.type = OBJECT_PLAYER;

var Beer = function (x, y) {
    this.setup('Beer', {vx: -100, damage: 10});
    this.x = x - this.w / 2;
    this.y = y - this.h;
    this.llena = true;

    this.step = function (dt) {
        if(this.llena) {
            this.x += this.vx * dt;
            var collision = this.board.collide(this, OBJECT_ENEMY);
            if (collision) {
                collision.hit(this.damage);
                this.vx = -this.vx;
                this.sprite = 'Glass';
                GameManager.clienteServido();
                this.llena = false;
            }
        }
        else{
            this.x += this.vx * dt;
            var collision = this.board.collide(this, OBJECT_PLAYER);
            if (collision) {
                this.board.remove(this);
            GameManager.jarraRecogida();
            }
        }
    }
};

Beer.prototype = new Sprite();
Beer.prototype.type = OBJECT_PLAYER_PROJECTILE;

var Client = function (position) {
    this.setup('NPC', {vx: -40, damage: 10});
    this.merge(position);

    this.step = function (dt) {
        this.x -= this.vx * dt;
    }
};

Client.prototype = new Sprite();
Client.prototype.type = OBJECT_ENEMY;

var DeadZone = function(x, y){
    this.x = x;
    this.y = y;
    this.w = 10;
    this.h = 70;

    this.draw = function (ctx) {
        ctx.fillStyle = "#00FF00";
        ctx.fillRect(this.x, this.y, this.w, this.h);
    };

    this.step = function (dt) {
        var collision = this.board.collide(this, OBJECT_ENEMY | OBJECT_PLAYER_PROJECTILE);
        if(collision){
            this.board.remove(collision);
            //lives--;
            //if(lives == 0)
                GameManager.loseGame();
        }
    };
};

var Spawner = function(client, parameters) {
    this.type  = parameters[0];
    this.amount = parameters[1];
    this.delay = parameters[2];
    this.frequency = parameters[3];
    this.t = 0;
    this.proto = client;
    this.count = 0;
    GameManager.asignarClientes(this.amount);
};

Spawner.prototype.step = function(dt) {

    // Update the current time offset
    this.t += dt * 1000;

    var cont = 0;
    while(this.delay <= this.t && this.count < this.amount) {

            // Add a new enemy
            var enemy = Object.create(this.proto);
            this.board.add(enemy);

            // Increment the delay by the frequency
            this.delay += this.frequency;
            this.count++;
    }

};

Spawner.prototype.draw = function(ctx) { };


window.addEventListener("load", function () {
    Game.initialize("game", sprites, startGame);
});


