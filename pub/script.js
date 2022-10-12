const board_size = 8;
const DEBUG = true;
let stop = true;
var runningTimeout = null;
var runningAudio = null;
var currentVoice = "woman";
// These two are the only instances there are.
var defaultAudioLoop = null;
var defaultBoard = null;


class Field {
    constructor(fieldname, voice) {
        this.voice = voice;
        this.fieldname = fieldname;
        this.answer = Field.get_answer(fieldname);

        // Add 2 audios (e.g. "A" "1")
        let that = this;
        if (DEBUG) console.log("add audio '" + fieldname + "' with voice " + voice);
        runningAudio = that.audioy;
        this.audioy = new Howl({ src: ["../sound/" + fieldname[1] + "_" + voice + '.mp3'],
                                 onplay: function() { runningAudio = that.audioy; },
                                 onend: function() {
            runningAudio = null;
            defaultAudioLoop.play();
        }});
        if (DEBUG) console.log("add audio '" + fieldname[0] + "' with voice " + voice);
        this.audiox = new Howl({ src: ["../sound/" + fieldname[0] + "_" + voice + '.mp3'],
                                 onplay: function() { runningAudio = that.audiox; },
                                 onend: function() {
            runningAudio = null;
            that.audioy.play();
        }});
    };

    play() {
        if (DEBUG) console.log("playing: " + this.string);
        this.audiox.play();
    };

};

Field.get_field_numberal = function (fieldname) {
    if (DEBUG) console.log("fieldname = " + 'ABCDEFGH'.indexOf(fieldname[0]) + " " + fieldname[1]);
    return ['_ABCDEFGH'.indexOf(fieldname[0]), fieldname[1]];
};

Field.get_answer = function (fieldname) {
        let numberal = Field.get_field_numberal(fieldname);
        let x = numberal[0];
        let y = numberal[1];
        if ((x % 2 === 0 && y % 2 === 0) || (x % 2 === 1 && y % 2 === 1)) {
            return "black";
        } else {
            return "white";
        };
    };

class Board {
    constructor(activeFields, voice='woman') {
        this.last_question = ""
        this.last_answer = ''
        this.answers = {};
        this.voice = voice;
        this.fields = {};

        // We don't want to duplicate the answer for each field.
        for (let answer of ['black', 'white']) {
            let that = this
            if (DEBUG) console.log("add audio '" + answer + "' with voice " + voice);
            this.answers[answer] = new Howl({ src: ["../sound/" + answer + "_" + voice + '.mp3'], onend: function() {
                defaultAudioLoop.play();
            }});
        };

        // Create dictionary of fields
        for (let fieldname of activeFields) {
            this.fields[fieldname] = new Field(fieldname, voice);
        };
        if (DEBUG) console.log("Amount of active Fields: " + Object.keys(this.fields).length);
    };

    question() {
        // get random field
        let randomField;
        let keys = Object.keys(this.fields);
        while (true) {
            let randomKey = keys[Math.floor(Math.random() * keys.length)];
            randomField = this.fields[randomKey];
            if (DEBUG) console.log("random generated: " + randomField);
            if (this.last_question !== randomField) {
                break;
            };
        };
        this.last_question = randomField;
        if (DEBUG) console.log("chose randomly: " + randomField);
        this.last_answer = this.answers[randomField.answer];
        randomField.play();
    };

    answer() {
        if (DEBUG) console.log("Answering with: " + this.last_answer);
        this.last_answer.play();
    };
};



class AudioLoop {
    constructor(time_after_question=4000, time_between_questions=2000) {
        this.loop = ['question', 'sleep_after_question', 'answer', 'sleep_between_questions'];
        this.time_after_question = time_after_question;
        this.time_between_questions = time_between_questions;
        this.pointer = -1; // Loop starts with an increase
        this.run = false;
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

        if (this.loop[this.pointer] === 'question') {
            defaultBoard.question();
        } else if (this.loop[this.pointer] === 'answer') {
            defaultBoard.answer();
        } else if (this.loop[this.pointer] === 'sleep_after_question') {
            if (DEBUG) console.log('sleep for ' + this.time_after_question);
            runningTimeout = setTimeout(() => this.play(), this.time_after_question);
        } else if (this.loop[this.pointer] === 'sleep_between_questions') {
            if (DEBUG) console.log('sleep for ' + this.time_between_questions);
            runningTimeout = setTimeout(() => this.play(), this.time_between_questions);
        };
    }
};

/*
  Global Functions to be accessed by HTML
*/

function chooseLevel(activeLevel) {
    var levels = [1,2,3,4];
    let currentLevelList = [];
    if (defaultAudioLoop) {
        toggle("stop");
    };
    for (let level of levels) {
        let image = document.getElementById("level" + level + "-img");
        image.style.visibility = "hidden";
        let element = document.getElementById("level" + level);
        let isActive = element.classList.contains("active");
        if (level === activeLevel && isActive) {
            if (DEBUG) console.log("disabling level " + level);
            element.classList.remove("active");
        } else if (level === activeLevel) {
            if (DEBUG) console.log("enabling level" + level);
            element.classList.add("active");
            currentLevelList = currentLevelList.concat(AudioLoop.levels[level])
            image.style.visibility = "visible";
        } else if (isActive) {
            if (DEBUG) console.log("readding fields of active level " + level);
            currentLevelList = currentLevelList.concat(AudioLoop.levels[level])
            image.style.visibility = "visible";
        };
    };
    // we always want at least one level chosen.
    if (currentLevelList.length === 0) {
        chooseLevel(activeLevel);
    } else {
        defaultBoard = new Board(currentLevelList, currentVoice);
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
        document.getElementById("board").style.visibility = "hidden";

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
        document.getElementById("board").style.visibility = "visible";
        element.classList.remove("active");
    };
};

/*
  Connect to HTML
 */

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

/*
  Initialize Game
*/

AudioLoop.levels =  [
    [], // we ignore level 0
    ["D4", "D5", "E4", "E5"],
    ["C3", "C4", "C5", "C6", "D3", "D6", "E3", "E6", "F3", "F4", "F5", "F6"],
    ["B2", "B3", "B4", "B5", "B6", "B7", "C2", "C7", "D2", "D7", "E2", "E7", "F2", "F7", "G2", "G3", "G4", "G5", "G6", "G7"],
    ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "B1", "B8", "C1", "C8", "D1", "D8", "E1", "E8", "F1", "F8", "G1", "G8", "H1", "H2", "H3", "H4", "H5", "H6", "H7", "H8"],
];

chooseLevel(1);
defaultAudioLoop = new AudioLoop(time_after_question_slider.value, time_between_questions_slider.value);


//var defaultAudioLoop = new AudioLoop(1, time_after_question_slider.value, time_between_questions_slider.value);
// document.getElementById("play-button").addEventListener("click", defaultAudioLoop.toggle);
