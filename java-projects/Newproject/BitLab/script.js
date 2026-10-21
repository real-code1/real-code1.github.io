const values = [128, 64, 32, 16, 8, 4, 2, 1];
const imageSize = 4;
const imagePixelCount = imageSize * imageSize;

let bits = [0, 1, 0, 0, 0, 0, 0, 1];
let score = 0;
let target = 65;
let hintIndex = 0;
let pixels = Array(64).fill(0);
let gamePixels = Array(imagePixelCount).fill(0);
let targetImage = [];
let challengeType = "number";
let challengeMode = "decimalToBits";
let selectedChoice = "";
let imageRevealInterval = null;
let imageChallengeStarted = false;
let nextChallengeTimeout = null;

function showTab(tabName, clickedButton) {
    document.querySelectorAll(".tab-page").forEach(function (page) {
        const isSelected = page.id === tabName;
        page.classList.toggle("active", isSelected);
        page.hidden = !isSelected;
    });

    document.querySelectorAll(".tab-button").forEach(function (button) {
        const isSelected = button === clickedButton;
        button.classList.toggle("active", isSelected);
        button.setAttribute("aria-selected", isSelected);
        button.tabIndex = isSelected ? 0 : -1;
    });
}

document.querySelectorAll(".tab-button").forEach(function (button, index, buttons) {
    button.addEventListener("keydown", function (event) {
        let nextIndex;

        if (event.key === "ArrowRight") {
            nextIndex = (index + 1) % buttons.length;
        } else if (event.key === "ArrowLeft") {
            nextIndex = (index - 1 + buttons.length) % buttons.length;
        } else if (event.key === "Home") {
            nextIndex = 0;
        } else if (event.key === "End") {
            nextIndex = buttons.length - 1;
        } else {
            return;
        }

        event.preventDefault();
        buttons[nextIndex].focus();
        buttons[nextIndex].click();
    });
});

function createBits() {
    const containers = [
        { element: document.getElementById("bits"), label: "Bit", showValues: true },
        { element: document.getElementById("gameBits"), label: "Game bit", showValues: false }
    ];

    containers.forEach(function (container) {
        container.element.innerHTML = "";

        for (let i = 0; i < 8; i++) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "bit";
            button.setAttribute("aria-pressed", bits[i] === 1);
            button.setAttribute("aria-label", container.label + " value " + values[i]);
            button.innerHTML = (container.showValues
                ? "<span>" + values[i] + "</span>"
                : "") + bits[i];

            if (bits[i] === 1) {
                button.classList.add("active");
            }

            button.onclick = function () {
                bits[i] = bits[i] === 1 ? 0 : 1;
                createBits();
                updateBinary();
            };

            container.element.appendChild(button);
        }
    });
}

function getNumber() {
    let total = 0;

    for (let i = 0; i < 8; i++) {
        total += bits[i] * values[i];
    }

    return total;
}

function updateBinary() {
    const binary = bits.join("");
    const number = getNumber();

    document.getElementById("binaryValue").textContent = binary;
    document.getElementById("decimalValue").textContent = number;
    document.getElementById("hexValue").textContent =
        "0x" + number.toString(16).toUpperCase().padStart(2, "0");

    if (number >= 32 && number <= 126) {
        document.getElementById("asciiValue").textContent =
            String.fromCharCode(number);
    } else {
        document.getElementById("asciiValue").textContent =
            "Non-printable";
    }
}

function convertNumber() {
    const input = document.getElementById("numberInput");
    const number = Number(input.value);

    if (
        input.value.trim() === "" ||
        !Number.isInteger(number) ||
        number < 0 ||
        number > 255
    ) {
        alert("Enter a whole number from 0 to 255.");
        return;
    }

    document.getElementById("numberBinary").textContent =
        number.toString(2).padStart(8, "0");

    document.getElementById("numberHex").textContent =
        "0x" + number.toString(16).toUpperCase().padStart(2, "0");

    bits = values.map(value => (number & value) ? 1 : 0);

    createBits();
    updateBinary();
}

function createPixels() {
    const grid = document.getElementById("pixelGrid");
    grid.innerHTML = "";

    for (let i = 0; i < 64; i++) {
        const pixel = document.createElement("button");
        pixel.type = "button";
        pixel.className = "pixel";
        pixel.setAttribute("aria-pressed", pixels[i] === 1);
        pixel.setAttribute("aria-label", "Pixel " + (i + 1));

        if (pixels[i] === 1) {
            pixel.classList.add("on");
        }

        pixel.onclick = function () {
            pixels[i] = pixels[i] === 1 ? 0 : 1;
            createPixels();
        };

        grid.appendChild(pixel);
    }

    updatePixelData();
}

function updatePixelData() {
    let data = "";

    for (let row = 0; row < 8; row++) {
        data += pixels.slice(row * 8, row * 8 + 8).join("") + "\n";
    }

    document.getElementById("pixelData").textContent = data;
}

function clearPixels() {
    pixels = Array(64).fill(0);
    createPixels();
}

function createGamePixels() {
    const targetGrid = document.getElementById("targetPixelGrid");
    const answerGrid = document.getElementById("gamePixelGrid");
    targetGrid.innerHTML = "";
    answerGrid.innerHTML = "";

    for (let i = 0; i < imagePixelCount; i++) {
        const targetPixel = document.createElement("span");
        targetPixel.className = "game-target-pixel";
        if (targetImage[i] === 1) {
            targetPixel.classList.add("on");
        }
        targetPixel.setAttribute("aria-hidden", "true");
        targetGrid.appendChild(targetPixel);

        const pixel = document.createElement("button");
        pixel.type = "button";
        pixel.className = "pixel";
        pixel.setAttribute("aria-pressed", gamePixels[i] === 1);
        pixel.setAttribute("aria-label", "Pixel " + (i + 1));
        if (gamePixels[i] === 1) {
            pixel.classList.add("on");
        }
        pixel.onclick = function () {
            gamePixels[i] = gamePixels[i] === 1 ? 0 : 1;
            createGamePixels();
        };
        answerGrid.appendChild(pixel);
    }
}

function newChallenge() {
    if (nextChallengeTimeout !== null) {
        clearTimeout(nextChallengeTimeout);
        nextChallengeTimeout = null;
    }
    if (imageRevealInterval !== null) {
        clearInterval(imageRevealInterval);
        imageRevealInterval = null;
    }
    imageChallengeStarted = false;

    if (challengeType === "number" || challengeType === "ascii") {
        challengeMode = Math.random() < 0.5 ? "decimalToBits" : "binaryToDecimal";
    } else if (challengeType === "binaryToImage") {
        challengeMode = "binaryToImage";
    } else if (challengeType === "imageToBinary") {
        challengeMode = "imageToBinary";
    }
    hintIndex = 0;

    const targetArea = document.getElementById("gameTargetArea");
    const bitArea = document.getElementById("gameBitArea");
    const answerArea = document.getElementById("gameAnswerArea");
    const choicesArea = document.getElementById("gameChoices");
    const imageArea = document.getElementById("gameImageArea");
    const targetLabel = document.getElementById("targetLabel");
    const binaryInput = document.getElementById("gameAnswer");
    const isImageChallenge = challengeType === "binaryToImage" ||
        challengeType === "imageToBinary";
    const isAsciiChoice = challengeType === "ascii" &&
        challengeMode === "binaryToDecimal";
    const isBinaryAnswer = challengeMode === "binaryToDecimal" &&
        !isAsciiChoice;

    document.getElementById("challengeTypeLabel").textContent =
        challengeType === "number" ? "Binary & Decimal Challenge" :
            challengeType === "ascii" ? "ASCII Challenge" :
                challengeType === "binaryToImage" ?
                    "Binary to Image Challenge" :
                    "Image to Binary Challenge";

    targetArea.hidden = isImageChallenge;
    bitArea.hidden = isBinaryAnswer || isImageChallenge;
    answerArea.hidden = !isBinaryAnswer;
    choicesArea.hidden = !isAsciiChoice;
    imageArea.hidden = !isImageChallenge;
    document.getElementById("gameDrawingArea").hidden =
        challengeMode !== "binaryToImage";
    document.getElementById("targetPictureArea").hidden = true;
    document.getElementById("targetBinaryArea").hidden =
        true;
    document.getElementById("imageBinaryAnswer").hidden = true;
    document.getElementById("imageCountdown").hidden = true;
    document.getElementById("imagePlayButton").hidden = !isImageChallenge;
    binaryInput.value = "";
    choicesArea.innerHTML = "";
    selectedChoice = "";

    if (challengeType === "number" && challengeMode === "decimalToBits") {
        target = Math.floor(Math.random() * 256);
        targetLabel.textContent = "Decimal Number";
        document.getElementById("targetNumber").textContent = target;
        document.getElementById("gameInstructions").textContent =
            "Set the bits to represent this decimal number.";
    } else if (challengeType === "number") {
        target = Math.floor(Math.random() * 256);
        targetLabel.textContent = "Binary Number";
        document.getElementById("targetNumber").textContent =
            target.toString(2).padStart(8, "0");
        document.getElementById("gameInstructions").textContent =
            "Convert this binary number to decimal.";
    } else if (challengeType === "ascii" && challengeMode === "decimalToBits") {
        target = Math.floor(Math.random() * 94) + 33;
        targetLabel.textContent = "ASCII Character";
        document.getElementById("targetNumber").textContent =
            String.fromCharCode(target);
        document.getElementById("gameInstructions").textContent =
            "Set the bits to represent this character's ASCII code.";
    } else if (isAsciiChoice) {
        target = Math.floor(Math.random() * 94) + 33;
        targetLabel.textContent = "ASCII Code";
        document.getElementById("targetNumber").textContent = target;
        document.getElementById("gameInstructions").textContent =
            "Choose the character that matches this ASCII code.";
        createAsciiChoices(choicesArea);
    } else {
        const image = Array.from({ length: imageSize }, function () {
            return Array.from({ length: imageSize }, function () {
                return Math.random() < 0.5 ? "0" : "1";
            }).join("");
        });
        targetImage = image.join("").split("").map(Number);
        gamePixels = Array(imagePixelCount).fill(0);
        createGamePixels();
        document.getElementById("gameDrawingArea").hidden = true;
        document.getElementById("targetPictureArea").hidden = true;
        if (challengeMode === "binaryToImage") {
            const binaryData = image.join("\n");
            document.getElementById("targetImageBinary").textContent = binaryData;
            document.getElementById("gameInstructions").textContent =
                "Press Play and memorize the random 4-by-4 binary pattern. Then recreate it with the pixels.";
        } else {
            document.getElementById("gameInstructions").textContent =
                "Press Play and memorize the random 4-by-4 image. Then enter its binary rows.";
            createImageBinaryInputs();
        }
    }

    document.getElementById("gameMessage").textContent = "";
    document.getElementById("gameHint").textContent = "";

    bits = Array(8).fill(0);
    createBits();
    updateBinary();
}

function startImageChallenge() {
    if (!isImageChallenge()) {
        return;
    }
    if (imageChallengeStarted || imageRevealInterval !== null) {
        return;
    }

    imageChallengeStarted = true;
    let secondsLeft = 5;
    const playButton = document.getElementById("imagePlayButton");
    const countdown = document.getElementById("imageCountdown");
    const targetPicture = document.getElementById("targetPictureArea");
    const targetBinary = document.getElementById("targetBinaryArea");
    const drawingArea = document.getElementById("gameDrawingArea");
    const binaryAnswer = document.getElementById("imageBinaryAnswer");

    playButton.hidden = true;
    countdown.hidden = false;
    countdown.textContent = "Memorize the pattern: " + secondsLeft;
    targetPicture.hidden = challengeMode !== "imageToBinary";
    targetBinary.hidden = challengeMode !== "binaryToImage";

    imageRevealInterval = setInterval(function () {
        secondsLeft--;
        if (secondsLeft > 0) {
            countdown.textContent = "Memorize the pattern: " + secondsLeft;
            return;
        }

        clearInterval(imageRevealInterval);
        imageRevealInterval = null;
        targetPicture.hidden = true;
        targetBinary.hidden = true;
        drawingArea.hidden = challengeMode !== "binaryToImage";
        binaryAnswer.hidden = challengeMode !== "imageToBinary";
        countdown.hidden = true;
        document.getElementById("gameInstructions").textContent =
            challengeMode === "imageToBinary"
                ? "Enter the four 4-bit rows you memorized."
                : "Recreate the binary pattern by lighting the matching pixels.";
    }, 1000);
}

function startChallenge(type, button) {
    challengeType = type;
    document.querySelectorAll(".challenge-option").forEach(function (option) {
        const isSelected = option === button;
        option.classList.toggle("active", isSelected);
        option.setAttribute("aria-pressed", isSelected);
    });
    newChallenge();
}

function createAsciiChoices(container) {
    const correctCharacter = String.fromCharCode(target);
    const characters = new Set([correctCharacter]);

    while (characters.size < 4) {
        characters.add(String.fromCharCode(Math.floor(Math.random() * 94) + 33));
    }

    Array.from(characters).sort(() => Math.random() - 0.5).forEach(function (character) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "game-choice";
        button.textContent = character;
        button.setAttribute("aria-pressed", "false");
        button.onclick = function () {
            selectedChoice = character;
            container.querySelectorAll(".game-choice").forEach(function (choice) {
                const isSelected = choice === button;
                choice.classList.toggle("active", isSelected);
                choice.setAttribute("aria-pressed", isSelected);
            });
        };
        container.appendChild(button);
    });
}

function createImageBinaryInputs() {
    const container = document.getElementById("imageBinaryInputs");
    container.innerHTML = "";

    for (let row = 0; row < imageSize; row++) {
        const input = document.createElement("input");
        input.type = "text";
        input.className = "image-binary-input";
        input.maxLength = imageSize;
        input.pattern = "[01]{" + imageSize + "}";
        input.inputMode = "numeric";
        input.value = "0".repeat(imageSize);
        input.setAttribute("aria-label", "4-bit binary data for image row " + (row + 1));
        container.appendChild(input);
    }
}

function getHint() {
    if (challengeType === "binaryToImage" ||
        challengeType === "imageToBinary") {
        const litPixels = targetImage.filter(pixel => pixel === 1).length;
        document.getElementById("gameHint").textContent =
            "Hint: This image has " + litPixels + " lit pixels.";
        return;
    }

    if (challengeType === "ascii" && challengeMode === "binaryToDecimal") {
        document.getElementById("gameHint").textContent =
            "Hint: ASCII uses a number to represent each character.";
        return;
    }

    if (hintIndex >= values.length) {
        document.getElementById("gameHint").textContent =
            "You've used all the hints. Try your answer!";
        return;
    }

    const exponent = hintIndex;
    const value = values[values.length - 1 - hintIndex];
    document.getElementById("gameHint").textContent =
        "Hint: Start counting at the rightmost bit as position 0. Each step " +
        "to the left increases the position by 1. Bit " + exponent +
        " is worth 2^" + exponent + " = " + value + ".";
    hintIndex++;
}

function isImageChallenge() {
    return challengeType === "binaryToImage" ||
        challengeType === "imageToBinary";
}

function checkAnswer() {
    let isCorrect;

    if (nextChallengeTimeout !== null) {
        return;
    }

    if (isImageChallenge() &&
        (!imageChallengeStarted || imageRevealInterval !== null)) {
        document.getElementById("gameMessage").textContent =
            "Press Play and finish the five-second countdown before answering.";
        return;
    }

    if (challengeMode === "binaryToDecimal" &&
        (challengeType === "number" || challengeType === "ascii")) {
        if (challengeType === "ascii") {
            isCorrect = selectedChoice === String.fromCharCode(target);
        } else {
            const input = document.getElementById("gameAnswer");
            const answer = Number(input.value);
            if (
                input.value.trim() === "" ||
                !Number.isInteger(answer) ||
                answer < 0 ||
                answer > 255
            ) {
                document.getElementById("gameMessage").textContent =
                    "Enter a whole number from 0 to 255.";
                return;
            }
            isCorrect = answer === target;
        }
    } else if (challengeType === "binaryToImage" &&
        challengeMode === "binaryToImage") {
        isCorrect = gamePixels.every((pixel, index) => pixel === targetImage[index]);
    } else if (challengeType === "imageToBinary" &&
        challengeMode === "imageToBinary") {
        const inputs = document.querySelectorAll(".image-binary-input");
        isCorrect = Array.from(inputs).every(function (input, index) {
            const expectedRow = targetImage.slice(
                index * imageSize,
                index * imageSize + imageSize
            ).join("");
            const rowPattern = new RegExp("^[01]{" + imageSize + "}$");
            return rowPattern.test(input.value) && input.value === expectedRow;
        });
    } else {
        isCorrect = getNumber() === target;
    }

    if (isCorrect) {
        score += 10;

        document.getElementById("score").textContent = score;
        document.getElementById("gameMessage").textContent =
            "Correct! You earned 10 points. Next question coming up...";
    } else {
        document.getElementById("gameMessage").textContent =
            "Not quite! Next question coming up...";
    }

    nextChallengeTimeout = setTimeout(function () {
        nextChallengeTimeout = null;
        newChallenge();
    }, 1500);
}

createBits();
updateBinary();
convertNumber();
createPixels();
startChallenge("number", document.querySelector(".challenge-option"));
