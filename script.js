const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// player object
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 20,
    angle: Math.PI / 2,
    speed: 5
};
const mouse = {
    x: canvas.width / 2,
    y: canvas.height / 2
};

// keys state
const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

// Keyboard event listeners
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key in keys) {
        keys[key] = true;
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key in keys) {
        keys[key] = false;
    }
});

// load player image
const playerImage = new Image();
playerImage.src = 'assets/ships/ship-001.png';
let imageLoaded = false;

playerImage.onload = () => {
    imageLoaded = true;
};

playerImage.onerror = () => {
    console.error('failed to load iamge from ' + playerImage.src);
};

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

const PlayerMovement = {
    updateAngle(playerObj, mousePos) {
        const dx = mousePos.x - playerObj.x;
        const dy = mousePos.y - playerObj.y;
        playerObj.angle = Math.atan2(dy, dx);
        playerObj.angle += Math.PI * 2; // adjust for image orientation
    },
    getMovementVectors(angle) {
        return {
            forward: { x: Math.cos(angle), y: Math.sin(angle) },
            right: { x: Math.cos(angle + Math.PI / 2), y: Math.sin(angle + Math.PI / 2) }
        };
    },

    // apply movement based on key states
    applyMovement(playerObj, keyStates, vectors) {
        const { forward, right } = vectors;
        
        if (keyStates.w) {
            playerObj.x += forward.x * playerObj.speed;
            playerObj.y += forward.y * playerObj.speed;
        }
        if (keyStates.s) {
            playerObj.x -= forward.x * playerObj.speed;
            playerObj.y -= forward.y * playerObj.speed;
        }
        if (keyStates.a) {
            playerObj.x -= right.x * playerObj.speed;
            playerObj.y -= right.y * playerObj.speed;
        }
        if (keyStates.d) {
            playerObj.x += right.x * playerObj.speed;
            playerObj.y += right.y * playerObj.speed;
        }
    },


    constrainPlayer(playerObj, bounds) {
        playerObj.x = Math.max(playerObj.size, Math.min(bounds.width - playerObj.size, playerObj.x));
        playerObj.y = Math.max(playerObj.size, Math.min(bounds.height - playerObj.size, playerObj.y));
    },

    update(playerObj, mousePos, keyStates, bounds) {
        this.updateAngle(playerObj, mousePos);
        const vectors = this.getMovementVectors(playerObj.angle);
        this.applyMovement(playerObj, keyStates, vectors);
        this.constrainPlayer(playerObj, bounds);
    }
};

// draw player
function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    // Rotate with offset: subtract 90 degrees (Math.PI/2) if your image points up
    // The default angle calculation assumes the image points right (0 degrees)
    ctx.rotate(player.angle + Math.PI / 2);
    ctx.imageSmoothingEnabled = false;
    
    if (imageLoaded) {
        // draw image
        ctx.drawImage(
            playerImage, 
            -player.size, 
            -player.size, 
            player.size * 2, 
            player.size * 2
        );
    } else {
        console.warn('player image not loaded, cannot draw player.');
    }
    
    ctx.restore();
}
function gameLoop() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    PlayerMovement.update(player, mouse, keys, { width: canvas.width, height: canvas.height });
    drawPlayer();
    requestAnimationFrame(gameLoop);
}
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

gameLoop();
