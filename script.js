const board_size = 8;
const DEBUG = true;
class Field {
    constructor(x, y, audioLoop) {
        this.x = x;
        this.y = y;
        if ((x % 2 === 0 && y % 2 === 0) || (x % 2 === 1 && y % 2 === 1)) {
            this.answer = "black";
        } else {
            this.answer = "white";
        };
        this.audioLoop = audioLoop;
        //this.audio = new Howl({ src: ["" + x + y + '.mp3'] });
    };
    get string() {
        let y = 1 + eval(this.y);
        return 'ABCDEFGH'[this.x] + y;
    };
    play() {
        if (DEBUG) console.log("playing: " + this.string);
        this.audioLoop.last_answer = this.answer;
        this.audioLoop.play();
    };

};
class AudioLoop {
    constructor(level, sleep_after_move) {
        this.level = level;
        this.sleep_after_move = sleep_after_move;
        this.pointer = 0;
        this.audios = []
        for (let x in [...Array(board_size).keys()]) {
            this.audios.push([]);
            for (let y in [...Array(board_size).keys()]) {
                this.audios[x].push(new Field(x, y, this));
            };
        };
        this.update_loop()
        if (DEBUG) console.log("Level is: " + AudioLoop.levels[this.level])
    };
    update_loop() {
        let that = this
        this.loop = ['play', 'sleep']
        this.max_x = this.level
    };
    play() {
        this.pointer++
        if (this.pointer > (this.loop.length - 1)) {
            this.pointer = 0;
        }
        if (DEBUG) console.log("pointer goes to: " + this.pointer);

        if (this.loop[this.pointer] === 'play') {
            this.play_random();
        } else if (this.loop[this.pointer] === 'sleep') {
            if (DEBUG) console.log('sleep for ' + this.sleep_after_move);
            setTimeout(() => this.play(), this.sleep_after_move);
        };
    }
    play_random() {
        let rand_x = AudioLoop.levels[this.level][Math.floor(Math.random() * AudioLoop.levels[this.level].length)];
        let rand_y = AudioLoop.levels[this.level][Math.floor(Math.random() * AudioLoop.levels[this.level].length)];
        if (DEBUG) console.log("chose randomly: " + rand_x +" " + rand_y);
        this.audios[rand_x][rand_y].play()
    };
};
AudioLoop.levels =  [
    [0, 1, 2, 3, 4, 5, 6, 7],
    [3, 4],
    [2, 3, 4, 5],
    [1, 2, 3, 4, 5, 6],
];

let myLoop = new AudioLoop(1, 1000)
myLoop.play()
