import { config } from "./config.js";
import { rand, clamp, getGroundY, getOceanY, getOrbitY } from "./helpers.js";

const LAYER_ALT = {
    GEO: 0.16,
    MEO: 0.36,
    LEO: 0.56,
};

const FACTION_STYLES = {
    SITH: { hull: "#5b1a1a", trim: "#ff5252", engine: "rgba(255, 90, 90, 0.65)" },
    JEDI: { hull: "#2f5a66", trim: "#9fe6ff", engine: "rgba(140, 220, 255, 0.65)" },
    SEPARATIST: { hull: "#6f6c74", trim: "#c7b27c", engine: "rgba(230, 210, 140, 0.6)" },
    BOUNTY: { hull: "#3b4b45", trim: "#7cffc2", engine: "rgba(120, 240, 200, 0.6)" },
    TRADER: { hull: "#4a5562", trim: "#ffd4a3", engine: "rgba(255, 200, 140, 0.55)" },
    REBEL: { hull: "#445a73", trim: "#ffb86b", engine: "rgba(255, 180, 110, 0.6)" },
    DEFAULT: { hull: "#7d8ea1", trim: "#9fd2ff", engine: "rgba(140, 220, 255, 0.6)" },
};

const ROLE_PROFILES = {
    fighter: { scale: 1, wobble: 6, trail: 16 },
    interceptor: { scale: 0.95, wobble: 7, trail: 14 },
    bomber: { scale: 1.05, wobble: 4, trail: 18 },
    corvette: { scale: 1.1, wobble: 3.5, trail: 20 },
    cruiser: { scale: 1.2, wobble: 2.5, trail: 24 },
    freighter: { scale: 1.25, wobble: 2.2, trail: 26 },
    shuttle: { scale: 0.9, wobble: 4.5, trail: 18 },
};

export class Entity {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    update() { }
    draw() { }
}

export class Star extends Entity {
    constructor(width, height) {
        super(Math.random() * width, Math.random() * (height * 0.78));
        this.size = rand(0.4, 1.8);
        this.baseAlpha = rand(0.2, 0.75);
        this.alpha = this.baseAlpha;
        this.phase = rand(0, Math.PI * 2);
        this.speed = rand(0.7, 2.2);
    }
    update(world) {
        this.phase += this.speed * world.dt;
        this.alpha = this.baseAlpha + Math.sin(this.phase) * 0.18;
    }
    draw(ctx) {
        ctx.fillStyle = `rgba(255,255,255,${Math.max(0.1, this.alpha)})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

export class City extends Entity {
    constructor(x) {
        super(x, 0);
        this.structures = [];
        const count = Math.floor(rand(4, 8));
        for (let i = 0; i < count; i++) {
            const width = rand(16, 42);
            const height = rand(32, 132);
            this.structures.push({
                offsetX: (i - count * 0.5) * 22 + rand(-5, 5),
                width,
                height,
                windowRows: Math.floor(height / 10),
            });
        }
    }
    update() { }
    draw(ctx, world) {
        const baseY = getGroundY(this.x, world.width, world.height) + 18;
        for (const b of this.structures) {
            const x = this.x + b.offsetX;
            const y = baseY - b.height;
            ctx.fillStyle = "rgba(34, 50, 66, 0.92)";
            ctx.beginPath();
            ctx.moveTo(x, baseY);
            ctx.lineTo(x + b.width, baseY);
            ctx.lineTo(x + b.width * 0.7, y);
            ctx.lineTo(x + b.width * 0.35, y + b.height * 0.15);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = "rgba(120, 180, 220, 0.5)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + b.width * 0.2, y + b.height * 0.4);
            ctx.lineTo(x + b.width * 0.78, y + b.height * 0.4);
            ctx.stroke();

            ctx.fillStyle = "rgba(120, 200, 255, 0.5)";
            ctx.beginPath();
            ctx.arc(x + 4, baseY - 4, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

export class LandOutpost extends Entity {
    constructor(x, width, height) {
        super(x, getGroundY(x, width, height));
        this.blockW = rand(24, 38);
        this.blockH = rand(14, 24);
        this.sideW = rand(12, 20);
        this.sideH = rand(10, 18);
        this.phase = rand(0, Math.PI * 2);
    }
    update(world) {
        this.phase += world.dt * 2.4;
        this.y = getGroundY(this.x, world.width, world.height);
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.fillStyle = "rgba(26, 40, 54, 0.95)";
        ctx.beginPath();
        ctx.moveTo(-this.blockW * 0.6, 0);
        ctx.lineTo(this.blockW * 0.7, 0);
        ctx.lineTo(this.blockW * 0.35, -this.blockH);
        ctx.lineTo(-this.blockW * 0.3, -this.blockH * 0.85);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = "rgba(120, 190, 230, 0.6)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-this.blockW * 0.15, -this.blockH * 0.35);
        ctx.lineTo(this.blockW * 0.45, -this.blockH * 0.35);
        ctx.stroke();

        // Cockpit glow
        const blink = 0.2 + Math.abs(Math.sin(this.phase)) * 0.5;
        ctx.globalAlpha = blink;
        ctx.fillStyle = "rgba(140, 220, 255, 0.6)";
        ctx.beginPath();
        ctx.arc(this.blockW * 0.1, -this.blockH * 0.65, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Landing struts
        ctx.strokeStyle = "rgba(80, 120, 150, 0.7)";
        ctx.beginPath();
        ctx.moveTo(-this.blockW * 0.45, 0);
        ctx.lineTo(-this.blockW * 0.55, 6);
        ctx.moveTo(this.blockW * 0.45, 0);
        ctx.lineTo(this.blockW * 0.55, 6);
        ctx.stroke();

        ctx.restore();
    }
}

export class EdgeHub extends Entity {
    constructor(x, width, height) {
        super(x, getGroundY(x, width, height));
        this.width = rand(34, 52);
        this.height = rand(20, 30);
        this.phase = rand(0, Math.PI * 2);
    }
    update(world) {
        this.phase += world.dt * 1.8;
        this.y = getGroundY(this.x, world.width, world.height);
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.fillStyle = "rgba(22, 36, 50, 0.96)";
        ctx.beginPath();
        ctx.moveTo(-this.width * 0.6, 0);
        ctx.lineTo(this.width * 0.7, 0);
        ctx.lineTo(this.width * 0.4, -this.height);
        ctx.lineTo(-this.width * 0.25, -this.height * 0.9);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = config.colors.hubGlow;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-this.width * 0.2, -this.height * 0.4);
        ctx.lineTo(this.width * 0.55, -this.height * 0.4);
        ctx.stroke();

        const glow = 0.2 + Math.abs(Math.sin(this.phase)) * 0.55;
        ctx.globalAlpha = glow;
        ctx.fillStyle = "rgba(120, 210, 255, 0.7)";
        ctx.fillRect(-this.width * 0.4, -this.height * 0.75, this.width * 0.6, 4);
        ctx.globalAlpha = 1;

        // Bridge tower
        ctx.fillStyle = "rgba(70, 110, 140, 0.9)";
        ctx.fillRect(this.width * 0.1, -this.height - 10, this.width * 0.22, 10);

        ctx.restore();
    }
}

export class MicrowaveRelay extends Entity {
    constructor(x, width, height) {
        super(x, getGroundY(x, width, height));
        this.height = rand(28, 40);
        this.phase = rand(0, Math.PI * 2);
    }
    update(world) {
        this.phase += world.dt * 2.2;
        this.y = getGroundY(this.x, world.width, world.height);
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.fillStyle = "rgba(90, 130, 160, 0.9)";
        ctx.beginPath();
        ctx.arc(0, -this.height * 0.4, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(140, 220, 255, 0.7)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-10, -this.height * 0.4);
        ctx.lineTo(10, -this.height * 0.4);
        ctx.stroke();

        const pulse = 0.3 + Math.abs(Math.sin(this.phase)) * 0.4;
        ctx.globalAlpha = pulse;
        ctx.strokeStyle = "rgba(120, 220, 255, 0.6)";
        ctx.beginPath();
        ctx.arc(0, -this.height * 0.4, 12, Math.PI * 1.2, Math.PI * 1.8);
        ctx.stroke();
        ctx.globalAlpha = 1;

        ctx.restore();
    }
}

export class SmallCell extends Entity {
    constructor(x, width, height) {
        super(x, getGroundY(x, width, height));
        this.height = rand(16, 24);
        this.phase = rand(0, Math.PI * 2);
    }
    update(world) {
        this.phase += world.dt * 3;
        this.y = getGroundY(this.x, world.width, world.height);
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.fillStyle = "rgba(40, 60, 80, 0.95)";
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.lineTo(8, 0);
        ctx.lineTo(4, -this.height);
        ctx.lineTo(-4, -this.height * 0.8);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = config.colors.cellColor;
        ctx.beginPath();
        ctx.arc(2, -this.height * 0.6, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

export class TelecomBuilding extends Entity {
    constructor(x, width, height) {
        super(x, getGroundY(x, width, height));
        this.type = Math.floor(rand(0, 3));
        this.width = rand(40, 68);
        this.height = rand(26, 44);
        this.phase = rand(0, Math.PI * 2);
    }
    update(world) {
        this.phase += world.dt * 1.7;
        this.y = getGroundY(this.x, world.width, world.height);
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.fillStyle = config.colors.telecomCore;
        ctx.beginPath();
        ctx.moveTo(-this.width * 0.6, 0);
        ctx.lineTo(this.width * 0.7, 0);
        ctx.lineTo(this.width * 0.4, -this.height);
        ctx.lineTo(-this.width * 0.2, -this.height * 0.85);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = config.colors.telecomTrim;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-this.width * 0.15, -this.height * 0.35);
        ctx.lineTo(this.width * 0.55, -this.height * 0.35);
        ctx.stroke();

        const blink = 0.2 + Math.abs(Math.sin(this.phase)) * 0.6;
        ctx.globalAlpha = blink;
        ctx.fillStyle = "rgba(120, 210, 255, 0.65)";
        ctx.fillRect(-this.width * 0.4, -this.height + 6, this.width * 0.8, 3);
        ctx.globalAlpha = 1;

        if (this.type === 0) {
            // Docked antenna mast
            ctx.strokeStyle = "rgba(140, 220, 255, 0.7)";
            ctx.beginPath();
            ctx.moveTo(this.width * 0.05, -this.height * 0.9);
            ctx.lineTo(this.width * 0.05, -this.height - 16);
            ctx.stroke();
            ctx.fillStyle = config.colors.cellColor;
            ctx.fillRect(this.width * 0.05 - 3, -this.height - 20, 6, 6);
        } else if (this.type === 1) {
            // Engine vents
            ctx.fillStyle = "rgba(80, 120, 150, 0.8)";
            for (let i = -1; i <= 1; i++) {
                ctx.fillRect(i * 10 - 4, -this.height * 0.9, 8, 6);
            }
        } else {
            // Side dish
            ctx.fillStyle = config.colors.dishColor;
            ctx.beginPath();
            ctx.arc(this.width * 0.4, -this.height * 0.5, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "rgba(140, 220, 255, 0.6)";
            ctx.beginPath();
            ctx.moveTo(this.width * 0.25, -this.height * 0.5);
            ctx.lineTo(this.width * 0.4, -this.height * 0.5);
            ctx.stroke();
        }

        ctx.restore();
    }
}

export class SubseaDarkFiber extends Entity {
    constructor(width, height) {
        super(0, 0);
        this.reset(width, height);
    }
    reset(width, height) {
        const coastX = width * config.geometry.ground.coastlineRatio;
        const minX = coastX + 40;
        const maxX = width - 60;
        this.startX = rand(minX, maxX);
        const direction = Math.random() > 0.5 ? 1 : -1;
        const length = rand(120, 260);
        this.endX = this.startX + direction * length;
        if (this.endX < minX) this.endX = minX + rand(40, 120);
        if (this.endX > maxX) this.endX = maxX - rand(40, 120);

        this.y1 = getOceanY(this.startX, width, height) + rand(40, 90);
        this.y2 = getOceanY(this.endX, width, height) + rand(40, 90);
        const mx = (this.startX + this.endX) * 0.5;
        const my = (this.y1 + this.y2) * 0.5;
        const bend = rand(-35, 35);
        this.cx = mx + bend;
        this.cy = my + rand(10, 35);

        this.life = 0;
        this.maxLife = rand(3.0, 5.0);
        this.pulse = rand(0, 1);
        this.speed = rand(0.18, 0.35);
    }
    update(world) {
        this.life += world.dt;
        this.pulse += this.speed * world.dt;
        if (this.pulse > 1) this.pulse = 0;
        if (this.life >= this.maxLife) {
            this.reset(world.width, world.height);
        }
    }
    draw(ctx) {
        ctx.save();
        ctx.strokeStyle = config.colors.darkFiber;
        ctx.globalAlpha = 0.8;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.startX, this.y1);
        ctx.quadraticCurveTo(this.cx, this.cy, this.endX, this.y2);
        ctx.stroke();

        ctx.strokeStyle = config.colors.darkFiberGlow;
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.startX, this.y1);
        ctx.quadraticCurveTo(this.cx, this.cy, this.endX, this.y2);
        ctx.stroke();

        const t = this.pulse;
        const inv = 1 - t;
        const x = inv * inv * this.startX + 2 * inv * t * this.cx + t * t * this.endX;
        const y = inv * inv * this.y1 + 2 * inv * t * this.cy + t * t * this.y2;
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = config.colors.darkFiberGlow;
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

export class SuperStarDestroyer extends Entity {
    constructor(width, height) {
        super(width * 0.25, height * LAYER_ALT.GEO);
        this.speed = config.speeds.station;
        this.phase = rand(0, Math.PI * 2);
        this.id = `GEO-HUB-${Math.floor(rand(120, 980))}`;
    }
    update(world) {
        this.x += this.speed * world.dt;
        if (this.x > world.width + 140) this.x = -140;
        this.phase += world.dt * 1.4;
        const base = getOrbitY(this.x, world.height * LAYER_ALT.GEO, world.width);
        this.y = base - 24 + Math.sin(this.phase) * 4;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.fillStyle = "#7f94a6";
        ctx.beginPath();
        ctx.moveTo(-60, 6);
        ctx.lineTo(70, 0);
        ctx.lineTo(-30, -14);
        ctx.lineTo(-50, -4);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#5f7487";
        ctx.fillRect(-8, -22, 26, 8);
        ctx.fillRect(6, -30, 14, 6);

        ctx.strokeStyle = "#8fd8ff";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-8, -8);
        ctx.lineTo(30, -8);
        ctx.stroke();

        // Engine glow
        ctx.fillStyle = "rgba(120, 210, 255, 0.45)";
        ctx.beginPath();
        ctx.ellipse(-48, 2, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

export class SkyLaneTraffic extends Entity {
    constructor(lane, index, total, width, height) {
        super(0, 0);
        this.lane = lane;
        this.offset = total > 0 ? index / total : 0;
        this.margin = 80;
        this.speed = lane.speed;
        this.direction = lane.direction || 1;
        this.color = lane.color;
        this.size = lane.size || rand(1.8, 2.6);
        this.trail = rand(12, 26);
        this.phase = rand(0, Math.PI * 2);
        this.wobble = rand(1.5, 4.5);
        this.baseAlt = height * lane.altRatio;
    }
    update(world) {
        const path = world.width + this.margin * 2;
        const travel = ((world.t * 0.001 * this.speed) + this.offset * path) % path;
        const x = -this.margin + travel;
        this.x = this.direction >= 0 ? x : world.width + this.margin - travel;

        this.phase += world.dt * 1.6;
        const base = getOrbitY(this.x, world.height * this.lane.altRatio, world.width);
        this.y = base + Math.sin(this.phase + this.offset * Math.PI * 2) * this.wobble;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        if (this.direction < 0) ctx.scale(-1, 1);

        ctx.strokeStyle = this.color;
        ctx.globalAlpha = 0.65;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-this.trail, 0);
        ctx.lineTo(0, 0);
        ctx.stroke();

        ctx.globalAlpha = 0.9;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

export class FactionShip extends Entity {
    constructor(faction, role, layer, speed, startX, width, height) {
        super(startX, 0);
        this.faction = faction;
        this.role = role;
        this.layer = layer;
        this.heading = speed >= 0 ? 1 : -1;
        this.speed = Math.abs(speed) || 60;
        this.phase = rand(0, Math.PI * 2);

        const profile = ROLE_PROFILES[role] || ROLE_PROFILES.fighter;
        this.scale = profile.scale || 1;
        this.wobble = profile.wobble || 4;
        this.trail = profile.trail || 16;
        this.id = `${faction}-${role}-${Math.floor(rand(100, 999))}`;

        const altRatio = LAYER_ALT[layer] || LAYER_ALT.LEO;
        this.baseAlt = height * altRatio;
        this.y = getOrbitY(startX, this.baseAlt, width);
    }
    update(world) {
        this.x += this.heading * this.speed * world.dt;
        if (this.x > world.width + 60) this.x = -60;
        if (this.x < -60) this.x = world.width + 60;

        this.phase += world.dt * 1.05;
        const altRatio = LAYER_ALT[this.layer] || LAYER_ALT.LEO;
        const base = getOrbitY(this.x, world.height * altRatio, world.width);
        this.y = base + Math.sin(this.phase + this.x * 0.01) * this.wobble;
    }
    draw(ctx) {
        const style = FACTION_STYLES[this.faction] || FACTION_STYLES.DEFAULT;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.heading * this.scale, this.scale);

        ctx.fillStyle = style.hull;

        if (this.role === "cruiser" || this.role === "freighter") {
            ctx.beginPath();
            ctx.moveTo(-26, 6);
            ctx.lineTo(28, 2);
            ctx.lineTo(16, -10);
            ctx.lineTo(-18, -12);
            ctx.closePath();
            ctx.fill();
            ctx.fillRect(-8, -16, 18, 6);
        } else if (this.role === "corvette") {
            ctx.beginPath();
            ctx.moveTo(-18, 5);
            ctx.lineTo(18, 0);
            ctx.lineTo(-10, -8);
            ctx.lineTo(-20, -2);
            ctx.closePath();
            ctx.fill();
            ctx.fillRect(-6, -12, 12, 4);
        } else if (this.role === "bomber") {
            ctx.beginPath();
            ctx.moveTo(-14, 6);
            ctx.lineTo(16, 2);
            ctx.lineTo(-2, -10);
            ctx.lineTo(-16, -4);
            ctx.closePath();
            ctx.fill();
            ctx.fillRect(-10, -12, 10, 4);
        } else if (this.role === "interceptor") {
            ctx.beginPath();
            ctx.moveTo(-12, 5);
            ctx.lineTo(14, 0);
            ctx.lineTo(-8, -8);
            ctx.lineTo(-14, -2);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = style.trim;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-2, -6);
            ctx.lineTo(-2, 4);
            ctx.stroke();
        } else if (this.role === "shuttle") {
            ctx.beginPath();
            ctx.moveTo(-10, 4);
            ctx.lineTo(12, 1);
            ctx.lineTo(0, -8);
            ctx.lineTo(-12, -2);
            ctx.closePath();
            ctx.fill();
            ctx.fillRect(-4, -12, 8, 4);
        } else {
            ctx.beginPath();
            ctx.moveTo(-10, 4);
            ctx.lineTo(12, 0);
            ctx.lineTo(-8, -6);
            ctx.lineTo(-12, -2);
            ctx.closePath();
            ctx.fill();
        }

        ctx.strokeStyle = style.trim;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(-8, -2);
        ctx.lineTo(10, -2);
        ctx.stroke();

        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = style.engine;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-this.trail, 1);
        ctx.lineTo(-2, 1);
        ctx.stroke();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = style.engine;
        ctx.beginPath();
        ctx.ellipse(-14, 2, 4.5, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

export class DistantSkirmisher extends Entity {
    constructor(width, height, faction, bounds) {
        super(rand(bounds.xMin, bounds.xMax), rand(bounds.yMin, bounds.yMax));
        this.faction = faction;
        this.bounds = bounds;
        this.size = rand(0.6, 1.2);
        this.speed = rand(6, 14);
        const angle = rand(0, Math.PI * 2);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed * 0.5;
        this.fireTimer = rand(0, 3);
        this.fireInterval = rand(1.8, 4.8);
        this.shotLife = 0;
        this.shotDuration = rand(0.08, 0.18);
        this.shotAngle = 0;
        this.shotLen = rand(8, 16);

        const isSith = faction === "SITH";
        this.dotColor = isSith ? config.colors.battleDotSith : config.colors.battleDotJedi;
        this.laserColor = isSith ? config.colors.battleSith : config.colors.battleJedi;
    }
    update(world) {
        this.x += this.vx * world.dt;
        this.y += this.vy * world.dt;

        if (this.x < this.bounds.xMin || this.x > this.bounds.xMax) {
            this.vx *= -1;
            this.x = clamp(this.x, this.bounds.xMin, this.bounds.xMax);
        }
        if (this.y < this.bounds.yMin || this.y > this.bounds.yMax) {
            this.vy *= -1;
            this.y = clamp(this.y, this.bounds.yMin, this.bounds.yMax);
        }

        if (this.shotLife > 0) {
            this.shotLife = Math.max(0, this.shotLife - world.dt);
        }

        this.fireTimer += world.dt;
        if (this.fireTimer >= this.fireInterval) {
            this.fireTimer = 0;
            this.shotLife = this.shotDuration;
            const heading = this.vx >= 0 ? 0 : Math.PI;
            this.shotAngle = heading + rand(-0.5, 0.5);
            this.shotLen = rand(10, 18);
        }
    }
    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.dotColor;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        if (this.shotLife > 0) {
            const alpha = (this.shotLife / this.shotDuration) * 0.35;
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = this.laserColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(
                this.x + Math.cos(this.shotAngle) * this.shotLen,
                this.y + Math.sin(this.shotAngle) * this.shotLen
            );
            ctx.stroke();
        }

        ctx.restore();
    }
}

export class Ripple extends Entity {
    constructor() {
        super(0, 0);
        this.active = false;
    }
    spawn(x, y, color = config.colors.ripple) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = 2;
        this.maxRadius = rand(18, 34);
        this.opacity = 0.9;
        this.speed = rand(30, 52);
        this.active = true;
    }
    update(world) {
        if (!this.active) return;
        this.radius += this.speed * world.dt;
        this.opacity -= 1.2 * world.dt;
        if (this.radius > this.maxRadius || this.opacity <= 0) {
            this.active = false;
        }
    }
    draw(ctx) {
        if (!this.active) return;
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = Math.max(0, this.opacity);
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
}

export class SpaceShip extends Entity {
    constructor(type, layer, speed, startX, width, height) {
        super(startX, 0);
        this.type = type;
        this.layer = layer;
        this.heading = speed >= 0 ? 1 : -1;
        this.speed = Math.abs(speed) > 6 ? Math.abs(speed) : Math.abs(speed) * 90;
        this.speed = this.speed || config.speeds.satellite[layer];
        this.phase = rand(0, Math.PI * 2);
        this.id = `${layer}-${Math.floor(rand(100, 999))}`;
        this.faction = "NETWORK";

        const altRatio = LAYER_ALT[layer] || LAYER_ALT.LEO;
        this.baseAlt = height * altRatio;
        this.y = getOrbitY(startX, this.baseAlt, width);
    }
    update(world) {
        this.x += this.heading * this.speed * world.dt;
        if (this.x > world.width + 50) this.x = -50;
        if (this.x < -50) this.x = world.width + 50;

        this.phase += world.dt * 1.1;
        const altRatio = LAYER_ALT[this.layer] || LAYER_ALT.LEO;
        const base = getOrbitY(this.x, world.height * altRatio, world.width);
        const wobble = this.layer === "LEO" ? 6 : this.layer === "MEO" ? 4 : 2;
        this.y = base + Math.sin(this.phase) * wobble;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.heading, 1);

        if (this.layer === "GEO") {
            ctx.fillStyle = "#8ba0b2";
            ctx.beginPath();
            ctx.moveTo(-18, 6);
            ctx.lineTo(22, 0);
            ctx.lineTo(-10, -10);
            ctx.lineTo(-20, -4);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = "#4b6376";
            ctx.fillRect(-4, -14, 12, 6);

            ctx.fillStyle = "rgba(140, 220, 255, 0.6)";
            ctx.beginPath();
            ctx.ellipse(-16, 2, 5, 2, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.layer === "MEO") {
            ctx.fillStyle = "#7d94a8";
            ctx.beginPath();
            ctx.moveTo(-14, 4);
            ctx.lineTo(16, 0);
            ctx.lineTo(-8, -6);
            ctx.lineTo(-16, -2);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = "#48657c";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-2, -2);
            ctx.lineTo(8, -2);
            ctx.stroke();

            ctx.fillStyle = "rgba(140, 220, 255, 0.55)";
            ctx.beginPath();
            ctx.ellipse(-12, 1, 4, 2, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = "#9ab2c7";
            ctx.beginPath();
            ctx.moveTo(-10, 5);
            ctx.lineTo(12, 0);
            ctx.lineTo(-10, -5);
            ctx.lineTo(-4, 0);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = "#5b768c";
            ctx.beginPath();
            ctx.moveTo(-2, -6);
            ctx.lineTo(-2, 6);
            ctx.stroke();

            ctx.fillStyle = "rgba(140, 220, 255, 0.6)";
            ctx.beginPath();
            ctx.ellipse(-8, 0, 3.5, 1.5, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

export class StaticTower extends Entity {
    constructor(x, width, height) {
        super(x, getGroundY(x, width, height));
        this.height = rand(48, 78);
        this.width = 10;
        this.phase = rand(0, Math.PI * 2);
        this.faction = "NETWORK";
    }
    update(world) {
        this.y = getGroundY(this.x, world.width, world.height);
        this.phase += world.dt * 4;
    }
    draw(ctx) {
        const topY = this.y - this.height;
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.strokeStyle = config.colors.towerColor;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(-this.width * 0.5, 0);
        ctx.lineTo(0, -this.height);
        ctx.lineTo(this.width * 0.5, 0);
        ctx.stroke();

        for (let step = 8; step < this.height; step += 10) {
            const ratio = 1 - step / this.height;
            ctx.beginPath();
            ctx.moveTo(-this.width * 0.5 * ratio, -step);
            ctx.lineTo(this.width * 0.5 * ratio, -(step - 4));
            ctx.stroke();
        }

        // Side antenna panels
        ctx.fillStyle = "rgba(160, 210, 235, 0.7)";
        ctx.fillRect(-this.width * 0.6 - 3, -this.height * 0.55, 4, 12);
        ctx.fillRect(this.width * 0.6 - 1, -this.height * 0.52, 4, 12);

        ctx.fillStyle = "#d8f2ff";
        const blinkAlpha = 0.45 + Math.sin(this.phase) * 0.4;
        ctx.globalAlpha = Math.max(0.15, blinkAlpha);
        ctx.beginPath();
        ctx.arc(0, -this.height - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.strokeStyle = "rgba(140, 220, 255, 0.35)";
        ctx.beginPath();
        ctx.arc(0, -this.height - 3, 7, Math.PI, Math.PI * 2);
        ctx.stroke();

        // Multi-band sector sweep
        const sweep = 0.35 + Math.abs(Math.sin(this.phase)) * 0.35;
        ctx.globalAlpha = sweep;
        ctx.strokeStyle = "rgba(120, 220, 255, 0.35)";
        ctx.beginPath();
        ctx.arc(0, -this.height - 3, 14, Math.PI * 1.2, Math.PI * 1.8);
        ctx.stroke();
        ctx.globalAlpha = 1;

        ctx.restore();
        this.topY = topY;
    }
}

export class SmartCar extends Entity {
    constructor(x, width, height) {
        super(x, getGroundY(x, width, height));
        this.speed = rand(config.speeds.car * 0.7, config.speeds.car * 1.2) * (Math.random() > 0.5 ? 1 : -1);
        this.color = ["#e67e22", "#3498db", "#f1c40f", "#ecf0f1", "#2ecc71"][Math.floor(rand(0, 5))];
    }
    update(world) {
        this.x += this.speed * world.dt;
        const coastX = world.width * config.geometry.ground.coastlineRatio;
        if (this.speed > 0 && this.x > coastX + 20) this.x = -20;
        if (this.speed < 0 && this.x < -20) this.x = coastX + 20;
        this.y = getGroundY(this.x, world.width, world.height);
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y - 2);
        if (this.speed < 0) ctx.scale(-1, 1);

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(-10, 1);
        ctx.lineTo(12, 1);
        ctx.lineTo(6, -6);
        ctx.lineTo(-6, -6);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#dbe9f6";
        ctx.beginPath();
        ctx.arc(0, -5, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(120, 210, 255, 0.5)";
        ctx.beginPath();
        ctx.arc(-9, 0, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

export class SmartHome extends Entity {
    constructor(x, width, height) {
        super(x, getGroundY(x, width, height) - 12);
        this.hasFiber = Math.random() > 0.2;
        this.phase = rand(0, Math.PI * 2);
        this.blink = rand(0.2, 0.9);
    }
    update(world) {
        this.phase += world.dt * 2.2;
        this.blink += world.dt * 3.8;
        this.y = getGroundY(this.x, world.width, world.height) - 12;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = config.colors.homeColor;
        ctx.beginPath();
        ctx.moveTo(-10, 2);
        ctx.lineTo(12, 2);
        ctx.lineTo(6, -8);
        ctx.lineTo(-6, -8);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#2a4f67";
        ctx.beginPath();
        ctx.arc(0, -4, 3.2, 0, Math.PI * 2);
        ctx.fill();

        if (this.hasFiber) {
            ctx.strokeStyle = "rgba(0, 229, 255, 0.45)";
            ctx.beginPath();
            ctx.moveTo(10, 2);
            ctx.lineTo(16, 6);
            ctx.stroke();
        }

        ctx.fillStyle = `rgba(255,255,180,${0.3 + Math.abs(Math.sin(this.blink)) * 0.6})`;
        ctx.beginPath();
        ctx.arc(-6, 0, 2, 0, Math.PI * 2);
        ctx.arc(6, 0, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

export class MarineRelay extends Entity {
    constructor(x, width, height) {
        super(x, getOceanY(x, width, height) + rand(6, 20));
        this.phase = rand(0, Math.PI * 2);
    }
    update(world) {
        this.phase += world.dt * 2;
        this.y = getOceanY(this.x, world.width, world.height) + 12 + Math.sin(this.phase) * 2.5;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = config.colors.relayColor;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.moveTo(-12, 2);
        ctx.lineTo(12, 2);
        ctx.lineTo(6, -6);
        ctx.lineTo(-6, -6);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.fillStyle = "rgba(140, 220, 255, 0.6)";
        ctx.beginPath();
        ctx.arc(0, -8, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(159, 240, 255, 0.4)";
        ctx.beginPath();
        ctx.arc(0, -8, 8, Math.PI * 1.2, Math.PI * 1.8);
        ctx.stroke();

        ctx.restore();
    }
}

export class CruiseShip extends Entity {
    constructor(x, width, height) {
        super(x, getOceanY(x, width, height));
        this.speed = rand(config.speeds.ship * 0.6, config.speeds.ship * 0.95) * (Math.random() > 0.5 ? 1 : -1);
        this.length = rand(56, 84);
    }
    update(world) {
        this.x += this.speed * world.dt;
        const coastX = world.width * config.geometry.ground.coastlineRatio;
        const margin = this.length * 0.6;
        if (this.speed > 0 && this.x > world.width + margin) this.x = coastX + margin;
        if (this.speed < 0 && this.x < coastX + margin) this.x = world.width + margin;
        this.y = getOceanY(this.x, world.width, world.height) - 3;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        if (this.speed < 0) ctx.scale(-1, 1);
        ctx.fillStyle = "#cdd8e2";
        ctx.beginPath();
        ctx.moveTo(-this.length * 0.55, 2);
        ctx.lineTo(this.length * 0.55, 0);
        ctx.lineTo(this.length * 0.35, -12);
        ctx.lineTo(-this.length * 0.2, -10);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#8ea1b1";
        ctx.fillRect(-this.length * 0.1, -20, this.length * 0.22, 8);
        ctx.fillStyle = "rgba(120, 210, 255, 0.45)";
        ctx.beginPath();
        ctx.ellipse(-this.length * 0.48, 0, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export class NavalShip extends Entity {
    constructor(width, height) {
        const coastX = width * config.geometry.ground.coastlineRatio;
        super(rand(coastX, width), getOceanY(coastX, width, height));
        this.speed = rand(config.speeds.ship * 0.7, config.speeds.ship * 1.2) * (Math.random() > 0.5 ? 1 : -1);
        this.length = rand(44, 70);
        this.depthOffset = rand(10, 70);
    }
    update(world) {
        this.x += this.speed * world.dt;
        const coastX = world.width * config.geometry.ground.coastlineRatio;
        const margin = this.length * 0.6;
        if (this.speed > 0 && this.x > world.width + margin) this.x = coastX + margin;
        if (this.speed < 0 && this.x < coastX + margin) this.x = world.width + margin;
        this.y = getOceanY(this.x, world.width, world.height) + this.depthOffset + Math.sin((world.t * 0.001) + this.x * 0.01) * 5;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        if (this.speed < 0) ctx.scale(-1, 1);
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = config.colors.shipColor;
        ctx.beginPath();
        ctx.moveTo(-this.length * 0.55, 0);
        ctx.lineTo(this.length * 0.5, -2);
        ctx.lineTo(this.length * 0.3, -10);
        ctx.lineTo(-this.length * 0.2, -8);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#d2dde6";
        ctx.fillRect(-6, -16, 14, 6);
        ctx.fillStyle = "rgba(120, 210, 255, 0.45)";
        ctx.beginPath();
        ctx.ellipse(-this.length * 0.5, -1, 5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
    }
}

export class Packet extends Entity {
    constructor() {
        super(0, 0);
        this.active = false;
        this.finished = false;
    }
    spawn(start, end, color, type) {
        this.type = type;
        this.color = color;
        this.active = true;
        this.finished = false;
        this.progress = 0;
        this.speed = config.speeds.packet + rand(-0.2, 0.45);

        this.sx = start.x;
        this.sy = start.y;
        this.ex = end.x;
        this.ey = end.y;

        const mx = (this.sx + this.ex) * 0.5;
        const my = (this.sy + this.ey) * 0.5;
        const dx = this.ex - this.sx;
        const dy = this.ey - this.sy;
        const norm = Math.hypot(dx, dy) || 1;
        const offset = Math.min(28, norm * 0.08);
        this.cx = mx - (dy / norm) * offset;
        this.cy = my + (dx / norm) * offset;

        this.x = this.sx;
        this.y = this.sy;
    }
    update(world) {
        if (!this.active) return;
        this.progress += this.speed * world.dt;
        if (this.progress >= 1) {
            this.progress = 1;
            this.active = false;
            this.finished = true;
        }
        const t = this.progress;
        const inv = 1 - t;
        this.x = inv * inv * this.sx + 2 * inv * t * this.cx + t * t * this.ex;
        this.y = inv * inv * this.sy + 2 * inv * t * this.cy + t * t * this.ey;
    }
    draw(ctx) {
        if (!this.active) return;
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(this.sx, this.sy);
        ctx.quadraticCurveTo(this.cx, this.cy, this.x, this.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
    }
}

export class SubseaHabitat extends Entity {
    constructor(x, width, height) {
        super(x, getOceanY(x, width, height) + rand(35, 80));
        this.phase = rand(0, Math.PI * 2);
    }
    update(world) {
        this.phase += world.dt * 1.3;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = "rgba(20, 50, 70, 0.85)";
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = config.colors.linkSubsea;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.lineTo(6, 0);
        ctx.stroke();

        ctx.fillStyle = `rgba(180,250,255,${0.35 + Math.sin(this.phase) * 0.25})`;
        ctx.beginPath();
        ctx.arc(8, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export class UndergroundFiber extends Entity {
    constructor(width, height) {
        super(0, 0);
        this.reset(width, height);
    }
    reset(width, height) {
        this.startX = rand(0, width * config.geometry.ground.coastlineRatio);
        const direction = Math.random() > 0.5 ? 1 : -1;
        this.endX = this.startX + direction * rand(100, 220);
        this.y1 = getGroundY(this.startX, width, height) + rand(10, 22);
        this.y2 = getGroundY(this.endX, width, height) + rand(10, 22);
        this.life = 0;
        this.maxLife = rand(1.4, 3.0);
        this.color = [config.colors.packetSubsea, config.colors.packetLEO, config.colors.packetMEO][Math.floor(rand(0, 3))];
    }
    update(world) {
        this.life += world.dt;
        if (this.life >= this.maxLife) {
            this.reset(world.width, world.height);
        }
    }
    draw(ctx) {
        const alpha = Math.sin((this.life / this.maxLife) * Math.PI) * 0.55;
        ctx.globalAlpha = Math.max(0.08, alpha);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.startX, this.y1);
        ctx.lineTo(this.endX, this.y2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
}
