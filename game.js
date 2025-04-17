class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        this.grid = {
            rows: 5, // Multiple lanes now
            cols: 9,
            cellSize: 80
        };

        this.sun = 50;
        this.totalSun = 50; // For shop purchases
        this.plants = [];
        this.zombies = [];
        this.projectiles = [];
        
        // Gacha system - track waves and rewards
        this.waveCount = 0;
        this.lastWaveTime = 0;
        this.waveInterval = 30000; // 30 seconds per wave
        this.showingGachaReward = false;
        
        // Multiple cats system
        this.cats = [];
        
        // Create different cat types
        this.catTypes = {
            'orange': {
                color: '#FFA500',
                attackDamage: 30,
                attackRange: 70,
                speed: 2,
                attackCooldown: 800,
                specialAbility: 'sunBoost', // Generates extra sun when defeating zombies
                specialCooldown: 15000
            },
            'black': {
                color: '#333333',
                attackDamage: 50,
                attackRange: 60,
                speed: 3,
                attackCooldown: 1200,
                specialAbility: 'criticalHit', // Chance to deal double damage
                specialCooldown: 8000
            },
            'white': {
                color: '#FFFFFF',
                attackDamage: 20,
                attackRange: 100,
                speed: 4,
                attackCooldown: 500,
                specialAbility: 'speedBurst', // Temporary speed boost
                specialCooldown: 10000
            },
            'calico': {
                color: '#E6A141',
                attackDamage: 35,
                attackRange: 80,
                speed: 2.5,
                attackCooldown: 900,
                specialAbility: 'healPlants', // Heals nearby plants
                specialCooldown: 12000
            },
            'siamese': {
                color: '#D2B48C',
                attackDamage: 45,
                attackRange: 65,
                speed: 3.5,
                attackCooldown: 1000,
                specialAbility: 'freezeZombies', // Temporarily freezes zombies
                specialCooldown: 20000
            }
        };
        
        // Create initial cats
        this.createCat('orange', 400, 300);
        this.createCat('black', 200, 200);
        this.createCat('white', 600, 400);
        this.createCat('calico', 300, 500);
        this.createCat('siamese', 500, 100);
        
        // Method to create cats
        this.createCatContainer = document.getElementById('plants-container'); // Using plants container for cats too
        this.selectedPlant = null;
        
        // Plant costs
        this.plantCosts = {
            'sunflower': 1,
            'peashooter': 2,
            'acorn_smartan': 1,
            'super_peashooter': 2,
            'garlic-mine': 3,
            'sweet_potato': 4,
            'hypno_king': 5,
            'jalapeno': 6
        };

        // Unlocked plants
        this.unlockedPlants = {
            'sunflower': true,
            'peashooter': true,
            'acorn_smartan': true,
            'super_peashooter': false,
            'garlic-mine': false,
            'sweet_potato': false,
            'hypno_king': false,
            'jalapeno': true
        };

        // Current screen
        this.currentScreen = 'home';

        this.garlicMineEffect = (zombies) => {
            const numZombies = zombies.length;
            const damage = (numZombies * 20 / 1800) + 100;
            zombies.forEach(zombie => {
                zombie.health -= damage;
            });
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showScreen('home');
    }
    
    startGame() {
        this.showScreen('game');
        this.gameLoop();
        this.spawnZombiesInterval();
    }
    
    showScreen(screenName) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show the requested screen
        if (screenName === 'home') {
            document.getElementById('home-screen').classList.add('active');
            this.currentScreen = 'home';
        } else if (screenName === 'shop') {
            document.getElementById('shop-screen').classList.add('active');
            this.currentScreen = 'shop';
            // Update shop display
            document.querySelectorAll('.shop-item').forEach(item => {
                const plantType = item.getAttribute('data-plant');
                const buyBtn = item.querySelector('.buy-btn');
                if (this.unlockedPlants[plantType]) {
                    buyBtn.textContent = 'Purchased';
                    buyBtn.disabled = true;
                } else {
                    buyBtn.textContent = 'Buy';
                    buyBtn.disabled = false;
                }
            });
        } else if (screenName === 'game') {
            document.getElementById('game-container').classList.add('active');
            this.currentScreen = 'game';
        }
    }

    setupEventListeners() {
        // Home screen buttons
        document.getElementById('start-game-btn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('shop-btn').addEventListener('click', () => {
            this.showScreen('shop');
        });

        // Shop screen buttons
        document.getElementById('back-to-home-btn').addEventListener('click', () => {
            this.showScreen('home');
        });
        
        // Cat selector functionality
        let selectedCatType = 'orange'; // Default selected cat
        
        // Select cat type
        document.querySelectorAll('.cat-card').forEach(card => {
            card.addEventListener('click', () => {
                // Remove selected class from all cards
                document.querySelectorAll('.cat-card').forEach(c => c.classList.remove('selected'));
                
                // Add selected class to clicked card
                card.classList.add('selected');
                
                // Update selected cat type
                selectedCatType = card.getAttribute('data-cat');
                console.log(`Selected cat type: ${selectedCatType}`);
            });
        });
        
        // Spawn new cat button
        document.getElementById('spawn-cat-btn').addEventListener('click', () => {
            // Generate random position within canvas bounds
            const randomX = Math.random() * (this.canvas.width - 100) + 50;
            const randomY = Math.random() * (this.canvas.height - 100) + 50;
            
            // Create new cat of selected type
            this.createCat(selectedCatType, randomX, randomY);
            console.log(`Spawned new ${selectedCatType} cat at (${randomX}, ${randomY})`);
        });
        

        document.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const plantType = btn.parentElement.getAttribute('data-plant');
                const cost = parseInt(btn.parentElement.getAttribute('data-cost'));
                
                console.log(`Attempting to purchase ${plantType} for ${cost} sun. Current sun: ${this.totalSun}`);
                
                if (this.totalSun >= cost) {
                    this.totalSun -= cost;
                    this.unlockedPlants[plantType] = true;
                    
                    // Update shop display
                    btn.textContent = 'Purchased';
                    btn.disabled = true;
                    
                    // Update plant selector
                    const plantCard = document.querySelector(`.plant-card[data-plant="${plantType}"]`);
                    if (plantCard) {
                        plantCard.classList.remove('locked');
                        const lockedOverlay = plantCard.querySelector('.locked-overlay');
                        if (lockedOverlay) {
                            lockedOverlay.remove();
                        }
                    }
                    
                    console.log(`Purchased ${plantType} for ${cost} sun`);
                }
            });
        });


        // Game screen buttons
        document.getElementById('back-to-menu-btn').addEventListener('click', () => {
            this.showScreen('home');
        });

        // Plant selection
        const plantCards = document.querySelectorAll('.plant-card');
        plantCards.forEach(card => {
            card.addEventListener('click', () => {
                const plantType = card.getAttribute('data-plant');
                if (!card.classList.contains('locked') && this.unlockedPlants[plantType]) {
                    this.selectedPlant = plantType;
                    
                    // Visual feedback for selection
                    plantCards.forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                    
                    console.log(`Selected plant: ${plantType}`);
                }
            });
        });

        // Plant placement
        this.canvas.addEventListener('click', (e) => {
            if (!this.selectedPlant) {
                console.log('No plant selected');
                return;
            }
            
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Convert click coordinates to grid position
            const gridX = Math.floor(x / this.grid.cellSize);
            const gridY = Math.floor(y / this.grid.cellSize);
            
            console.log(`Canvas clicked at (${x}, ${y}), grid position: (${gridX}, ${gridY})`);
            
            // Check if gridY is within bounds
            if (gridY >= 0 && gridY < this.grid.rows) {
                this.placePlant(gridX, gridY);
            } else {
                console.log(`Grid position (${gridX}, ${gridY}) is out of bounds`);
            }
        });
        
        // Log when game starts
        console.log('Game initialized, event listeners set up');
    }

    placePlant(gridX, gridY) {
        // Check if the cell is empty
        const cellOccupied = this.plants.some(plant => 
            plant.gridX === gridX && plant.gridY === gridY
        );
        
        if (cellOccupied) {
            console.log(`Cell at (${gridX}, ${gridY}) is already occupied`);
            return;
        }
        
        // Check if we have enough sun
        const sunCost = this.plantCosts[this.selectedPlant];
        console.log(`Attempting to place ${this.selectedPlant} at (${gridX}, ${gridY}). Cost: ${sunCost}, Available sun: ${this.sun}`);
        
        if (this.sun >= sunCost) {
            const plant = {
                gridX: gridX,
                gridY: gridY,
                x: gridX * this.grid.cellSize,
                y: gridY * this.grid.cellSize,
                type: this.selectedPlant,
                health: 100,
                lastShot: 0,
                state: 'normal', // For Acorn Smartan states
                lastAbility: 0,   // For special abilities like shield bash
                attackSpeed: 1     // Multiplier for attack speed
            };
            
            this.plants.push(plant);

            // Sweet Potato logic
            if (plant.type === 'sweet_potato') {
                plant.health = 4000;
                plant.hypnotizeEffect = false;
                plant.healingMechanism = true;
                plant.chocolateAttack = true;
            }
            
            // Hypno King logic
            if (plant.type === 'hypno_king') {
                plant.health = 150;
                plant.lastHypnotize = 0;
                plant.lastSpawn = 0;
                plant.hypnotizeCooldown = 8000; // 8 seconds between hypnotizing
                plant.spawnCooldown = 15000; // 15 seconds between spawning zombies
                plant.hypnotizeRange = this.grid.cellSize * 3; // Range for hypnotizing zombies
            }
            
            // Deduct sun cost
            this.sun -= sunCost;
            
class Almanac {
    constructor() {
        this.entries = {
            'basic-cat': {
                name: 'Basic Cat',
                description: 'A standard fighter cat',
                stats: { health: 100, damage: 20 }
            },
            'tank-cat': {
                name: 'Tank Cat',
                description: 'High HP, low damage cat',
                stats: { health: 200, damage: 10 }
            },
            'zombie': {
                name: 'Basic Zombie',
                description: 'Standard enemy',
                stats: { health: 100, speed: 1 }
            }
        };
    }

    showEntry(id) {
        return this.entries[id];
    }
}class Shop {
    constructor() {
        this.items = [
            { name: 'Basic Cat', cost: 100, type: 'basic' },
            { name: 'Tank Cat', cost: 200, type: 'tank' },
            // Add more shop items
        ];
    }

    purchase(itemType, playerMoney) {
        const item = this.items.find(i => i.type === itemType);
        if (item && playerMoney >= item.cost) {
            return { success: true, cost: item.cost };
        }
        return { success: false };
    }
}

// Add to your game initialization
const shop = new Shop();class Zombie {
    // ... existing code ...
    
    die() {
        // Add fade out animation
        let opacity = 1;
        const fadeOut = setInterval(() => {
            opacity -= 0.1;
            if (opacity <= 0) {
                clearInterval(fadeOut);
                this.remove = true;
            }
            this.opacity = opacity;
        }, 50);
    }

    draw(ctx) {
        ctx.globalAlpha = this.opacity || 1;
        ctx.drawImage(zombieImage, this.x, this.y, this.width, this.height);
        ctx.globalAlpha = 1;
    }
}// Update image loading paths to be relative
const zombieImage = new Image();
zombieImage.src = './images/zombie.svg';  // Using SVG instead of PNG

// Create cat method
Game.prototype.createCat = function(type, x, y) {
    const cat = {
        type: type,
        x: x,
        y: y,
        health: 100,
        attackDamage: this.catTypes[type].attackDamage,
        attackRange: this.catTypes[type].attackRange,
        speed: this.catTypes[type].speed,
        attackCooldown: this.catTypes[type].attackCooldown,
        lastAttack: 0,
        specialAbility: this.catTypes[type].specialAbility,
        specialCooldown: this.catTypes[type].specialCooldown,
        lastSpecial: 0
    };
    
    this.cats.push(cat);
    
    // Create DOM element for the cat
    const catsContainer = document.getElementById('plants-container'); // Using plants container for cats too
    if (catsContainer) {
        const catElement = document.createElement('div');
        catElement.className = `cat ${type}-cat`;
        catElement.style.left = `${x}px`;
        catElement.style.top = `${y}px`;
        catElement.style.position = 'absolute';
        catElement.style.width = '60px';
        catElement.style.height = '60px';
        catElement.style.backgroundSize = 'contain';
        catElement.style.backgroundRepeat = 'no-repeat';
        catElement.style.backgroundPosition = 'center';
        
        // Set the background image based on cat type
        const catImagePath = catImages[type] || './images/cat.svg';
        catElement.style.backgroundImage = `url(${catImagePath})`;
        
        catElement.setAttribute('data-cat-id', this.cats.length - 1);
        catsContainer.appendChild(catElement);
        
        console.log(`Created ${type} cat at (${x}, ${y})`);
    } else {
        console.error('Cats container not found');
    }
    
    return cat;
};

// Update cats method
Game.prototype.updateCats = function() {
    this.cats.forEach((cat, index) => {
        // Update cat position in DOM
        const catElement = document.querySelector(`[data-cat-id="${index}"]`);
        if (catElement) {
            catElement.style.left = `${cat.x}px`;
            catElement.style.top = `${cat.y}px`;
        }
        
        // Cat AI and behavior can be implemented here
        // For now, just basic movement
        
        // Find nearest zombie
        const nearestZombie = this.findNearestZombie(cat);
        
        if (nearestZombie) {
            // Move towards zombie
            const dx = nearestZombie.x - cat.x;
            const dy = nearestZombie.y - cat.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > cat.attackRange) {
                // Move towards zombie
                cat.x += (dx / distance) * cat.speed;
                cat.y += (dy / distance) * cat.speed;
            } else {
                // Attack zombie if in range and cooldown is ready
                if (Date.now() - cat.lastAttack > cat.attackCooldown) {
                    nearestZombie.health -= cat.attackDamage;
                    cat.lastAttack = Date.now();
                    
                    // Special ability
                    if (Date.now() - cat.lastSpecial > cat.specialCooldown) {
                        this.activateCatSpecial(cat, nearestZombie);
                        cat.lastSpecial = Date.now();
                    }
                }
            }
        }
    });
};

// Find nearest zombie helper method
Game.prototype.findNearestZombie = function(cat) {
    if (this.zombies.length === 0) return null;
    
    let nearestZombie = null;
    let minDistance = Infinity;
    
    this.zombies.forEach(zombie => {
        const dx = zombie.x - cat.x;
        const dy = zombie.y - cat.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance) {
            minDistance = distance;
            nearestZombie = zombie;
        }
    });
    
    return nearestZombie;
};

// Activate cat special ability
Game.prototype.activateCatSpecial = function(cat, target) {
    switch (cat.specialAbility) {
        case 'sunBoost':
            // Orange cat: Generate extra sun
            this.sun += 15;
            this.totalSun += 15;
            break;
        case 'criticalHit':
            // Black cat: Chance for double damage
            if (Math.random() < 0.5) {
                target.health -= cat.attackDamage; // Additional damage
            }
            break;
        case 'speedBurst':
            // White cat: Temporary speed boost
            cat.speed *= 2;
            setTimeout(() => {
                cat.speed /= 2; // Return to normal speed
            }, 3000);
            break;
        case 'healPlants':
            // Calico cat: Heal nearby plants
            this.plants.forEach(plant => {
                const dx = plant.x - cat.x;
                const dy = plant.y - cat.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) { // Healing range
                    plant.health = Math.min(100, plant.health + 20);
                }
            });
            break;
        case 'freezeZombies':
            // Siamese cat: Temporarily freeze zombies
            this.zombies.forEach(zombie => {
                const dx = zombie.x - cat.x;
                const dy = zombie.y - cat.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 200) { // Freeze range
                    zombie.speed = 0;
                    setTimeout(() => {
                        zombie.speed = 1; // Return to normal speed
                    }, 2000);
                }
            });
            break;
    }
};


const catImages = {
    orange: './images/cat.svg',
    black: './images/black_cat.svg',
    white: './images/white_cat.svg',
    calico: './images/cat.svg',  // Using default cat SVG for calico
    siamese: './images/cat.svg'  // Using default cat SVG for siamese
};            // Create DOM element for the plant
            const plantsContainer = document.getElementById('plants-container');
            if (plantsContainer) {
                const plantElement = document.createElement('div');
                plantElement.className = `plant ${plant.type}`;
                plantElement.style.left = `${plant.x}px`;
                plantElement.style.top = `${plant.y}px`;
                plantElement.style.position = 'absolute';
                plantElement.style.width = `${this.grid.cellSize}px`;
                plantElement.style.height = `${this.grid.cellSize}px`;
                plantElement.style.backgroundSize = 'contain';
                plantElement.style.backgroundRepeat = 'no-repeat';
                plantElement.style.backgroundPosition = 'center';
                plantElement.style.backgroundImage = `url(./images/${plant.type}.svg)`;
                plantElement.setAttribute('data-plant-id', this.plants.length - 1);
                plantsContainer.appendChild(plantElement);
                
                console.log(`Successfully placed ${plant.type} at (${gridX}, ${gridY})`);
            } else {
                console.error('Plants container not found');
            }
        } else {
            console.log(`Not enough sun to place ${this.selectedPlant}. Need ${sunCost}, have ${this.sun}`);
        }
    }

    spawnZombiesInterval() {
        setInterval(() => {
            // Randomly select a lane to spawn zombie
            const randomLane = Math.floor(Math.random() * this.grid.rows);
            this.zombies.push({
                x: this.canvas.width,
                y: randomLane * this.grid.cellSize,
                gridY: randomLane,
                health: 100,
                speed: 1,
                knockback: 0 // For Acorn Smartan's shield bash
            });
            
            // Track wave progress
            const currentTime = Date.now();
            if (currentTime - this.lastWaveTime >= this.waveInterval) {
                this.waveCount++;
                this.lastWaveTime = currentTime;
                this.giveGachaReward();
            }
        }, 10000);
    }

    update() {
        // Update cats movement and attacks
        this.updateCats();
        
        // Update zombies
        this.zombies.forEach(zombie => {
            // Apply knockback if any
            if (zombie.knockback > 0) {
                zombie.x += 2; // Move backward
                zombie.knockback--;
            } else {
                zombie.x -= zombie.speed;
            }
            
            // Hypnotized zombies attack other zombies
            if (zombie.hypnotized && zombie.ally) {
                // Find nearby enemy zombies
                const enemyZombies = this.zombies.filter(enemy => 
                    !enemy.hypnotized && 
                    Math.abs(enemy.gridY - zombie.gridY) <= 1 && // Can attack adjacent lanes
                    Math.abs(enemy.x - zombie.x) < this.grid.cellSize
                );
                
                if (enemyZombies.length > 0) {
                    // Attack the first enemy zombie
                    enemyZombies[0].health -= 0.2; // Damage over time
                }
            }
        });

        // Update plants and shooting
        this.plants.forEach(plant => {
            // Sweet Potato logic
            if (plant.type === 'sweet_potato') {
                // Hypnotize effect
                if (!plant.hypnotizeEffect && Date.now() - plant.lastAbility > 15000) {
                    this.zombies.forEach(zombie => {
                        if (zombie.gridY === plant.gridY && Math.abs(zombie.x - plant.x) < this.grid.cellSize * 2) {
                            zombie.speed *= -1; // Reverse direction
                        }
                    });
                    plant.lastAbility = Date.now();
                    plant.hypnotizeEffect = true;
                    setTimeout(() => {
                        plant.hypnotizeEffect = false;
                    }, 5000);
                }

                // Healing mechanism
                if (plant.healingMechanism && Date.now() - plant.lastShot > 10000) {
                    this.plants.forEach(otherPlant => {
                        if (otherPlant !== plant && otherPlant.gridY === plant.gridY && Math.abs(otherPlant.x - plant.x) < this.grid.cellSize * 2) {
                            otherPlant.health = Math.min(100, otherPlant.health + 50);
                        }
                    });
                    plant.lastShot = Date.now();
                }

                // Chocolate attack
                if (plant.chocolateAttack && Date.now() - plant.lastShot > 5000) {
                    this.projectiles.push({
                        x: plant.x + this.grid.cellSize,
                        y: plant.y + this.grid.cellSize / 2,
                        speed: 4,
                        damage: 50
                    });
                    plant.lastShot = Date.now();
                }
            }

            // peashooter logic
            if (plant.type === 'peashooter' && Date.now() - plant.lastShot > 2000) {
                this.projectiles.push({
                    x: plant.x + this.grid.cellSize,
                    y: plant.y + this.grid.cellSize / 2,
                    speed: 5,
                    damage: 20
                });
                plant.lastShot = Date.now();
            }
            
            // Super peashooter logic (faster and stronger)
            if (plant.type === 'super_peashooter' && Date.now() - plant.lastShot > 1000) {
                this.projectiles.push({
                    x: plant.x + this.grid.cellSize,
                    y: plant.y + this.grid.cellSize / 2,
                    speed: 7,
                    damage: 40
                });
                plant.lastShot = Date.now();
            }
            
            // Sunflower logic
            if (plant.type === 'sunflower' && Date.now() - plant.lastShot > 10000) {
                this.sun += 25;
                plant.lastShot = Date.now();
            }
            
            // Hypno King logic
            if (plant.type === 'hypno_king') {
                // Hypnotize zombies ability
                if (Date.now() - plant.lastHypnotize > plant.hypnotizeCooldown) {
                    // Find zombies in range
                    const zombiesInRange = this.zombies.filter(zombie => 
                        !zombie.hypnotized && // Only target non-hypnotized zombies
                        Math.abs(zombie.x - plant.x) < plant.hypnotizeRange && 
                        Math.abs(zombie.gridY - plant.gridY) <= 1 // Can affect adjacent lanes
                    );
                    
                    if (zombiesInRange.length > 0) {
                        // Sort by closest
                        zombiesInRange.sort((a, b) => Math.abs(a.x - plant.x) - Math.abs(b.x - plant.x));
                        const target = zombiesInRange[0];
                        
                        // Hypnotize the zombie
                        target.hypnotized = true;
                        target.speed *= -1; // Make it walk backward
                        target.ally = true; // Mark as ally
                        
                        plant.lastHypnotize = Date.now();
                        
                        // Visual feedback
                        const plantElement = document.querySelector(`.plant[style*="left: ${plant.x}px"][style*="top: ${plant.y}px"]`);
                        if (plantElement) {
                            plantElement.classList.add('hypnotizing');
                            setTimeout(() => {
                                plantElement.classList.remove('hypnotizing');
                            }, 500);
                        }
                    }
                }
                
                // Spawn zombie ability
                if (Date.now() - plant.lastSpawn > plant.spawnCooldown) {
                    // Create a new zombie that fights for the player
                    const newZombie = {
                        x: plant.x + this.grid.cellSize,
                        y: plant.gridY * this.grid.cellSize,
                        gridY: plant.gridY,
                        health: 80, // Slightly weaker than regular zombies
                        speed: 1,
                        knockback: 0,
                        hypnotized: true, // Already hypnotized
                        ally: true // Mark as ally
                    };
                    
                    this.zombies.push(newZombie);
                    plant.lastSpawn = Date.now();
                    
                    // Visual feedback
                    const plantElement = document.querySelector(`.plant[style*="left: ${plant.x}px"][style*="top: ${plant.y}px"]`);
                    if (plantElement) {
                        plantElement.classList.add('spawning');
                        setTimeout(() => {
                            plantElement.classList.remove('spawning');
                        }, 500);
                    }
                }
            }
            
            // Jalapeno logic - explodes in a plus pattern dealing 1800 damage
            if (plant.type === 'jalapeno' && Date.now() - plant.lastShot > 3000) {
                // Find all zombies in the same row and column (plus pattern)
                const zombiesInPlus = this.zombies.filter(zombie => 
                    // Same row
                    (zombie.gridY === plant.gridY) ||
                    // Same column (approximate x position)
                    (Math.abs(zombie.x - plant.x) <= this.grid.cellSize)
                );
                
                if (zombiesInPlus.length > 0) {
                    // Deal massive damage to all zombies in the plus pattern
                    zombiesInPlus.forEach(zombie => {
                        zombie.health -= 1800; // Massive damage
                    });
                    
                    // Create explosion visual effects for plus pattern
                    // Center explosion
                    const centerExplosion = document.createElement('div');
                    centerExplosion.className = 'explosion';
                    centerExplosion.style.left = `${plant.x}px`;
                    centerExplosion.style.top = `${plant.y}px`;
                    document.getElementById('plants-container').appendChild(centerExplosion);
                    
                    // Horizontal explosions (same row)
                    for (let i = 1; i <= 4; i++) {
                        // Right side
                        const rightExplosion = document.createElement('div');
                        rightExplosion.className = 'explosion horizontal';
                        rightExplosion.style.left = `${plant.x + (this.grid.cellSize * i)}px`;
                        rightExplosion.style.top = `${plant.y}px`;
                        document.getElementById('plants-container').appendChild(rightExplosion);
                        
                        // Left side
                        const leftExplosion = document.createElement('div');
                        leftExplosion.className = 'explosion horizontal';
                        leftExplosion.style.left = `${plant.x - (this.grid.cellSize * i)}px`;
                        leftExplosion.style.top = `${plant.y}px`;
                        document.getElementById('plants-container').appendChild(leftExplosion);
                    }
                    
                    // Vertical explosions (same column)
                    for (let i = 1; i <= 4; i++) {
                        // Down side
                        if (plant.gridY + i < this.grid.rows) {
                            const downExplosion = document.createElement('div');
                            downExplosion.className = 'explosion vertical';
                            downExplosion.style.left = `${plant.x}px`;
                            downExplosion.style.top = `${plant.y + (this.grid.cellSize * i)}px`;
                            document.getElementById('plants-container').appendChild(downExplosion);
                        }
                        
                        // Up side
                        if (plant.gridY - i >= 0) {
                            const upExplosion = document.createElement('div');
                            upExplosion.className = 'explosion vertical';
                            upExplosion.style.left = `${plant.x}px`;
                            upExplosion.style.top = `${plant.y - (this.grid.cellSize * i)}px`;
                            document.getElementById('plants-container').appendChild(upExplosion);
                        }
                    }
                    
                    // Remove the explosion effects after animation
                    setTimeout(() => {
                        document.querySelectorAll('.explosion').forEach(el => el.remove());
                    }, 1000);
                    
                    // Remove the plant after explosion (one-time use)
                    const plantIndex = this.plants.findIndex(p => p.x === plant.x && p.y === plant.y);
                    if (plantIndex !== -1) {
                        this.plants.splice(plantIndex, 1);
                        
                        // Remove the plant element from DOM
                        const plantElement = document.querySelector(`.plant[style*="left: ${plant.x}px"][style*="top: ${plant.y}px"]`);
                        if (plantElement) {
                            plantElement.remove();
                        }
                    }
                    
                    plant.lastShot = Date.now();
                }
            }
            
            // Acorn Smartan logic
            if (plant.type === 'acorn_smartan') {
                // Check health for state change
                if (plant.health <= 20 && plant.state === 'normal') {
                    plant.state = 'red';
                    plant.attackSpeed = 2; // 200% faster attacks
                    
                    // Update the visual
                    const plantElement = document.querySelector(`.plant[style*="left: ${plant.x}px"][style*="top: ${plant.y}px"]`);
                    if (plantElement) {
                        plantElement.className = 'plant acorn_smartan_red';
                    }
                }
                
                // Attack with sr
                const attackInterval = 3000 / plant.attackSpeed; // Adust for attack speed
                if (Date.now() - plant.lastShot > attackInterval) {
                    // Find zombies in the same lane
                    const zombiesInLane = this.zombies.filter(zombie => 
                        zombie.gridY === plant.gridY && zombie.x > plant.x
                    );
                    
                    if (zombiesInLane.length > 0) {
                        // Sort by closest
                        zombiesInLane.sort((a, b) => a.x - b.x);
                        const target = zombiesInLane[0];
                        
                        // Create a sr projectile
                        this.projectiles.push({
                            x: plant.x + this.grid.cellSize,
                            y: plant.y + this.grid.cellSize / 2,
                            speed: 6,
                            damage: 25
                        });
                        plant.lastShot = Date.now();
                    }
                }
                
                // Shield bash ability (for the shield state)
                if (plant.state === 'shield' && Date.now() - plant.lastAbility > 5000) {
                    // Find zombies in close range
                    const closeZombies = this.zombies.filter(zombie => 
                        zombie.gridY === plant.gridY && 
                        zombie.x > plant.x && 
                        zombie.x < plant.x + this.grid.cellSize * 2
                    );
                    
                    if (closeZombies.length > 0) {
                        // Apply knockback to all close zombies
                        closeZombies.forEach(zombie => {
                            zombie.knockback = 30; // Knockback frames
                            zombie.health -= 15; // Damage from bash
                        });
                        
                        plant.lastAbility = Date.now();
                    }
                }
            }
        });

        // Update projectiles
        this.projectiles.forEach(projectile => {
            projectile.x += projectile.speed;
        });

        // Check collisions
        this.checkCollisions();
        
        // Remove zombies that have been defeated
        this.zombies = this.zombies.filter(zombie => zombie.health > 0);
        
        // Remove projectiles that are off-screen
        this.projectiles = this.projectiles.filter(projectile => 
            projectile.x < this.canvas.width
        );
    }

    checkCollisions() {
        // Projectile-zombie collisions
        this.projectiles.forEach((projectile, pIndex) => {
            this.zombies.forEach((zombie, zIndex) => {
                if (this.checkCollision(projectile, zombie)) {
                    // Use the projectile's damage value or default to 20
                    zombie.health -= projectile.damage || 20;
                    this.projectiles.splice(pIndex, 1);
                    
                    if (zombie.health <= 0) {
                        this.zombies.splice(zIndex, 1);
                        // Add sun when defeating zombies
                        this.sun += 1;
                        this.totalSun += 1;
                    }
                }
            });
        });
        
        // Cats-zombie collisions for cat attacks
        this.cats.forEach(cat => {
            if (Date.now() - cat.lastAttack > cat.attackCooldown) {
                for (let i = 0; i < this.zombies.length; i++) {
                    const zombie = this.zombies[i];
                    // Check if zombie is within cat's attack range
                    const distance = Math.sqrt(
                        Math.pow(cat.x + cat.width/2 - (zombie.x + this.grid.cellSize/2), 2) +
                        Math.pow(cat.y + cat.height/2 - (zombie.y + this.grid.cellSize/2), 2)
                    );
                    
                    if (distance < cat.attackRange) {
                        // Cat attacks zombie
                        zombie.health -= cat.attackDamage;
                        cat.lastAttack = Date.now();
                        
                        // Visual feedback for attack
                        cat.attacking = true;
                        cat.element.classList.add('attacking');
                        setTimeout(() => {
                            cat.attacking = false;
                            cat.element.classList.remove('attacking');
                        }, 300);
                        
                        if (zombie.health <= 0) {
                            this.zombies.splice(i, 1);
                            i--; // Adjust index after removing element
                            
                            // Check for orange cat's sun boost special ability
                            if (cat.specialAbility === 'sunBoost' && cat.specialActive) {
                                // Extra sun from special ability
                                this.sun += 5;
                                this.totalSun += 5;
                            } else {
                                // Normal sun when defeating zombies
                                this.sun += 1;
                                this.totalSun += 1;
                            }
                        }
                        
                        // Only attack one zombie per cooldown
                        break;
                    }
                }
            }
        });
        
        // Plant-zombie collisions (for damage to plants)
        this.plants.forEach((plant, pIndex) => {
            this.zombies.forEach(zombie => {
                if (plant.gridX * this.grid.cellSize < zombie.x + this.grid.cellSize &&
                    (plant.gridX + 1) * this.grid.cellSize > zombie.x &&
                    plant.gridY === zombie.gridY) {
                    
                    // Damage the plant
                    plant.health -= 0.1; // Slow damage over time
                    
                    // Check if plant should be removed
                    if (plant.health <= 0) {
                        // Remove the plant element
                        const plantElement = document.querySelector(`.plant[style*="left: ${plant.x}px"][style*="top: ${plant.y}px"]`);
                        if (plantElement) {
                            plantElement.remove();
                        }
                        
                        // Remove from plants array
                        this.plants.splice(pIndex, 1);
                    } 
                    // Check if Acorn Smartan should change to shield state
                    else if (plant.type === 'acorn_smartan' && plant.health <= 50 && plant.state === 'normal') {
                        plant.state = 'shield';
                        
                        // Update the visual
                        const plantElement = document.querySelector(`.plant[style*="left: ${plant.x}px"][style*="top: ${plant.y}px"]`);
                        if (plantElement) {
                            plantElement.className = 'plant acorn_smartan_shield';
                        }
                    }
                }
            });
        });
    }
    
    checkCollision(ob1, ob2) {
        return ob1.x < ob2.x + this.grid.cellSize &&
               ob1.x + 10 > ob2.x &&
               ob1.y < ob2.y + this.grid.cellSize &&
               ob1.y + 10 > ob2.y;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update sun counter display
        document.getElementById('sun-amount').textContent = this.sun;
        
        // Draw grid - multiple rows for lanes
        for (let row = 0; row < this.grid.rows; row++) {
            for (let col = 0; col < this.grid.cols; col++) {
                this.ctx.strokeRect(
                    col * this.grid.cellSize,
                    row * this.grid.cellSize,
                    this.grid.cellSize,
                    this.grid.cellSize
                );
            }
        }
        
        // Cat is now handled by DOM element
        // No need to draw it on canvas

        // Plants are now handled by DOM elements
        // We don't need to draw them on canvas
        
        // Draw zombies with numeric health
        this.zombies.forEach(zombie => {
            // Draw zombie base
            this.ctx.fillStyle = zombie.frozen ? '#ADD8E6' : '#666'; // Light blue for frozen zombies
            this.ctx.fillRect(zombie.x, zombie.y, this.grid.cellSize * 0.8, this.grid.cellSize);
            
            // Draw health number
            this.ctx.fillStyle = zombie.health > 30 ? '#00ff00' : '#ff0000';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                Math.ceil(zombie.health), 
                zombie.x + (this.grid.cellSize * 0.4), 
                zombie.y - 5
            );
            
            // Draw frozen effect
            if (zombie.frozen) {
                this.ctx.strokeStyle = '#00BFFF';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(
                    zombie.x + (this.grid.cellSize * 0.4),
                    zombie.y + (this.grid.cellSize * 0.5),
                    this.grid.cellSize * 0.5,
                    0,
                    Math.PI * 2
                );
                this.ctx.stroke();
            }
        });
    }

    draw() {
        // Draw projectiles
        this.projectiles.forEach(projectile => {
            this.ctx.beginPath();
            this.ctx.arc(projectile.x, projectile.y, 8, 0, 2 * Math.PI);
            this.ctx.fillStyle = '#00BFFF';
            this.ctx.fill();
        });
        // Draw cats
        this.cats.forEach(cat => {
            this.ctx.beginPath();
            this.ctx.arc(cat.x, cat.y, 20, 0, 2 * Math.PI);
            this.ctx.fillStyle = this.catTypes[cat.type].color;
            this.ctx.fill();
        });
        // Draw zombies
        this.zombies.forEach(zombie => {
            // Use purple color for hypnotized zombies
            this.ctx.fillStyle = zombie.hypnotized ? '#8A2BE2' : '#228B22';
            this.ctx.fillRect(zombie.x, zombie.y, 40, 60);
        });
        // Draw plants
        this.plants.forEach(plant => {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillRect(plant.x, plant.y, this.grid.cellSize, this.grid.cellSize);
        });
    }

    // Gacha system to give random plant rewards
    giveGachaReward() {
        // Don't give rewards if already showing one
        if (this.showingGachaReward) return;
        
        this.showingGachaReward = true;
        
        // Get all locked plants
        const lockedPlants = Object.keys(this.unlockedPlants).filter(plant => !this.unlockedPlants[plant]);
        
        // If all plants are unlocked, give sun instead
        if (lockedPlants.length === 0) {
            this.sun += 50;
            this.totalSun += 50;
            this.showGachaNotification('No new plants to unlock! Received 50 sun instead.');
            return;
        }
        
        // Select a random locked plant
        const randomPlant = lockedPlants[Math.floor(Math.random() * lockedPlants.length)];
        
        // Unlock the plant
        this.unlockedPlants[randomPlant] = true;
        
        // Show notification
        this.showGachaNotification(`You received a new plant: ${randomPlant}!`);
        
        // Update plant selector
        const plantCard = document.querySelector(`.plant-card[data-plant="${randomPlant}"]`);
        if (plantCard) {
            plantCard.classList.remove('locked');
            const lockedOverlay = plantCard.querySelector('.locked-overlay');
            if (lockedOverlay) {
                lockedOverlay.remove();
            }
        }
        
        // Update shop display if on shop screen
        if (this.currentScreen === 'shop') {
            document.querySelectorAll('.shop-item').forEach(item => {
                const plantType = item.getAttribute('data-plant');
                const buyBtn = item.querySelector('.buy-btn');
                if (this.unlockedPlants[plantType]) {
                    buyBtn.textContent = 'Purchased';
                    buyBtn.disabled = true;
                }
            });
        }
    }
    
    showGachaNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'gacha-notification';
        notification.innerHTML = `
            <div class="gacha-content">
                <h2>Plant Gacha Reward!</h2>
                <p>${message}</p>
                <button class="close-gacha-btn">Continue</button>
            </div>
        `;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Add event listener to close button
        notification.querySelector('.close-gacha-btn').addEventListener('click', () => {
            notification.remove();
            this.showingGachaReward = false;
        });
    }
    
    gameLoop() {
        this.update();
        this.draw();
        
        // Check if all zombies are cleared to trigger a wave completion
        if (this.zombies.length === 0 && Date.now() - this.lastWaveTime >= 5000 && !this.showingGachaReward) {
            this.waveCount++;
            this.lastWaveTime = Date.now();
            this.giveGachaReward();
        }
        
        // Update wave counter display
        const waveCounter = document.getElementById('wave-counter');
        if (waveCounter) {
            waveCounter.textContent = this.waveCount;
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }

    createCat(type, x, y) {
        const catType = this.catTypes[type];
        
        // Create DOM element for the cat
        const catElement = document.createElement('div');
        catElement.className = `cat ${type}-cat`;
        catElement.style.left = `${x}px`;
        catElement.style.top = `${y}px`;
        document.getElementById('plants-container').appendChild(catElement);
        
        const cat = {
            type: type,
            x: x,
            y: y,
            width: 60, // Match CSS width
            height: 60, // Match CSS height
            attackDamage: catType.attackDamage,
            attackRange: catType.attackRange,
            speed: catType.speed,
            attackCooldown: catType.attackCooldown,
            lastAttack: 0,
            specialAbility: catType.specialAbility,
            lastSpecial: 0,
            specialCooldown: catType.specialCooldown,
            element: catElement // Store reference to DOM element
        };
        this.cats.push(cat);
    }

    updateCats() {
        this.cats.forEach(cat => {
            // Move cats
            cat.x += cat.speed;
            if (cat.x > this.canvas.width) cat.x = 0;
            
            // Update DOM element position
            if (cat.element) {
                cat.element.style.left = `${cat.x}px`;
                cat.element.style.top = `${cat.y}px`;
            }
            
            // Cat attacks
            if (Date.now() - cat.lastAttack > cat.attackCooldown) {
                for (let i = 0; i < this.zombies.length; i++) {
                    const zombie = this.zombies[i];
                    const dx = cat.x - zombie.x;
                    const dy = cat.y - zombie.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < cat.attackRange) {
                        let damage = cat.attackDamage;
                        
                        // Add attacking class for visual feedback
                        if (cat.element) {
                            cat.element.classList.add('attacking');
                            setTimeout(() => {
                                cat.element.classList.remove('attacking');
                            }, 300);
                        }
                        
                        // Black cat critical hit
                        if (cat.type === 'black' && Math.random() < 0.2) {
                            damage *= 2;
                            if (cat.element) {
                                cat.element.classList.add('critical-hit');
                                setTimeout(() => {
                                    cat.element.classList.remove('critical-hit');
                                }, 500);
                            }
                        }
                        
                        zombie.health -= damage;
                        cat.lastAttack = Date.now();
                        
                        // Orange cat sun boost
                        if (cat.type === 'orange' && zombie.health <= 0) {
                            this.sun += 10;
                            this.totalSun += 10;
                            if (cat.element) {
                                cat.element.classList.add('special-active');
                                setTimeout(() => {
                                    cat.element.classList.remove('special-active');
                                }, 1000);
                            }
                        }
                        
                        // White cat speed burst
                        if (cat.type === 'white' && Date.now() - cat.lastSpecial > cat.specialCooldown) {
                            cat.speed *= 2;
                            cat.lastSpecial = Date.now();
                            
                            if (cat.element) {
                                cat.element.classList.add('speed-burst');
                            }
                            
                            setTimeout(() => { 
                                cat.speed = this.catTypes['white'].speed;
                                if (cat.element) {
                                    cat.element.classList.remove('speed-burst');
                                }
                            }, 2000);
                        }
                        
                        // Calico cat heal plants
                        if (cat.type === 'calico' && Date.now() - cat.lastSpecial > cat.specialCooldown) {
                            this.plants.forEach(plant => {
                                if (Math.abs(plant.x - cat.x) < 100 && Math.abs(plant.y - cat.y) < 100) {
                                    plant.health = Math.min(100, plant.health + 30);
                                }
                            });
                            cat.lastSpecial = Date.now();
                            
                            if (cat.element) {
                                cat.element.classList.add('healing');
                                setTimeout(() => {
                                    cat.element.classList.remove('healing');
                                }, 1500);
                            }
                        }
                        
                        // Siamese cat freeze zombies
                        if (cat.type === 'siamese' && Date.now() - cat.lastSpecial > cat.specialCooldown) {
                            this.zombies.forEach(z => {
                                if (Math.abs(z.x - cat.x) < 80 && Math.abs(z.y - cat.y) < 80) {
                                    z.speed = 0;
                                    setTimeout(() => { z.speed = 1; }, 2000);
                                }
                            });
                            cat.lastSpecial = Date.now();
                            
                            if (cat.element) {
                                cat.element.classList.add('freezing');
                                setTimeout(() => {
                                    cat.element.classList.remove('freezing');
                                }, 3000);
                            }
                        }
                        break;
                    }
                }
            }
        });
    }

    checkCollision(a, b) {
        return (
            a.x < b.x + 40 &&
            a.x + 16 > b.x &&
            a.y < b.y + 60 &&
            a.y + 16 > b.y
        );
    }

    checkCollisions() {
        // Projectile-zombie collisions
        this.projectiles.forEach((projectile, pIndex) => {
            this.zombies.forEach((zombie, zIndex) => {
                if (this.checkCollision(projectile, zombie)) {
                    zombie.health -= projectile.damage || 20;
                    this.projectiles.splice(pIndex, 1);
                    if (zombie.health <= 0) {
                        this.zombies.splice(zIndex, 1);
                        this.sun += 1;
                        this.totalSun += 1;
                    }
                }
            });
        });
        // Cats-zombie collisions for cat attacks
        this.cats.forEach(cat => {
            if (Date.now() - cat.lastAttack > cat.attackCooldown) {
                for (let i = 0; i < this.zombies.length; i++) {
                    const zombie = this.zombies[i];
                    const distance = Math.sqrt(
                        Math.pow(cat.x + cat.width/2 - (zombie.x + 20), 2) +
                        Math.pow(cat.y + cat.height/2 - (zombie.y + 30), 2)
                    );
                    if (distance < cat.attackRange) {
                        zombie.health -= cat.attackDamage;
                        cat.lastAttack = Date.now();
                        break;
                    }
                }
            }
        });
    }
}
// Initialize game and tools when window loads
window.onload = () => {
    const game = new Game();
    window.game = game;
    
    // Initialize tool buttons
    const shovelBtn = document.getElementById('shovel-btn');
    const gloveBtn = document.getElementById('glove-btn');
    
    let activeTool = null;
    
    // Shovel button click handler
    shovelBtn.addEventListener('click', () => {
        if (activeTool === 'shovel') {
            // Deactivate tool if already active
            activeTool = null;
            shovelBtn.classList.remove('active');
        } else {
            // Activate shovel, deactivate other tools
            activeTool = 'shovel';
            shovelBtn.classList.add('active');
            gloveBtn.classList.remove('active');
            console.log('Shovel tool activated');
        }
    });
    
    // Glove button click handler
    gloveBtn.addEventListener('click', () => {
        if (activeTool === 'glove') {
            // Deactivate tool if already active
            activeTool = null;
            gloveBtn.classList.remove('active');
        } else {
            // Activate glove, deactivate other tools
            activeTool = 'glove';
            gloveBtn.classList.add('active');
            shovelBtn.classList.remove('active');
            console.log('Glove tool activated');
        }
    });
    
    // Add tool functionality to canvas click event
    game.canvas.addEventListener('click', (e) => {
        if (!activeTool) return;
        
        const rect = game.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Convert click coordinates to grid position
        const gridX = Math.floor(x / game.grid.cellSize);
        const gridY = Math.floor(y / game.grid.cellSize);
        
        if (activeTool === 'shovel') {
            // Find plant at clicked position
            const plant = game.plants.find(p => p.gridX === gridX && p.gridY === gridY);
            if (plant) {
                const plantIndex = game.plants.indexOf(plant);
                game.plants.splice(plantIndex, 1);
                game.sun += game.plantCosts[plant.type] || 1; // Convert plant back to sun
                game.totalSun += game.plantCosts[plant.type] || 1;
                console.log(`Removed ${plant.type} and recovered ${game.plantCosts[plant.type] || 1} sun`);
                
                // Update sun display
                document.getElementById('sun-amount').textContent = game.sun;
            }
        } else if (activeTool === 'glove') {
            // Check for plants first
            const plant = game.plants.find(p => p.gridX === gridX && p.gridY === gridY);
            if (plant) {
                const plantIndex = game.plants.indexOf(plant);
                game.plants.splice(plantIndex, 1);
                console.log(`Removed plant: ${plant.type}`);
                return;
            }
            
            // Then check for zombies
            for (let i = 0; i < game.zombies.length; i++) {
                const zombie = game.zombies[i];
                const zombieGridX = Math.floor(zombie.x / game.grid.cellSize);
                const zombieGridY = zombie.gridY || Math.floor(zombie.y / game.grid.cellSize);
                
                if (zombieGridX === gridX && zombieGridY === gridY) {
                    game.zombies.splice(i, 1);
                    console.log('Removed zombie');
                    break;
                }
            }
        }
    });
};

// Zombie class with proper rendering
class Zombie {
    constructor(x, y, gridY) {
        this.x = x;
        this.y = y;
        this.gridY = gridY;
        this.width = 60;
        this.height = 80;
        this.health = 100;
        this.speed = 0.5;
        this.knockback = 0;
        this.hypnotized = false;
        this.ally = false;
        this.frozen = false;
        this.opacity = 1;
    }
    
    die() {
        // Add fade out animation
        let opacity = 1;
        const fadeOut = setInterval(() => {
            opacity -= 0.1;
            if (opacity <= 0) {
                clearInterval(fadeOut);
                this.remove = true;
            }
            this.opacity = opacity;
        }, 50);
    }

    draw(ctx) {
        ctx.globalAlpha = this.opacity || 1;
        if (zombieImage.complete) {
            ctx.drawImage(zombieImage, this.x, this.y, this.width, this.height);
        } else {
            // Fallback rendering if image isn't loaded
            ctx.fillStyle = this.hypnotized ? '#8A2BE2' : (this.frozen ? '#ADD8E6' : '#8BC34A');
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Draw health
            ctx.fillStyle = this.health > 30 ? '#00ff00' : '#ff0000';
            ctx.font = '12px Arial';
            ctx.fillText(Math.ceil(this.health), this.x + (this.width/2), this.y - 5);
        }
        ctx.globalAlpha = 1;
    }
}

// Update spawn zombies method to use the Zombie class
Game.prototype.spawnZombiesInterval = function() {
    setInterval(() => {
        // Randomly select a lane to spawn zombie
        const randomLane = Math.floor(Math.random() * this.grid.rows);
        const newZombie = new Zombie(
            this.canvas.width, 
            randomLane * this.grid.cellSize, 
            randomLane
        );
        this.zombies.push(newZombie);
        
        console.log(`Spawned zombie in lane ${randomLane}`);
    }, 5000); // Spawn every 5 seconds
};

// Update the zombie drawing in the render method
const originalRender = Game.prototype.render;
Game.prototype.render = function() {
    // Call the original render method
    originalRender.call(this);
    
    // Override zombie rendering
    this.zombies.forEach(zombie => {
        if (zombie instanceof Zombie) {
            zombie.draw(this.ctx);
        } else {
            // Legacy zombie objects
            this.ctx.globalAlpha = zombie.opacity || 1;
            if (zombieImage.complete) {
                this.ctx.drawImage(zombieImage, zombie.x, zombie.y, 60, 80);
            } else {
                // Fallback rendering
                this.ctx.fillStyle = zombie.hypnotized ? '#8A2BE2' : (zombie.frozen ? '#ADD8E6' : '#8BC34A');
                this.ctx.fillRect(zombie.x, zombie.y, 60, 80);
                
                // Draw health
                this.ctx.fillStyle = zombie.health > 30 ? '#00ff00' : '#ff0000';
                this.ctx.font = '12px Arial';
                this.ctx.fillText(Math.ceil(zombie.health), zombie.x + 30, zombie.y - 5);
            }
            this.ctx.globalAlpha = 1;
        }
    });
};