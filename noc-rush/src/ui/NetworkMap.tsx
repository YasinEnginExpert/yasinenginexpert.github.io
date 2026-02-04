import { useGameStore } from '../engine/session';

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
                <circle cx={11 + i * 9} y="15" r="1" fill={Math.random() > 0.3 ? "#22c55e" : "#6b7280"}>
                    {Math.random() > 0.5 && <animate attributeName="opacity" values="1;0.3;1" dur={`${0.2 + Math.random() * 0.3}s`} repeatCount="indefinite" />}
                </circle>
            </g>
        ))}
        {[...Array(12)].map((_, i) => (
            <g key={`port2-${i}`}>
                <rect x={8 + i * 9} y="24" width="6" height="5" fill="#0f172a" stroke="#334155" strokeWidth="0.3" rx="0.5" />
                <circle cx={11 + i * 9} y="23" r="1" fill={Math.random() > 0.3 ? "#22c55e" : "#6b7280"}>
                    {Math.random() > 0.5 && <animate attributeName="opacity" values="1;0.3;1" dur={`${0.2 + Math.random() * 0.3}s`} repeatCount="indefinite" />}
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

// Ethernet Cable Component
const EthernetCable = ({ x1, y1, x2, y2, isActive, isDown }: { key?: number; x1: number; y1: number; x2: number; y2: number; isActive: boolean; isDown: boolean }) => {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const connectorOffset = 15;
    const cx1 = x1 + Math.cos(angle) * connectorOffset;
    const cy1 = y1 + Math.sin(angle) * connectorOffset;
    const cx2 = x2 - Math.cos(angle) * connectorOffset;
    const cy2 = y2 - Math.sin(angle) * connectorOffset;

    const cableColor = isDown ? "#ef4444" : (isActive ? "#2563eb" : "#374151");
    const highlightColor = isDown ? "#f87171" : (isActive ? "#60a5fa" : "#4b5563");

    return (
        <g className="transition-all duration-500">
            <line x1={cx1} y1={cy1 + 2} x2={cx2} y2={cy2 + 2} stroke="rgba(0,0,0,0.3)" strokeWidth="6" strokeLinecap="round" />
            <line x1={cx1} y1={cy1} x2={cx2} y2={cy2} stroke={cableColor} strokeWidth="5" strokeLinecap="round" />
            <line x1={cx1} y1={cy1} x2={cx2} y2={cy2} stroke={highlightColor} strokeWidth="2" strokeLinecap="round" />
            {/* Source Label */}
            <g transform={`translate(${cx1 + Math.cos(angle + Math.PI / 2) * 12}, ${cy1 + Math.sin(angle + Math.PI / 2) * 12})`}>
                <text textAnchor="middle" fontSize="6" fill="#94a3b8" fontWeight="bold" className="pointer-events-none select-none">
                    {(useGameStore.getState().topology.links.find(l =>
                        (l.source === (useGameStore.getState().topology.devices as any)['R1']?.id || l.source === 'R1') // Mock-ish but functional
                    ) as any)?.sourceInt || 'Gi0/1'}
                </text>
            </g>

            {/* RJ45 Connector at source */}
            <g transform={`translate(${cx1}, ${cy1}) rotate(${angle * 180 / Math.PI})`}>
                <rect x="-8" y="-4" width="10" height="8" fill={isDown ? "#fca5a5" : "#e5e7eb"} stroke={isDown ? "#ef4444" : "#9ca3af"} strokeWidth="0.5" rx="1" />
                <rect x="-6" y="-2" width="4" height="4" fill="#f3f4f6" />
                <rect x="0" y="-2" width="2" height="4" fill="#d1d5db" />
            </g>

            {/* Destination Label */}
            <g transform={`translate(${cx2 + Math.cos(angle - Math.PI / 2) * 12}, ${cy2 + Math.sin(angle - Math.PI / 2) * 12})`}>
                <text textAnchor="middle" fontSize="6" fill="#94a3b8" fontWeight="bold" className="pointer-events-none select-none">
                    Gi0/2
                </text>
            </g>

            {/* RJ45 Connector at destination */}
            <g transform={`translate(${cx2}, ${cy2}) rotate(${(angle * 180 / Math.PI) + 180})`}>
                <rect x="-8" y="-4" width="10" height="8" fill={isDown ? "#fca5a5" : "#e5e7eb"} stroke={isDown ? "#ef4444" : "#9ca3af"} strokeWidth="0.5" rx="1" />
                <rect x="-6" y="-2" width="4" height="4" fill="#f3f4f6" />
                <rect x="0" y="-2" width="2" height="4" fill="#d1d5db" />
            </g>

            {isActive && !isDown && (
                <circle r="3" fill="#22c55e" className="filter drop-shadow-[0_0_5px_#22c55e]">
                    <animateMotion dur="2s" repeatCount="indefinite" path={`M${cx1},${cy1} L${cx2},${cy2}`} />
                </circle>
            )}
        </g>
    );
};

const PacketPulse = ({ x1, y1, x2, y2 }: { x1: number, y1: number, x2: number, y2: number }) => (
    <circle r="4" fill="#60a5fa" className="filter drop-shadow-[0_0_8px_#3b82f6]">
        <animateMotion
            dur="0.8s"
            repeatCount="1"
            path={`M${x1},${y1} L${x2},${y2}`}
            fill="remove"
        />
    </circle>
);

export const NetworkMap = ({ activeDevice, onDeviceClick }: NetworkMapProps) => {
    const { topology, packetAnims } = useGameStore();
    const { devices, links } = topology;

    return (
        <div className="relative w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 via-black to-black overflow-hidden select-none">
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
                </defs>

                {links.map((link, i) => {
                    const srcDev = devices[link.source];
                    const dstDev = devices[link.target];
                    if (!srcDev || !dstDev) return null;

                    const srcInt = srcDev.interfaces[link.sourceInt];
                    const dstInt = dstDev.interfaces[link.targetInt];
                    const isDown = (srcInt?.status !== 'up') || (dstInt?.status !== 'up') || link.status === 'down';
                    const isLinkActive = activeDevice === link.source || activeDevice === link.target;

                    return (
                        <g key={i}>
                            <EthernetCable
                                x1={srcDev.x}
                                y1={srcDev.y}
                                x2={dstDev.x}
                                y2={dstDev.y}
                                isActive={isLinkActive}
                                isDown={isDown}
                            />
                            {/* Render triggered packets along this link */}
                            {packetAnims.filter(p =>
                                (p.source === link.source && p.target === link.target) ||
                                (p.source === link.target && p.target === link.source)
                            ).map(p => (
                                <PacketPulse
                                    key={p.id}
                                    x1={p.source === link.source ? srcDev.x : dstDev.x}
                                    y1={p.source === link.source ? srcDev.y : dstDev.y}
                                    x2={p.source === link.source ? dstDev.x : srcDev.x}
                                    y2={p.source === link.source ? dstDev.y : srcDev.y}
                                />
                            ))}
                        </g>
                    );
                })}
            </svg>

            {/* Device nodes */}
            {Object.values(devices).map((dev: any) => {
                const isActive = activeDevice === dev.id;
                const isRouter = dev.type === 'router';

                return (
                    <div
                        key={dev.id}
                        onClick={() => onDeviceClick?.(dev.id)}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${isActive ? 'scale-110 z-20' : 'hover:scale-105 z-10'
                            }`}
                        style={{ left: dev.x, top: dev.y }}
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
                        <div className={`text-center mt-1 px-2 py-0.5 rounded ${isActive ? 'bg-green-900/50 text-green-400' : 'bg-gray-800/50 text-gray-400'
                            }`}>
                            <span className="text-xs font-bold">{dev.id}</span>
                        </div>

                        {/* Connection indicator */}
                        {isActive && (
                            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-[10px] text-green-400 whitespace-nowrap">
                                ● Connected
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
                Click a device to connect
            </div>
        </div>
    );
};
