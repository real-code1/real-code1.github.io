const values = [128, 64, 32, 16, 8, 4, 2, 1];

let bits = [0, 1, 0, 0, 0, 0, 0, 1];
let score = 0;
let target = 65;
let hintIndex = 0;
let pixels = Array(64).fill(0);
let gamePixels = Array(64).fill(0);
let targetImage = [];
let challengeType = "number";
let challengeMode = "decimalToBits";
let selectedChoice = "";

const imageChallenges = [
    [
        "00111100", "01000010", "10100101", "10000001",
        "10100101", "10011001", "01000010", "00111100"
    ],
    [
        "00000000", "01100110", "11111111", "11111111",
        "01111110", "00111100", "00011000", "00000000"
    ],
    [
        "10000001", "01000010", "00100100", "00011000",
        "00011000", "00100100", "01000010", "10000001"
    ]
];

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

    for (let i = 0; i < 64; i++) {
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
    if (challengeType === "number" || challengeType === "ascii") {
        challengeMode = Math.random() < 0.5 ? "decimalToBits" : "binaryToDecimal";
    } else if (challengeType === "imageDraw") {
        challengeMode = "imageDraw";
    } else {
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
    const isImageChallenge =
        challengeType === "imageDraw" || challengeType === "imageBinary";
    const isAsciiChoice = challengeType === "ascii" &&
        challengeMode === "binaryToDecimal";
    const isBinaryAnswer = challengeMode === "binaryToDecimal" &&
        !isAsciiChoice;

    document.getElementById("challengeTypeLabel").textContent =
        challengeType === "number" ? "Binary & Decimal Challenge" :
            challengeType === "ascii" ? "ASCII Challenge" :
                challengeType === "imageDraw" ? "Draw Image Challenge" :
                    "Image to Binary Challenge";

    targetArea.hidden = isImageChallenge;
    bitArea.hidden = isBinaryAnswer || isImageChallenge;
    answerArea.hidden = !isBinaryAnswer;
    choicesArea.hidden = !isAsciiChoice;
    imageArea.hidden = !isImageChallenge;
    document.getElementById("gameDrawingArea").hidden =
        challengeType !== "imageDraw";
    document.getElementById("imageBinaryAnswer").hidden =
        challengeType !== "imageBinary";
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
        const image = imageChallenges[
            Math.floor(Math.random() * imageChallenges.length)
        ];
        targetImage = image.join("").split("").map(Number);
        gamePixels = Array(64).fill(0);
        createGamePixels();
        if (challengeType === "imageDraw") {
            document.getElementById("gameInstructions").textContent =
                "Recreate the target image by turning on the matching pixels.";
        } else {
            document.getElementById("gameInstructions").textContent =
                "Enter the 8-bit binary data for each row of the target image.";
            createImageBinaryInputs();
        }
    }

    document.getElementById("gameMessage").textContent = "";
    document.getElementById("gameHint").textContent = "";

    bits = Array(8).fill(0);
    createBits();
    updateBinary();
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

    for (let row = 0; row < 8; row++) {
        const input = document.createElement("input");
        input.type = "text";
        input.className = "image-binary-input";
        input.maxLength = 8;
        input.pattern = "[01]{8}";
        input.inputMode = "numeric";
        input.setAttribute("aria-label", "Binary data for image row " + (row + 1));
        container.appendChild(input);
    }
}

function getHint() {
    if (challengeType === "imageDraw" || challengeType === "imageBinary") {
        const litPixels = targetImage.filter(pixel => pixel === 1).length;
        document.getElementById("gameHint").textContent =
            "Hint: The target image has " + litPixels + " lit pixels.";
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

function checkAnswer() {
    let isCorrect;

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
    } else if (challengeType === "imageDraw") {
        isCorrect = gamePixels.every((pixel, index) => pixel === targetImage[index]);
    } else if (challengeType === "imageBinary") {
        const inputs = document.querySelectorAll(".image-binary-input");
        isCorrect = Array.from(inputs).every(function (input, index) {
            const expectedRow = targetImage.slice(index * 8, index * 8 + 8).join("");
            return /^[01]{8}$/.test(input.value) && input.value === expectedRow;
        });
    } else {
        isCorrect = getNumber() === target;
    }

    if (isCorrect) {
        score += 10;

        document.getElementById("score").textContent = score;
        document.getElementById("gameMessage").textContent =
            "Correct! You earned 10 points!";
    } else {
        document.getElementById("gameMessage").textContent =
            "Not quite! Keep trying.";
    }
}

createBits();
updateBinary();
convertNumber();
createPixels();
startChallenge("number", document.querySelector(".challenge-option"));
