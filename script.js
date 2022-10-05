const board_size = 8;
const DEBUG = true;
let stop = true;
var runningTimeout = null;
var runningAudio = null;
var defaultAudioLoop = null;

class Field {
    constructor(x, y, audioLoop, voice) {
        this.voice = voice
        this.x = x;
        this.y = y;
        if ((x % 2 === 0 && y % 2 === 0) || (x % 2 === 1 && y % 2 === 1)) {
            this.answer = "black";
        } else {
            this.answer = "white";
        };
        this.audioLoop = audioLoop;
        let that = this;
        if (DEBUG) console.log("add audio '" + this.string[1] + "' with voice " + voice);
        runningAudio = that.audioy;
        this.audioy = new Howl({ src: ["../sound/" + this.string[1] + "_" + voice + '.mp3'],
                                 onplay: function() { runningAudio = that.audioy; },
                                 onend: function() {
            runningAudio = null;
            that.audioLoop.last_answer = that.answer;
            that.audioLoop.play();
        }});
        if (DEBUG) console.log("add audio '" + this.string[0] + "' with voice " + voice);
        this.audiox = new Howl({ src: ["../sound/" + this.string[0] + "_" + voice + '.mp3'],
                                 onplay: function() { runningAudio = that.audiox; },
                                 onend: function() {
            runningAudio = null;
            that.audioy.play()
        } });
    };
    get string() {
        let y = 1 + eval(this.y);
        return 'ABCDEFGH'[this.x] + y;
    };
    play() {
        if (DEBUG) console.log("playing: " + this.string);
        this.audiox.play()
    };

};

class AudioLoop {
    constructor(level, time_after_question=4000, time_between_questions=2000, voice='woman') {
        this.level = level;
        this.time_after_question = time_after_question;
        this.time_between_questions = time_between_questions;
        this.voice = voice;
        this.last_question = ""
        this.pointer = -1; // Loop starts with an increase
        this.audios = [];
        this.run = false;
        this.last_answer = ''
        this.answers = { };
        for (let answer of ['black', 'white']) {
            let that = this
            if (DEBUG) console.log("add audio '" + answer + "' with voice " + voice);
            this.answers[answer] = new Howl({ src: ["../sound/" + answer + "_" + voice + '.mp3'], onend: function() {
                that.play();
            }});
        };

        for (let x in [...Array(board_size).keys()]) {
            this.audios.push([]);
            for (let y in [...Array(board_size).keys()]) {
                this.audios[x].push(new Field(x, y, this, voice));
            };
        };
        this.update_loop()
        if (DEBUG) console.log("Level is: " + this.level + " and contains " + AudioLoop.levels[this.level])
    };
    update_loop() {
        let that = this;
        this.loop = ['random_question', 'sleep_after_question', 'answer', 'sleep_between_questions'];
        this.max_x = this.level;
    };
    play() {

        if (this.run === false) {
            if (DEBUG) console.log("Running is disabled, stopping");
            return;
        }
        this.pointer++;
        if (this.pointer > (this.loop.length - 1)) {
            this.pointer = 0;
        }
        if (DEBUG) console.log("pointer goes to: " + this.pointer);

        if (this.loop[this.pointer] === 'random_question') {
            this.play_random();
        } else if (this.loop[this.pointer] === 'answer') {
            if (DEBUG) console.log('answering with ' + this.last_answer);
            this.answers[this.last_answer].play();
        } else if (this.loop[this.pointer] === 'sleep_after_question') {
            if (DEBUG) console.log('sleep for ' + this.time_after_question);
            runningTimeout = setTimeout(() => this.play(), this.time_after_question);
        } else if (this.loop[this.pointer] === 'sleep_between_questions') {
            if (DEBUG) console.log('sleep for ' + this.time_between_questions);
            runningTimeout = setTimeout(() => this.play(), this.time_between_questions);
        };
    }
    play_random() {
        while (true) {
            let r_x = [Math.floor(Math.random() * AudioLoop.levels[this.level].length)];
            let r_y = [Math.floor(Math.random() * AudioLoop.levels[this.level].length)];
            var rand_x = AudioLoop.levels[this.level][r_x];
            var rand_y = AudioLoop.levels[this.level][r_y];
            var s = "" + rand_x + rand_y;
            if (DEBUG) console.log("random generated: " + s);
            if (this.last_question !== s) {
                break;
            };
        };
        this.last_question = s;
        if (DEBUG) console.log("chose randomly: " + s);
        this.audios[rand_x][rand_y].play();
    };
};

var time_after_question_slider = document.getElementById("time_after_question");
time_after_question_slider.oninput = function() {
    defaultAudioLoop.time_after_question = this.value;
    if (DEBUG) console.log("time_after_question_slider is now at: " + this.value);
};

var time_between_questions_slider = document.getElementById("time_between_questions");
time_between_questions_slider.oninput = function() {
    defaultAudioLoop.time_between_questions = this.value;
    if (DEBUG) console.log("time_between_questions_slider is now at: " + this.value);
};


function chooseLevel(activeLevel) {
    var levels = [1,2,3];
    for (let level of levels) {
        let element = document.getElementById("level" + level);
        if (level === activeLevel) {
            element.classList.add("active");
            if (defaultAudioLoop) {
                toggle("stop");
            };
            defaultAudioLoop = new AudioLoop(level, time_after_question_slider.value, time_between_questions_slider.value);
        } else {
            if (element.classList.contains("active")) {
                element.classList.remove("active");
            };
        };
    };
};

function toggle(state="") {
    if (!(defaultAudioLoop)) {
        if (DEBUG) console.log("No defaultAudioLoop defined");
        // Todo: add warning button
        console.log("Please choose a level!");
        return;
    };

    let element = document.getElementById("play-button")
    if (DEBUG) console.log("toggle!");
    if (!(element.classList.contains("active")) && state !== "stop") {
        element.classList.add("active");
        element.innerText = "Stop";

        defaultAudioLoop.run = true;
        if (DEBUG) console.log("start new loop!");
        defaultAudioLoop.play();
    } else if (state !== "start") {
        if (DEBUG) console.log("Stopping!");
        defaultAudioLoop.run = false;
        defaultAudioLoop.pointer = -1;
        if (runningTimeout) {
            clearTimeout(runningTimeout);
            if (DEBUG) console.log("cleared timeout!");
        };
        if (runningAudio) {
            runningAudio.stop();
            if (DEBUG) console.log("stopped audio!");
        };
        element.innerText = "Start";
        element.classList.remove("active");
    };
};
AudioLoop.levels =  [
    [0, 1, 2, 3, 4, 5, 6, 7],
    [3, 4],
    [2, 3, 4, 5],
    [1, 2, 3, 4, 5, 6],
];
chooseLevel(1);

//var defaultAudioLoop = new AudioLoop(1, time_after_question_slider.value, time_between_questions_slider.value);
// document.getElementById("play-button").addEventListener("click", defaultAudioLoop.toggle);
