const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let playerAngle = 0;

// player object
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 20,
    angle: Math.PI / 2,
    speed: 5,
    // hitbox properties
    hitbox: {
        width: 30,
        height: 30,
        offsetX: 0,
        offsetY: 0
    }
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

// Debug flag for hitbox display
let showHitboxes = false;

// Keyboard event listeners
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key in keys) {
        keys[key] = true;
    }
    
    // Toggle hitbox display with F3
    if (e.key === 'F3') {
        e.preventDefault();
        showHitboxes = !showHitboxes;
        console.log('Hitbox display:', showHitboxes ? 'ON' : 'OFF');
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

playerImage.onload = () => { imageLoaded = true; };
playerImage.onerror = () => { console.error('failed to load iamge from ' + playerImage.src); };

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

const InputHelper = {
    isAnyKeyPressed(keyArray, keyStates) { return keyArray.some(key => keyStates[key] === true); },
    areAllKeysPressed(keyArray, keyStates) { return keyArray.every(key => keyStates[key] === true); },
    getPressedKeys(keyStates) { return Object.keys(keyStates).filter(key => keyStates[key] === true); },
    isKeyPressed(key, keyStates) { return keyStates[key] === true; }
};

const HitboxHelper = {
    // get bounding box for an entity
    getAABB(entity) {
        return {
            x: entity.x - entity.hitbox.width / 2 + entity.hitbox.offsetX,
            y: entity.y - entity.hitbox.height / 2 + entity.hitbox.offsetY,
            width: entity.hitbox.width,
            height: entity.hitbox.height
        };
    },

    // check for entity - entity collision
    checkCollision(entity1, entity2) {
        const box1 = this.getAABB(entity1);
        const box2 = this.getAABB(entity2);

        return (
            box1.x < box2.x + box2.width &&
            box1.x + box1.width > box2.x &&
            box1.y < box2.y + box2.height &&
            box1.y + box1.height > box2.y
        );
    },

    // draw hitbox for debugging
    drawHitbox(ctx, entity, color = '#ff0000') {
        const box = this.getAABB(entity);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
    },

    // Check if a point (x, y) is within an entity's hitbox
    isPointInHitbox(x, y, entity) {
        const box = this.getAABB(entity);
        return (
            x >= box.x &&
            x <= box.x + box.width &&
            y >= box.y &&
            y <= box.y + box.height
        );
    }
};

const PlayerMovement = {
    updateAngle(playerObj, mousePos) {
        // Only update angle if mouse is outside the hitbox (prevents jittering)
        if (!HitboxHelper.isPointInHitbox(mousePos.x, mousePos.y, playerObj)) {
            const dx = mousePos.x - playerObj.x;
            const dy = mousePos.y - playerObj.y;
            playerObj.angle = Math.atan2(dy, dx);
        }
    },
    
    getMovementVectors(angle) {
        return {
            forward: { x: Math.cos(angle), y: Math.sin(angle) },
            right: { x: Math.cos(angle + Math.PI / 2), y: Math.sin(angle + Math.PI / 2) }
        };
    },

    // apply movement based on key states
    applyMovement(playerObj, keyStates, vectors, mousePos) {
        // Don't move if mouse is within the hitbox
        if (HitboxHelper.isPointInHitbox(mousePos.x, mousePos.y, playerObj)) {
            return;
        }
        
        const { forward, right } = vectors;
        
        if (InputHelper.isKeyPressed('w', keyStates)) {
            playerObj.x += forward.x * playerObj.speed;
            playerObj.y += forward.y * playerObj.speed;
        }
        if (InputHelper.isKeyPressed('s', keyStates)) {
            playerObj.x -= forward.x * playerObj.speed;
            playerObj.y -= forward.y * playerObj.speed;
        }
        if (InputHelper.isKeyPressed('a', keyStates)) {
            playerObj.x -= right.x * playerObj.speed;
            playerObj.y -= right.y * playerObj.speed;
        }
        if (InputHelper.isKeyPressed('d', keyStates)) {
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
        this.applyMovement(playerObj, keyStates, vectors, mousePos);
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
    } else { console.warn('player image not loaded, cannot draw player.'); }
    
    ctx.restore();
    
    // Draw hitbox only if debug mode is enabled (toggle with F3)
    if (showHitboxes) {
        HitboxHelper.drawHitbox(ctx, player, '#00ff00');
    }
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
