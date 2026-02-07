function deepFreeze(obj) {
    Object.freeze(obj);
    Object.getOwnPropertyNames(obj).forEach((prop) => {
        const value = obj[prop];
        if (value && typeof value === "object" && !Object.isFrozen(value)) {
            deepFreeze(value);
        }
    });
    return obj;
}

export const config = deepFreeze({
    colors: {
        skyTop: "#030711",
        skyBottom: "#102235",
        text: "rgba(230, 240, 255, 0.85)",
        skylineNear: "#1a2f42",
        skylineMid: "#152838",
        skylineFar: "#10212f",
        cityGlow: "rgba(255, 190, 120, 0.12)",
        cityBand: "rgba(255, 200, 150, 0.16)",
        cityWindow: "rgba(255, 210, 160, 0.22)",
        trafficWarm: "rgba(255, 200, 140, 0.85)",
        trafficCool: "rgba(140, 220, 255, 0.8)",
        battleSith: "rgba(255, 90, 90, 0.7)",
        battleJedi: "rgba(120, 210, 255, 0.7)",
        battleDotSith: "rgba(255, 160, 160, 0.5)",
        battleDotJedi: "rgba(170, 230, 255, 0.5)",
        landmarkMain: "rgba(34, 56, 78, 0.95)",
        landmarkTrim: "rgba(140, 210, 255, 0.55)",
        landmarkGlow: "rgba(255, 210, 160, 0.18)",
        groundFill: "#1b2a35",
        groundLine: "#2f495e",
        oceanTop: "rgba(16, 90, 130, 0.42)",
        oceanBottom: "rgba(4, 16, 36, 0.9)",
        meshLink: "rgba(120, 220, 255, 0.35)",
        carLink: "rgba(255, 190, 70, 0.45)",
        towerColor: "#8aa9bf",
        relayColor: "#7ee3ff",
        homeColor: "#c5d6e8",
        shipColor: "#6f879b",
        hubColor: "#9bd7ff",
        hubGlow: "rgba(120, 210, 255, 0.5)",
        cellColor: "#f59e0b",
        dishColor: "#cfe6f8",
        outpostColor: "rgba(30, 55, 75, 0.9)",
        telecomCore: "rgba(24, 40, 58, 0.95)",
        telecomTrim: "rgba(120, 200, 255, 0.65)",
        darkFiber: "rgba(30, 80, 110, 0.4)",
        darkFiberGlow: "rgba(120, 200, 255, 0.18)",
        packetSubsea: "#00e5ff",
        packetLEO: "#f59e0b",
        packetMEO: "#0ea5e9",
        packetGEO: "#d946ef",
        linkLEO: "#f59e0b",
        linkMEO: "#0ea5e9",
        linkGEO: "#d946ef",
        linkSubsea: "#00e5ff",
        ripple: "rgba(135, 230, 255, 0.28)",
    },
    counts: {
        satellites: { LEO: 12, MEO: 6, GEO: 3 },
        towers: 6,
        homes: 10,
        cars: 6,
        ships: 3,
        marineRelays: 4,
        subseaHabitats: 4,
        cities: 3,
        fibers: 8,
        edgeHubs: 4,
        microwaveRelays: 5,
        smallCells: 10,
        outposts: 4,
        telecomBuildings: 5,
        darkFibers: 7,
        skyTraffic: 16,
        factionShips: {
            SITH: 3,
            JEDI: 3,
            SEPARATIST: 4,
            BOUNTY: 3,
            TRADER: 4,
            REBEL: 3,
        },
        skirmishers: 18,
    },
    speeds: {
        satellite: { LEO: 140, MEO: 70, GEO: 22 },
        station: 12,
        ship: 18,
        car: 32,
        packet: 1.25,
        skyTraffic: 46,
        factionShip: { LEO: 120, MEO: 62, GEO: 24 },
    },
    geometry: {
        ground: {
            baseOffset: 46,
            curveHeight: 120,
            curveWidthFactor: 0.62,
            coastlineRatio: 0.58,
        },
        ocean: { surfaceOffset: 15 },
        orbit: { curveDepth: 42, curveWidthFactor: 0.63 },
    },
    ui: {
        fontMono: "600 12px 'Courier New', monospace",
        fontBody: "11px Inter, sans-serif",
        panel: { hoverWidth: 300, hoverHeight: 56, selectedWidth: 460, selectedHeight: 190 },
    },
});

export const QUALITY = deepFreeze({
    HIGH: { stars: 190, groundSteps: 96, oceanSteps: 84, orbitStep: 10, caustics: 12, skylineScale: 1.2 },
    BALANCED: { stars: 130, groundSteps: 68, oceanSteps: 54, orbitStep: 16, caustics: 8, skylineScale: 1.0 },
    LOW: { stars: 80, groundSteps: 46, oceanSteps: 34, orbitStep: 24, caustics: 4, skylineScale: 0.8 },
});

export const runtime = {
    quality: "BALANCED",
};

export const translations = deepFreeze({
    en: {
        systemStatus: "GLOBAL NETWORK TELEMETRY: ONLINE",
        orbits: {
            geo: {
                name: "GEO",
                full: "GEOSTATIONARY BACKBONE",
                info: "Latency ~600 ms | Broadcast, weather payloads and backhaul coverage",
            },
            meo: {
                name: "MEO",
                full: "MIDDLE EARTH NETWORK",
                info: "Latency ~150 ms | Navigation timing and regional transit paths",
            },
            leo: {
                name: "LEO",
                full: "LOW EARTH CONSTELLATION",
                info: "Latency <30 ms | High-throughput broadband and edge links",
            },
            subsea: {
                name: "SUBSEA",
                full: "SUBSEA FIBER CORE",
                info: "Latency ~65 ms / 10,000km | Intercontinental optical backbone",
            },
        },
    },
    tr: {
        systemStatus: "KURESEL AG TELEMETRISI: AKTIF",
        orbits: {
            geo: {
                name: "GEO",
                full: "JEOSTASYONER OMURGA",
                info: "Gecikme ~600 ms | Yayin, hava durumu yukleri ve genis kapsama",
            },
            meo: {
                name: "MEO",
                full: "ORTA YORUNGE AGI",
                info: "Gecikme ~150 ms | Navigasyon zamanlamasi ve bolgesel transit",
            },
            leo: {
                name: "LEO",
                full: "DUSUK YORUNGE TAKIMYILDIZI",
                info: "Gecikme <30 ms | Yuksek hizli genisbant ve edge baglantilari",
            },
            subsea: {
                name: "SUBSEA",
                full: "DENIZ ALTI FIBER CEKIRDEK",
                info: "Gecikme ~65 ms / 10.000km | Kitalararasi optik omurga",
            },
        },
    },
});

export const SUPPORTED_LANGS = ["en", "tr"];
export const DEFAULT_LANG = "en";

let currentLang = DEFAULT_LANG;

export function readLang() {
    const value = localStorage.getItem("selectedLanguage");
    return SUPPORTED_LANGS.includes(value) ? value : DEFAULT_LANG;
}

export function setLang(lang) {
    const safe = SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
    currentLang = safe;
    localStorage.setItem("selectedLanguage", safe);
}

export function updateLanguage() {
    currentLang = readLang();
}

export function getCurrentLang() {
    return currentLang;
}

export function getOrbits(lang) {
    const t = translations[lang]?.orbits || translations[DEFAULT_LANG].orbits;
    return [
        {
            id: "GEO",
            name: t.geo.name,
            full: t.geo.full,
            info: t.geo.info,
            altRatio: 0.16,
            color: config.colors.linkGEO,
            latencyMs: 600,
            coverageKm: 9000,
        },
        {
            id: "MEO",
            name: t.meo.name,
            full: t.meo.full,
            info: t.meo.info,
            altRatio: 0.36,
            color: config.colors.linkMEO,
            latencyMs: 150,
            coverageKm: 4500,
        },
        {
            id: "LEO",
            name: t.leo.name,
            full: t.leo.full,
            info: t.leo.info,
            altRatio: 0.56,
            color: config.colors.linkLEO,
            latencyMs: 30,
            coverageKm: 1700,
        },
        {
            id: "SUBSEA",
            name: t.subsea.name,
            full: t.subsea.full,
            info: t.subsea.info,
            altRatio: 0.9,
            color: config.colors.linkSubsea,
            latencyMs: 65,
            coverageKm: 10000,
        },
    ];
}
