// Global variable for orbit selection
let clickedOrbit = null;

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {

    const canvas = document.getElementById('network-canvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    const ctx = canvas.getContext('2d');

    let width, height;

    // ═══════════════════════════════════════════════════════════════
    // LANGUAGE SYSTEM
    // ═══════════════════════════════════════════════════════════════
    const translations = {
        en: {
            systemStatus: 'PLANETARY DEFENSE: ACTIVE // SYSTEM MONITORING',
            orbits: {
                geo: {
                    name: 'GEO',
                    full: 'GEOSTATIONARY EARTH ORBIT',
                    info: 'LATENCY: ~600ms | BROADCAST, WEATHER & GLOBAL BACKBONE'
                },
                meo: {
                    name: 'MEO',
                    full: 'MEDIUM EARTH ORBIT',
                    info: 'LATENCY: ~150ms | GNSS/GPS NAVIGATION & FIBER-LIKE DATA'
                },
                leo: {
                    name: 'LEO',
                    full: 'LOW EARTH ORBIT',
                    info: 'LATENCY: <30ms | HIGH-SPEED MESH BROADBAND & OBSERVATION'
                }
            }
        },
        tr: {
            systemStatus: 'GEZEGEN SAVUNMASI: AKTİF // SİSTEM İZLEME',
            orbits: {
                geo: {
                    name: 'GEO',
                    full: 'JEOSTASYONERİ YER YÖRÜNGESİ',
                    info: 'GECİKME: ~600ms | YAYINCILIK, HAVA DURUMU & KÜRESEL OMURGA'
                },
                meo: {
                    name: 'MEO',
                    full: 'ORTA YER YÖRÜNGESİ',
                    info: 'GECİKME: ~150ms | GNSS/GPS NAVİGASYON & FİBER HIZINDA VERİ'
                },
                leo: {
                    name: 'LEO',
                    full: 'DÜŞÜK YER YÖRÜNGESİ',
                    info: 'GECİKME: <30ms | YÜKSEK HIZLI AĞ GENİŞBANT & GÖZLEM'
                }
            }
        }
    };

    let currentLang = localStorage.getItem('selectedLanguage') || 'en';

    // Update language dynamically from localStorage
    function updateLanguage() {
        currentLang = localStorage.getItem('selectedLanguage') || 'en';
    }


    // ═══════════════════════════════════════════════════════════════
    // SYSTEM CONFIGURATION
    // ═══════════════════════════════════════════════════════════════
    const config = {
        colors: {
            bgTop: '#000000', // Deep Space Black
            bgBottom: '#0a0a15', // Dark Space Horizon
            groundGrid: 'rgba(50, 60, 70, 0.3)',
            tieColor: '#445566',
            xwingColor: '#99aabb',
            falconColor: '#b0c0d0',
            deathStarColor: '#778899',
            laserEmpire: '#55ff55',
            laserRebel: '#ff5555',
            rippleEmpire: 'rgba(100, 255, 100, 0.3)',
            rippleRebel: 'rgba(255, 100, 100, 0.3)',
            meshTower: '#4a5b6c', // Structure Grey
            shipHull: '#334455',
            citySilhouette: '#2f3a42', // Darker distant city
            ssdColor: '#2a333a', // Heavy dark metal
            meshLink: 'rgba(200, 220, 255, 0.2)',
            road: '#2b353b',
            carHeadlight: 'rgba(255, 255, 200, 0.6)',
            linkStation: 'rgba(0, 255, 255, 0.5)', // Cyan for Science
            linkV2X: 'rgba(255, 200, 0, 0.4)',      // Yellow/Orange for Cars

            // NTN Layer Colors
            linkGEO: '#d946ef', // Purple/Pink (High Latency/Altitude)
            linkMEO: '#0ea5e9', // Sky Blue (Medium)
            linkLEO: '#f59e0b', // Amber (Low Latency/Fast)

            text: 'rgba(255,255,255,0.5)'
        },
        counts: {
            leo: 8, // Reduced from 12
            meo: 4, // Reduced from 6
            gso: 1,
            towers: 8, // Reduced from 15
            ships: 3, // Reduced from 4
            cities: 3,
            cars: 5,
            scenery: 5
        },
        speeds: {
            leo: 0.002,
            meo: 0.0008,
            falcon: 0.0014,
            gso: 0.00004,
            ship: 0.3,
            station: 0.2,
            car: 1.6
        }
    };

    // ═══════════════════════════════════════════════════════════════
    // RUNTIME STATE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════
    let satellites = [];
    let groundNodes = [];
    let oceanShips = [];
    let cities = [];
    let scenery = [];
    let spaceStation = null;
    let packets = [];
    let ripples = [];
    let stars = [];
    let orbitRegions = []; // For interactive orbit labels
    let skylinePoints = [];
    let bgCityLayers = [];
    let marineStructures = []; // Ocean surface structures
    let civilians = []; // Cars and Homes

    const rand = (min, max) => Math.random() * (max - min) + min;

    // Planetary Surface Curvature Calculation
    function getGroundY(x) {
        const midX = width / 2;
        const curveHeight = 120;
        const baseY = height - 40;
        const normX = (x - midX) / (width * 0.6);
        const yOffset = normX * normX * curveHeight;
        return baseY - curveHeight + yOffset;
    }

    function getOceanY(x) {
        return getGroundY(x) + 15;
    }

    // Orbital Curve Calculation (for satellites)
    function getOrbitY(x, baseAlt) {
        const cx = width / 2;
        const dx = x - cx;
        const maxDist = width * 0.6;
        const normDist = Math.abs(dx) / maxDist;
        const curveDepth = 40;
        const yOffset = normDist * normDist * curveDepth;
        return baseAlt + yOffset;
    }


    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        init();
    }
    window.addEventListener('resize', resize);

    // User Interface Tracking
    let mouseX = 0;
    let mouseY = 0;
    let selectedOrbitName = null; // Changed from object ref 'clickedOrbit' to string ID

    // Global event listener (canvas has pointer-events disabled)
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });


    // Click handler for orbit selection
    // Click handler for orbit selection
    window.addEventListener('click', () => {
        // Detect orbit region interaction
        let found = false;
        orbitRegions.forEach(region => {
            const { x, y, w, h } = region;
            const isSelected = selectedOrbitName === region.data.name;

            // Calculate Hitbox
            // If selected, the hitbox is MUCH bigger (covering the info panel)
            // Panel is offset by (w + 20) and size is 450x180
            let hitW = w + 50;
            let hitH = h + 20; // Base padding

            if (isSelected) {
                hitW = 450 + w + 50; // Cover the panel width too
                hitH = 200; // Cover panel height
            }

            if (mouseX >= x && mouseX <= x + hitW && mouseY >= y - 10 && mouseY <= y + hitH) {
                // Toggle selection
                if (selectedOrbitName === region.data.name) {
                    // Only close if clicking the label part again, or maybe just let it stay open?
                    // Let's allow closing if they click the label again.
                    // Actually, if we make the hitbox huge, clicking the panel toggles it OFF.
                    // Refined logic: If clicking panel body -> Keep open. If clicking label -> Toggle?
                    // Simplest: Just treat entire area as "active". If active, clicking it again closes it (Toggle).
                    selectedOrbitName = null;
                }
                else selectedOrbitName = region.data.name;

                // If we just opened it, keep it found
                if (selectedOrbitName) found = true;
                // If we just closed it, we technically "found" the target to close, so prevent global clear
                found = true;
            }
        });

        // Critical: Only clear if we clicked on NOTHING
        if (!found) selectedOrbitName = null;
    });



    // ═══════════════════════════════════════════════════════════════
    // ENTITY CLASS DEFINITIONS
    // ═══════════════════════════════════════════════════════════════
    class Entity {
        constructor(x, y) { this.x = x; this.y = y; }
    }

    class Star {
        constructor() {
            this.x = Math.random() * width; this.y = Math.random() * (height * 0.8);
            this.size = Math.random() * 1.5; this.alpha = Math.random(); this.flickerSpeed = 0.02 + Math.random() * 0.05;
        }
        update() { this.alpha += this.flickerSpeed; if (this.alpha > 1 || this.alpha < 0.2) this.flickerSpeed *= -1; }
        draw() { ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); }
    }

    class City {
        constructor(x) {
            this.x = x; this.structures = [];
            const count = rand(3, 6); // Fewer, bigger structures
            for (let i = 0; i < count; i++) {
                const type = Math.random() > 0.6 ? 'DOME' : 'SPIRE';
                this.structures.push({
                    type: type,
                    w: type === 'DOME' ? rand(40, 80) : rand(15, 30),
                    h: type === 'DOME' ? rand(30, 50) : rand(80, 200),
                    offX: (i * 30) - (count * 30 / 2)
                });
            }
        }
        draw() {
            const baseY = getGroundY(this.x) + 30; // Anchor deeper
            this.structures.forEach(b => {
                ctx.fillStyle = '#2f3a42'; // Dark Grey Structure

                if (b.type === 'DOME') {
                    ctx.beginPath();
                    ctx.arc(this.x + b.offX, baseY, b.w / 2, Math.PI, 0);
                    ctx.fill();
                    // Dome Rings
                    ctx.strokeStyle = '#4a5b6c';
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(this.x + b.offX, baseY, b.w / 2 - 5, Math.PI, 0); ctx.stroke();
                    ctx.beginPath(); ctx.arc(this.x + b.offX, baseY, b.w / 2 - 15, Math.PI, 0); ctx.stroke();
                } else {
                    // Spire
                    ctx.fillRect(this.x + b.offX, baseY - b.h, b.w, b.h);
                    // Spire details
                    ctx.fillStyle = '#3e4a52';
                    ctx.fillRect(this.x + b.offX + 5, baseY - b.h + 10, b.w - 10, b.h - 10);

                    // Antenna on top
                    ctx.beginPath(); ctx.moveTo(this.x + b.offX + b.w / 2, baseY - b.h);
                    ctx.lineTo(this.x + b.offX + b.w / 2, baseY - b.h - 30);
                    ctx.strokeStyle = '#4a5b6c'; ctx.stroke();
                }
            });
        }
    }

    // [DEPRECATED] Scenery class removed - unnecessary for orbital focus

    // [DEPRECATED] Car class removed - V2X logic not required for NTN visualization

    // [DEPRECATED] SpaceStation class removed - replaced by SuperStarDestroyer

    class SuperStarDestroyer extends Entity {
        constructor() { super(-400, height * 0.15); this.vx = config.speeds.station; }
        update() {
            this.x += this.vx;
            this.y = (height * 0.15) + Math.sin(this.x * 0.005) * 5;
            if (this.x > width + 400) { this.x = -400; }
            if (Math.random() < 0.015) {
                const target = groundNodes[Math.floor(Math.random() * groundNodes.length)];
                if (target) packets.push(new Packet(this, { x: target.x, y: target.y - target.height }, config.colors.linkGEO, 'STATION'));
            }
        }
        draw() {
            ctx.save(); ctx.translate(this.x, this.y);

            // SUPER STAR DESTROYER (EXECUTOR CLASS) - HIGH FIDELITY
            const grd = ctx.createLinearGradient(-200, 0, 350, 0);
            grd.addColorStop(0, '#1a2228'); // Dark Engine Block
            grd.addColorStop(0.5, '#2f3a42'); // Hull Grey
            grd.addColorStop(1, '#4a5b6c'); // Nose Highlight

            // Main Hull (Arrowhead)
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.moveTo(350, 0);
            ctx.lineTo(-200, -50);
            ctx.lineTo(-180, 0);
            ctx.lineTo(-200, 50);
            ctx.closePath();
            ctx.fill();

            // Cityscape / Superstructure (The "Island")
            ctx.fillStyle = '#1c252d';
            ctx.beginPath();
            ctx.moveTo(50, 0); ctx.lineTo(-150, -25); ctx.lineTo(-150, 25); ctx.fill();

            // Bridge Tower
            ctx.fillStyle = '#3e4a52';
            ctx.fillRect(-80, -10, 30, 20); // Base
            ctx.fillStyle = '#111';
            ctx.fillRect(-60, -4, 15, 8); // Bridge Window Area

            // Shield Generator Domes (Geodesic look)
            ctx.fillStyle = '#667788';
            ctx.beginPath(); ctx.arc(-70, -15, 5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(-70, 15, 5, 0, Math.PI * 2); ctx.fill();

            // Engine Glow (Massive array of boosters)
            ctx.shadowBlur = 20; ctx.shadowColor = '#ff3333';
            ctx.fillStyle = '#ff1111';
            [-45, -30, -15, 0, 15, 30, 45].forEach(ey => {
                ctx.fillRect(-205, ey - 2, 8, 4);
            });
            ctx.shadowBlur = 0;

            // Hull Plating / Greebles (Details)
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            for (let i = 0; i < 20; i++) {
                ctx.fillRect(Math.random() * 200 - 100, Math.random() * 40 - 20, Math.random() * 30, 1);
            }

            ctx.restore();
        }
    }

    class Ripple {
        constructor(x, y, color) { this.x = x; this.y = y; this.radius = 1; this.speed = 1.5; this.color = color; this.opacity = 1.0; this.finished = false; }
        update() { this.radius += this.speed; this.opacity -= 0.02; if (this.opacity <= 0) this.finished = true; }
        draw() { ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.strokeStyle = this.color; ctx.globalAlpha = this.opacity; ctx.lineWidth = 1.5; ctx.stroke(); ctx.globalAlpha = 1.0; }
    }

    class SpaceShip extends Entity {
        constructor(type, layer, speed, startX) {
            super(0, 0);
            this.type = type;
            this.layer = layer;
            this.x = startX;
            this.speed = speed;
            this.faction = (type === 'TIE' || type === 'DEATH_STAR') ? 'EMPIRE' : 'REBEL';
            if (layer === 'GEO') this.baseAlt = height * 0.15;
            else if (layer === 'MEO') this.baseAlt = height * 0.35;
            else this.baseAlt = height * 0.55;
            this.y = getOrbitY(this.x, this.baseAlt);
        }
        update() {
            this.x += this.speed;
            if (this.x > width + 50) this.x = -50;
            if (this.x < -50) this.x = width + 50;
            this.y = getOrbitY(this.x, this.baseAlt);
            let pingChance = this.layer === 'GEO' ? 0.02 : 0.005;
            if (Math.random() < pingChance) {
                const color = this.faction === 'EMPIRE' ? config.colors.rippleEmpire : config.colors.rippleRebel;
                ripples.push(new Ripple(this.x, this.y, color));
            }
        }
        draw() {
            ctx.save(); ctx.translate(this.x, this.y);

            if (this.type === 'DEATH_STAR') {
                // DEATH STAR - TEXTURED SPHERE
                const size = 30;
                // Base Gradient
                const grd = ctx.createRadialGradient(-10, -10, 2, 0, 0, size);
                grd.addColorStop(0, '#5a6b7c');
                grd.addColorStop(1, '#2b353b');
                ctx.fillStyle = grd;
                ctx.beginPath(); ctx.arc(0, 0, size, 0, Math.PI * 2); ctx.fill();

                // Equatorial Trench
                ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.moveTo(-size, 0); ctx.lineTo(size, 0); ctx.stroke();

                // Superlaser Dish (Concave effect)
                ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(-12, -12, 9, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#444'; ctx.lineWidth = 1; ctx.stroke();
                // Laser Focus Point
                ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(-13, -13, 1, 0, Math.PI * 2); ctx.fill();

                // Tech Texture (Dots)
                ctx.fillStyle = 'rgba(0,0,0,0.4)';
                for (let i = 0; i < 40; i++) {
                    ctx.fillRect(Math.random() * 40 - 20, Math.random() * 40 - 20, 1, 1);
                }
            }
            else if (this.type === 'TIE') {
                // TIE FIGHTER - MOVIE QUALITY
                ctx.fillStyle = '#111'; // Solar Panel Black
                ctx.strokeStyle = '#4a5b6c'; // Frame Grey
                ctx.lineWidth = 1.5;

                const drawWing = (ox) => {
                    ctx.beginPath();
                    // Hexagon Shape
                    ctx.moveTo(ox, -12);
                    ctx.lineTo(ox + 4, -6);
                    ctx.lineTo(ox + 4, 6);
                    ctx.lineTo(ox, 12);
                    ctx.lineTo(ox - 4, 6);
                    ctx.lineTo(ox - 4, -6);
                    ctx.closePath();
                    ctx.fill(); ctx.stroke();
                    // Radiating lines (Solar cells)
                    ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, -12); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, 12); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox + 4, -6); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox - 4, 6); ctx.stroke();
                };
                drawWing(-9);
                drawWing(9);

                // Connecting Pylons
                ctx.fillStyle = '#556677';
                ctx.fillRect(-9, -2, 18, 4);

                // Cockpit Pod
                ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
                // Window Frame
                ctx.strokeStyle = '#778899'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2); ctx.stroke();
                // Red Laser Ports
                ctx.fillStyle = '#ff0000'; ctx.fillRect(-2, 3, 1, 1); ctx.fillRect(1, 3, 1, 1);

                // Ion Engines
                ctx.fillStyle = '#ff4444'; ctx.shadowBlur = 4; ctx.shadowColor = '#f00';
                ctx.fillRect(-1, -1, 2, 2); ctx.shadowBlur = 0;

                // CONN: Comm Antenna (Left of Cockpit)
                ctx.strokeStyle = '#00ff00'; // Green Sync Light
                ctx.beginPath(); ctx.moveTo(-3, -4); ctx.lineTo(-3, -10); ctx.stroke();
                ctx.fillStyle = '#00ff00'; ctx.fillRect(-4, -10, 2, 2);
            }
            else if (this.type === 'XWING') {
                // X-WING - MOVIE QUALITY
                // Fuselage Gradient
                const hullGrd = ctx.createLinearGradient(20, 0, -10, 0);
                hullGrd.addColorStop(0, '#fff'); hullGrd.addColorStop(1, '#ccc');
                ctx.fillStyle = hullGrd;

                // Nose
                ctx.beginPath(); ctx.moveTo(25, 0); ctx.lineTo(-5, -3); ctx.lineTo(-5, 3); ctx.fill();
                // Rear Body
                ctx.fillRect(-15, -4, 15, 8);

                // Engine Glows (4 Engines)
                ctx.shadowBlur = 8; ctx.shadowColor = '#ff5555'; ctx.fillStyle = '#ff8888';
                ctx.beginPath(); ctx.arc(-15, -8, 2.5, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(-15, 8, 2.5, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(-12, -6, 2.5, 0, Math.PI * 2); ctx.fill(); // Lower/Upper pair illusion
                ctx.beginPath(); ctx.arc(-12, 6, 2.5, 0, Math.PI * 2); ctx.fill();
                ctx.shadowBlur = 0;

                // Wings (Open Attack Position)
                ctx.strokeStyle = '#cfcfcf'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-18, -16); ctx.stroke(); // Top Left
                ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-18, 16); ctx.stroke(); // Bottom Left
                ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(0, -16); ctx.stroke(); // Top Forward
                ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(0, 16); ctx.stroke(); // Bottom Forward

                // Red Stripe on fuselage (Red 5)
                ctx.fillStyle = '#cc0000'; ctx.fillRect(5, -1, 10, 2);

                // Cockpit Canopy
                ctx.fillStyle = '#334455'; ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(5, -2); ctx.lineTo(8, 0); ctx.lineTo(0, 2); ctx.fill();

                // CONN: Astromech Droid (R2 Unit) - The Comm Hub
                ctx.fillStyle = '#0000ff'; ctx.fillRect(2, -3, 2, 2); // Body
                ctx.fillStyle = '#ccc'; ctx.beginPath(); ctx.arc(3, -3, 1.5, Math.PI, 0); ctx.fill(); // Dome head
                // Blinking Light on Droid
                if (Date.now() % 600 < 300) { ctx.fillStyle = '#f00'; ctx.fillRect(2.5, -4, 1, 1); }
            }
            else if (this.type === 'FALCON') {
                // MILLENNIUM FALCON - MOVIE QUALITY
                ctx.fillStyle = '#b0c0d0'; // Base hull

                // Main Hull Disc
                ctx.beginPath(); ctx.ellipse(-5, 0, 18, 14, 0, 0, Math.PI * 2); ctx.fill();

                // Front Mandibles
                ctx.fillRect(5, -10, 18, 6);
                ctx.fillRect(5, 4, 18, 6);

                // Maintenance Pits (Dark Grey)
                ctx.fillStyle = '#445566';
                ctx.fillRect(8, -2, 4, 4);

                // Cockpit (Side Outrigger)
                ctx.fillStyle = '#778899';
                ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(12, 18); ctx.lineTo(-4, 18); ctx.lineTo(-6, 6); ctx.fill();
                // Cockpit Window
                ctx.fillStyle = '#222';
                ctx.beginPath(); ctx.arc(10, 16, 2.5, 0, Math.PI * 2); ctx.fill();

                // Quad Laser Turret (Center)
                ctx.fillStyle = '#444'; ctx.beginPath(); ctx.arc(-5, 0, 3, 0, Math.PI * 2); ctx.fill();

                // Engine Glow (The Strip)
                ctx.shadowBlur = 15; ctx.shadowColor = '#00ffff'; ctx.fillStyle = '#eeffff';
                ctx.beginPath();
                ctx.ellipse(-20, 0, 3, 10, 0, Math.PI * 0.5, Math.PI * 1.5); // Rear curved strip
                ctx.fill();
                ctx.shadowBlur = 0;

                // CONN: Sensor Dish (Rectangular) - Prominent Rotation
                ctx.save();
                ctx.translate(-8, -8);
                ctx.rotate(Date.now() * 0.002); // CONSTANT ROTATION
                ctx.fillStyle = '#e0e0e0';
                ctx.fillRect(-3, -2, 6, 4); // Rectangular dish
                ctx.fillStyle = '#999'; ctx.fillRect(-1, -1, 2, 2); // Mount
                ctx.strokeStyle = '#555'; ctx.strokeRect(-3, -2, 6, 4);
                ctx.restore();
            }
            else if (this.type === 'GR75') {
                // REBEL GR-75 MEDIUM TRANSPORT (The "Gallofree")
                // Shape: Clam-shell / Beetle like

                // Hull (Beige/Tan)
                ctx.fillStyle = '#d2b48c';
                ctx.beginPath();
                ctx.ellipse(0, 0, 25, 10, 0, 0, Math.PI * 2);
                ctx.fill();

                // Armor Plating Lines (Curved)
                ctx.strokeStyle = '#8b4513'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.ellipse(0, 0, 25, 10, 0, 0, Math.PI); ctx.stroke(); // Bottom curve
                ctx.beginPath(); ctx.moveTo(-20, -3); ctx.lineTo(20, -3); ctx.stroke(); // Top ridge

                // Engine Array (Back block)
                ctx.fillStyle = '#555';
                ctx.fillRect(-28, -8, 6, 16);

                // Engine Glow (Blue)
                ctx.fillStyle = '#00ffff'; ctx.shadowBlur = 10; ctx.shadowColor = '#00ffff';
                ctx.fillRect(-30, -6, 2, 4);
                ctx.fillRect(-30, 2, 2, 4);
                ctx.shadowBlur = 0;

                // CONN: Sensor Cluster (Top Ridge)
                // A few protruding antennas
                ctx.strokeStyle = '#888';
                ctx.beginPath(); ctx.moveTo(5, -8); ctx.lineTo(5, -14); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(8, -7); ctx.lineTo(8, -12); ctx.stroke();
                // Blinking Beacon
                if (Date.now() % 1000 < 200) { ctx.fillStyle = '#fff'; ctx.fillRect(4.5, -15, 2, 2); }
            }
            else if (this.type === 'GOZANTI') {
                // IMPERIAL GOZANTI-CLASS CRUISER
                // Shape: Flat, wide U-shape with bridge on top

                ctx.fillStyle = '#556677'; // Imperial Grey

                // Main Hull
                ctx.beginPath();
                ctx.moveTo(20, -5); // Front Nose
                ctx.lineTo(10, -10); // Front Left Flare
                ctx.lineTo(-20, -10); // Rear Left
                ctx.lineTo(-25, -4); // Engine Housing Left
                ctx.lineTo(-25, 4); // Engine Housing Right
                ctx.lineTo(-20, 10); // Rear Right
                ctx.lineTo(10, 10); // Front Right Flare
                ctx.lineTo(20, 5); // Front Nose Bottom
                ctx.fill();

                // Bridge Tower (Top/Rear)
                ctx.fillStyle = '#34495e';
                ctx.fillRect(-15, -12, 10, 4);

                // Engine Glow (Red)
                ctx.fillStyle = '#ff3333'; ctx.shadowBlur = 10; ctx.shadowColor = '#ff0000';
                ctx.beginPath(); ctx.arc(-26, -5, 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(-26, 5, 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(-22, 0, 2, 0, Math.PI * 2); ctx.fill(); // Center engine
                ctx.shadowBlur = 0;

                // CONN: Imperial Comms Dish (Bottom Ventral or Top)
                // Let's put a rotating dish on top
                ctx.save();
                ctx.translate(0, 0);
                ctx.rotate(Date.now() * -0.003);
                ctx.fillStyle = '#888';
                ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI, false); ctx.fill(); // Dish shape
                ctx.restore();
            }

            ctx.restore();
        }
    }

    class StaticTower extends Entity {
        constructor(x) {
            super(x, getGroundY(x));
            this.height = 40 + Math.random() * 20; // Reduced Height (was 60-100)
            this.width = 8; // Slender
            this.type = 'TOWER';
            this.faction = Math.random() > 0.5 ? 'EMPIRE' : 'REBEL';
        }
        draw() {
            ctx.save(); ctx.translate(this.x, this.y);

            // 1. Lattice Structure (Zig-Zag)
            ctx.strokeStyle = '#3e4a52'; ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-this.width / 2, 0); ctx.lineTo(0, -this.height); ctx.lineTo(this.width / 2, 0); // Triangle Shape
            ctx.stroke();
            // Cross bracing
            for (let i = 10; i < this.height; i += 10) {
                ctx.beginPath(); ctx.moveTo(-this.width / 2 * (1 - i / this.height), -i); ctx.lineTo(this.width / 2 * (1 - (i - 5) / this.height), -(i - 5)); ctx.stroke();
            }

            // 2. Sector Antennas (Top)
            ctx.fillStyle = '#ccc';
            ctx.fillRect(-6, -this.height - 8, 2, 12); // Panel 1
            ctx.fillRect(4, -this.height - 8, 2, 12); // Panel 2

            // 3. Microwave Drum
            ctx.fillStyle = '#eee'; ctx.beginPath(); ctx.arc(0, -this.height - 4, 3, 0, Math.PI * 2); ctx.fill();

            // 4. Ground Annexes (Equipment Shelters)
            // Shelter A (Power/Diesel Gen)
            ctx.fillStyle = '#2c3e50'; ctx.fillRect(-15, -8, 10, 8);
            ctx.strokeStyle = '#34495e'; ctx.strokeRect(-15, -8, 10, 8);
            // Shelter B (Radio Heads)
            ctx.fillStyle = '#34495e'; ctx.fillRect(5, -6, 8, 6);

            // Fenced Area (Suggestion with lines)
            ctx.strokeStyle = '#555'; ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(-20, -10); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(15, -10); ctx.stroke();

            ctx.restore();
        }
    }

    class SmartCar extends Entity {
        constructor(x) {
            super(x, getGroundY(x));
            this.speed = (Math.random() * 0.5 + 0.5) * (Math.random() > 0.5 ? 1 : -1);
            this.color = ['#e74c3c', '#3498db', '#f1c40f', '#ecf0f1'][Math.floor(Math.random() * 4)];
        }
        update() {
            this.x += this.speed;
            if (this.x > width) this.x = 0; if (this.x < 0) this.x = width;
            this.y = getGroundY(this.x);

            // V2N (Vehicle to Network) - 5G Uplink
            if (Math.random() < 0.02) {
                // Find nearest tower
                let nearest = null; let minD = 300;
                groundNodes.forEach(t => {
                    let d = Math.abs(t.x - this.x);
                    if (d < minD) { minD = d; nearest = t; }
                });
                if (nearest) {
                    // Beam
                    ctx.beginPath(); ctx.moveTo(this.x, this.y - 10); ctx.lineTo(nearest.x, nearest.y - nearest.height);
                    ctx.strokeStyle = this.speed > 0 ? '#00ff00' : '#ff0000'; // Traffic data color
                    ctx.globalAlpha = 0.5; ctx.stroke(); ctx.globalAlpha = 1.0;
                }
            }
        }
        draw() {
            ctx.save(); ctx.translate(this.x, this.y);
            // Chassis
            ctx.fillStyle = this.color;
            ctx.fillRect(-8, -6, 16, 4); // Body
            ctx.fillStyle = '#333';
            ctx.beginPath(); ctx.arc(-5, -2, 3, 0, Math.PI * 2); ctx.fill(); // Wheel
            ctx.beginPath(); ctx.arc(5, -2, 3, 0, Math.PI * 2); ctx.fill(); // Wheel
            // Upper Cabin
            ctx.fillStyle = '#ecf0f1';
            ctx.fillRect(-4, -9, 8, 3);
            ctx.restore();
        }
    }

    class SmartHome extends Entity {
        constructor(x) {
            super(x, getGroundY(x) - 10); // Start floating
            this.floatY = Math.random() * Math.PI;
            this.hasFiber = Math.random() > 0.3;
        }
        draw() {
            // Update float
            this.floatY += 0.02;
            const currentY = this.y + Math.sin(this.floatY) * 5;

            ctx.save(); ctx.translate(this.x, currentY);

            // YEAR 22000 DESIGN: Anti-Gravity Bio-Pod
            // Shape: Floating Egg/Teardrop (Organic Tech)

            // Maglev Glow (Shadow)
            ctx.shadowBlur = 15; ctx.shadowColor = '#00ffff';
            ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
            ctx.beginPath(); ctx.ellipse(0, 20, 10, 3, 0, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;

            // Main Shell (Pearlescent White)
            const grd = ctx.createLinearGradient(-10, -20, 10, 20);
            grd.addColorStop(0, '#ffffff'); grd.addColorStop(1, '#aaccff');
            ctx.fillStyle = grd;

            ctx.beginPath();
            ctx.arc(0, 0, 12, Math.PI, 0); // Top dome
            ctx.bezierCurveTo(12, 10, 0, 25, 0, 25); // Taper bottom
            ctx.bezierCurveTo(0, 25, -12, 10, -12, 0);
            ctx.fill();

            // Holographic Window (Ring)
            ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.ellipse(0, -2, 8, 4, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = 'rgba(0, 255, 255, 0.3)'; ctx.fill();

            // Tech Spire (Top Antenna)
            ctx.strokeStyle = '#ccc'; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, -25); ctx.stroke();
            // Blinking beacon
            if (Math.random() < 0.1) { ctx.fillStyle = '#fff'; ctx.fillRect(-1, -27, 2, 2); }

            // CONNECTION: Neural Link (Purple Stream)
            if (Math.random() < 0.01) {
                const target = groundNodes[0]; // Link to nearest tower
                if (target) {
                    ctx.strokeStyle = '#9b59b6'; ctx.lineWidth = 0.5;
                    ctx.beginPath(); ctx.moveTo(0, -25); ctx.lineTo(target.x - this.x, target.y - target.height - currentY); ctx.stroke();
                }
            }

            ctx.restore();
        }
    }

    // New Class: Subsea Habitat (Underwater City)
    class SubseaHabitat extends Entity {
        constructor(x) {
            super(x, height - 20); // Near bottom
            this.size = 20 + Math.random() * 30;
        }
        update() {
            // Static structure, no movement logic needed yet
        }
        draw() {
            ctx.save(); ctx.translate(this.x, this.y);

            // Geo-Dome
            ctx.fillStyle = 'rgba(0, 255, 200, 0.1)';
            ctx.strokeStyle = '#00ffcc'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(0, 0, this.size, Math.PI, 0); ctx.fill(); ctx.stroke();

            // Inner Buildings (Silhouettes)
            ctx.fillStyle = '#004444';
            ctx.fillRect(-10, -15, 5, 15);
            ctx.fillRect(-2, -25, 6, 25);
            ctx.fillRect(8, -10, 8, 10);

            // Bioluminescent Lights
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(-1, -26, 2, 2);

            ctx.restore();
        }
    }

    class MarineRelay extends Entity {
        constructor(x) {
            super(x, getOceanY(x) + 5);
            this.type = 'RELAY';
            this.floatOffset = Math.random() * Math.PI * 2;
            // Spread them out vertically a bit too, but keep near surface
            this.yBaseOffset = Math.random() * 30;
        }
        update() {
            // Bobbing animation
            this.floatOffset += 0.05;
            this.y = getOceanY(this.x) + this.yBaseOffset + Math.sin(this.floatOffset) * 3;

            // Communication Logic (VDES - VHF Data Exchange)
            if (Math.random() < 0.01) {
                // Find nearest ship
                let nearest = null; let minD = 500;
                oceanShips.forEach(ship => {
                    let d = Math.abs(ship.x - this.x);
                    if (d < minD) { minD = d; nearest = ship; }
                });
                if (nearest) {
                    packets.push(new Packet(this, nearest, '#00ffcc', 'V2X')); // Cyan Link
                } else {
                    // Link to Satellite if no ship
                    satellites.forEach(sat => {
                        if (Math.abs(sat.x - this.x) < 200 && sat.layer === 'LEO') {
                            packets.push(new Packet(this, sat, '#00ffcc', 'V2X'));
                        }
                    });
                }
            }
        }
        draw() {
            ctx.save(); ctx.translate(this.x, this.y);

            // Buoy / Platform Base
            ctx.fillStyle = '#f39c12'; // Safety Orange
            ctx.beginPath();
            ctx.moveTo(-10, 0); ctx.lineTo(-5, -5); ctx.lineTo(5, -5); ctx.lineTo(10, 0);
            ctx.lineTo(0, 8); // Underwater weight
            ctx.fill();

            // Tower
            ctx.strokeStyle = '#e67e22'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(0, -25); ctx.stroke();

            // Sensor Array (Solar Panels + Antenna)
            ctx.fillStyle = '#34495e';
            ctx.fillRect(-6, -20, 12, 4); // Solar Panel crossbar

            // Top Light
            const time = Date.now();
            ctx.fillStyle = (Math.floor(time / 1000) % 2 === 0) ? '#ffff00' : '#444400';
            ctx.beginPath(); ctx.arc(0, -28, 3, 0, Math.PI * 2); ctx.fill();

            // Radar Rings (Static)
            ctx.strokeStyle = 'rgba(0, 255, 204, 0.3)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(0, -15, 6, -Math.PI, 0); ctx.stroke();
            ctx.beginPath(); ctx.arc(0, -15, 10, -Math.PI, 0); ctx.stroke();

            ctx.restore();
        }
    }

    class CruiseShip extends Entity {
        constructor(x) {
            super(x, getOceanY(x) - 5);
            this.speed = (Math.random() * 0.3 + 0.1) * (Math.random() > 0.5 ? 1 : -1);
            this.length = 60 + Math.random() * 40;
        }
        update() {
            this.x += this.speed;
            if (this.x > width + 100) this.x = -100;
            if (this.x < -100) this.x = width + 100;
            this.y = getOceanY(this.x) - 5;
        }
        draw() {
            ctx.save(); ctx.translate(this.x, this.y);
            if (this.speed < 0) ctx.scale(-1, 1);

            // Hull
            ctx.fillStyle = '#ecf0f1';
            ctx.beginPath();
            ctx.moveTo(-this.length / 2, 0);
            ctx.lineTo(this.length / 2, 0);
            ctx.lineTo(this.length / 2 + 10, -10); // Bow
            ctx.lineTo(-this.length / 2, -10);
            ctx.fill();

            // Decks (Stacked)
            ctx.fillStyle = '#bdc3c7';
            ctx.fillRect(-this.length / 2 + 5, -18, this.length - 15, 8); // Deck 1
            ctx.fillRect(-this.length / 2 + 10, -26, this.length - 30, 8); // Deck 2

            // Windows (Lights)
            ctx.fillStyle = '#f1c40f'; // Party lights
            for (let i = 0; i < this.length / 5; i++) {
                if (Math.random() > 0.3) ctx.fillRect(-this.length / 2 + 5 + (i * 5), -5, 2, 2); // Hull windows
                if (Math.random() > 0.3) ctx.fillRect(-this.length / 2 + 10 + (i * 5), -14, 2, 2); // Deck 1
            }

            // Pool / Hologram Deck
            ctx.fillStyle = 'rgba(0, 255, 255, 0.4)';
            ctx.beginPath(); ctx.arc(0, -26, 5, Math.PI, 0); ctx.fill();

            ctx.restore();
        }
    }

    class MarineLife extends Entity {
        constructor() {
            super(Math.random() * width, 0);
            this.reset();
        }
        reset() {
            this.x = Math.random() * width;
            this.y = getOceanY(this.x) + 20 + Math.random() * 100; // Underwater
            this.state = 'SWIM'; // SWIM, JUMP
            this.vy = 0;
            this.vx = (Math.random() * 0.5 + 0.5) * (Math.random() > 0.5 ? 1 : -1);
            this.type = Math.random() > 0.8 ? 'WHALE' : 'FISH';
        }
        update() {
            // State Machine
            if (this.state === 'SWIM') {
                this.x += this.vx;
                this.y = getOceanY(this.x) + 50 + Math.sin(Date.now() * 0.002 + this.x) * 20;

                // Random Jump Trigger
                if (Math.random() < 0.001) {
                    this.state = 'JUMP_START';
                }
            } else if (this.state === 'JUMP_START') {
                // Prepare launch velocity
                this.vy = -4 - Math.random() * 2; // Jump force
                this.state = 'AIR';
            } else if (this.state === 'AIR') {
                this.x += this.vx * 1.5;
                this.y += this.vy;
                this.vy += 0.1; // Gravity

                // Re-entry
                if (this.y > getOceanY(this.x)) {
                    this.y = getOceanY(this.x);
                    this.state = 'SWIM';
                    ripples.push(new Ripple(this.x, this.y, '#fff', false)); // Splash
                }
            }

            // Wrap
            if (this.x > width + 50) this.x = -50;
            if (this.x < -50) this.x = width + 50;
        }
        draw() {
            ctx.save(); ctx.translate(this.x, this.y);
            if (this.vx < 0) ctx.scale(-1, 1);

            if (this.type === 'WHALE') {
                // Futuristic Cyber-Whale
                ctx.fillStyle = '#34495e';
                ctx.beginPath();
                ctx.ellipse(0, 0, 15, 6, 0, 0, Math.PI * 2);
                ctx.fill();
                // Tail
                ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-20, -5); ctx.lineTo(-20, 5); ctx.fill();
                // Glowing lines
                ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(10, 0); ctx.stroke();
            } else {
                // Flying Fish
                ctx.fillStyle = '#00ffcc';
                ctx.beginPath();
                ctx.moveTo(5, 0); ctx.lineTo(-5, -3); ctx.lineTo(-5, 3);
                ctx.fill();
                // Wing
                if (this.state === 'AIR') {
                    ctx.fillStyle = 'rgba(255,255,255,0.5)';
                    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-5, -8); ctx.lineTo(2, 0); ctx.fill();
                }
            }
            ctx.restore();
        }
    }

    class NavalShip extends Entity {
        constructor() {
            super(0, 0);
            this.x = rand(0, width);
            this.speed = rand(0.15, 0.35) * (Math.random() > 0.5 ? 1 : -1);
            this.scale = 0.7 + Math.random() * 0.3;
            // Depth Simulation: Random Y offset from the "surface" line
            this.depthOffset = Math.random() * 100; // Can be up to 100px lower
            this.isAutonomous = Math.random() > 0.3;
        }
        update() {
            this.x += this.speed;
            if (this.x > width + 50) this.x = -50;
            if (this.x < -50) this.x = width + 50;

            // Calculate Y based on surface curve PLUS depth offset
            // We use a sine wave on the offset to make them 'wander' slightly up and down
            this.y = getOceanY(this.x) + this.depthOffset + Math.sin(this.x * 0.01 + Date.now() * 0.0001) * 10;

            // Occasional Satellite Uplink (Starlink Maritime)
            if (Math.random() < 0.005) {
                let sat = satellites[Math.floor(Math.random() * satellites.length)];
                if (sat && Math.abs(sat.x - this.x) < 300) {
                    packets.push(new Packet(this, sat, '#3498db', 'MESH'));
                }
            }
        }
        draw() {
            ctx.save(); ctx.translate(this.x, this.y);

            // Depth scaling: Deeper ships are darker/smaller (perspective)
            const depthScale = 1 - (this.depthOffset / 200);
            ctx.scale(this.scale * depthScale, this.scale * depthScale);
            // Tint adjustment for depth (underwater look)
            ctx.globalAlpha = 0.8 + (0.2 * depthScale);

            if (this.speed < 0) ctx.scale(-1, 1);
            ctx.scale(this.scale, this.scale);

            // Wake
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.beginPath(); ctx.moveTo(-35, 2); ctx.lineTo(-80, -4); ctx.lineTo(-80, 4); ctx.fill();

            // HULL - Sleek Modern Design
            // Hull Gradient
            const hullGrd = ctx.createLinearGradient(-40, 0, 40, 0);
            hullGrd.addColorStop(0, '#2c3e50'); hullGrd.addColorStop(1, '#34495e');
            ctx.fillStyle = hullGrd;

            ctx.beginPath();
            ctx.moveTo(40, -5); // Sharp Bow
            ctx.lineTo(35, 6); // Waterline
            ctx.lineTo(-40, 6); // Stern
            ctx.lineTo(-45, -2); // Rear Deck
            ctx.lineTo(-42, -5); // Transom
            ctx.fill();

            // Red Waterline Strip
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(-38, 4, 75, 2);

            // SUPERSTRUCTURE
            if (this.isAutonomous) {
                // Futuristic Bridge-less Design (Sensor Dome)
                ctx.fillStyle = '#ecf0f1';
                ctx.beginPath();
                ctx.ellipse(30, -5, 8, 3, 0, Math.PI, 0); // Front sensor pod
                ctx.fill();

                // Rear Aerodynamic Tower
                ctx.beginPath(); ctx.moveTo(-35, -5); ctx.lineTo(-35, -20); ctx.lineTo(-25, -5); ctx.fill();

                // CONN: High-Gain VDES Antenna (Cyan Glow)
                ctx.strokeStyle = '#00ffcc'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(-35, -20); ctx.lineTo(-35, -32); ctx.stroke();
                // Pulsing data orb
                const pulse = (Math.sin(Date.now() * 0.01) + 1) * 2;
                ctx.fillStyle = '#00ffcc'; ctx.beginPath(); ctx.arc(-35, -34, pulse, 0, Math.PI * 2); ctx.fill();

            } else {
                // Modern Bridge
                ctx.fillStyle = '#ecf0f1';
                ctx.fillRect(-38, -18, 12, 13);
                ctx.fillStyle = '#3498db'; // Glass
                ctx.fillRect(-37, -15, 10, 3);

                // CONN: Rotating Satcom Dome (White ball on top)
                ctx.fillStyle = '#fff';
                ctx.beginPath(); ctx.arc(-32, -22, 4, 0, Math.PI * 2); ctx.fill();
                // Rotating Ring
                ctx.save(); ctx.translate(-32, -22); ctx.rotate(Date.now() * 0.005);
                ctx.strokeStyle = '#f39c12'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.ellipse(0, 0, 6, 2, 0, 0, Math.PI * 2); ctx.stroke();
                ctx.restore();
            }

            // CARGO
            const colors = ['#e67e22', '#2980b9', '#27ae60', '#8e44ad'];
            const startX = -20;
            const w = 7;
            for (let i = 0; i < 6; i++) {
                let h = 2 + Math.floor(Math.random() * 3);
                for (let j = 0; j < h; j++) {
                    ctx.fillStyle = colors[(i + j) % colors.length];
                    ctx.fillRect(startX + (i * 8), -5 - ((j + 1) * 4), w, 3.5);
                }
            }

            ctx.restore();
        }
    }

    class Packet {
        constructor(p1, p2, color, type) {
            this.p1 = p1; this.p2 = p2; this.t = 0;
            this.type = type || 'MESH'; // MESH, STATION, V2X, BATTLE
            this.speed = (type === 'STATION') ? 0.015 : ((type === 'V2X') ? 0.08 : 0.05);
            this.finished = false; this.color = color;
        }
        update() { this.t += this.speed; if (this.t >= 1) this.finished = true; }
        draw() {
            const cx = this.p1.x + (this.p2.x - this.p1.x) * this.t;
            const cy = this.p1.y + (this.p2.y - this.p1.y) * this.t;
            ctx.fillStyle = this.color;

            if (this.type === 'V2X') {
                // Tiny Packets
                ctx.beginPath(); ctx.arc(cx, cy, 1, 0, Math.PI * 2); ctx.fill();
            } else if (this.type === 'STATION') {
                // Big Data Beam tip
                ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
                // Trail
                ctx.beginPath(); ctx.moveTo(this.p1.x, this.p1.y); ctx.lineTo(cx, cy);
                ctx.strokeStyle = this.color; ctx.globalAlpha = 0.2; ctx.stroke(); ctx.globalAlpha = 1.0;
            } else {
                // Standard
                const angle = Math.atan2(this.p2.y - this.p1.y, this.p2.x - this.p1.x);
                ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle);
                ctx.fillRect(-4, -1, 8, 2); ctx.restore();
            }
        }
    }




    function init() {
        satellites = []; groundNodes = []; oceanShips = []; cities = []; packets = []; ripples = []; stars = []; skylinePoints = []; bgCityLayers = []; orbitRegions = []; marineStructures = []; civilians = [];

        for (let i = 0; i < 100; i++) stars.push(new Star());

        // Generate distant skyline silhouette
        for (let x = 0; x <= width; x += 40) {
            const h = 40 + Math.random() * 60;
            skylinePoints.push({ x: x, h: h });
        }

        // Generate parallax city layers (depth simulation)
        bgCityLayers = [];
        // Layer 1: Distant horizon (atmospheric haze effect)
        bgCityLayers.push(generateCityLayer(200, height * 0.4, '#0e141a', 0.5));
        // Layer 2: Mid-range structures (enhanced detail)
        bgCityLayers.push(generateCityLayer(100, height * 0.25, '#151d25', 0.8));
        // Layer 3: Foreground installations (maximum fidelity)
        bgCityLayers.push(generateCityLayer(50, height * 0.15, '#1c2630', 1.0));

        for (let i = 0; i < config.counts.towers; i++) {
            const x = (width / config.counts.towers) * (i + 0.5);
            groundNodes.push(new StaticTower(x));
        }

        // TERRAFORMING: Add Civilians (Homes & Cars)
        // Spread them on the ground
        for (let i = 0; i < 8; i++) {
            civilians.push(new SmartHome(rand(100, width - 100)));
        }
        for (let i = 0; i < 6; i++) {
            civilians.push(new SmartCar(rand(0, width)));
        }

        // Initialize remaining entities
        for (let i = 0; i < config.counts.ships; i++) oceanShips.push(new NavalShip());

        // Maritime Communication Infrastructure
        for (let i = 0; i < 3; i++) { // Reduced from 5
            marineStructures.push(new MarineRelay(rand(20, width - 20)));
        }
        // Subsea Cities (Year 22000)
        for (let i = 0; i < 4; i++) {
            marineStructures.push(new SubseaHabitat(rand(width * 0.1, width * 0.9)));
        }

        for (let i = 0; i < config.counts.cities; i++) {
            const x = (width / config.counts.cities) * i + (width / 6);
            cities.push(new City(x));
        }

        // Non-Terrestrial Network (NTN) Satellite Deployment
        // Capital ship: Mon Calamari flagship (GEO layer)
        satellites.push(new SpaceShip('HOME_ONE', 'GEO', 0.03, width * 0.2));

        // Logistics fleet: Star Wars Transports (MEO layer)
        for (let i = 0; i < 3; i++) { // Reduced from 6
            // Randomly choose Rebel GR-75 or Imperial Gozanti
            const type = Math.random() > 0.5 ? 'GR75' : 'GOZANTI';
            const startX = (width / 3) * i;
            const speed = 0.2 * (Math.random() > 0.5 ? 1 : -1);
            satellites.push(new SpaceShip(type, 'MEO', speed, startX));
        }

        for (let i = 0; i < 5; i++) { // Reduced from 8 (TIEs)
            const startX = (width / 5) * i;
            const speed = 0.8 * (Math.random() > 0.5 ? 1 : -1);
            satellites.push(new SpaceShip('TIE', 'LEO', speed, startX));
        }

        // REBEL ALLIANCE - EASTER EGGS
        // X-Wing Squadron
        for (let i = 0; i < 2; i++) { // Reduced from 3
            const startX = (width / 2) * i + 100;
            const speed = 1.2; // Faster than TIEs
            satellites.push(new SpaceShip('XWING', 'LEO', speed, startX));
        }

        // The Millennium Falcon (Rare Individual)
        satellites.push(new SpaceShip('FALCON', 'LEO', 2.0, 0)); // Very Fast


        spaceStation = new SuperStarDestroyer();
    }

    function generateCityLayer(count, avgHeight, color, density) {
        let layer = { color: color, buildings: [] };
        for (let i = 0; i < count; i++) {
            const w = rand(30, 120);
            const h = avgHeight * (0.5 + Math.random());
            const x = rand(-200, width + 200);
            // Types: BLOCK (Standard), SPIRE (Tall/Thin), SLANT (Angled Roof)
            let type = 'BLOCK';
            if (Math.random() > 0.7) type = 'SLANT';
            if (h > avgHeight * 1.2) type = 'SPIRE';

            layer.buildings.push({ x: x, w: w, h: h, type: type });
        }
        return layer;
    }

    function drawOceanVolume() {
        ctx.save();
        // Create a path that follows the ocean surface and goes down to bottom
        ctx.beginPath();
        const steps = 50;
        ctx.moveTo(0, height);
        ctx.lineTo(0, getOceanY(0));
        for (let i = 0; i <= steps; i++) {
            const x = (width / steps) * i;
            ctx.lineTo(x, getOceanY(x));
        }
        ctx.lineTo(width, height);
        ctx.closePath();

        // Deep Blue Gradient
        const grd = ctx.createLinearGradient(0, height / 2, 0, height);
        grd.addColorStop(0, 'rgba(0, 105, 148, 0.4)'); // Surface Blue
        grd.addColorStop(1, 'rgba(0, 10, 40, 0.9)');   // Deep Dark
        ctx.fillStyle = grd;
        ctx.fill();

        // Caustics (Light rays underwater) - subtle
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        for (let i = 0; i < 5; i++) {
            const w = Math.random() * 50;
            const x = Math.random() * width;
            ctx.fillRect(x, getOceanY(x), w, height);
        }

        ctx.restore();
    }

    function drawBackground() {
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, config.colors.bgTop); // Hazy Sky
        grad.addColorStop(1, config.colors.bgBottom); // Horizon
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Stars
        stars.forEach(s => { s.update(); s.draw(); });

        // RENDER CITY LAYERS (Back to Front)
        if (bgCityLayers) {
            bgCityLayers.forEach(layer => {
                ctx.fillStyle = layer.color;
                layer.buildings.forEach(b => {
                    const groundY = height;

                    // Shape Logic
                    if (b.type === 'SLANT') {
                        ctx.beginPath();
                        ctx.moveTo(b.x, groundY);
                        ctx.lineTo(b.x, groundY - b.h);
                        ctx.lineTo(b.x + b.w, groundY - b.h * 0.85); // Slant down
                        ctx.lineTo(b.x + b.w, groundY);
                        ctx.fill();
                    } else if (b.type === 'SPIRE') {
                        ctx.beginPath();
                        ctx.moveTo(b.x + b.w * 0.2, groundY);
                        ctx.lineTo(b.x + b.w * 0.4, groundY - b.h); // Peak
                        ctx.lineTo(b.x + b.w * 0.6, groundY - b.h); // Flat top small
                        ctx.lineTo(b.x + b.w * 0.8, groundY);
                        ctx.fill();
                        // Antenna on spire
                        ctx.beginPath(); ctx.moveTo(b.x + b.w * 0.5, groundY - b.h);
                        ctx.lineTo(b.x + b.w * 0.5, groundY - b.h - 30);
                        ctx.strokeStyle = layer.color; ctx.lineWidth = 2; ctx.stroke();
                    } else {
                        // BLOCK
                        ctx.fillRect(b.x, groundY - b.h, b.w, b.h);
                    }

                    // SUBTLE DETAILS: Removed per user request

                    ctx.fillStyle = layer.color; // Reset for next building
                });
            });
        }

        // Draw active Cities
        cities.forEach(c => c.draw());

        // FOREGROUND GROUND - Dense Metallic City Surface

        // Fill background of ground
        ctx.beginPath();
        ctx.moveTo(0, height);
        const steps = 60;
        for (let i = 0; i <= steps; i++) { const x = (width / steps) * i; ctx.lineTo(x, getGroundY(x)); }
        ctx.lineTo(width, height);
        ctx.fillStyle = '#1e252b'; // Dark metal base
        ctx.fill();

        // Draw "Greeble" Blocks on ground
        for (let i = 0; i <= steps; i++) {
            const x = (width / steps) * i;
            const y = getGroundY(x);

            // Random tech blocks on surface
            if (i % 2 === 0) {
                ctx.fillStyle = '#2a333a';
                const h = Math.random() * 20;
                ctx.fillRect(x, y, (width / steps), h);
                // Side highlight
                ctx.fillStyle = '#3e4a52';
                ctx.fillRect(x + (width / steps) - 2, y, 2, h);
            }
        }

        // Surface Grid
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) { const x = (width / steps) * i; ctx.lineTo(x, getGroundY(x)); }
        ctx.lineWidth = 1; ctx.strokeStyle = '#3e4a52'; ctx.stroke();
    }

    function drawOrbitLines() {
        // Only draws the dashed lines (Background Layer)
        ctx.save();
        const cx = width / 2;
        orbitRegions = []; // Reset and Populate for UI check

        // Define orbits properties (dynamic language support)
        const t = translations[currentLang].orbits;
        const orbits = [
            {
                name: t.geo.name,
                full: t.geo.full,
                alt: height * 0.15,
                color: "#d946ef",
                info: t.geo.info
            },
            {
                name: t.meo.name,
                full: t.meo.full,
                alt: height * 0.35,
                color: "#0ea5e9",
                info: t.meo.info
            },
            {
                name: t.leo.name,
                full: t.leo.full,
                alt: height * 0.55,
                color: "#f59e0b",
                info: t.leo.info
            },
            {
                name: "SUBSEA",
                full: "GLOBAL UNDERSEA BACKBONE",
                alt: height * 0.90, // Near bottom
                color: "#00ffcc",
                info: "Fiber Optic Cables & Habitats"
            }
        ];

        orbits.forEach(orbit => {
            ctx.beginPath();
            let labelY = orbit.alt;

            for (let x = 0; x <= width; x += 20) {
                const dx = (x - cx) / width;
                const curve = 150 * (dx * dx);
                const y = orbit.alt + curve;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);

                if (x >= 40 && x < 60) labelY = y;
            }
            ctx.strokeStyle = orbit.color;
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 15]);
            ctx.globalAlpha = 0.5;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
            ctx.setLineDash([]);

            // Store Region for UI Function
            const labelX = 30;
            const text = orbit.name + " LAYER";
            ctx.font = "bold 12px 'Courier New', monospace";
            const metrics = ctx.measureText(text);
            const w = metrics.width + 20;
            const h = 24;

            orbitRegions.push({ x: labelX, y: labelY - 15, w: w, h: h, data: orbit });
        });

        ctx.restore();
    }

    // Orbit UI Rendering (Labels and Info Panels)
    function drawOrbitUI() {
        ctx.save();
        orbitRegions.forEach(region => {
            const orbit = region.data;
            const { x, y, w, h } = region;

            // Expanded Hitbox
            const isHover = (mouseX >= x && mouseX <= x + w + 50 && mouseY >= y - 10 && mouseY <= y + h + 10);

            // Label Background
            ctx.fillStyle = isHover ? orbit.color : 'rgba(10, 20, 30, 0.8)';
            ctx.strokeStyle = orbit.color;
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + w - 10, y);
            ctx.lineTo(x + w, y + 10);
            ctx.lineTo(x + w, y + h);
            ctx.lineTo(x + 10, y + h);
            ctx.lineTo(x, y + h - 10);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Text
            ctx.fillStyle = isHover ? '#000' : orbit.color;
            ctx.font = "bold 12px 'Courier New', monospace";
            ctx.fillText(orbit.name + " LAYER", x + 10, y + 16);

            ctx.fillText(orbit.name + " LAYER", x + 10, y + 16);

            // Tooltip on Hover OR Detailed Panel on Click
            // ROBUST FIX: Use string ID comparison
            const isSelected = selectedOrbitName === orbit.name;

            if (isHover || isSelected) {
                const boxWidth = isSelected ? 450 : 280;
                const boxHeight = isSelected ? 180 : 50;
                const tx = x + w + 20;
                const ty = y - 10;

                // Ensure box stays within canvas bounds
                const finalX = Math.min(tx, width - boxWidth - 20);
                const finalY = Math.max(20, Math.min(ty, height - boxHeight - 20));

                // Box
                ctx.fillStyle = 'rgba(5, 10, 15, 0.95)';
                ctx.strokeStyle = orbit.color;
                ctx.lineWidth = isSelected ? 2 : 1;

                if (isSelected) {
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = orbit.color;
                }

                ctx.fillRect(finalX, finalY, boxWidth, boxHeight);
                ctx.strokeRect(finalX, finalY, boxWidth, boxHeight);
                ctx.shadowBlur = 0;

                if (isSelected) {
                    // Detailed Panel
                    // Header bar
                    ctx.fillStyle = orbit.color;
                    ctx.fillRect(finalX, finalY, boxWidth, 30);

                    // Header text
                    ctx.fillStyle = '#000';
                    ctx.font = "bold 14px 'Courier New', monospace";
                    ctx.fillText(orbit.full, finalX + 10, finalY + 20);

                    // Content
                    ctx.fillStyle = orbit.color;
                    ctx.font = "10px 'Courier New', monospace"; // Reduced from 11px

                    let details = [];
                    if (orbit.name === 'GEO') {
                        details = [
                            `ALTITUDE: 35,786 km`,
                            `PERIOD: 24h (Geostationary)`,
                            `COVERAGE: Global (3 sats)`,
                            `USE: TV, Weather, Backhaul`,
                            `LATENCY: ~600ms (High)`,
                            `BANDWIDTH: Med | STABILITY: High`
                        ];
                    } else if (orbit.name === 'MEO') {
                        details = [
                            `ALTITUDE: 2,000-35,000 km`,
                            `PERIOD: 2-12 hours`,
                            `COVERAGE: Regional`,
                            `USE: GPS, Galileo, Fiber-Like`,
                            `LATENCY: ~150ms (Medium)`,
                            `BANDWIDTH: High | STABILITY: Good`
                        ];
                    } else if (orbit.name === 'SUBSEA') {
                        details = [
                            `DEPTH: Avg 3,600m (Max 11km)`,
                            `LENGTH: >1.3 Million km total`,
                            `SPEED: Petabits/sec`,
                            `USE: 99% of Global Traffic`,
                            `LATENCY: ~Speed of Light`,
                            `THREATS: Sharks, Anchors, Spies`
                        ];
                    } else {
                        details = [
                            `ALTITUDE: 160-2,000 km`,
                            `PERIOD: 90-120 mins`,
                            `COVERAGE: Local (Requires Constellation)`,
                            `USE: Starlink, IoT, BB`,
                            `LATENCY: <30ms (Low)`,
                            `BANDWIDTH: V.High | STABILITY: Fair`
                        ];
                    }

                    details.forEach((line, idx) => {
                        ctx.fillText(line, finalX + 10, finalY + 45 + (idx * 14)); // Tighter spacing
                    });
                } else {
                    // Simple Hover Tooltip
                    ctx.beginPath(); ctx.moveTo(x + w, y + 10); ctx.lineTo(finalX, finalY + 25); ctx.stroke();

                    ctx.fillStyle = orbit.color;
                    ctx.font = "bold 13px 'Courier New'";
                    ctx.fillText(orbit.full, finalX + 10, finalY + 20);

                    ctx.fillStyle = '#ccc';
                    ctx.font = "11px Inter";
                    ctx.fillText(orbit.info, finalX + 10, finalY + 38);
                }
            }
        });
        ctx.restore();
    }

    function animate() {
        updateLanguage(); // Sync with site language
        drawBackground();
        drawOrbitLines(); // Draw Lines first

        spaceStation.update(); spaceStation.draw();
        satellites.forEach(s => s.update());
        oceanShips.forEach(s => s.update());
        // marineStructures.forEach(m => { m.update(); m.draw(); }); // Moved down

        // Render Civilians (Terraform Layer)
        civilians.forEach(c => { if (c.update) c.update(); c.draw(); });

        // UNDERWATER LAYER & HABITATS
        drawOceanVolume();
        marineStructures.forEach(m => {
            m.update();
            m.draw();
        });

        ripples.forEach((r, idx) => { r.update(); r.draw(); if (r.finished) ripples.splice(idx, 1); });

        // Mesh
        ctx.lineWidth = 1;
        for (let i = 0; i < groundNodes.length - 1; i++) {
            const t1 = groundNodes[i]; const t2 = groundNodes[i + 1];
            ctx.beginPath(); ctx.moveTo(t1.x, t1.y - t1.height); ctx.lineTo(t2.x, t2.y - t2.height);
            ctx.strokeStyle = config.colors.meshLink; ctx.setLineDash([2, 2]); ctx.stroke(); ctx.setLineDash([]);
            if (Math.random() < 0.01) packets.push(new Packet({ x: t1.x, y: t1.y - t1.height }, { x: t2.x, y: t2.y - t2.height }, '#ffffff', 'MESH'));
        }

        // New Ground Connection Types (Fiber & 5G)
        // 1. Underground Fiber Pulses (Horizontal high-speed data)
        const time = Date.now();
        if (Math.floor(time / 200) % 5 === 0) { // Every second-ish
            // Pick a random segment of the "ground"
            const startX = Math.random() * width;
            const endX = startX + (Math.random() * 200 + 100) * (Math.random() > 0.5 ? 1 : -1);
            const y = getGroundY(startX) + 20; // Slightly below surface

            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, getGroundY(endX) + 20);

            // Multicolor fiber strands
            const fiberColors = ['#00ff00', '#ff00ff', '#00ffff'];
            ctx.strokeStyle = fiberColors[Math.floor(Math.random() * fiberColors.length)];
            ctx.globalAlpha = 0.5;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }

        // 2. 5G/6G Macro Cell Beams (Tower to User Equipment simulation)
        groundNodes.forEach(tower => {
            if (Math.random() < 0.02) {
                // Beam down to "street level"
                const targetX = tower.x + (Math.random() * 100 - 50);
                const targetY = getGroundY(targetX) - 5; // Street level

                ctx.beginPath();
                ctx.moveTo(tower.x, tower.y - tower.height); // Top of tower
                ctx.lineTo(targetX, targetY);

                // Beam Style
                const beamColor = tower.faction === 'EMPIRE' ? '#ff4444' : '#44ff44';
                ctx.strokeStyle = beamColor;
                ctx.lineWidth = 0.5;
                ctx.stroke();

                // Impact splash
                ctx.fillStyle = beamColor;
                ctx.beginPath(); ctx.arc(targetX, targetY, 2, 0, Math.PI * 2); ctx.fill();
            }
        });

        // Space Logic
        groundNodes.forEach(g => {
            let nearestShip = null; let minDest = 99999;
            satellites.forEach(s => {
                if (s.faction === g.faction) {
                    // Range depends on layer (GEO covers more)
                    let range = width * 0.2;
                    if (s.layer === 'GEO') range = width * 0.8;
                    else if (s.layer === 'MEO') range = width * 0.5;

                    if (Math.abs(s.x - g.x) < range) {
                        const dist = Math.hypot(s.x - g.x, s.y - g.y);
                        if (dist < minDest) { minDest = dist; nearestShip = s; }
                    }
                }
            });
            if (nearestShip) {
                // Color based on Layer
                let color;
                if (nearestShip.layer === 'GEO') color = config.colors.linkGEO;
                else if (nearestShip.layer === 'MEO') color = config.colors.linkMEO;
                else color = config.colors.linkLEO;

                const alpha = 1 - (minDest / (height)); // Allow longer links
                if (alpha > 0) {
                    const topY = g.y - g.height; ctx.setLineDash([5, 10]); ctx.lineDashOffset = -performance.now() * 0.1;
                    ctx.beginPath(); ctx.moveTo(g.x, topY); ctx.lineTo(nearestShip.x, nearestShip.y);
                    ctx.strokeStyle = color; ctx.globalAlpha = alpha * 0.6; ctx.lineWidth = 1; ctx.stroke();
                    ctx.setLineDash([]); ctx.globalAlpha = 1.0;
                    if (Math.random() < 0.005) {
                        // Send packet
                        if (Math.random() > 0.5) {
                            packets.push(new Packet({ x: g.x, y: topY }, nearestShip, color, 'BATTLE'));
                            ripples.push(new Ripple(g.x, topY, color, false));
                        }
                        else packets.push(new Packet(nearestShip, { x: g.x, y: topY }, color, 'BATTLE'));
                    }
                }
            }
        });

        groundNodes.forEach(g => g.draw());
        oceanShips.forEach(s => s.draw());
        satellites.forEach(s => s.draw());
        packets.forEach((p, idx) => { p.update(); p.draw(); if (p.finished) packets.splice(idx, 1); });

        ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = '10px Inter';
        ctx.fillText(translations[currentLang].systemStatus, 20, height * 0.08);

        drawOrbitUI(); // Draw UI last (on top)

        requestAnimationFrame(animate);
    }

    resize();
    animate();

}); // End of DOMContentLoaded
