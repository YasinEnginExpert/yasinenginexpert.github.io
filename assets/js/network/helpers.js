import { config } from "./config.js";

export const rand = (min, max) => Math.random() * (max - min) + min;
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const lerp = (start, end, t) => start + (end - start) * t;

export function isOceanX(x, width) {
    return x > width * config.geometry.ground.coastlineRatio;
}

export function getGroundY(x, width, height) {
    const g = config.geometry.ground;
    const midX = width * 0.5;
    const baseY = height - g.baseOffset;
    const denom = Math.max(width * g.curveWidthFactor, 1);
    const norm = clamp((x - midX) / denom, -1.25, 1.25);
    const curve = norm * norm * g.curveHeight;
    return baseY - g.curveHeight + curve;
}

export function getOceanY(x, width, height) {
    return getGroundY(x, width, height) + config.geometry.ocean.surfaceOffset;
}

export function getOrbitY(x, baseAltitude, width) {
    const orbitCfg = config.geometry.orbit;
    const centerX = width * 0.5;
    const maxDistance = Math.max(width * orbitCfg.curveWidthFactor, 1);
    const normalized = clamp(Math.abs(x - centerX) / maxDistance, 0, 1.5);
    return baseAltitude + normalized * normalized * orbitCfg.curveDepth;
}

export function computeLinkAlpha(distance, maxDistance, min = 0.15, max = 0.72) {
    if (maxDistance <= 0) return min;
    const ratio = clamp(1 - distance / maxDistance, 0, 1);
    return lerp(min, max, ratio);
}

export function orbitCoverageWidth(layer, width) {
    if (layer === "GEO") return width * 0.82;
    if (layer === "MEO") return width * 0.52;
    return width * 0.24;
}

export function packetColorByLayer(layer, colors) {
    if (layer === "GEO") return colors.packetGEO;
    if (layer === "MEO") return colors.packetMEO;
    if (layer === "LEO") return colors.packetLEO;
    return colors.packetSubsea;
}

