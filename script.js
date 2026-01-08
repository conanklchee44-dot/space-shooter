const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// player object
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 20,
    angle: 0,
    speed: 5
};
const mouse = {
    x: canvas.width / 2,
    y: canvas.height / 2
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
    },
    getMovementVectors(angle) {
        return {
            forward: { x: Math.cos(angle), y: Math.sin(angle) },
            right: { x: Math.cos(angle + Math.PI / 2), y: Math.sin(angle + Math.PI / 2) }
        };
    },

    // Apply movement based on input keys
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
        this.constrainToBounds(playerObj, bounds);
    }
};

// draw player
function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.beginPath();
    ctx.moveTo(player.size, 0);
    ctx.lineTo(-player.size / 2, player.size / 2);
    ctx.lineTo(-player.size / 2, -player.size / 2);
    ctx.closePath();
    
    ctx.fillStyle = '#00ff00';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
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
