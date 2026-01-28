"use client";

import React from "react";

type Ring = {
    label: string;
    value: number;
    target: number;
};

function clamp01(x: number) {
    if (Number.isNaN(x)) return 0;
    return Math.max(0, Math.min(1, x));
}

function formatValue(label: string, value: number) {
    if (label.toLowerCase().includes("water")) return `${Math.round(value)} ml`;
    if (label.toLowerCase().includes("protein")) return `${value.toFixed(0)} g`;
    if (label.toLowerCase().includes("kcal")) return `${value.toFixed(0)} kcal`;
    return `${value}`;
}

export default function TripleRings({
                                        rings,
                                        size = 220,
                                        stroke = 14,
                                        gap = 8,
                                    }: {
    rings: [Ring, Ring, Ring]; // outer, middle, inner
    size?: number;
    stroke?: number;
    gap?: number;
}) {
    const center = size / 2;

    // radii for 3 rings
    const rOuter = center - stroke / 2;
    const rMid = rOuter - (stroke + gap);
    const rInner = rMid - (stroke + gap);

    const radii = [rOuter, rMid, rInner];

    const circumference = (r: number) => 2 * Math.PI * r;

    // background circle + progress circle
    const RingCircle = ({
                            r,
                            progress,
                        }: {
        r: number;
        progress: number;
    }) => {
        const c = circumference(r);
        const dashOffset = c * (1 - clamp01(progress));

        return (
            <>
                {/* track */}
                <circle
                    cx={center}
                    cy={center}
                    r={r}
                    fill="none"
                    stroke="rgba(0,0,0,0.10)"
                    strokeWidth={stroke}
                />
                {/* progress */}
                <circle
                    cx={center}
                    cy={center}
                    r={r}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={dashOffset}
                    style={{
                        transition: "stroke-dashoffset 350ms ease",
                        transform: `rotate(-90deg)`,
                        transformOrigin: "50% 50%",
                    }}
                />
            </>
        );
    };

    const [outer, mid, inner] = rings;

    const pOuter = outer.target > 0 ? outer.value / outer.target : 0;
    const pMid = mid.target > 0 ? mid.value / mid.target : 0;
    const pInner = inner.target > 0 ? inner.value / inner.target : 0;

    return (
        <div style={{ width: size, maxWidth: "100%" }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Outer ring (Protein) */}
                <g style={{ color: "rgba(0,0,0,0.85)" }}>
                    <RingCircle r={radii[0]} progress={pOuter} />
                </g>

                {/* Middle ring (Kcal) */}
                <g style={{ color: "rgba(0,0,0,0.65)" }}>
                    <RingCircle r={radii[1]} progress={pMid} />
                </g>

                {/* Inner ring (Water) */}
                <g style={{ color: "rgba(0,0,0,0.45)" }}>
                    <RingCircle r={radii[2]} progress={pInner} />
                </g>

                {/* Center text */}
                <text x={center} y={center - 12} textAnchor="middle" fontSize="16" fontWeight="700">
                    Today
                </text>

                <text x={center} y={center + 16} textAnchor="middle" fontSize="12" opacity={0.85}>
                    {formatValue(outer.label, outer.value)} / {formatValue(outer.label, outer.target)}
                </text>
                <text x={center} y={center + 34} textAnchor="middle" fontSize="12" opacity={0.75}>
                    {formatValue(mid.label, mid.value)} / {formatValue(mid.label, mid.target)}
                </text>
                <text x={center} y={center + 52} textAnchor="middle" fontSize="12" opacity={0.65}>
                    {formatValue(inner.label, inner.value)} / {formatValue(inner.label, inner.target)}
                </text>
            </svg>
        </div>
    );
}