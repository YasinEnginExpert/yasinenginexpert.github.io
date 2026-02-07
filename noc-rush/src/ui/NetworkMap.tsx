import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../engine/session';
import { Device, Link, PacketAnimation } from '../engine/types';

interface NetworkMapProps {
    activeDevice?: string;
    onDeviceClick?: (deviceId: string) => void;
}

// Realistic Cisco-style Router SVG
const RouterIcon = ({ isActive }: { isActive: boolean }) => (
    <svg viewBox="0 0 100 60" className="w-24 h-14">
        {/* Router body - realistic 3D look */}
        <defs>
            <linearGradient id="routerBody" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={isActive ? "#166534" : "#374151"} />
                <stop offset="50%" stopColor={isActive ? "#15803d" : "#1f2937"} />
                <stop offset="100%" stopColor={isActive ? "#14532d" : "#111827"} />
            </linearGradient>
            <linearGradient id="routerTop" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={isActive ? "#22c55e" : "#4b5563"} />
                <stop offset="100%" stopColor={isActive ? "#16a34a" : "#374151"} />
            </linearGradient>
        </defs>

        {/* Main chassis */}
        <rect x="5" y="15" width="90" height="40" rx="3" fill="url(#routerBody)" stroke={isActive ? "#22c55e" : "#6b7280"} strokeWidth="1.5" />

        {/* Top panel (3D effect) */}
        <polygon points="5,15 15,5 85,5 95,15" fill="url(#routerTop)" stroke={isActive ? "#22c55e" : "#6b7280"} strokeWidth="1" />

        {/* Right side (3D effect) */}
        <polygon points="95,15 95,55 85,45 85,5" fill={isActive ? "#14532d" : "#111827"} stroke={isActive ? "#22c55e" : "#6b7280"} strokeWidth="1" />

        {/* Ventilation slots */}
        {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <rect key={i} x={12 + i * 10} y="25" width="6" height="2" fill={isActive ? "#052e16" : "#030712"} rx="0.5" />
        ))}
        {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <rect key={`b${i}`} x={12 + i * 10} y="30" width="6" height="2" fill={isActive ? "#052e16" : "#030712"} rx="0.5" />
        ))}

        {/* LED indicators */}
        <circle cx="15" cy="45" r="2.5" fill={isActive ? "#4ade80" : "#6b7280"}>
            {isActive && <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite" />}
        </circle>
        <circle cx="25" cy="45" r="2.5" fill="#fbbf24">
            <animate attributeName="opacity" values="1;0.3;1" dur="0.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="35" cy="45" r="2.5" fill="#22c55e" />

        {/* Ethernet ports */}
        {[0, 1, 2, 3].map(i => (
            <rect key={`port${i}`} x={55 + i * 10} y="42" width="7" height="10" fill="#1e293b" stroke="#475569" strokeWidth="0.5" rx="1" />
        ))}

        {/* Console port */}
        <rect x="45" y="44" width="6" height="6" fill="#3b82f6" stroke="#60a5fa" strokeWidth="0.5" rx="1" />

        {/* Cisco logo area */}
        <text x="50" y="22" textAnchor="middle" fontSize="6" fill={isActive ? "#86efac" : "#9ca3af"} fontFamily="Arial" fontWeight="bold">CISCO</text>
    </svg>
);

// Realistic Cisco-style Switch SVG
const SwitchIcon = ({ isActive }: { isActive: boolean }) => (
    <svg viewBox="0 0 120 50" className="w-28 h-12">
        <defs>
            <linearGradient id="switchBody" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={isActive ? "#1e40af" : "#374151"} />
                <stop offset="50%" stopColor={isActive ? "#1e3a8a" : "#1f2937"} />
                <stop offset="100%" stopColor={isActive ? "#172554" : "#111827"} />
            </linearGradient>
        </defs>

        {/* Main chassis - wide and low like real switch */}
        <rect x="2" y="8" width="116" height="35" rx="2" fill="url(#switchBody)" stroke={isActive ? "#3b82f6" : "#6b7280"} strokeWidth="1.5" />

        {/* Top edge highlight */}
        <rect x="2" y="8" width="116" height="4" rx="2" fill={isActive ? "#2563eb" : "#4b5563"} />

        {/* 24 Port indicators (2 rows of 12) */}
        {[...Array(12)].map((_, i) => (
            <g key={`port1-${i}`}>
                <rect x={8 + i * 9} y="16" width="6" height="5" fill="#0f172a" stroke="#334155" strokeWidth="0.3" rx="0.5" />
                <circle cx={11 + i * 9} y="15" r="1" fill={(i % 4 === 0 || i % 7 === 0) ? "#6b7280" : "#22c55e"}>
                    {(i % 3 === 0) && <animate attributeName="opacity" values="1;0.3;1" dur="0.35s" repeatCount="indefinite" />}
                </circle>
            </g>
        ))}
        {[...Array(12)].map((_, i) => (
            <g key={`port2-${i}`}>
                <rect x={8 + i * 9} y="24" width="6" height="5" fill="#0f172a" stroke="#334155" strokeWidth="0.3" rx="0.5" />
                <circle cx={11 + i * 9} y="23" r="1" fill={(i % 5 === 0 || i % 8 === 0) ? "#6b7280" : "#22c55e"}>
                    {(i % 4 === 0) && <animate attributeName="opacity" values="1;0.3;1" dur="0.5s" repeatCount="indefinite" />}
                </circle>
            </g>
        ))}

        {/* SFP Uplink ports */}
        <rect x="100" y="16" width="12" height="12" fill="#1e293b" stroke="#475569" strokeWidth="0.5" rx="1" />
        <text x="106" y="24" textAnchor="middle" fontSize="4" fill="#94a3b8">SFP+</text>

        {/* Status LEDs */}
        <circle cx="8" cy="38" r="2" fill={isActive ? "#22c55e" : "#6b7280"}>
            {isActive && <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite" />}
        </circle>
        <circle cx="16" cy="38" r="2" fill="#f59e0b" />

        {/* Model label */}
        <text x="60" y="40" textAnchor="middle" fontSize="5" fill={isActive ? "#93c5fd" : "#9ca3af"} fontFamily="Arial">Catalyst 3560-24PS</text>
    </svg>
);



const PacketPulse = ({ pathData, durationMs }: { pathData: string, durationMs?: number, key?: string }) => (
    <circle r="4" fill="#60a5fa" className="filter drop-shadow-[0_0_8px_#3b82f6] z-50">
        <animateMotion
            dur={`${Math.max(250, durationMs ?? 800) / 1000}s`}
            repeatCount="1"
            path={pathData}
            fill="remove"
            rotate="auto" // Orients the packet along the path
        />
        <animate
            attributeName="r"
            values="4;6;4"
            dur="0.5s"
            repeatCount="indefinite"
        />
        <animate
            attributeName="opacity"
            values="1;0.7;1"
            dur="0.5s"
            repeatCount="indefinite"
        />
    </circle>
);

export const NetworkMap = ({ activeDevice, onDeviceClick }: NetworkMapProps) => {
    const { topology, packetAnims, faults } = useGameStore();
    const { devices, links } = topology;
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [layout, setLayout] = useState<Record<string, { x: number; y: number }>>({});
    const activeFaults = faults.filter(f => !f.resolved);
    const faultDeviceIds = new Set(activeFaults.map(f => f.deviceId));

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const measure = () => {
            setSize({ width: el.clientWidth, height: el.clientHeight });
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    useEffect(() => {
        const ids = Object.keys(devices as Record<string, Device>);
        if (!ids.length || size.width === 0 || size.height === 0) return;

        const root = activeDevice && (devices as Record<string, Device>)[activeDevice] ? activeDevice : ids[0];
        const graph = new Map<string, string[]>();
        (links as Link[]).forEach(l => {
            if (!graph.has(l.source)) graph.set(l.source, []);
            if (!graph.has(l.target)) graph.set(l.target, []);
            graph.get(l.source)!.push(l.target);
            graph.get(l.target)!.push(l.source);
        });

        const levels = new Map<string, number>();
        const queue: string[] = [root];
        levels.set(root, 0);
        while (queue.length) {
            const node = queue.shift()!;
            const depth = levels.get(node) ?? 0;
            (graph.get(node) ?? []).forEach(n => {
                if (!levels.has(n)) {
                    levels.set(n, depth + 1);
                    queue.push(n);
                }
            });
        }

        let maxDepth = 0;
        levels.forEach(v => { if (v > maxDepth) maxDepth = v; });
        const orphanDepth = maxDepth + 1;
        ids.forEach(id => { if (!levels.has(id)) levels.set(id, orphanDepth); });
        maxDepth = Math.max(maxDepth, orphanDepth);

        const margin = 90;
        const usableWidth = Math.max(200, size.width - margin * 2);
        const usableHeight = Math.max(200, size.height - margin * 2);
        const levelCount = Math.max(1, maxDepth + 1);

        const byDepth: string[][] = Array.from({ length: levelCount }, () => []);
        ids.forEach(id => {
            const d = levels.get(id) ?? 0;
            byDepth[Math.min(d, levelCount - 1)].push(id);
        });

        const nextLayout: Record<string, { x: number; y: number }> = {};
        byDepth.forEach((group, depth) => {
            const y = levelCount === 1
                ? margin + usableHeight / 2
                : margin + (usableHeight * depth) / (levelCount - 1);
            group.forEach((id, i) => {
                const x = group.length === 1
                    ? margin + usableWidth / 2
                    : margin + (usableWidth * (i + 1)) / (group.length + 1);
                nextLayout[id] = { x, y };
            });
        });

        setLayout(nextLayout);
    }, [devices, links, size.width, size.height, activeDevice]);

    return (
        <div ref={containerRef} className="relative w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 via-black to-black overflow-hidden select-none">
            {/* Grid background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#4ade80 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <linearGradient id="cableGradient" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity="0" />
                        <stop offset="50%" stopColor="#22c55e" stopOpacity="1" />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {(links as Link[]).map((link, i) => {
                    const srcDev = (devices as Record<string, Device>)[link.source];
                    const dstDev = (devices as Record<string, Device>)[link.target];
                    if (!srcDev || !dstDev) return null;

                    const srcPos = layout[link.source] ?? { x: srcDev.x, y: srcDev.y };
                    const dstPos = layout[link.target] ?? { x: dstDev.x, y: dstDev.y };

                    const srcInt = srcDev.interfaces[link.sourceInt];
                    const dstInt = dstDev.interfaces[link.targetInt];
                    const isDown = (srcInt?.status !== 'up') || (dstInt?.status !== 'up') || link.status === 'down';
                    const isLinkActive = activeDevice === link.source || activeDevice === link.target;

                    // Calculate Bezier control points for a smooth curve
                    // We'll curve slightly based on the distance to avoid straight overlaps
                    const dx = dstPos.x - srcPos.x;
                    const dy = dstPos.y - srcPos.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);


                    // Curvature based on index to separate parallel links if any (simple implementation for now)
                    // For a cleaner look, we add a perpendicular offset for the control point
                    const curveFactor = 0.2; // 20% of distance
                    const cx = (srcPos.x + dstPos.x) / 2 - dy * curveFactor;
                    const cy = (srcPos.y + dstPos.y) / 2 + dx * curveFactor;

                    const pathData = `M${srcPos.x},${srcPos.y} Q${cx},${cy} ${dstPos.x},${dstPos.y}`;

                    return (
                        <g key={i}>
                            {/* Main cable path */}
                            <path
                                d={pathData}
                                stroke={isDown ? "#ef4444" : (isLinkActive ? "#22c55e" : "#374151")}
                                strokeWidth={isLinkActive ? 3 : 2}
                                fill="none"
                                strokeDasharray={isDown ? "5,5" : "none"}
                                className={`transition-all duration-500 ${isLinkActive ? 'filter drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'opacity-40'}`}
                            />

                            {/* Animated flow effect for active links */}
                            {isLinkActive && !isDown && (
                                <path
                                    d={pathData}
                                    stroke="url(#cableGradient)"
                                    strokeWidth="3"
                                    fill="none"
                                    strokeDasharray={`${dist}`}
                                    strokeDashoffset={`${dist}`}
                                >
                                    <animate
                                        attributeName="stroke-dashoffset"
                                        values={`${dist}; ${-dist}`}
                                        dur="1.5s"
                                        repeatCount="indefinite"
                                    />
                                </path>
                            )}

                            {/* Render triggered packets along this link */}
                            {(packetAnims as PacketAnimation[]).filter(p =>
                                (p.source === link.source && p.target === link.target) ||
                                (p.source === link.target && p.target === link.source)
                            ).map(p => {
                                const isReverse = p.source === link.target;
                                // For reverse packets, we need to reverse the path or animate backwards
                                // SVG 1.1 doesn't support reversing path easily in animateMotion without 'keyPoints'
                                // So we'll validly reconstruct the path for the packet if needed
                                const pktPathData = isReverse
                                    ? `M${dstPos.x},${dstPos.y} Q${cx},${cy} ${srcPos.x},${srcPos.y}` // Note: Q control point stays same for symmetry or needs mirroring
                                    : pathData;

                                return (
                                    <PacketPulse
                                        key={p.id}
                                        pathData={pktPathData}
                                        durationMs={p.durationMs}
                                    />
                                );
                            })}
                        </g>
                    );
                })}
            </svg>

            {/* Device nodes */}
            {Object.values(devices as Record<string, Device>).map((dev) => {
                const isActive = activeDevice === dev.id;
                const isRouter = dev.type === 'router';
                const pos = layout[dev.id] ?? { x: dev.x, y: dev.y };
                const hasFault = faultDeviceIds.has(dev.id);

                return (
                    <div
                        key={dev.id}
                        onClick={() => onDeviceClick?.(dev.id)}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${isActive ? 'scale-110 z-20' : 'hover:scale-105 z-10'
                            }`}
                        style={{ left: pos.x, top: pos.y }}
                    >
                        {/* Device glow effect when active */}
                        {isActive && (
                            <div className="absolute inset-0 -m-4 bg-green-500/20 blur-xl rounded-full animate-pulse" />
                        )}

                        {/* Device icon */}
                        <div className={`relative ${isActive ? 'drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]' : ''}`}>
                            {isRouter ? <RouterIcon isActive={isActive} /> : <SwitchIcon isActive={isActive} />}
                        </div>

                        {/* Device label */}
                        <div className={`text-center mt-1 px-2 py-0.5 rounded ${isActive ? 'bg-green-900/50 text-green-400' : hasFault ? 'bg-red-900/40 text-red-300' : 'bg-gray-800/50 text-gray-400'
                            }`}>
                            <span className="text-xs font-bold">{dev.id}</span>
                        </div>

                        {/* Fault badge */}
                        {hasFault && (
                            <div className="absolute -top-3 -right-3 w-5 h-5 rounded-full bg-red-500 text-black text-[10px] font-black flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse">
                                !
                            </div>
                        )}

                        {/* Connection indicator */}
                        {isActive && (
                            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-[10px] text-green-400 whitespace-nowrap">
                                Connected
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 border border-gray-700">
                <div className="text-[10px] text-gray-400 mb-2 font-semibold uppercase tracking-wider">Network Topology</div>
                <div className="flex gap-4 text-[10px]">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-green-500" />
                        <span className="text-gray-300">Active</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-1 bg-blue-500 rounded" />
                        <span className="text-gray-300">Link Up</span>
                    </div>
                </div>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-4 right-4 text-[10px] text-gray-500 bg-gray-900/50 px-2 py-1 rounded">
                Click a device for console + hints
            </div>
        </div>
    );
};
