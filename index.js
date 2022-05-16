import dictionary from "./dictionary.js";
import targetWords from "./targetWords.js";

const WORD_LENGTH = 5;
const FLIP_ANIMATION_DURATION = 500
const DANCE_ANIMATION_DURATION = 500
const dataGrid = document.querySelector("[data-guess-grid]");
const keyboard = document.querySelector("[data-keyboard]");
const alertContainer = document.querySelector("[data-alert-container]");
let targetWord;

startInteraction();

function generateTargetWord() {
    const offsetFromDate = new Date(2022, 0, 1);
    const msOffset = Date.now() - offsetFromDate;
    const dayOffset = msOffset / 1000 / 60 / 60 / 24;
    return targetWords[Math.floor(dayOffset)];
}

function startInteraction() {
    targetWord = generateTargetWord();
    document.addEventListener("click", handleMouseClick)
    document.addEventListener("keydown", handleKeyPress)
}

function stopInteraction() {
    document.removeEventListener("click", handleMouseClick)
    document.removeEventListener("keydown", handleKeyPress)
}

function handleMouseClick(e) {
    if (e.target.matches("[data-key]")) {
        pressKey(e.target.dataset.key);
        return;
    }
    if (e.target.matches("[data-enter]")) {
        submitGuess();
        return;
    }
    if (e.target.matches("[data-delete]")) {
        deleteKey();
        return;
    }
}

function handleKeyPress(e) {
    if (e.key.match(/^[a-zA-Z]$/)) {
        pressKey(e.key);
        return;
    }
    if (e.key === "Enter") {
        submitGuess();
        return;
    }
    if (e.key === "Backspace" || e.key === "Delete") {
        deleteKey();
        return;
    }
}

function getActiveTiles() {
    return dataGrid.querySelectorAll("[data-state='active']")
}

function pressKey(key) {
    const activeTiles = getActiveTiles();
    if (activeTiles.length >= WORD_LENGTH) {
        return;
    }
    const nextTile = dataGrid.querySelector(":not([data-letter])");
    nextTile.dataset.letter = key.toLowerCase();
    nextTile.dataset.state = "active";
    nextTile.textContent = key;
}
function deleteKey() {
    const activeTiles = getActiveTiles();
    const lastTile = activeTiles[activeTiles.length - 1];
    if (lastTile == null) {
        return;
    }
    lastTile.innerHTML = "";
    delete lastTile.dataset.letter;
    delete lastTile.dataset.state;
}

function showAlert(text, duration = 1000) {
    let alertEl = document.createElement("div");
    alertEl.classList.add("alert");
    alertEl.innerText = text;
    alertContainer.prepend(alertEl);
    if (duration == null) {
        return;
    }
    setTimeout(() => {
        alertEl.classList.add("hide");
        alertEl.addEventListener("transitionend", () => {
            alertEl.remove();
        })
    }, duration);
}
function checkWinLose(guess, activeTiles) {
    if (guess === targetWord) {
        showAlert("You Win", 5000);
        danceTiles(activeTiles);
        stopInteraction();
        return;
    }
    const remainingTiles = dataGrid.querySelectorAll(":not([data-letter])")
    if (remainingTiles.length === 0) {
        showAlert(`Correct Word: ${targetWord.toUpperCase()}`, null);
        stopInteraction();
    }
}

function danceTiles(tiles) {
    tiles.forEach((tile, index) => {
        setTimeout(() => {
            tile.classList.add("dance");
            tile.addEventListener(
                "animationend",
                () => {
                    tile.classList.remove("dance");
                },
                { once: true }
            )
        }, (index * DANCE_ANIMATION_DURATION) / 5);
    });
}

function shakeTiles(activeTiles) {
    activeTiles.forEach((tile) => {
        tile.classList.add("shake");
        tile.addEventListener(
            "animationend",
            () => {
                tile.classList.remove("shake");
            },
            { once: true }
        )
    });
}

function flipTile(tile, index, activeTiles, guess) {
    const letter = tile.dataset.letter;
    const keyboardTarget = keyboard.querySelector(`[data-key='${letter}'i]`);
    setTimeout(() => {
        tile.classList.add("flip");
    }, index * FLIP_ANIMATION_DURATION / 2);
    tile.addEventListener("transitionend", () => {
        tile.classList.remove("flip");
        if (targetWord[index] === letter) {
            tile.dataset.state = "correct"
            keyboardTarget.classList.add("correct")
        } else if (targetWord.includes(letter)) {
            tile.dataset.state = "wrong-location"
            keyboardTarget.classList.add("wrong-location")
        } else {
            tile.dataset.state = "wrong"
            keyboardTarget.classList.add("wrong")
        }

        if (index === activeTiles.length - 1) {
            tile.addEventListener(
                "transitionend",
                () => {
                    checkWinLose(guess, activeTiles)
                }
            )
        }
    }, { once: true }
    );
}

function submitGuess() {
    const activeTiles = [...getActiveTiles()];

    if (activeTiles.length !== WORD_LENGTH) {
        showAlert("Not enough length");
        shakeTiles(activeTiles);
        return;
    }
    let currGuess = activeTiles.reduce((word, tile) => {
        return word + tile.dataset.letter
    }, "");
    if (!dictionary.includes(currGuess)) {
        showAlert("Not in word list");
        shakeTiles(activeTiles);
        return;
    }
    activeTiles.forEach((...params) => flipTile(...params, currGuess));
}