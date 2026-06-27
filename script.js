console.log("Running SCRIPT V4");
const videoElement = document.querySelector(".input_video");

const growText = document.createElement("div");
growText.classList.add("grow-text");
document.body.appendChild(growText);

const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.classList.add("stem-svg");
document.body.appendChild(svg);

const flowerImages = [
    "flowers/flower1.png",
    "flowers/flower2.png",
    "flowers/flower3.png"
];
const plants = [
    {
        startX: 0.35,
        startY: 0.98,
        height: 0.65,
        lean: -0.08,
        curve: -70,
        flowers: [
            { t: 0.45, side: -1, length: 0.13, flower: 0 },
            { t: 0.62, side: -1, length: 0.15, flower: 1 },
            { t: 0.80, side: -1, length: 0.12, flower: 2 }
        ]
    },
    {
        startX: 0.43,
        startY: 0.98,
        height: 0.70,
        lean: 0.10,
        curve: 75,
        flowers: [
            { t: 0.45, side: 1, length: 0.13, flower: 1 },
            { t: 0.62, side: 1, length: 0.15, flower: 2 },
            { t: 0.82, side: 1, length: 0.12, flower: 0 }
        ]
    }
];
const stemPaths = [];
const branchPaths = [];
const flowerElements = [];
const leafElements = [];
const lastPetalTimes = [];

plants.forEach((plant) => {
    const mainPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    mainPath.classList.add("stem-path");
    svg.appendChild(mainPath);
    stemPaths.push(mainPath);

    plant.flowers.forEach((flowerData) => {
        const branchPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        branchPath.classList.add("stem-path");
        svg.appendChild(branchPath);
        branchPaths.push(branchPath);

        const flower = document.createElement("img");
        flower.src = flowerImages[flowerData.flower];
        flower.classList.add("tree-flower");
        document.body.appendChild(flower);
        flowerElements.push(flower);
        const leaf = document.createElement("div");
        leaf.classList.add("leaf");
        document.body.appendChild(leaf);
        leafElements.push(leaf);
    });
});

const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
});

hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
});

hands.onResults(function(results) {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        growText.innerText = "No Hands";
        drawTrees(0, 0);
        return;
    }

    const handCount = results.multiHandLandmarks.length;

    growText.innerText = "Hands Detected Now: " + handCount;

    if (handCount === 1) {
        const growValue = getPinchValue(results.multiHandLandmarks[0]);
        drawTrees(growValue, 0);
        return;
    }

    if (handCount === 2) {
        const hand1Value = getPinchValue(results.multiHandLandmarks[0]);
        const hand2Value = getPinchValue(results.multiHandLandmarks[1]);

        const growValue = Math.max(hand1Value, hand2Value);
        const bloomValue = Math.min(hand1Value, hand2Value);

        drawTrees(growValue, bloomValue);
    }
});
function getPinchValue(hand) {
    const thumb = hand[4];
    const index = hand[8];

    const thumbX = thumb.x * window.innerWidth;
    const thumbY = thumb.y * window.innerHeight;

    const indexX = index.x * window.innerWidth;
    const indexY = index.y * window.innerHeight;

    const distance = Math.sqrt(
        (thumbX - indexX) ** 2 +
        (thumbY - indexY) ** 2
    );

    let value = (distance - 20) / 130;
    return Math.max(0, Math.min(1, value));
}

function drawTrees(grow, bloom) {
    let flowerIndex = 0;
    let branchIndex = 0;

    plants.forEach((plant, plantIndex) => {
        const startX = plant.startX * window.innerWidth;
        const startY = plant.startY * window.innerHeight;

        const endX = (plant.startX + plant.lean) * window.innerWidth;
        const endY = (plant.startY - plant.height) * window.innerHeight;

        const currentEndX = startX + (endX - startX) * grow;
        const currentEndY = startY + (endY - startY) * grow;

       const sway = Math.sin(Date.now() * 0.0015 + plantIndex) * 8;

       const controlX =
    (startX + currentEndX) / 2 +
    plant.curve +
    sway;
        const controlY = (startY + currentEndY) / 2;

        stemPaths[plantIndex].setAttribute(
            "d",
            `M ${startX} ${startY} Q ${controlX} ${controlY} ${currentEndX} ${currentEndY}`
        );

        stemPaths[plantIndex].style.opacity = grow * 0.55;
        stemPaths[plantIndex].setAttribute("stroke-width", 6);

        plant.flowers.forEach((flowerData) => {
            const branchGrow = Math.max(
                0,
                Math.min(1, (grow - flowerData.t + 0.18) / 0.25)
            );

            const stemPointX = startX + (endX - startX) * flowerData.t;
            const stemPointY = startY + (endY - startY) * flowerData.t;

            const branchEndX =
                stemPointX + flowerData.side * flowerData.length * window.innerWidth;

            const branchEndY =
                stemPointY - 0.08 * window.innerHeight;

            const currentBranchX =
                stemPointX + (branchEndX - stemPointX) * branchGrow;

            const currentBranchY =
                stemPointY + (branchEndY - stemPointY) * branchGrow;

            const branchControlX =
                (stemPointX + currentBranchX) / 2 + flowerData.side * 25;

            const branchControlY =
                (stemPointY + currentBranchY) / 2 - 20;

            branchPaths[branchIndex].setAttribute(
                "d",
                `M ${stemPointX} ${stemPointY} Q ${branchControlX} ${branchControlY} ${currentBranchX} ${currentBranchY}`
            );

            branchPaths[branchIndex].style.opacity = branchGrow * 0.5;
            branchPaths[branchIndex].setAttribute("stroke-width", 3);
            const leaf = leafElements[flowerIndex];

const leafX = stemPointX + (currentBranchX - stemPointX) * 0.45;
const leafY = stemPointY + (currentBranchY - stemPointY) * 0.45;

leaf.style.left = leafX + "px";
leaf.style.top = leafY + "px";
leaf.style.opacity = branchGrow* 0.85;

leaf.style.transform =
    `translate(-50%, -50%) rotate(${flowerData.side * 35}deg) scale(${0.4 + branchGrow * 0.8})`;
            const flower = flowerElements[flowerIndex];

            flower.style.left = currentBranchX + "px";
            flower.style.top = currentBranchY + "px";
            flower.style.opacity = branchGrow * bloom;

            const bloomBounce = Math.sin(bloom * Math.PI) * 0.12;
            const bloomScale = 0.15 + bloom * 1.05 + bloomBounce;

            flower.style.transform =
                `translate(-50%, -50%) scale(${bloomScale}) rotate(${flowerData.side * bloom * 14}deg)`;
       const glow = bloom * 18;

flower.style.filter =
    `drop-shadow(0 0 ${glow}px rgba(255,192,203,0.9))`;
     const now = Date.now();

    if (bloom > 0.85 && branchGrow > 0.9) {
    if (!lastPetalTimes[flowerIndex] || now - lastPetalTimes[flowerIndex] > 1800) {
        spawnPetals(currentBranchX, currentBranchY);
        spawnRipple(currentBranchX, currentBranchY);
        lastPetalTimes[flowerIndex] = now;
    }
}
            flowerIndex++;
            branchIndex++;
        });
    });
}

function spawnPetals(x, y) {

    for (let i = 0; i < 3; i++) {

        const petal = document.createElement("div");
        petal.className = "petal";

        petal.style.left = x + "px";
        petal.style.top = y + "px";

        const randomX = (Math.random() * 80 - 40) + "px";
        petal.style.setProperty("--petal-x", randomX);

        document.body.appendChild(petal);

        petal.addEventListener("animationend", () => {
            petal.remove();
        });

    }

}
function spawnPetals(x, y) {
    for (let i = 0; i < 3; i++) {
        const petal = document.createElement("div");
        petal.className = "petal";

        petal.style.left = x + "px";
        petal.style.top = y + "px";

        const randomX = (Math.random() * 80 - 40) + "px";
        petal.style.setProperty("--petal-x", randomX);

        document.body.appendChild(petal);

        petal.addEventListener("animationend", () => {
            petal.remove();
        });
    }
}

function spawnRipple(x, y) {

    const ripple = document.createElement("div");

    ripple.className = "ripple";

    ripple.style.left = x + "px";
    ripple.style.top = y + "px";

    document.body.appendChild(ripple);

    ripple.addEventListener("animationend", () => {
        ripple.remove();
    });

}
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480
});

camera.start().then(() => {

    setTimeout(() => {

        document.getElementById("loader").classList.add("hide");

    }, 800);

});