import { config, getOrbits, getCurrentLang, translations } from "./config.js";
import { getGroundY, getOceanY, getOrbitY, isOceanX } from "./helpers.js";

export function drawStars(ctx, stars, world) {
    if (!stars || !stars.length) return;
    for (const star of stars) {
        star.update(world);
        star.draw(ctx);
    }
}

function drawLandmarks(ctx, width, height, landmarks) {
    if (!landmarks || !landmarks.length) return;
    ctx.save();
    for (const lm of landmarks) {
        const baseY = lm.baseY ?? height;
        ctx.fillStyle = lm.color || config.colors.landmarkMain;
        ctx.strokeStyle = lm.trim || config.colors.landmarkTrim;
        ctx.lineWidth = 1.2;

        if (lm.type === "SENATE_DOME") {
            ctx.beginPath();
            ctx.ellipse(lm.x, baseY - lm.h, lm.w * 0.5, lm.h * 0.55, 0, Math.PI, 0);
            ctx.fill();
            ctx.fillRect(lm.x - lm.w * 0.5, baseY - lm.h, lm.w, lm.h * 0.35);
            ctx.strokeStyle = lm.trim || config.colors.landmarkTrim;
            ctx.beginPath();
            ctx.moveTo(lm.x - lm.w * 0.32, baseY - lm.h * 0.75);
            ctx.lineTo(lm.x + lm.w * 0.32, baseY - lm.h * 0.75);
            ctx.stroke();
        } else if (lm.type === "TWIN_TEMPLE") {
            const towerW = lm.w * 0.22;
            const gap = lm.w * 0.14;
            const leftX = lm.x - gap - towerW;
            const rightX = lm.x + gap;
            ctx.fillRect(leftX, baseY - lm.h, towerW, lm.h);
            ctx.fillRect(rightX, baseY - lm.h, towerW, lm.h);
            ctx.fillRect(lm.x - lm.w * 0.45, baseY - lm.h * 0.45, lm.w * 0.9, lm.h * 0.18);
            ctx.beginPath();
            ctx.moveTo(leftX + towerW * 0.15, baseY - lm.h);
            ctx.lineTo(leftX + towerW * 0.5, baseY - lm.h - lm.h * 0.18);
            ctx.lineTo(leftX + towerW * 0.85, baseY - lm.h);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(rightX + towerW * 0.15, baseY - lm.h);
            ctx.lineTo(rightX + towerW * 0.5, baseY - lm.h - lm.h * 0.18);
            ctx.lineTo(rightX + towerW * 0.85, baseY - lm.h);
            ctx.closePath();
            ctx.fill();
        } else if (lm.type === "RING_TOWER") {
            ctx.fillRect(lm.x - lm.w * 0.18, baseY - lm.h, lm.w * 0.36, lm.h);
            ctx.strokeStyle = lm.trim || config.colors.landmarkTrim;
            for (let i = 0; i < 3; i++) {
                const y = baseY - lm.h * (0.2 + i * 0.22);
                ctx.beginPath();
                ctx.ellipse(lm.x, y, lm.w * 0.5, lm.w * 0.12, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else if (lm.type === "PLATFORM_CORE") {
            ctx.fillRect(lm.x - lm.w * 0.5, baseY - lm.h * 0.55, lm.w, lm.h * 0.55);
            ctx.fillRect(lm.x - lm.w * 0.35, baseY - lm.h * 0.95, lm.w * 0.7, lm.h * 0.4);
            ctx.strokeStyle = lm.trim || config.colors.landmarkTrim;
            ctx.beginPath();
            ctx.moveTo(lm.x - lm.w * 0.4, baseY - lm.h * 0.7);
            ctx.lineTo(lm.x + lm.w * 0.4, baseY - lm.h * 0.7);
            ctx.stroke();
        } else if (lm.type === "SPIRE_CLUSTER") {
            const count = 4;
            for (let i = 0; i < count; i++) {
                const w = lm.w * (0.18 + i * 0.02);
                const h = lm.h * (0.7 + i * 0.1);
                const x = lm.x - lm.w * 0.4 + i * (lm.w * 0.26);
                ctx.beginPath();
                ctx.moveTo(x, baseY);
                ctx.lineTo(x + w * 0.5, baseY - h);
                ctx.lineTo(x + w, baseY);
                ctx.closePath();
                ctx.fill();
            }
        }

        if (lm.glow) {
            ctx.fillStyle = lm.glow;
            ctx.globalAlpha = 0.6;
            ctx.fillRect(lm.x - lm.w * 0.6, baseY - lm.h, lm.w * 1.2, lm.h * 0.7);
            ctx.globalAlpha = 1;
        }
    }
    ctx.restore();
}

export function drawStaticBackground(ctx, width, height, skylineLayers, groundBlocks, steps = 60, landmarks = null) {
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, config.colors.skyTop);
    sky.addColorStop(1, config.colors.skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    if (skylineLayers) {
        for (const layer of skylineLayers) {
            const baseY = layer.baseY ?? height;
            const windowColor = layer.windowColor || config.colors.cityWindow;
            ctx.fillStyle = layer.color;
            for (const building of layer.buildings) {
                if (building.type === "SPIRE") {
                    ctx.beginPath();
                    ctx.moveTo(building.x, baseY);
                    ctx.lineTo(building.x + building.w * 0.5, baseY - building.h);
                    ctx.lineTo(building.x + building.w, baseY);
                    ctx.closePath();
                    ctx.fill();
                } else if (building.type === "SLANT") {
                    ctx.beginPath();
                    ctx.moveTo(building.x, baseY);
                    ctx.lineTo(building.x, baseY - building.h);
                    ctx.lineTo(building.x + building.w, baseY - building.h * 0.82);
                    ctx.lineTo(building.x + building.w, baseY);
                    ctx.closePath();
                    ctx.fill();
                } else if (building.type === "TIER") {
                    const capH = building.capH || building.h * 0.22;
                    const capW = building.capW || building.w * 0.6;
                    const capX = building.x + (building.w - capW) * 0.5;
                    ctx.fillRect(building.x, baseY - building.h, building.w, building.h);
                    ctx.fillRect(capX, baseY - building.h - capH, capW, capH);
                } else if (building.type === "DOME") {
                    ctx.fillRect(building.x, baseY - building.h, building.w, building.h);
                    ctx.beginPath();
                    ctx.ellipse(building.x + building.w * 0.5, baseY - building.h, building.w * 0.5, building.w * 0.28, 0, Math.PI, 0);
                    ctx.fill();
                } else if (building.type === "PLATFORM") {
                    const deckH = building.deckH || Math.max(4, building.h * 0.08);
                    ctx.fillRect(building.x, baseY - building.h, building.w, building.h);
                    ctx.fillRect(building.x - building.w * 0.08, baseY - building.h - deckH, building.w * 1.16, deckH);
                } else {
                    ctx.fillRect(building.x, baseY - building.h, building.w, building.h);
                }

                if (building.windowRows) {
                    ctx.save();
                    ctx.fillStyle = windowColor;
                    ctx.globalAlpha = 0.5;
                    const bandInset = building.bandInset ?? 0.12;
                    const bandW = building.w * (1 - bandInset * 2);
                    const bandX = building.x + building.w * bandInset;
                    const bandH = Math.max(1, building.h * 0.02);
                    for (let row = 1; row <= building.windowRows; row++) {
                        const y = baseY - (building.h * (row / (building.windowRows + 1)));
                        ctx.fillRect(bandX, y, bandW, bandH);
                    }
                    ctx.restore();
                }
            }

            if (layer.bands) {
                ctx.save();
                ctx.strokeStyle = layer.bandColor || config.colors.cityBand;
                ctx.lineWidth = 1;
                ctx.setLineDash([10, 14]);
                for (const band of layer.bands) {
                    const y = baseY - band.offset;
                    ctx.globalAlpha = band.alpha;
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(width, y);
                    ctx.stroke();
                }
                ctx.setLineDash([]);
                ctx.restore();
            }
        }
    }

    drawLandmarks(ctx, width, height, landmarks);

    const cityGlow = ctx.createLinearGradient(0, height * 0.2, 0, height);
    cityGlow.addColorStop(0, "rgba(255, 200, 150, 0)");
    cityGlow.addColorStop(0.7, "rgba(255, 190, 120, 0.08)");
    cityGlow.addColorStop(1, config.colors.cityGlow);
    ctx.fillStyle = cityGlow;
    ctx.fillRect(0, 0, width, height);

    const coastX = width * config.geometry.ground.coastlineRatio;
    const stepSize = width / Math.max(steps, 1);

    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= coastX; x += stepSize) {
        ctx.lineTo(x, getGroundY(x, width, height));
    }
    ctx.lineTo(coastX, getGroundY(coastX, width, height));
    ctx.lineTo(coastX, height);
    ctx.closePath();
    const landGradient = ctx.createLinearGradient(0, height - 220, 0, height);
    landGradient.addColorStop(0, "rgba(32, 55, 74, 0.96)");
    landGradient.addColorStop(1, "rgba(18, 30, 40, 0.98)");
    ctx.fillStyle = landGradient;
    ctx.fill();

    // Subsurface depth shading (land)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= coastX; x += stepSize) {
        ctx.lineTo(x, getGroundY(x, width, height));
    }
    ctx.lineTo(coastX, getGroundY(coastX, width, height));
    ctx.lineTo(coastX, height);
    ctx.closePath();
    ctx.clip();

    const soilGradient = ctx.createLinearGradient(0, height - 200, 0, height);
    soilGradient.addColorStop(0, "rgba(5, 10, 16, 0)");
    soilGradient.addColorStop(1, "rgba(5, 10, 16, 0.78)");
    ctx.fillStyle = soilGradient;
    ctx.fillRect(0, height - 200, coastX, 200);

    // Layered geology bands (spacing increases with depth)
    const layers = [
        { offset: 12, color: "rgba(20, 38, 54, 0.55)" },
        { offset: 30, color: "rgba(16, 30, 44, 0.6)" },
        { offset: 54, color: "rgba(12, 24, 36, 0.65)" },
        { offset: 84, color: "rgba(10, 20, 30, 0.72)" },
    ];
    let prevOffset = 0;
    for (const layer of layers) {
        ctx.beginPath();
        for (let x = 0; x <= coastX; x += stepSize) {
            ctx.lineTo(x, getGroundY(x, width, height) + prevOffset);
        }
        for (let x = coastX; x >= 0; x -= stepSize) {
            ctx.lineTo(x, getGroundY(x, width, height) + layer.offset);
        }
        ctx.closePath();
        ctx.fillStyle = layer.color;
        ctx.fill();

        ctx.strokeStyle = "rgba(30, 60, 80, 0.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x <= coastX; x += stepSize) {
            ctx.lineTo(x, getGroundY(x, width, height) + layer.offset);
        }
        ctx.stroke();

        prevOffset = layer.offset;
    }
    ctx.restore();

    if (groundBlocks) {
        for (const block of groundBlocks) {
            const x = stepSize * block.i;
            if (x > coastX) continue;
            const y = getGroundY(x, width, height);
            ctx.fillStyle = "rgba(46, 66, 84, 0.85)";
            ctx.fillRect(x, y, stepSize + 1, block.h);
        }
    }

    ctx.strokeStyle = config.colors.groundLine;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let x = 0; x <= coastX; x += stepSize) {
        ctx.lineTo(x, getGroundY(x, width, height));
    }
    ctx.stroke();

    // Shoreline divider (land/sea boundary)
    const shoreTop = getOceanY(coastX, width, height);
    ctx.save();
    ctx.strokeStyle = "rgba(210, 200, 160, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(coastX + 0.5, shoreTop - 4);
    ctx.lineTo(coastX + 0.5, height);
    ctx.stroke();
    ctx.restore();
}

export function drawOceanVolume(ctx, width, height, caustics, steps = 54) {
    const coastX = width * config.geometry.ground.coastlineRatio;
    const stepSize = (width - coastX) / Math.max(steps, 1);

    ctx.beginPath();
    ctx.moveTo(coastX, height);
    ctx.lineTo(coastX, getOceanY(coastX, width, height));
    for (let x = coastX; x <= width; x += stepSize) {
        ctx.lineTo(x, getOceanY(x, width, height));
    }
    ctx.lineTo(width, height);
    ctx.closePath();

    const oceanGradient = ctx.createLinearGradient(0, height * 0.45, 0, height);
    oceanGradient.addColorStop(0, config.colors.oceanTop);
    oceanGradient.addColorStop(1, config.colors.oceanBottom);
    ctx.fillStyle = oceanGradient;
    ctx.fill();

    // Deep water shading for depth perception
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(coastX, height);
    ctx.lineTo(coastX, getOceanY(coastX, width, height));
    for (let x = coastX; x <= width; x += stepSize) {
        ctx.lineTo(x, getOceanY(x, width, height));
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.clip();

    const deepGradient = ctx.createLinearGradient(0, height * 0.6, 0, height);
    deepGradient.addColorStop(0, "rgba(2, 12, 26, 0)");
    deepGradient.addColorStop(1, "rgba(2, 10, 22, 0.65)");
    ctx.fillStyle = deepGradient;
    ctx.fillRect(coastX, height * 0.6, width - coastX, height * 0.4);

    // Slope band near coastline (seabed drop-off hint)
    const shoreY = getOceanY(coastX, width, height);
    const slopeGradient = ctx.createLinearGradient(coastX, 0, coastX + 120, 0);
    slopeGradient.addColorStop(0, "rgba(12, 30, 50, 0.28)");
    slopeGradient.addColorStop(1, "rgba(12, 30, 50, 0)");
    ctx.fillStyle = slopeGradient;
    ctx.fillRect(coastX, shoreY - 4, 120, height - shoreY + 4);

    // Faint depth lines
    ctx.strokeStyle = "rgba(80, 120, 160, 0.12)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
        const y = height - 40 - i * 30;
        ctx.beginPath();
        ctx.moveTo(coastX + 10, y);
        ctx.lineTo(width - 10, y);
        ctx.stroke();
    }
    ctx.restore();

    // Surface line for visual separation
    ctx.save();
    ctx.strokeStyle = "rgba(120, 200, 255, 0.35)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(coastX, getOceanY(coastX, width, height));
    for (let x = coastX; x <= width; x += stepSize) {
        ctx.lineTo(x, getOceanY(x, width, height));
    }
    ctx.stroke();

    // Soft shoreline foam band
    const shoreYLine = shoreY;
    const shoreGradient = ctx.createLinearGradient(coastX, 0, coastX + 28, 0);
    shoreGradient.addColorStop(0, "rgba(240, 220, 160, 0.22)");
    shoreGradient.addColorStop(1, "rgba(240, 220, 160, 0)");
    ctx.fillStyle = shoreGradient;
    ctx.fillRect(coastX, shoreYLine - 6, 28, height - shoreYLine + 6);
    ctx.restore();

    if (!caustics || !caustics.length) return;
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = "rgba(255,255,255,0.045)";
    for (const c of caustics) {
        if (!isOceanX(c.x, width)) continue;
        const y = getOceanY(c.x, width, height);
        ctx.fillRect(c.x, y, c.w, height - y);
    }
    ctx.globalCompositeOperation = "source-over";
}

export function drawOrbitLines(ctx, width, height, time, stepSize = 16) {
    const orbitRegions = [];
    const lang = getCurrentLang();
    const orbitData = getOrbits(lang);

    ctx.save();
    for (const orbit of orbitData) {
        const baseAlt = height * orbit.altRatio;
        let labelY = baseAlt;

        ctx.beginPath();
        for (let x = 0; x <= width; x += stepSize) {
            const y = getOrbitY(x, baseAlt, width);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            if (x >= 42 && x <= 60) labelY = y;
        }

        ctx.strokeStyle = orbit.color;
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 12]);
        ctx.lineDashOffset = -time * 0.028;
        ctx.globalAlpha = 0.55;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        const label = `${orbit.name} LAYER`;
        ctx.font = config.ui.fontMono;
        const textWidth = ctx.measureText(label).width;
        orbitRegions.push({
            x: 28,
            y: labelY - 15,
            w: textWidth + 18,
            h: 24,
            data: orbit,
        });
    }
    ctx.restore();

    return orbitRegions;
}

export function drawOrbitUI(ctx, width, height, orbitRegions, mouseX, mouseY, selectedOrbitId) {
    if (!orbitRegions || orbitRegions.length === 0) return;

    ctx.save();
    const lang = getCurrentLang();
    const status = translations[lang]?.systemStatus || translations.en.systemStatus;

    ctx.font = config.ui.fontMono;
    ctx.fillStyle = "rgba(210, 240, 255, 0.7)";
    ctx.fillText(status, 24, 28);

    for (const region of orbitRegions) {
        const orbit = region.data;
        const isHover = mouseX >= region.x && mouseX <= region.x + region.w + 50 && mouseY >= region.y - 10 && mouseY <= region.y + region.h + 12;
        const isSelected = selectedOrbitId === orbit.id;

        ctx.fillStyle = isHover ? orbit.color : "rgba(8, 19, 31, 0.82)";
        ctx.strokeStyle = orbit.color;
        ctx.lineWidth = isSelected ? 2 : 1;

        ctx.beginPath();
        ctx.moveTo(region.x, region.y);
        ctx.lineTo(region.x + region.w - 10, region.y);
        ctx.lineTo(region.x + region.w, region.y + 10);
        ctx.lineTo(region.x + region.w, region.y + region.h);
        ctx.lineTo(region.x + 10, region.y + region.h);
        ctx.lineTo(region.x, region.y + region.h - 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isHover ? "#041016" : orbit.color;
        ctx.fillText(`${orbit.name} LAYER`, region.x + 8, region.y + 16);

        if (!isHover && !isSelected) continue;

        const panelCfg = config.ui.panel;
        const panelW = isSelected ? panelCfg.selectedWidth : panelCfg.hoverWidth;
        const panelH = isSelected ? panelCfg.selectedHeight : panelCfg.hoverHeight;
        const panelX = Math.min(region.x + region.w + 22, width - panelW - 16);
        const panelY = Math.max(20, Math.min(region.y - 10, height - panelH - 20));

        ctx.fillStyle = "rgba(4, 12, 20, 0.95)";
        ctx.strokeStyle = orbit.color;
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.fillRect(panelX, panelY, panelW, panelH);
        ctx.strokeRect(panelX, panelY, panelW, panelH);

        if (isSelected) {
            ctx.fillStyle = orbit.color;
            ctx.fillRect(panelX, panelY, panelW, 30);
            ctx.fillStyle = "#031017";
            ctx.font = "700 13px 'Courier New', monospace";
            ctx.fillText(orbit.full, panelX + 10, panelY + 20);

            ctx.font = config.ui.fontBody;
            ctx.fillStyle = "rgba(220, 238, 255, 0.9)";
            ctx.fillText(`Nominal latency: ${orbit.latencyMs} ms`, panelX + 10, panelY + 50);
            ctx.fillText(`Coverage radius: ~${orbit.coverageKm} km`, panelX + 10, panelY + 68);
            ctx.fillText("Operational mode: adaptive routing", panelX + 10, panelY + 86);
            ctx.fillText("Payload profile: telemetry + transport", panelX + 10, panelY + 104);
            ctx.fillText("Health: nominal / no major alarms", panelX + 10, panelY + 122);

            ctx.fillStyle = orbit.color;
            ctx.fillText(orbit.info, panelX + 10, panelY + 146);
        } else {
            ctx.fillStyle = orbit.color;
            ctx.font = "700 12px 'Courier New', monospace";
            ctx.fillText(orbit.full, panelX + 10, panelY + 18);
            ctx.fillStyle = "rgba(214, 232, 245, 0.85)";
            ctx.font = config.ui.fontBody;
            ctx.fillText(orbit.info, panelX + 10, panelY + 38);
        }
    }

    ctx.restore();
}
