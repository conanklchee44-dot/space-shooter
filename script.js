const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let playerAngle = 0;
let score = 0;

// player object
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 20,
    angle: Math.PI / 2,
    speed: 5,
    // hitbox properties
    hitbox: {
        type: 'rect',
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


const bullets = [];
const bulletSpeed = 10;
const bulletSize = 8;

const enemies = [];
const enemySize = Math.random() * 64 + 64; // 64 to 128
const enemySpeed = 2;

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

// images
const playerImage = new Image();
playerImage.src = 'assets/ships/ship-001.png';
let imageLoaded = false;

const bulletImage = new Image();
bulletImage.src = 'assets/bullets/bullet-001.png';
let bulletImageLoaded = false;

const enemyImage = new Image();
enemyImage.src = 'assets/asteroid.png'
let enemyImageLoaded = false;

playerImage.onload = () => { imageLoaded = true; };
playerImage.onerror = () => { console.error('failed to load iamge from ' + playerImage.src); };

bulletImage.onload = () => { bulletImageLoaded = true; };
bulletImage.onerror = () => { console.error('failed to load bullet image from ' + bulletImage.src); };

enemyImage.onload = () => { enemyImageLoaded = true; };
enemyImage.onerror = () => { console.error('failed to load enemy image from ' + enemyImage.src); };

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('click', (e) => {
    if (HitboxHelper.isPointInHitbox(mouse.x, mouse.y, player)) { return; }
    const bullet = {
        x: player.x,
        y: player.y,
        angle: player.angle,
        vx: Math.cos(player.angle) * bulletSpeed,
        vy: Math.sin(player.angle) * bulletSpeed,
        size: bulletSize,
        hitbox: {
            type: 'rect',
            width: bulletSize * 2,
            height: bulletSize * 2,
            offsetX: 0,
            offsetY: 0
        }
    };
    bullets.push(bullet);
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

    // check for entity - entity collision (supports both rect and circle)
    checkCollision(entity1, entity2) {
        // Circle to Circle collision
        if (entity1.hitbox.type === 'circle' && entity2.hitbox.type === 'circle') {
            const dx = entity1.x - entity2.x;
            const dy = entity1.y - entity2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < (entity1.hitbox.radius + entity2.hitbox.radius);
        }
        
        // Circle to Rect collision
        if (entity1.hitbox.type === 'circle' && entity2.hitbox.type === 'rect') {
            return this.circleRectCollision(entity1, entity2);
        }
        if (entity1.hitbox.type === 'rect' && entity2.hitbox.type === 'circle') {
            return this.circleRectCollision(entity2, entity1);
        }
        
        // Rect to Rect collision (original AABB)
        const box1 = this.getAABB(entity1);
        const box2 = this.getAABB(entity2);

        return (
            box1.x < box2.x + box2.width &&
            box1.x + box1.width > box2.x &&
            box1.y < box2.y + box2.height &&
            box1.y + box1.height > box2.y
        );
    },
    
    // Circle to rectangle collision
    circleRectCollision(circle, rect) {
        const box = this.getAABB(rect);
        const closestX = Math.max(box.x, Math.min(circle.x, box.x + box.width));
        const closestY = Math.max(box.y, Math.min(circle.y, box.y + box.height));
        const dx = circle.x - closestX;
        const dy = circle.y - closestY;
        return (dx * dx + dy * dy) < (circle.hitbox.radius * circle.hitbox.radius);
    },

    // draw hitbox for debugging
    drawHitbox(ctx, entity, color = '#ff0000') {
        if (entity.hitbox.type === 'circle') {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(entity.x, entity.y, entity.hitbox.radius, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            const box = this.getAABB(entity);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.strokeRect(box.x, box.y, box.width, box.height);
        }
    },

    // Check if a point (x, y) is within an entity's hitbox
    isPointInHitbox(x, y, entity) {
        if (entity.hitbox.type === 'circle') {
            const dx = x - entity.x;
            const dy = y - entity.y;
            return Math.sqrt(dx * dx + dy * dy) <= entity.hitbox.radius;
        }
        
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

    if (showHitboxes) {
        HitboxHelper.drawHitbox(ctx, player, '#00ff00');
    }
}
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        // remove bullet if it goes offscreen
        if (bullet.x < 0 || bullet.x > canvas.width || 
            bullet.y < 0 || bullet.y > canvas.height) {
            bullets.splice(i, 1);
        }
    }
}

// draw bullets
function drawBullets() {
    for (const bullet of bullets) {
        ctx.save();
        ctx.translate(bullet.x, bullet.y);
        ctx.rotate(bullet.angle); // rotate bullet to match angle
        ctx.imageSmoothingEnabled = false;
        
        if (bulletImageLoaded) {
            ctx.drawImage(
                bulletImage,
                -bullet.size,
                -bullet.size,
                bullet.size * 2,
                bullet.size * 2
            );
        } else { console.warn('bullet image not loaded, cannot draw bullet.'); }
        
        ctx.restore();

        if (showHitboxes) {
            HitboxHelper.drawHitbox(ctx, bullet, '#0000ff');
        }
    }
}

// Spawn enemy UFO
function spawnEnemy() {
    let x, y;
    const edge = Math.floor(Math.random() * 4); 
    
    switch(edge) {
        case 0: // top
            x = Math.random() * canvas.width;
            y = -enemySize;
            break;
        case 1: // right
            x = canvas.width + enemySize;
            y = Math.random() * canvas.height;
            break;
        case 2: // bottom
            x = Math.random() * canvas.width;
            y = canvas.height + enemySize;
            break;
        case 3: // left
            x = -enemySize;
            y = Math.random() * canvas.height;
            break;
    }
    
    // Random velocity for floating effect
    const angle = Math.random() * Math.PI * 2;
    const speed = enemySpeed * (0.5 + Math.random() * 0.5); // Random speed variation
    
    const enemy = {
        x: x,
        y: y,
        size: enemySize,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        angle: angle,
        hitbox: {
            type: 'circle',
            radius: enemySize * 0.8
        }
    };
    
    enemies.push(enemy);
}

function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
        enemy.angle += 0.02;
        enemy.vx += Math.sin(enemy.angle) * 0.05;
        enemy.vy += Math.cos(enemy.angle) * 0.05;
        const speed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
        if (speed > enemySpeed * 1.5) {
            enemy.vx = (enemy.vx / speed) * enemySpeed * 1.5;
            enemy.vy = (enemy.vy / speed) * enemySpeed * 1.5;
        }
        
        // Loop enemies around screen edges
        const margin = enemySize * 2;
        if (enemy.x < -margin) enemy.x = canvas.width + margin;
        if (enemy.x > canvas.width + margin) enemy.x = -margin;
        if (enemy.y < -margin) enemy.y = canvas.height + margin;
        if (enemy.y > canvas.height + margin) enemy.y = -margin;
    }
    
    // Check collisions separately to avoid index issues
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        for (let j = bullets.length - 1; j >= 0; j--) {
            const bullet = bullets[j];
            if (HitboxHelper.checkCollision(bullet, enemy)) {
                bullets.splice(j, 1);
                enemies.splice(i, 1);
                score += 10;
                break;
            }
        }
    }
}

// Draw enemies
function drawEnemies() {
    for (const enemy of enemies) {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.angle);
        ctx.imageSmoothingEnabled = false;
        
        if (enemyImageLoaded) {
            ctx.drawImage(
                enemyImage,
                -enemy.size,
                -enemy.size,
                enemy.size * 2,
                enemy.size * 2
            );
        } else {
            // Fallback: draw red circle if image not loaded
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(0, 0, enemy.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
        
        if (showHitboxes) {
            HitboxHelper.drawHitbox(ctx, enemy, '#ff0000');
        }
    }
}

function drawScore() {
    ctx.imageSmoothingEnabled = false;
    ctx.font = '32px "Pixelify Sans"';
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'top';
    ctx.fillText('Score: ' + score, 10, 10);
}

function gameLoop() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Spawn enemies randomly
    if (Math.random() < 0.02) { // 2% chance each frame
        spawnEnemy();
    }
    
    PlayerMovement.update(player, mouse, keys, { width: canvas.width, height: canvas.height });
    updateBullets();
    updateEnemies();
    
    drawPlayer();
    drawBullets();
    drawEnemies();
    drawScore();
    
    requestAnimationFrame(gameLoop);
}
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

gameLoop();
