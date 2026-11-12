// ═══════════════════════════════════════════════════════════════════════════
// DeviceIcons.jsx
// ---------------------------------------------------------------------------
// Inline-SVG toolbox icons for EVERY device in the Device Library — the power
// distribution chain (Transformer → Generator → MPP → PP → UPS → PDU → Rack)
// plus cooling, network, security, safety, storage, environment and
// infrastructure gear.
//
// These replace the generic Font Awesome glyphs so a tile in the Device
// Library actually *looks* like the piece of gear it places. Each icon is drawn on a 64×64 viewBox with a shared visual language
// (2-tone body shading + a coloured accent) so the whole row reads as one set,
// and every icon is silhouette-matched to the 3D mesh built for the same
// device by deviceBodies3d.js.
//
// Everything is stroke/fill driven by the `color` prop, so a tile can tint the
// icon with the device's own category colour and it still reads correctly on
// both a light and a dark tile background.
// ═══════════════════════════════════════════════════════════════════════════
import React from "react";

// Shared neutral tones — the "metal" of every cabinet/skid, kept identical
// across icons so a row of them looks like one product family rather than
// seven unrelated drawings.
const SHELL       = "#cbd5e1"; // cabinet face
const SHELL_DARK  = "#94a3b8"; // shadowed side / recess
const SHELL_LIGHT = "#e2e8f0"; // highlight / door face
const OUTLINE     = "#475569"; // outline stroke
const VENT        = "#64748b"; // louvers, grilles, fins

// ── TRANSFORMER ────────────────────────────────────────────────────────────
// Oil-filled distribution transformer: three HV bushings on the lid, a
// conservator drum, the main tank, and radiator fin banks down both flanks.
const TransformerIcon = ({ color = "#8b5cf6" }) => (
  <g>
    {/* HV bushings (3-phase) */}
    {[19, 32, 45].map((x) => (
      <g key={x}>
        <rect x={x - 1.4} y="6"  width="2.8" height="7" fill={color} />
        <ellipse cx={x} cy="12.5" rx="4.2" ry="1.5" fill={SHELL_LIGHT} stroke={OUTLINE} strokeWidth="0.8" />
        <ellipse cx={x} cy="15.5" rx="3.4" ry="1.3" fill={SHELL} stroke={OUTLINE} strokeWidth="0.8" />
        <ellipse cx={x} cy="5.5"  rx="2.6" ry="1.2" fill={color} />
      </g>
    ))}
    {/* conservator drum */}
    <rect x="7" y="14" width="11" height="5" rx="2.5" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.9" />
    {/* lid */}
    <rect x="12" y="17.5" width="40" height="4" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="1" />
    {/* main tank */}
    <rect x="15" y="21" width="34" height="27" rx="1.5" fill={SHELL} stroke={OUTLINE} strokeWidth="1.2" />
    <rect x="15" y="21" width="34" height="5"  fill={SHELL_LIGHT} />
    {/* rating plate */}
    <rect x="26" y="30" width="12" height="8" rx="1" fill={color} opacity="0.85" />
    {/* radiator fin banks (left + right flanks) */}
    {[0, 1, 2, 3].map((i) => (
      <g key={`f${i}`}>
        <rect x={8}  y={24 + i * 5.2} width="7" height="3.4" rx="1" fill={VENT} />
        <rect x={49} y={24 + i * 5.2} width="7" height="3.4" rx="1" fill={VENT} />
      </g>
    ))}
    {/* skid + wheels */}
    <rect x="13" y="48" width="38" height="3" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.9" />
    <circle cx="21" cy="53.5" r="3" fill={OUTLINE} />
    <circle cx="43" cy="53.5" r="3" fill={OUTLINE} />
  </g>
);

// ── GENERATOR (DG set) ─────────────────────────────────────────────────────
// Skid-mounted diesel genset: radiator grille up front, ribbed engine block,
// cylindrical alternator at the rear, exhaust silencer over the top.
const GeneratorIcon = ({ color = "#f97316" }) => (
  <g>
    {/* exhaust silencer + stack */}
    <rect x="17" y="9" width="19" height="6" rx="3" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.9" />
    <rect x="36.5" y="4" width="3.4" height="11" rx="1.5" fill={OUTLINE} />
    <rect x="20" y="15" width="2.4" height="7" rx="1" fill={OUTLINE} opacity="0.75" />
    {/* skid deck */}
    <rect x="5" y="44" width="54" height="5" rx="1.5" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="1.1" />
    {/* radiator (front) */}
    <rect x="6" y="19" width="13" height="25" rx="1.5" fill={SHELL} stroke={OUTLINE} strokeWidth="1.1" />
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <rect key={`r${i}`} x="8" y={21.5 + i * 3.6} width="9" height="1.9" rx="0.8" fill={VENT} />
    ))}
    {/* engine block */}
    <rect x="19" y="22" width="21" height="22" rx="1.5" fill={SHELL_LIGHT} stroke={OUTLINE} strokeWidth="1.1" />
    {/* cylinder head ribs */}
    {[0, 1, 2, 3].map((i) => (
      <rect key={`c${i}`} x={21 + i * 4.6} y="15" width="3.4" height="7.5" rx="0.8" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.7" />
    ))}
    {/* alternator — a ribbed drum, coupled to the block by a bellhousing */}
    <rect x="38.5" y="23" width="3.5" height="21" rx="1.5" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.9" />
    <rect x="42" y="24" width="15" height="20" rx="4" fill={color} opacity="0.9" stroke={OUTLINE} strokeWidth="1.1" />
    {[0, 1, 2, 3].map((i) => (
      <line key={`a${i}`} x1={45 + i * 3.2} y1="25.5" x2={45 + i * 3.2} y2="42.5" stroke={OUTLINE} strokeWidth="0.9" opacity="0.45" />
    ))}
    {/* terminal box on the alternator */}
    <rect x="45" y="19" width="9" height="5" rx="1" fill={OUTLINE} />
    {/* control panel */}
    <rect x="24" y="27" width="11" height="8" rx="1" fill={OUTLINE} />
    <rect x="26" y="29" width="7" height="4" rx="0.6" fill={color} />
    {/* anti-vibration feet */}
    <rect x="10" y="49" width="7" height="4" rx="1" fill={OUTLINE} />
    <rect x="47" y="49" width="7" height="4" rx="1" fill={OUTLINE} />
  </g>
);

// ── MPP — MAIN POWER PANEL ─────────────────────────────────────────────────
// Multi-section LV switchgear lineup: three bolted door sections, top louver
// bank, lifting eyes on the roof, plinth at the floor.
const MPPIcon = ({ color = "#6366f1" }) => (
  <g>
    {/* lifting eyes */}
    <circle cx="18" cy="7"  r="2.4" fill="none" stroke={OUTLINE} strokeWidth="1.5" />
    <circle cx="46" cy="7"  r="2.4" fill="none" stroke={OUTLINE} strokeWidth="1.5" />
    {/* roof */}
    <rect x="7" y="9" width="50" height="4" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="1" />
    {/* cabinet shell */}
    <rect x="9" y="12" width="46" height="41" rx="1.5" fill={SHELL} stroke={OUTLINE} strokeWidth="1.2" />
    {/* three door sections */}
    {[0, 1, 2].map((i) => (
      <g key={`d${i}`}>
        <rect x={11 + i * 15} y="15" width="13" height="35" rx="1" fill={SHELL_LIGHT} stroke={OUTLINE} strokeWidth="0.9" />
        {/* top louver bank */}
        {[0, 1, 2].map((j) => (
          <rect key={`l${j}`} x={12.5 + i * 15} y={17 + j * 2.6} width="10" height="1.5" rx="0.6" fill={VENT} />
        ))}
        {/* meter / indicator window */}
        <rect x={13.5 + i * 15} y="27" width="8" height="5.5" rx="0.8" fill={color} opacity="0.85" />
        {/* door handle */}
        <rect x={21 + i * 15} y="38" width="1.8" height="7" rx="0.9" fill={OUTLINE} />
      </g>
    ))}
    {/* plinth */}
    <rect x="7" y="53" width="50" height="4" rx="1" fill={OUTLINE} />
  </g>
);

// ── PP — POWER PANEL ───────────────────────────────────────────────────────
// Single-section floor-standing distribution panel: one door, handle, a small
// louver bank and an indicator window. Same family as MPP, narrower.
const PPIcon = ({ color = "#0ea5e9" }) => (
  <g>
    {/* roof */}
    <rect x="14" y="8" width="36" height="4" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="1" />
    {/* cabinet shell */}
    <rect x="16" y="11" width="32" height="42" rx="1.5" fill={SHELL} stroke={OUTLINE} strokeWidth="1.2" />
    {/* door */}
    <rect x="19" y="14" width="26" height="36" rx="1" fill={SHELL_LIGHT} stroke={OUTLINE} strokeWidth="0.9" />
    {/* louvers */}
    {[0, 1, 2].map((j) => (
      <rect key={`l${j}`} x="22" y={17 + j * 3} width="20" height="1.7" rx="0.7" fill={VENT} />
    ))}
    {/* indicator window / meter */}
    <rect x="23" y="28" width="18" height="8" rx="1" fill={color} opacity="0.85" />
    {/* status LEDs */}
    <circle cx="26" cy="41" r="1.5" fill="#22c55e" />
    <circle cx="31" cy="41" r="1.5" fill="#facc15" />
    <circle cx="36" cy="41" r="1.5" fill="#ef4444" />
    {/* door handle */}
    <rect x="42.4" y="30" width="1.9" height="9" rx="0.9" fill={OUTLINE} />
    {/* plinth */}
    <rect x="14" y="53" width="36" height="4" rx="1" fill={OUTLINE} />
  </g>
);

// ── UPS ────────────────────────────────────────────────────────────────────
// Tall dark UPS cabinet: full-height louvered intake, an LCD/mimic panel up
// top, battery-string status bar at the bottom.
const UPSIcon = ({ color = "#f59e0b" }) => (
  <g>
    {/* roof */}
    <rect x="14" y="6" width="36" height="4" rx="1" fill="#334155" stroke={OUTLINE} strokeWidth="1" />
    {/* cabinet shell (UPS cabinets are near-black in the field) */}
    <rect x="16" y="9" width="32" height="46" rx="1.5" fill="#3f4a5c" stroke={OUTLINE} strokeWidth="1.2" />
    <rect x="16" y="9" width="6"  height="46" fill="#2b3444" />
    {/* LCD / mimic panel */}
    <rect x="24" y="13" width="20" height="11" rx="1.2" fill="#0f172a" stroke={OUTLINE} strokeWidth="0.8" />
    <rect x="26" y="15" width="16" height="4" rx="0.6" fill={color} />
    <rect x="26" y="20.5" width="9" height="2" rx="0.6" fill={color} opacity="0.55" />
    {/* louvered intake grille */}
    {[0, 1, 2, 3, 4, 5, 6].map((j) => (
      <rect key={`v${j}`} x="24" y={27 + j * 3.1} width="20" height="1.9" rx="0.7" fill="#1e293b" />
    ))}
    {/* battery-string status bar */}
    <rect x="24" y="49" width="20" height="3.4" rx="1" fill="#0f172a" />
    <rect x="25" y="49.8" width="13" height="1.8" rx="0.8" fill="#22c55e" />
    {/* plinth */}
    <rect x="14" y="55" width="36" height="3.5" rx="1" fill={OUTLINE} />
  </g>
);

// ── PDU ────────────────────────────────────────────────────────────────────
// Floor-mount power distribution unit: twin doors, a metering head at the top
// and rows of branch breakers behind the doors.
const PDUIcon = ({ color = "#14b8a6" }) => (
  <g>
    {/* roof */}
    <rect x="9" y="8" width="46" height="4" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="1" />
    {/* cabinet shell */}
    <rect x="11" y="11" width="42" height="42" rx="1.5" fill={SHELL} stroke={OUTLINE} strokeWidth="1.2" />
    {/* metering head */}
    <rect x="15" y="14" width="34" height="8" rx="1" fill="#0f172a" />
    <rect x="17.5" y="16" width="12" height="4" rx="0.7" fill={color} />
    <circle cx="36" cy="18" r="1.5" fill="#22c55e" />
    <circle cx="41" cy="18" r="1.5" fill="#facc15" />
    <circle cx="46" cy="18" r="1.5" fill="#ef4444" />
    {/* twin doors */}
    <rect x="14" y="24" width="17" height="26" rx="1" fill={SHELL_LIGHT} stroke={OUTLINE} strokeWidth="0.9" />
    <rect x="33" y="24" width="17" height="26" rx="1" fill={SHELL_LIGHT} stroke={OUTLINE} strokeWidth="0.9" />
    {/* branch breaker rows */}
    {[0, 1, 2, 3, 4].map((j) => (
      <g key={`b${j}`}>
        <rect x="16.5" y={26.5 + j * 4.6} width="12" height="2.6" rx="0.8" fill={VENT} />
        <rect x="35.5" y={26.5 + j * 4.6} width="12" height="2.6" rx="0.8" fill={VENT} />
      </g>
    ))}
    {/* handles on the meeting stile */}
    <rect x="29.4" y="34" width="1.8" height="8" rx="0.9" fill={OUTLINE} />
    <rect x="32.8" y="34" width="1.8" height="8" rx="0.9" fill={OUTLINE} />
    {/* plinth */}
    <rect x="9" y="53" width="46" height="4" rx="1" fill={OUTLINE} />
  </g>
);

// ── RACK ───────────────────────────────────────────────────────────────────
// 42U server rack: perforated front door, mounted equipment slats with drive
// LEDs, castors at the base. Terminal node of the power chain.
const RackIcon = ({ color = "#3b82f6" }) => (
  <g>
    {/* roof + fan cutouts */}
    <rect x="15" y="5" width="34" height="4" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="1" />
    <circle cx="24" cy="7" r="1.2" fill={OUTLINE} />
    <circle cx="32" cy="7" r="1.2" fill={OUTLINE} />
    <circle cx="40" cy="7" r="1.2" fill={OUTLINE} />
    {/* frame */}
    <rect x="17" y="8" width="30" height="46" rx="1.5" fill="#334155" stroke={OUTLINE} strokeWidth="1.2" />
    {/* mounting rails */}
    <rect x="19" y="10" width="2.4" height="42" fill="#1e293b" />
    <rect x="42.6" y="10" width="2.4" height="42" fill="#1e293b" />
    {/* installed equipment (U slats) */}
    {[0, 1, 2, 3, 4, 5, 6].map((j) => (
      <g key={`u${j}`}>
        <rect x="22" y={11.5 + j * 5.8} width="20" height="4.4" rx="0.8"
              fill={j % 3 === 1 ? "#7d8ca1" : "#9dabbd"} stroke="#1e293b" strokeWidth="0.5" />
        <circle cx={24.5} cy={13.7 + j * 5.8} r="0.9" fill={j % 2 ? "#22c55e" : color} />
        <circle cx={27}   cy={13.7 + j * 5.8} r="0.9" fill="#22c55e" opacity="0.7" />
        <rect x={31} y={12.8 + j * 5.8} width="9" height="2.2" rx="0.5" fill="#1e293b" opacity="0.75" />
      </g>
    ))}
    {/* castors */}
    <circle cx="22" cy="56" r="2.4" fill={OUTLINE} />
    <circle cx="42" cy="56" r="2.4" fill={OUTLINE} />
  </g>
);

// ── BLADE SERVER ───────────────────────────────────────────────────────────
// Blade enclosure: vertical blade slots with ejector handles, a management
// module down one side and redundant PSU bays across the bottom.
const BladeServerIcon = ({ color = "#2980b9" }) => (
  <g>
    <rect x="9" y="9" width="46" height="46" rx="2" fill="#3a4657" stroke={OUTLINE} strokeWidth="1.2" />
    <rect x="11" y="11" width="42" height="4" rx="1" fill="#232c39" />
    {/* vertical blades with ejector handles */}
    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
      <g key={`b${i}`}>
        <rect x={12 + i * 5.6} y="17" width="4.4" height="26" rx="0.8" fill={i % 2 ? "#8d9cb0" : "#a7b4c5"} stroke="#232c39" strokeWidth="0.5" />
        <rect x={12.6 + i * 5.6} y="19" width="3.2" height="1.6" rx="0.5" fill={color} />
        <rect x={12.6 + i * 5.6} y="38.5" width="3.2" height="3" rx="0.6" fill="#232c39" />
      </g>
    ))}
    {/* management module */}
    <rect x="52.5" y="17" width="0" height="0" fill="none" />
    {/* PSU bays */}
    {[0, 1, 2].map((i) => (
      <rect key={`p${i}`} x={12 + i * 13.8} y="45" width="12" height="7" rx="1" fill="#232c39" stroke="#0f172a" strokeWidth="0.5" />
    ))}
    {[0, 1, 2].map((i) => (
      <circle key={`l${i}`} cx={14.5 + i * 13.8} cy="48.5" r="1.2" fill="#22c55e" />
    ))}
  </g>
);

// ── CRAC / PRECISION AC ────────────────────────────────────────────────────
// Downflow precision cooling unit: top return grille, filter section, fan
// deck behind the front louvers, and the chilled-water pipes at the back.
const CracIcon = ({ color = "#2ecc71" }) => (
  <g>
    {/* return-air grille on the roof */}
    <rect x="12" y="6" width="40" height="6" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="1" />
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <rect key={`g${i}`} x={14 + i * 6.2} y="7.5" width="4.4" height="3" rx="0.6" fill={VENT} />
    ))}
    {/* cabinet */}
    <rect x="14" y="11" width="36" height="42" rx="1.5" fill={SHELL} stroke={OUTLINE} strokeWidth="1.2" />
    {/* filter section */}
    <rect x="17" y="14" width="30" height="9" rx="1" fill={SHELL_LIGHT} stroke={OUTLINE} strokeWidth="0.8" />
    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
      <line key={`f${i}`} x1={18.5 + i * 3.8} y1="15" x2={18.5 + i * 3.8} y2="22" stroke={VENT} strokeWidth="1" />
    ))}
    {/* control display */}
    <rect x="18" y="25" width="11" height="7" rx="1" fill="#0f172a" />
    <rect x="19.5" y="26.5" width="8" height="4" rx="0.6" fill={color} />
    {/* fan deck seen through the front louvers */}
    <circle cx="39" cy="29" r="6" fill="none" stroke={VENT} strokeWidth="1.4" />
    <circle cx="39" cy="29" r="1.6" fill={OUTLINE} />
    {[0, 1, 2, 3, 4].map((i) => (
      <line key={`bl${i}`} x1="39" y1="29"
            x2={39 + 5.4 * Math.cos((i / 5) * Math.PI * 2)}
            y2={29 + 5.4 * Math.sin((i / 5) * Math.PI * 2)}
            stroke={VENT} strokeWidth="1.6" strokeLinecap="round" />
    ))}
    {/* supply louvers */}
    {[0, 1, 2, 3].map((i) => (
      <rect key={`s${i}`} x="18" y={36 + i * 4} width="28" height="2.4" rx="0.8" fill={VENT} />
    ))}
    {/* chilled-water pipes */}
    <rect x="50" y="16" width="4" height="30" rx="2" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.8" />
    <rect x="10" y="16" width="4" height="30" rx="2" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.8" />
    {/* plinth */}
    <rect x="12" y="53" width="40" height="4" rx="1" fill={OUTLINE} />
  </g>
);

// ── CHILLER ────────────────────────────────────────────────────────────────
// Air-cooled packaged chiller: a bank of condenser fans on the roof, V-coil
// blocks down the flanks, compressors on the skid.
const ChillerIcon = ({ color = "#16a085" }) => (
  <g>
    {/* condenser fans */}
    {[16, 32, 48].map((cx) => (
      <g key={cx}>
        <circle cx={cx} cy="14" r="7" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="1" />
        <circle cx={cx} cy="14" r="5.4" fill="#334155" />
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1={cx} y1="14"
                x2={cx + 5 * Math.cos((i / 5) * Math.PI * 2 + 0.4)}
                y2={14 + 5 * Math.sin((i / 5) * Math.PI * 2 + 0.4)}
                stroke={SHELL_LIGHT} strokeWidth="1.5" strokeLinecap="round" />
        ))}
        <circle cx={cx} cy="14" r="1.4" fill={color} />
      </g>
    ))}
    {/* fan deck */}
    <rect x="6" y="20" width="52" height="4" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="1" />
    {/* condenser coil body */}
    <rect x="8" y="23" width="48" height="21" rx="1.5" fill={SHELL} stroke={OUTLINE} strokeWidth="1.2" />
    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
      <line key={`c${i}`} x1={10.5 + i * 4} y1="25" x2={10.5 + i * 4} y2="42" stroke={VENT} strokeWidth="1.3" />
    ))}
    {/* control panel */}
    <rect x="24" y="28" width="16" height="10" rx="1" fill="#0f172a" stroke={OUTLINE} strokeWidth="0.8" />
    <rect x="26" y="30" width="12" height="4" rx="0.6" fill={color} />
    <circle cx="28" cy="36" r="1.1" fill="#22c55e" />
    <circle cx="32" cy="36" r="1.1" fill="#facc15" />
    {/* compressors on the skid */}
    <rect x="13" y="44" width="9" height="7" rx="2" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.9" />
    <rect x="42" y="44" width="9" height="7" rx="2" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.9" />
    {/* base rails */}
    <rect x="6" y="51" width="52" height="4" rx="1" fill={OUTLINE} />
    <rect x="10" y="55" width="6" height="3" rx="1" fill={OUTLINE} />
    <rect x="48" y="55" width="6" height="3" rx="1" fill={OUTLINE} />
  </g>
);

// ── HUMIDIFIER ─────────────────────────────────────────────────────────────
// Steam humidifier: cylinder boiler behind a window, steam distributor pipe
// on top, and a fill/drain assembly at the base.
const HumidifierIcon = ({ color = "#3498db" }) => (
  <g>
    {/* steam plume */}
    <path d="M24 12 q3 -4 0 -8 M32 10 q3 -5 0 -9 M40 12 q3 -4 0 -8"
          fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.75" />
    {/* distributor pipe */}
    <rect x="18" y="12" width="28" height="4" rx="2" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.9" />
    {/* cabinet */}
    <rect x="17" y="16" width="30" height="37" rx="1.5" fill={SHELL} stroke={OUTLINE} strokeWidth="1.2" />
    {/* sight window over the steam cylinder */}
    <rect x="21" y="20" width="14" height="22" rx="1" fill="#0f172a" stroke={OUTLINE} strokeWidth="0.8" />
    <rect x="24" y="24" width="8" height="16" rx="4" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.7" />
    <rect x="24" y="32" width="8" height="8" rx="1" fill={color} opacity="0.8" />
    {/* control panel */}
    <rect x="37" y="20" width="7" height="9" rx="1" fill="#0f172a" />
    <rect x="38.2" y="21.5" width="4.6" height="3" rx="0.5" fill={color} />
    <circle cx="40.5" cy="27" r="1.1" fill="#22c55e" />
    {/* fill + drain */}
    <rect x="37" y="33" width="7" height="9" rx="1" fill={SHELL_LIGHT} stroke={OUTLINE} strokeWidth="0.7" />
    <rect x="19" y="45" width="26" height="4" rx="1" fill={VENT} />
    <rect x="28" y="49" width="4" height="6" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.8" />
    {/* plinth */}
    <rect x="15" y="53" width="34" height="4" rx="1" fill={OUTLINE} />
  </g>
);

// ── Shared chassis primitive for rack-mount network / security gear ────────
// Switch, router and firewall are all the same 1-2U box in real life; what
// differs is the port layout and the badge on the bezel, so they share one
// drawing and pass in their own detail.
const RackChassis = ({ color, rows = 2, badge = null, antennas = false }) => (
  <g>
    {antennas && (
      <g>
        <rect x="14" y="6" width="2.6" height="13" rx="1.3" fill={OUTLINE} />
        <rect x="47.4" y="6" width="2.6" height="13" rx="1.3" fill={OUTLINE} />
      </g>
    )}
    {/* mounting ears */}
    <rect x="4" y="22" width="6" height="20" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.9" />
    <rect x="54" y="22" width="6" height="20" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.9" />
    <circle cx="7" cy="26" r="1.1" fill={OUTLINE} />
    <circle cx="7" cy="38" r="1.1" fill={OUTLINE} />
    <circle cx="57" cy="26" r="1.1" fill={OUTLINE} />
    <circle cx="57" cy="38" r="1.1" fill={OUTLINE} />
    {/* chassis */}
    <rect x="9" y="21" width="46" height="22" rx="1.5" fill="#3a4657" stroke={OUTLINE} strokeWidth="1.2" />
    <rect x="9" y="21" width="46" height="3" rx="1" fill="#4b5a6e" />
    {/* port banks */}
    {Array.from({ length: rows }).map((_, r) => (
      <g key={`r${r}`}>
        {Array.from({ length: 10 }).map((_, i) => (
          <rect key={i} x={12.5 + i * 4.2} y={rows === 1 ? 30 : 26.5 + r * 8}
                width="3.2" height="5.4" rx="0.6" fill="#141a24" stroke="#0b0f16" strokeWidth="0.4" />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <circle key={`d${i}`} cx={14.1 + i * 4.2} cy={(rows === 1 ? 30 : 26.5 + r * 8) - 1.2}
                  r="0.8" fill={i % 3 === 0 ? "#22c55e" : color} opacity={i % 2 ? 0.9 : 0.55} />
        ))}
      </g>
    ))}
    {/* SFP uplink cage */}
    <rect x="45" y="35.5" width="8" height="6" rx="0.8" fill="#0b0f16" />
    <rect x="46" y="36.5" width="2.6" height="4" rx="0.4" fill={color} />
    <rect x="49.6" y="36.5" width="2.6" height="4" rx="0.4" fill={color} opacity="0.5" />
    {badge}
    {/* rack rails behind */}
    <rect x="9" y="43" width="46" height="2.4" rx="0.6" fill="#1e293b" />
  </g>
);

// ── NETWORK SWITCH ─────────────────────────────────────────────────────────
const SwitchIcon = ({ color = "#9b59b6" }) => (
  <RackChassis
    color={color}
    rows={2}
    badge={
      <g>
        <rect x="10.5" y="22.5" width="7" height="3" rx="0.6" fill={color} opacity="0.8" />
      </g>
    }
  />
);

// ── ROUTER ─────────────────────────────────────────────────────────────────
const RouterIcon = ({ color = "#e74c3c" }) => (
  <RackChassis
    color={color}
    rows={1}
    antennas
    badge={
      <g>
        {/* routing arrows on the bezel */}
        <path d="M14 38 h9 m-2.5 -2.5 l2.5 2.5 l-2.5 2.5" fill="none" stroke={color} strokeWidth="1.4"
              strokeLinecap="round" strokeLinejoin="round" />
        <path d="M32 38 h-9 m2.5 -2.5 l-2.5 2.5 l2.5 2.5" fill="none" stroke="#22c55e" strokeWidth="1.4"
              strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      </g>
    }
  />
);

// ── FIREWALL ───────────────────────────────────────────────────────────────
const FirewallIcon = ({ color = "#c0392b" }) => (
  <RackChassis
    color={color}
    rows={1}
    badge={
      <g>
        {/* shield emblem */}
        <path d="M20 34.5 l5 -1.8 l5 1.8 v4 c0 3 -2.4 4.6 -5 5.6 c-2.6 -1 -5 -2.6 -5 -5.6 z"
              fill={color} stroke="#7f1d1d" strokeWidth="0.9" />
        <path d="M22.6 38.6 l1.8 1.8 l3.2 -3.4" fill="none" stroke="#fff" strokeWidth="1.3"
              strokeLinecap="round" strokeLinejoin="round" />
      </g>
    }
  />
);

// ── STORAGE ARRAY ──────────────────────────────────────────────────────────
// Disk shelf: a grid of hot-swap carriers, each with its own latch and
// activity LED, plus dual controller canisters at the bottom.
const StorageIcon = ({ color = "#34495e" }) => (
  <g>
    <rect x="7" y="10" width="50" height="44" rx="2" fill="#3a4657" stroke={OUTLINE} strokeWidth="1.2" />
    <rect x="7" y="10" width="50" height="4" rx="1" fill="#4b5a6e" />
    {/* drive carriers */}
    {[0, 1, 2, 3].map((r) =>
      [0, 1, 2, 3, 4, 5].map((c) => (
        <g key={`${r}-${c}`}>
          <rect x={10 + c * 7.6} y={16 + r * 7.4} width="6.6" height="6" rx="0.8"
                fill={(r + c) % 2 ? "#93a1b3" : "#a9b6c6"} stroke="#232c39" strokeWidth="0.5" />
          <rect x={10.8 + c * 7.6} y={17 + r * 7.4} width="1.4" height="4" rx="0.4" fill="#232c39" />
          <circle cx={15.2 + c * 7.6} cy={19 + r * 7.4} r="0.9"
                  fill={(r * 6 + c) % 5 === 0 ? color : "#22c55e"} />
        </g>
      )),
    )}
    {/* controller canisters */}
    <rect x="10" y="46" width="20" height="6" rx="1" fill="#232c39" stroke="#0f172a" strokeWidth="0.5" />
    <rect x="34" y="46" width="20" height="6" rx="1" fill="#232c39" stroke="#0f172a" strokeWidth="0.5" />
    <circle cx="13" cy="49" r="1.2" fill="#22c55e" />
    <circle cx="37" cy="49" r="1.2" fill="#22c55e" />
    <rect x="24" y="47.5" width="5" height="3" rx="0.5" fill={color} />
    <rect x="48" y="47.5" width="5" height="3" rx="0.5" fill={color} />
  </g>
);

// ── ISP RACK ───────────────────────────────────────────────────────────────
// Carrier demarcation rack: patch panels, a fibre tray with slack loops and
// the provider's terminating equipment.
const ISPRackIcon = ({ color = "#4f46e5" }) => (
  <g>
    <rect x="15" y="5" width="34" height="4" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="1" />
    <rect x="17" y="8" width="30" height="46" rx="1.5" fill="#334155" stroke={OUTLINE} strokeWidth="1.2" />
    <rect x="19" y="10" width="2.2" height="42" fill="#1e293b" />
    <rect x="42.8" y="10" width="2.2" height="42" fill="#1e293b" />
    {/* patch panels */}
    {[0, 1].map((r) => (
      <g key={`p${r}`}>
        <rect x="22" y={12 + r * 7} width="20" height="5.4" rx="0.7" fill="#9dabbd" stroke="#1e293b" strokeWidth="0.5" />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <rect key={i} x={23 + i * 2.7} y={13.2 + r * 7} width="1.8" height="3" rx="0.3" fill="#1e293b" />
        ))}
      </g>
    ))}
    {/* fibre tray with slack loops */}
    <rect x="22" y="27" width="20" height="7" rx="0.8" fill="#1e293b" />
    <path d="M24 34 q4 -6 8 0 q4 -6 8 0" fill="none" stroke={color} strokeWidth="1.3" opacity="0.9" />
    {/* carrier NTU + broadcast mark */}
    <rect x="22" y="36" width="20" height="6" rx="0.8" fill="#7d8ca1" stroke="#1e293b" strokeWidth="0.5" />
    <circle cx="26" cy="39" r="1.5" fill={color} />
    <path d="M29.5 41 q2.5 -2 5 0 M31.5 41 q0.9 -0.9 1.8 0" fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
    {/* uplink equipment */}
    <rect x="22" y="44" width="20" height="6" rx="0.8" fill="#9dabbd" stroke="#1e293b" strokeWidth="0.5" />
    <circle cx="25" cy="47" r="1" fill="#22c55e" />
    <circle cx="28" cy="47" r="1" fill="#22c55e" />
    <circle cx="22" cy="56" r="2.2" fill={OUTLINE} />
    <circle cx="42" cy="56" r="2.2" fill={OUTLINE} />
  </g>
);

// ── CAMERA (CCTV) ──────────────────────────────────────────────────────────
// Bullet camera on a wall bracket: lens barrel with an IR illuminator ring,
// sunshield hood and a status LED.
const CameraIcon = ({ color = "#8e44ad" }) => (
  <g>
    {/* wall plate + bracket arm */}
    <rect x="6" y="18" width="6" height="24" rx="1.5" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="1" />
    <circle cx="9" cy="22" r="1.1" fill={OUTLINE} />
    <circle cx="9" cy="38" r="1.1" fill={OUTLINE} />
    <rect x="11" y="27" width="9" height="4" rx="1.5" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.9" />
    <circle cx="21" cy="29" r="3" fill={SHELL} stroke={OUTLINE} strokeWidth="1" />
    {/* body */}
    <rect x="22" y="21" width="26" height="16" rx="6" fill={SHELL} stroke={OUTLINE} strokeWidth="1.2" />
    {/* sunshield hood */}
    <rect x="21" y="18.5" width="28" height="5" rx="2.5" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="1" />
    {/* lens assembly */}
    <circle cx="48" cy="29" r="8.5" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="1.2" />
    <circle cx="48" cy="29" r="6.4" fill="#0f172a" />
    <circle cx="48" cy="29" r="3.6" fill="#111c2e" stroke={color} strokeWidth="1.1" />
    <circle cx="46.2" cy="27" r="1.4" fill="#e2e8f0" opacity="0.8" />
    {/* IR illuminator ring */}
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <circle key={i}
              cx={48 + 5.2 * Math.cos((i / 6) * Math.PI * 2)}
              cy={29 + 5.2 * Math.sin((i / 6) * Math.PI * 2)}
              r="0.85" fill="#7f1d1d" />
    ))}
    {/* status LED + cable tail */}
    <circle cx="27" cy="24.5" r="1.3" fill="#22c55e" />
    <path d="M22 37 q-4 6 -9 7" fill="none" stroke={OUTLINE} strokeWidth="1.8" strokeLinecap="round" />
  </g>
);

// ── ACCESS CARD READER ─────────────────────────────────────────────────────
// Wall-mounted proximity reader: card presentation area with RF waves, a
// keypad and the read/grant LED.
const CardReaderIcon = ({ color = "#7c3aed" }) => (
  <g>
    <rect x="18" y="6" width="28" height="52" rx="4" fill={SHELL} stroke={OUTLINE} strokeWidth="1.3" />
    <rect x="20.5" y="8.5" width="23" height="47" rx="3" fill={SHELL_LIGHT} />
    {/* presentation target + RF waves */}
    <rect x="24" y="12" width="16" height="12" rx="1.6" fill="#0f172a" />
    <rect x="26" y="14.5" width="12" height="7" rx="1" fill={color} opacity="0.9" />
    <rect x="26.8" y="16" width="5" height="1.4" rx="0.5" fill="#fff" opacity="0.85" />
    <path d="M42 15 q3 3 0 6 M45 12.5 q5 5.5 0 11" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    {/* keypad */}
    {[0, 1, 2, 3].map((r) =>
      [0, 1, 2].map((c) => (
        <rect key={`${r}-${c}`} x={24.5 + c * 5.4} y={28 + r * 5.4} width="4.2" height="4.2" rx="1"
              fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.6" />
      )),
    )}
    {/* grant LED */}
    <circle cx="32" cy="52.5" r="2" fill="#22c55e" />
  </g>
);

// ── BIOMETRIC ACCESS ───────────────────────────────────────────────────────
// Fingerprint terminal: scan platen with a ridge pattern, a small display
// and the accept LED.
const BiometricIcon = ({ color = "#7c3aed" }) => (
  <g>
    <rect x="18" y="6" width="28" height="52" rx="4" fill={SHELL} stroke={OUTLINE} strokeWidth="1.3" />
    <rect x="20.5" y="8.5" width="23" height="47" rx="3" fill={SHELL_LIGHT} />
    {/* display */}
    <rect x="24" y="11" width="16" height="9" rx="1.2" fill="#0f172a" />
    <rect x="25.6" y="12.6" width="9" height="2.2" rx="0.5" fill={color} />
    <rect x="25.6" y="16" width="12.8" height="1.8" rx="0.5" fill={color} opacity="0.5" />
    {/* fingerprint platen */}
    <rect x="23" y="24" width="18" height="22" rx="3" fill="#0f172a" stroke={OUTLINE} strokeWidth="0.9" />
    {[0, 1, 2, 3].map((i) => (
      <path key={i}
            d={`M${28 - i * 1.4} 40 a${5 + i * 2.1} ${6 + i * 2.1} 0 0 1 ${8 + i * 2.8} 0`}
            fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity={0.95 - i * 0.14} />
    ))}
    <path d="M32 40 v-4" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    {/* scan sweep + accept LED */}
    <rect x="24" y="33" width="16" height="1.2" rx="0.6" fill="#22c55e" opacity="0.7" />
    <circle cx="32" cy="51" r="2" fill="#22c55e" />
  </g>
);

// ── PUSH BUTTON (request to exit) ──────────────────────────────────────────
// Green mushroom-head release button on its back-box, with the legend plate.
const PushButtonIcon = ({ color = "#ef4444" }) => (
  <g>
    <rect x="14" y="10" width="36" height="44" rx="3" fill={SHELL} stroke={OUTLINE} strokeWidth="1.3" />
    <rect x="16.5" y="12.5" width="31" height="39" rx="2" fill={SHELL_LIGHT} />
    {/* mushroom head */}
    <circle cx="32" cy="27" r="11.5" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="1.1" />
    <circle cx="32" cy="26" r="9" fill="#16a34a" stroke="#14532d" strokeWidth="1.1" />
    <ellipse cx="29" cy="22.5" rx="3.4" ry="2.2" fill="#4ade80" opacity="0.65" />
    {/* legend plate */}
    <rect x="19" y="41" width="26" height="8" rx="1.2" fill={color} opacity="0.9" />
    {[0, 1, 2].map((i) => (
      <rect key={i} x={22 + i * 7} y="44" width="5" height="2" rx="1" fill="#fff" opacity="0.9" />
    ))}
    {/* fixing screws */}
    <circle cx="18.5" cy="14.5" r="1" fill={OUTLINE} />
    <circle cx="45.5" cy="14.5" r="1" fill={OUTLINE} />
    <circle cx="18.5" cy="49.5" r="1" fill={OUTLINE} />
    <circle cx="45.5" cy="49.5" r="1" fill={OUTLINE} />
  </g>
);

// ── FM200 CYLINDER ─────────────────────────────────────────────────────────
// A single agent cylinder strapped to the wall: valve head, actuator, and
// the discharge hose into the manifold.
const FM200CylinderIcon = ({ color = "#f97316" }) => (
  <g>
    {/* wall straps */}
    <rect x="14" y="24" width="36" height="4" rx="1.5" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.9" />
    <rect x="14" y="44" width="36" height="4" rx="1.5" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.9" />
    {/* cylinder */}
    <rect x="21" y="17" width="22" height="38" rx="8" fill={color} stroke={OUTLINE} strokeWidth="1.3" />
    <rect x="24" y="19" width="5" height="34" rx="2.5" fill="#fff" opacity="0.22" />
    {/* neck + valve head */}
    <rect x="27.5" y="11" width="9" height="7" rx="1.5" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="1" />
    <circle cx="32" cy="9" r="4" fill={SHELL} stroke={OUTLINE} strokeWidth="1.1" />
    {/* pressure gauge */}
    <circle cx="42" cy="12" r="4.4" fill={SHELL_LIGHT} stroke={OUTLINE} strokeWidth="1" />
    <path d="M42 12 l2.6 -2.2" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    <circle cx="42" cy="12" r="0.9" fill={OUTLINE} />
    {/* discharge hose */}
    <path d="M36 10 q10 -3 14 5" fill="none" stroke={OUTLINE} strokeWidth="2.2" strokeLinecap="round" />
    {/* agent label */}
    <rect x="24" y="32" width="16" height="8" rx="1" fill="#fff" opacity="0.9" />
    <rect x="26" y="34.5" width="12" height="1.6" rx="0.8" fill={OUTLINE} opacity="0.7" />
    <rect x="26" y="37" width="8" height="1.6" rx="0.8" fill={OUTLINE} opacity="0.45" />
  </g>
);

// ── FM200 SYSTEM ───────────────────────────────────────────────────────────
// A whole suppression skid: a bank of cylinders on a common manifold feeding
// a ceiling nozzle, with the release control head.
const FM200SystemIcon = ({ color = "#f39c12" }) => (
  <g>
    {/* discharge nozzle */}
    <path d="M32 6 v5" stroke={OUTLINE} strokeWidth="2.2" strokeLinecap="round" />
    <path d="M26 11 h12 l-3 4 h-6 z" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="1" />
    <path d="M25 20 q2 -3 4 -4 M32 21 v-5 M39 20 q-2 -3 -4 -4"
          fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
    {/* manifold */}
    <rect x="9" y="24" width="46" height="4" rx="2" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="1" />
    <path d="M32 24 v-9" stroke={OUTLINE} strokeWidth="2.2" />
    {/* three cylinders */}
    {[15, 32, 49].map((cx) => (
      <g key={cx}>
        <rect x={cx - 3} y="28" width="6" height="4" rx="1" fill={SHELL_DARK} />
        <rect x={cx - 6.5} y="31" width="13" height="21" rx="5" fill={color} stroke={OUTLINE} strokeWidth="1.2" />
        <rect x={cx - 4.8} y="33" width="2.8" height="17" rx="1.4" fill="#fff" opacity="0.22" />
        <rect x={cx - 4} y="38" width="8" height="5" rx="0.8" fill="#fff" opacity="0.88" />
      </g>
    ))}
    {/* release control head */}
    <rect x="24" y="53" width="16" height="8" rx="1.2" fill="#0f172a" stroke={OUTLINE} strokeWidth="0.9" />
    <rect x="26" y="55" width="6" height="4" rx="0.6" fill="#ef4444" />
    <circle cx="36" cy="57" r="1.5" fill="#22c55e" />
    {/* floor rail */}
    <rect x="7" y="52" width="15" height="3" rx="1" fill={OUTLINE} />
    <rect x="42" y="52" width="15" height="3" rx="1" fill={OUTLINE} />
  </g>
);

// ── DOOR ───────────────────────────────────────────────────────────────────
// Access-controlled door: frame, leaf with a vision panel, lever handle,
// three hinges, a maglock at the head and the threshold.
const DoorIcon = ({ color = "#92400e" }) => (
  <g>
    {/* frame */}
    <rect x="12" y="5" width="40" height="52" rx="1.5" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="1.2" />
    {/* maglock + armature */}
    <rect x="22" y="7" width="20" height="4" rx="1" fill="#0f172a" />
    <circle cx="44" cy="9" r="1.4" fill="#22c55e" />
    {/* leaf */}
    <rect x="16" y="11" width="32" height="42" rx="1" fill={color} opacity="0.55" stroke={OUTLINE} strokeWidth="1.1" />
    <rect x="19" y="14" width="26" height="36" rx="1" fill={color} opacity="0.35" />
    {/* vision panel */}
    <rect x="23" y="17" width="18" height="14" rx="1" fill="#bae6fd" opacity="0.55" stroke={OUTLINE} strokeWidth="1" />
    <path d="M25 30 l7 -11 M31 30 l7 -11" stroke="#fff" strokeWidth="1.2" opacity="0.5" />
    {/* lever handle + escutcheon */}
    <rect x="18.5" y="31" width="3" height="9" rx="1.5" fill={SHELL} stroke={OUTLINE} strokeWidth="0.8" />
    <rect x="17" y="34.5" width="8" height="2.6" rx="1.3" fill={SHELL_LIGHT} stroke={OUTLINE} strokeWidth="0.8" />
    {/* hinges */}
    {[15, 32, 49].map((cy) => (
      <rect key={cy} x="46.5" y={cy - 2.5} width="3" height="5" rx="1" fill={SHELL} stroke={OUTLINE} strokeWidth="0.7" />
    ))}
    {/* threshold */}
    <rect x="12" y="53" width="40" height="4" rx="1" fill={OUTLINE} />
  </g>
);

// ── STAIRS & RAMP ──────────────────────────────────────────────────────────
// The loading-bay approach: a flight of steps with a handrail on one side and
// the accessibility ramp running up beside it.
const StairsIcon = ({ color = "#854d0e" }) => (
  <g>
    {/* ramp */}
    <path d="M6 52 L34 22 L40 22 L40 52 Z" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M9 51 L34 24" stroke={color} strokeWidth="1.6" opacity="0.7" strokeLinecap="round" />
    {/* steps */}
    {[0, 1, 2, 3, 4].map((i) => (
      <g key={i}>
        <rect x={40} y={46 - i * 6} width={18} height="6" fill={i % 2 ? SHELL : SHELL_LIGHT} stroke={OUTLINE} strokeWidth="1" />
      </g>
    ))}
    {/* nosing strips */}
    {[0, 1, 2, 3, 4].map((i) => (
      <rect key={`n${i}`} x={40} y={46 - i * 6} width="18" height="1.3" rx="0.5" fill={color} opacity="0.6" />
    ))}
    {/* handrail */}
    <path d="M38 40 L58 16" stroke={OUTLINE} strokeWidth="2.2" strokeLinecap="round" />
    <path d="M38 40 v10 M48 28 v22 M58 16 v14" stroke={OUTLINE} strokeWidth="1.8" strokeLinecap="round" />
    {/* platform edge */}
    <rect x="6" y="52" width="52" height="4" rx="1" fill={OUTLINE} />
  </g>
);

// ── BATTERY BANK ───────────────────────────────────────────────────────────
// VRLA battery rack: tiers of blocks on open shelves, linked by inter-cell
// straps, with the DC isolator at the end of the run.
const BatteryIcon = ({ color = "#059669" }) => (
  <g>
    {/* rack uprights */}
    <rect x="7" y="8" width="4" height="48" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.9" />
    <rect x="53" y="8" width="4" height="48" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.9" />
    {/* three shelves of blocks */}
    {[0, 1, 2].map((r) => (
      <g key={`s${r}`}>
        <rect x="9" y={22 + r * 12} width="46" height="3" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.8" />
        {[0, 1, 2, 3].map((c) => (
          <g key={c}>
            <rect x={11 + c * 11} y={11 + r * 12} width="9.5" height="11" rx="1"
                  fill={SHELL_LIGHT} stroke={OUTLINE} strokeWidth="0.9" />
            {/* terminals */}
            <rect x={12.4 + c * 11} y={9.6} width="2.4" height="1.8" rx="0.6" fill={color}
                  transform={`translate(0 ${r * 12})`} />
            <rect x={17 + c * 11} y={9.6} width="2.4" height="1.8" rx="0.6" fill="#ef4444"
                  transform={`translate(0 ${r * 12})`} />
            {/* cell vents */}
            <rect x={12.6 + c * 11} y={14 + r * 12} width="6.4" height="1.4" rx="0.6" fill={VENT} />
            <rect x={12.6 + c * 11} y={17 + r * 12} width="4.4" height="1.4" rx="0.6" fill={VENT} opacity="0.6" />
          </g>
        ))}
        {/* inter-cell straps */}
        {[0, 1, 2].map((c) => (
          <rect key={`t${c}`} x={18.2 + c * 11} y={9.8 + r * 12} width="5" height="1.4" rx="0.7" fill={OUTLINE} />
        ))}
      </g>
    ))}
    {/* DC isolator */}
    <rect x="22" y="47" width="20" height="8" rx="1.2" fill="#0f172a" stroke={OUTLINE} strokeWidth="0.9" />
    <rect x="24" y="49" width="7" height="4" rx="0.6" fill={color} />
    <circle cx="38" cy="51" r="1.6" fill="#ef4444" />
  </g>
);

// ── iPDU (rack power strip) ────────────────────────────────────────────────
// Vertical intelligent rack PDU: metered head, a column of switched C13
// outlets and the branch breakers down the side.
const IPDUIcon = ({ color = "#1abc9c" }) => (
  <g>
    <rect x="24" y="4" width="16" height="56" rx="2" fill="#3a4657" stroke={OUTLINE} strokeWidth="1.2" />
    {/* metering head */}
    <rect x="26" y="6" width="12" height="9" rx="1.2" fill="#0f172a" />
    <rect x="27.4" y="7.6" width="9" height="3.4" rx="0.6" fill={color} />
    <circle cx="29" cy="13" r="0.9" fill="#22c55e" />
    <circle cx="32" cy="13" r="0.9" fill="#22c55e" />
    <circle cx="35" cy="13" r="0.9" fill="#facc15" />
    {/* outlet column */}
    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
      <g key={i}>
        <rect x="26.5" y={18 + i * 5.8} width="11" height="4.6" rx="0.9" fill="#141a24" stroke="#0b0f16" strokeWidth="0.4" />
        <rect x="28" y={19.4 + i * 5.8} width="1.6" height="1.9" rx="0.4" fill={SHELL_DARK} />
        <rect x="30.8" y={19.4 + i * 5.8} width="1.6" height="1.9" rx="0.4" fill={SHELL_DARK} />
        <rect x="33.6" y={19.4 + i * 5.8} width="1.6" height="1.9" rx="0.4" fill={SHELL_DARK} />
        <circle cx="36" cy={20.3 + i * 5.8} r="0.7" fill={color} />
      </g>
    ))}
    {/* branch breakers on the flank */}
    {[0, 1, 2].map((i) => (
      <rect key={`b${i}`} x="40" y={20 + i * 9} width="4.5" height="6" rx="1" fill={SHELL} stroke={OUTLINE} strokeWidth="0.8" />
    ))}
    {/* supply cord */}
    <path d="M32 60 q-6 3 -12 2" fill="none" stroke={OUTLINE} strokeWidth="2.2" strokeLinecap="round" />
  </g>
);

// ── BUSWAY / POWER SOURCE ──────────────────────────────────────────────────
// Overhead busbar trunking: the suspended housing run, a joint pack, the
// tap-off slots along its length and the incoming feed elbow.
const BuswayIcon = ({ color = "#eab308" }) => (
  <g>
    {/* hangers */}
    <rect x="15" y="6" width="3" height="12" rx="1" fill={OUTLINE} />
    <rect x="46" y="6" width="3" height="12" rx="1" fill={OUTLINE} />
    <rect x="10" y="5" width="14" height="3" rx="1" fill={OUTLINE} />
    <rect x="41" y="5" width="14" height="3" rx="1" fill={OUTLINE} />
    {/* trunking run */}
    <rect x="5" y="18" width="54" height="16" rx="2" fill={SHELL} stroke={OUTLINE} strokeWidth="1.3" />
    <rect x="5" y="18" width="54" height="4" rx="1.5" fill={SHELL_LIGHT} />
    {/* live conductors seen through the housing */}
    {[0, 1, 2].map((i) => (
      <rect key={i} x="8" y={23 + i * 3.2} width="48" height="2" rx="1"
            fill={i === 2 ? color : "#94a3b8"} opacity={i === 2 ? 0.95 : 0.75} />
    ))}
    {/* joint pack */}
    <rect x="29" y="16" width="7" height="20" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="1" />
    <circle cx="32.5" cy="20" r="1.1" fill={OUTLINE} />
    <circle cx="32.5" cy="32" r="1.1" fill={OUTLINE} />
    {/* tap-off slots */}
    {[12, 21, 44, 53].map((cx) => (
      <rect key={cx} x={cx - 3} y="34" width="6" height="3" rx="1" fill="#0f172a" />
    ))}
    {/* incoming feed elbow */}
    <path d="M59 26 h4 v22" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    {/* lightning mark on the run */}
    <path d="M20 40 l6 0 l-2.5 5 l5 0 l-8 9 l2.5 -7 l-5 0 z" fill={color} stroke={OUTLINE} strokeWidth="0.7" strokeLinejoin="round" />
  </g>
);

// ── TAP-OFF BOX ────────────────────────────────────────────────────────────
// The plug-in box that hangs off a busway: locking handle, output socket and
// the flexible drop cable to the rack.
const TapOffIcon = ({ color = "#2563eb" }) => (
  <g>
    {/* busway stub it plugs into */}
    <rect x="6" y="8" width="52" height="9" rx="1.5" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="1.1" />
    {[0, 1, 2].map((i) => (
      <rect key={i} x="9" y={10 + i * 2.4} width="46" height="1.4" rx="0.7" fill={VENT} />
    ))}
    {/* plug-in stab */}
    <rect x="27" y="17" width="10" height="4" rx="1" fill={OUTLINE} />
    {/* box body */}
    <rect x="18" y="21" width="28" height="26" rx="2" fill={SHELL} stroke={OUTLINE} strokeWidth="1.3" />
    <rect x="20.5" y="23.5" width="23" height="21" rx="1.5" fill={SHELL_LIGHT} />
    {/* rotary isolator handle */}
    <circle cx="27" cy="30" r="4.6" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="1" />
    <rect x="26" y="26.5" width="2" height="5" rx="1" fill={color} transform="rotate(35 27 30)" />
    {/* ON/OFF marks */}
    <circle cx="34" cy="27" r="1.2" fill="#22c55e" />
    <circle cx="34" cy="33" r="1.2" fill="#ef4444" />
    {/* output socket */}
    <rect x="38" y="26" width="5" height="9" rx="1" fill="#0f172a" />
    {/* breaker window */}
    <rect x="22" y="37" width="20" height="5" rx="0.8" fill={color} opacity="0.85" />
    {/* drop cable */}
    <path d="M32 47 q1 8 -6 10 t-8 4" fill="none" stroke={OUTLINE} strokeWidth="2.6" strokeLinecap="round" />
    <rect x="15" y="58" width="7" height="4" rx="1" fill={OUTLINE} />
  </g>
);

// ── BR (BREAKER) ───────────────────────────────────────────────────────────
// Moulded-case breaker enclosure: hinged lid open onto the MCCB, its trip
// toggle mid-travel, arc chutes and the ON/OFF legend.
const BreakerIcon = ({ color = "#991b1b" }) => (
  <g>
    <rect x="12" y="7" width="40" height="50" rx="2.5" fill={SHELL} stroke={OUTLINE} strokeWidth="1.3" />
    <rect x="15" y="10" width="34" height="44" rx="1.5" fill={SHELL_LIGHT} stroke={OUTLINE} strokeWidth="0.8" />
    {/* the MCCB itself */}
    <rect x="20" y="16" width="24" height="32" rx="1.5" fill="#2a323f" stroke={OUTLINE} strokeWidth="1.1" />
    {/* arc chute vents */}
    {[0, 1, 2].map((i) => (
      <rect key={i} x={22 + i * 7.4} y="18" width="5.4" height="4" rx="0.8" fill="#0b0f16" />
    ))}
    {/* toggle */}
    <rect x="28" y="26" width="8" height="12" rx="2" fill={SHELL_LIGHT} stroke={OUTLINE} strokeWidth="1" />
    <rect x="30" y="28" width="4" height="6" rx="1.5" fill={color} />
    {/* ON / OFF legend */}
    <rect x="22" y="27" width="4" height="2" rx="1" fill="#22c55e" />
    <rect x="38" y="35" width="4" height="2" rx="1" fill="#ef4444" />
    {/* line + load terminals */}
    {[0, 1, 2].map((i) => (
      <g key={`t${i}`}>
        <rect x={22.5 + i * 7} y="12.5" width="4" height="3.5" rx="0.6" fill="#b87333" />
        <rect x={22.5 + i * 7} y="48" width="4" height="3.5" rx="0.6" fill="#b87333" />
      </g>
    ))}
    {/* rating label + fixings */}
    <rect x="20" y="41" width="24" height="5" rx="0.8" fill={color} opacity="0.8" />
    <circle cx="15.5" cy="10.5" r="1" fill={OUTLINE} />
    <circle cx="48.5" cy="10.5" r="1" fill={OUTLINE} />
    <circle cx="15.5" cy="53.5" r="1" fill={OUTLINE} />
    <circle cx="48.5" cy="53.5" r="1" fill={OUTLINE} />
  </g>
);

// ── UPS / WLD PANEL (water-leak detection) ─────────────────────────────────
// Leak-detection controller: zone map on the display, alarm beacon, and the
// sensing cable looping out of the gland at the bottom.
const WLDPanelIcon = ({ color = "#0e7490" }) => (
  <g>
    {/* alarm beacon */}
    <path d="M28 4 h8 l1.5 5 h-11 z" fill="#ef4444" stroke={OUTLINE} strokeWidth="0.9" strokeLinejoin="round" />
    <rect x="30" y="9" width="4" height="3" rx="1" fill={OUTLINE} />
    {/* enclosure */}
    <rect x="13" y="12" width="38" height="40" rx="2.5" fill={SHELL} stroke={OUTLINE} strokeWidth="1.3" />
    <rect x="16" y="15" width="32" height="34" rx="1.5" fill={SHELL_LIGHT} stroke={OUTLINE} strokeWidth="0.8" />
    {/* zone display */}
    <rect x="19" y="18" width="26" height="14" rx="1.2" fill="#0f172a" />
    <path d="M32 21.5 c3.2 3.4 5 5.4 5 7.2 a5 5 0 0 1 -10 0 c0 -1.8 1.8 -3.8 5 -7.2 z"
          fill={color} stroke="#0ea5e9" strokeWidth="0.8" />
    <ellipse cx="30" cy="28" rx="1.1" ry="1.5" fill="#fff" opacity="0.6" />
    {/* zone LEDs */}
    {[0, 1, 2, 3].map((i) => (
      <circle key={i} cx={21.5 + i * 7} cy="37" r="1.9"
              fill={i === 1 ? "#ef4444" : "#22c55e"} opacity={i === 1 ? 1 : 0.8} />
    ))}
    {/* mute / test buttons */}
    <rect x="19" y="42" width="11" height="4.5" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.7" />
    <rect x="34" y="42" width="11" height="4.5" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.7" />
    {/* gland + sensing cable loop under the floor */}
    <rect x="29" y="52" width="6" height="3.5" rx="1" fill={OUTLINE} />
    <path d="M32 55.5 q-12 2 -14 6 M32 55.5 q12 2 14 6" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </g>
);

// ── EMERGENCY EXIT SIGN ────────────────────────────────────────────────────
// Maintained exit luminaire on its ceiling bracket: the running-man pictogram,
// the direction arrow and the green "mains healthy" pilot.
const ExitSignIcon = ({ color = "#16a34a" }) => (
  <g>
    {/* ceiling bracket */}
    <rect x="20" y="4" width="24" height="3" rx="1" fill={OUTLINE} />
    <rect x="30.5" y="7" width="3" height="7" rx="1" fill={OUTLINE} />
    {/* sign body */}
    <rect x="6" y="14" width="52" height="26" rx="3" fill="#16a34a" stroke="#14532d" strokeWidth="1.4" />
    <rect x="8.5" y="16.5" width="47" height="21" rx="2" fill="#22c55e" />
    {/* running man */}
    <circle cx="19" cy="22" r="2.9" fill="#fff" />
    <path d="M20 25.5 l-3.5 5 l1.5 4.5 M20 25.5 l3.5 3 l0.5 4"
          fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18 30.5 l-3.5 4.5 M20.5 27 l-4.5 -1.5"
          fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
    {/* doorway the figure is running through */}
    <path d="M28 17.5 v19 h6" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round" opacity="0.9" />
    {/* direction arrow */}
    <path d="M38 27 h9 m-3 -4 l4 4 l-4 4" fill="none" stroke="#fff" strokeWidth="2.6"
          strokeLinecap="round" strokeLinejoin="round" />
    {/* mains-healthy pilot + battery pack below */}
    <circle cx="53" cy="19.5" r="1.6" fill="#bbf7d0" />
    <rect x="18" y="40" width="28" height="7" rx="1.5" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="1" />
    <rect x="21" y="42" width="12" height="3" rx="1" fill={color} />
    <circle cx="41" cy="43.5" r="1.4" fill="#22c55e" />
  </g>
);


// ═══════════════════════════════════════════════════════════════════════════
// TIER III NETWORK ROOM — the deployment chain from the reference diagram:
// Internet/WAN → ISP Uplink → Core Router → Firewall → Distribution Switch →
// Access Switch (ToR) → Server & Storage Racks, plus the passive gear
// (ODF, patch panel) and the appliances that hang off it (IPS, LB, OOB).
// ═══════════════════════════════════════════════════════════════════════════

// ── INTERNET / WAN ─────────────────────────────────────────────────────────
// The demarcation cloud: globe inside a carrier cloud, with the two entry
// paths that split toward ISP A and ISP B.
const WanIcon = ({ color = "#0ea5e9" }) => (
  <g>
    <path d="M17 38 a9 9 0 0 1 1.6 -17.8 a12 12 0 0 1 22.6 -3.4 a9.5 9.5 0 0 1 5.4 17.6 z"
          fill={SHELL_LIGHT} stroke={OUTLINE} strokeWidth="1.6" strokeLinejoin="round" />
    <circle cx="30" cy="24" r="7.5" fill="none" stroke={color} strokeWidth="1.6" />
    <ellipse cx="30" cy="24" rx="3.2" ry="7.5" fill="none" stroke={color} strokeWidth="1.2" />
    <path d="M22.7 21.5 h14.6 M22.7 26.5 h14.6" stroke={color} strokeWidth="1.2" />
    {/* dual entries down to the ISP layer */}
    <path d="M24 38 v6 l-8 6" fill="none" stroke={OUTLINE} strokeWidth="2" strokeLinecap="round" />
    <path d="M40 38 v6 l8 6" fill="none" stroke={OUTLINE} strokeWidth="2" strokeLinecap="round" />
    <circle cx="16" cy="51" r="2.6" fill={color} stroke={OUTLINE} strokeWidth="1" />
    <circle cx="48" cy="51" r="2.6" fill={color} stroke={OUTLINE} strokeWidth="1" />
  </g>
);

// ── ISP UPLINK / CPE ───────────────────────────────────────────────────────
// The carrier's edge device: a small 1U CPE with a WAN port lit, a signal
// fan above it, and the "A/B" carrier tag.
const IspUplinkIcon = ({ color = "#0284c7" }) => (
  <g>
    {/* carrier signal */}
    <path d="M24 15 a11 11 0 0 1 16 0" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" opacity="0.45" />
    <path d="M27 19 a7 7 0 0 1 10 0" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
    <circle cx="32" cy="23" r="2" fill={color} />
    <rect x="10" y="28" width="44" height="17" rx="2" fill="#3a4657" stroke={OUTLINE} strokeWidth="1.3" />
    <rect x="10" y="28" width="44" height="3" rx="1" fill="#4b5a6e" />
    {/* WAN port, lit */}
    <rect x="14" y="35" width="9" height="6.5" rx="0.8" fill="#0b0f16" stroke="#000" strokeWidth="0.4" />
    <rect x="15.4" y="36.4" width="6.2" height="3.6" rx="0.5" fill={color} />
    <text x="18.5" y="49.5" fontSize="6.5" fontWeight="700" fill={color}
          textAnchor="middle" fontFamily="system-ui">WAN</text>
    {/* LAN ports */}
    {[0, 1, 2, 3].map((i) => (
      <rect key={i} x={28 + i * 6} y="35.5" width="4.4" height="5.5" rx="0.6" fill="#141a24" />
    ))}
    <circle cx="51" cy="33" r="1.5" fill="#22c55e" />
  </g>
);

// ── CORE ROUTER ────────────────────────────────────────────────────────────
// A big chassis router: multiple line cards, a routing-engine badge and the
// route arrows that say "this thing forwards between networks".
const CoreRouterIcon = ({ color = "#ef4444" }) => (
  <g>
    <rect x="4" y="17" width="6" height="30" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.9" />
    <rect x="54" y="17" width="6" height="30" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.9" />
    <rect x="9" y="16" width="46" height="32" rx="2" fill="#3a4657" stroke={OUTLINE} strokeWidth="1.3" />
    <rect x="9" y="16" width="46" height="3.4" rx="1" fill="#4b5a6e" />
    {/* line cards */}
    {[0, 1, 2].map((r) => (
      <g key={r}>
        <rect x="12" y={22 + r * 8} width="40" height="6.4" rx="0.9"
              fill="#222c3a" stroke="#0b0f16" strokeWidth="0.5" />
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={i} x={14 + i * 4.6} y={23.6 + r * 8} width="2.8" height="3.4" rx="0.4"
                fill="#0b0f16" />
        ))}
        <circle cx={49} cy={25.2 + r * 8} r="1" fill={r === 0 ? "#22c55e" : color} />
      </g>
    ))}
    {/* routing badge */}
    <path d="M17 52 h12 m-3.5 -3.5 l3.5 3.5 l-3.5 3.5" fill="none" stroke={color}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M47 52 h-12 m3.5 -3.5 l-3.5 3.5 l3.5 3.5" fill="none" stroke={color}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
  </g>
);

// ── DISTRIBUTION / AGGREGATION SWITCH ──────────────────────────────────────
// Deeper chassis than a ToR, two full port rows and a stack of uplink SFPs
// on the right — the visual cue for "aggregation".
const DistSwitchIcon = ({ color = "#8b5cf6" }) => (
  <g>
    <rect x="4" y="20" width="6" height="24" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.9" />
    <rect x="54" y="20" width="6" height="24" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.9" />
    <rect x="9" y="19" width="46" height="26" rx="1.8" fill="#3a4657" stroke={OUTLINE} strokeWidth="1.3" />
    <rect x="9" y="19" width="46" height="3" rx="1" fill="#4b5a6e" />
    {[0, 1].map((r) => (
      <g key={r}>
        {Array.from({ length: 9 }).map((_, i) => (
          <rect key={i} x={12.5 + i * 3.9} y={25 + r * 8} width="3" height="5" rx="0.5" fill="#141a24" />
        ))}
        {Array.from({ length: 9 }).map((_, i) => (
          <circle key={`d${i}`} cx={14 + i * 3.9} cy={23.8 + r * 8} r="0.75"
                  fill={i % 3 === 0 ? "#22c55e" : color} opacity={i % 2 ? 0.9 : 0.55} />
        ))}
      </g>
    ))}
    {/* uplink SFP stack */}
    <rect x="48" y="24" width="5.5" height="17" rx="0.8" fill="#0b0f16" />
    {[0, 1, 2].map((i) => (
      <rect key={i} x="49" y={25.5 + i * 5} width="3.5" height="3.4" rx="0.4"
            fill={color} opacity={0.4 + i * 0.3} />
    ))}
    {/* peer-link between A and B */}
    <path d="M14 51 h36" stroke={color} strokeWidth="1.6" strokeDasharray="3 3" strokeLinecap="round" />
    <circle cx="14" cy="51" r="2" fill={color} />
    <circle cx="50" cy="51" r="2" fill={color} />
  </g>
);

// ── ACCESS / TOP-OF-RACK SWITCH ────────────────────────────────────────────
// A shallow 1U switch sitting on the rack lip, with the two dual-home uplinks
// leaving the top — the defining feature of a Tier III ToR.
const TorSwitchIcon = ({ color = "#6366f1" }) => (
  <g>
    {/* dual-homed uplinks */}
    <path d="M22 24 l-6 -9" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M42 24 l6 -9" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="16" cy="14" r="2.4" fill={color} stroke={OUTLINE} strokeWidth="0.8" />
    <circle cx="48" cy="14" r="2.4" fill={color} stroke={OUTLINE} strokeWidth="0.8" />
    <rect x="4" y="24" width="6" height="13" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.9" />
    <rect x="54" y="24" width="6" height="13" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.9" />
    <rect x="9" y="24" width="46" height="13" rx="1.6" fill="#3a4657" stroke={OUTLINE} strokeWidth="1.3" />
    <rect x="9" y="24" width="46" height="2.6" rx="1" fill="#4b5a6e" />
    {Array.from({ length: 12 }).map((_, i) => (
      <rect key={i} x={12 + i * 3.5} y="29.5" width="2.6" height="4.6" rx="0.5" fill="#141a24" />
    ))}
    {Array.from({ length: 12 }).map((_, i) => (
      <circle key={`d${i}`} cx={13.3 + i * 3.5} cy="28.4" r="0.7"
              fill={i % 3 === 0 ? "#22c55e" : color} opacity={i % 2 ? 0.9 : 0.55} />
    ))}
    {/* the rack it caps */}
    <rect x="13" y="39" width="38" height="17" rx="1.4" fill={SHELL} stroke={OUTLINE} strokeWidth="1.2" />
    {[0, 1, 2].map((i) => (
      <rect key={i} x="16" y={41.5 + i * 4.6} width="32" height="3.2" rx="0.6" fill={VENT} opacity="0.55" />
    ))}
  </g>
);

// ── LOAD BALANCER ──────────────────────────────────────────────────────────
// One flow in, three flows out — the whole idea of an ADC in one glyph.
const LoadBalancerIcon = ({ color = "#0d9488" }) => (
  <g>
    <rect x="9" y="24" width="46" height="15" rx="1.8" fill="#3a4657" stroke={OUTLINE} strokeWidth="1.3" />
    <rect x="9" y="24" width="46" height="2.8" rx="1" fill="#4b5a6e" />
    <rect x="4" y="26" width="6" height="11" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.9" />
    <rect x="54" y="26" width="6" height="11" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.9" />
    {/* the balance beam */}
    <path d="M20 33 h24" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="32" cy="33" r="2.4" fill={color} />
    <path d="M20 33 v3.5 M44 33 v3.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    {/* one in */}
    <path d="M32 12 v9" stroke={OUTLINE} strokeWidth="2" strokeLinecap="round" />
    <circle cx="32" cy="10" r="2.6" fill={color} stroke={OUTLINE} strokeWidth="1" />
    {/* three out */}
    <path d="M32 40 v4 M18 52 v-4 q0 -4 4 -4 h20 q4 0 4 4 v4" fill="none"
          stroke={OUTLINE} strokeWidth="1.8" strokeLinecap="round" />
    {[18, 32, 46].map((x) => (
      <rect key={x} x={x - 4} y="52" width="8" height="7" rx="1"
            fill={SHELL} stroke={OUTLINE} strokeWidth="1" />
    ))}
  </g>
);

// ── IDS / IPS ──────────────────────────────────────────────────────────────
// Appliance with an inspection lens over the traffic lane.
const IdsIpsIcon = ({ color = "#f43f5e" }) => (
  <g>
    <rect x="9" y="26" width="46" height="17" rx="1.8" fill="#3a4657" stroke={OUTLINE} strokeWidth="1.3" />
    <rect x="9" y="26" width="46" height="3" rx="1" fill="#4b5a6e" />
    <rect x="4" y="28" width="6" height="13" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.9" />
    <rect x="54" y="28" width="6" height="13" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.9" />
    {/* traffic lane */}
    <path d="M13 35 h38" stroke={color} strokeWidth="1.6" strokeDasharray="4 3" strokeLinecap="round" opacity="0.7" />
    {/* inspection lens */}
    <circle cx="32" cy="34.5" r="7.5" fill="#0b0f16" fillOpacity="0.55" stroke={color} strokeWidth="2" />
    <path d="M37.4 39.9 l5.4 5.4" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
    <path d="M28.5 34.5 l2.6 2.8 l4.6 -5.6" fill="none" stroke="#fff" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round" />
    <text x="32" y="53" fontSize="8" fontWeight="700" fill={color}
          textAnchor="middle" fontFamily="system-ui">IPS</text>
  </g>
);

// ── PATCH PANEL ────────────────────────────────────────────────────────────
// Passive 24-port copper panel with the numbering strip.
const PatchPanelIcon = ({ color = "#64748b" }) => (
  <g>
    <rect x="4" y="22" width="6" height="21" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.9" />
    <rect x="54" y="22" width="6" height="21" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.9" />
    <rect x="9" y="21" width="46" height="23" rx="1.6" fill={SHELL} stroke={OUTLINE} strokeWidth="1.3" />
    {[0, 1].map((r) => (
      <g key={r}>
        {Array.from({ length: 12 }).map((_, i) => (
          <rect key={i} x={11.6 + i * 3.6} y={24.5 + r * 9} width="2.8" height="6" rx="0.5"
                fill="#1e293b" stroke={OUTLINE} strokeWidth="0.4" />
        ))}
        <rect x="11" y={31 + r * 9} width="42" height="1.6" rx="0.4" fill={color} opacity="0.5" />
      </g>
    ))}
    {/* patch cords hanging out */}
    <path d="M16 44 q2 8 8 10 M28 44 q1 8 6 10 M42 44 q-1 8 -6 10" fill="none"
          stroke={color} strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
  </g>
);

// ── FIBER ODF (OPTICAL DISTRIBUTION FRAME) ─────────────────────────────────
// Splice tray drawer with LC duplex adapters and the fiber coils behind them.
const OdfIcon = ({ color = "#06b6d4" }) => (
  <g>
    <rect x="4" y="20" width="6" height="25" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.9" />
    <rect x="54" y="20" width="6" height="25" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.9" />
    <rect x="9" y="19" width="46" height="26" rx="1.6" fill={SHELL_LIGHT} stroke={OUTLINE} strokeWidth="1.3" />
    {/* pulled-out splice drawer */}
    <rect x="12" y="22.5" width="40" height="10" rx="1" fill={SHELL} stroke={OUTLINE} strokeWidth="1" />
    {/* fiber coils */}
    <path d="M18 27.5 a4 2.6 0 1 0 8 0 a4 2.6 0 1 0 -8 0" fill="none" stroke={color} strokeWidth="1.1" />
    <path d="M22 27.5 a6 3.6 0 1 0 12 0 a6 3.6 0 1 0 -12 0" fill="none" stroke={color} strokeWidth="0.9" opacity="0.7" />
    {/* LC duplex adapter row */}
    {Array.from({ length: 8 }).map((_, i) => (
      <g key={i}>
        <rect x={12.5 + i * 5} y="35" width="4" height="7" rx="0.6" fill="#0f172a" stroke={OUTLINE} strokeWidth="0.4" />
        <rect x={13.3 + i * 5} y="36.4" width="2.4" height="2" rx="0.3" fill={color} />
        <rect x={13.3 + i * 5} y="39.2" width="2.4" height="2" rx="0.3" fill={color} opacity="0.55" />
      </g>
    ))}
    {/* carrier fiber entering */}
    <path d="M10 52 q14 -4 26 0 q10 3 18 -2" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="10" cy="52" r="2" fill={color} />
  </g>
);

// ── CONSOLE / OUT-OF-BAND SERVER ───────────────────────────────────────────
// Terminal server: serial port bank plus a console prompt on the face.
const ConsoleServerIcon = ({ color = "#a3e635" }) => (
  <g>
    <rect x="4" y="24" width="6" height="17" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.9" />
    <rect x="54" y="24" width="6" height="17" rx="1" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.9" />
    <rect x="9" y="23" width="46" height="19" rx="1.8" fill="#3a4657" stroke={OUTLINE} strokeWidth="1.3" />
    <rect x="9" y="23" width="46" height="3" rx="1" fill="#4b5a6e" />
    {/* console prompt window */}
    <rect x="12.5" y="28" width="18" height="11" rx="1" fill="#0b0f16" stroke="#000" strokeWidth="0.4" />
    <path d="M15 32 l2.6 2.2 l-2.6 2.2" fill="none" stroke={color} strokeWidth="1.4"
          strokeLinecap="round" strokeLinejoin="round" />
    <rect x="19.5" y="35.4" width="7" height="1.6" rx="0.6" fill={color} opacity="0.8" />
    {/* serial bank */}
    {Array.from({ length: 6 }).map((_, i) => (
      <rect key={i} x={33 + i * 3.4} y="29.5" width="2.4" height="8" rx="0.5" fill="#141a24" />
    ))}
    <circle cx="52" cy="27" r="1.4" fill="#22c55e" />
    {/* the OOB path, deliberately separate from the data path */}
    <path d="M14 48 h36" stroke={color} strokeWidth="1.6" strokeDasharray="2 3" strokeLinecap="round" />
    <text x="32" y="57" fontSize="7" fontWeight="700" fill={color}
          textAnchor="middle" fontFamily="system-ui">OUT-OF-BAND</text>
  </g>
);

// ── NETWORK RACK ───────────────────────────────────────────────────────────
// A comms cabinet: mesh door, horizontal cable managers between each active
// device — visibly different from a compute rack full of servers.
const NetworkRackIcon = ({ color = "#4f46e5" }) => (
  <g>
    <rect x="12" y="8" width="40" height="50" rx="2.5" fill={SHELL} stroke={OUTLINE} strokeWidth="1.5" />
    <rect x="12" y="8" width="40" height="4" rx="1.5" fill={SHELL_DARK} />
    {/* mesh door hint */}
    <rect x="15" y="13" width="34" height="42" rx="1.5" fill={SHELL_LIGHT} stroke={OUTLINE} strokeWidth="0.8" />
    {/* switch, cable manager, switch, cable manager, patch */}
    {[0, 1, 2].map((i) => (
      <g key={i}>
        <rect x="17.5" y={16 + i * 12} width="29" height="6" rx="0.8" fill="#3a4657" stroke={OUTLINE} strokeWidth="0.6" />
        {Array.from({ length: 8 }).map((_, p) => (
          <rect key={p} x={19 + p * 3.4} y={17.5 + i * 12} width="2.2" height="3" rx="0.3" fill="#141a24" />
        ))}
        <circle cx="44" cy={17.6 + i * 12} r="0.9" fill={i === 0 ? "#22c55e" : color} />
        {/* horizontal cable manager below each */}
        <rect x="17.5" y={23 + i * 12} width="29" height="3.6" rx="0.8" fill={SHELL_DARK} stroke={OUTLINE} strokeWidth="0.5" />
        {Array.from({ length: 5 }).map((_, f) => (
          <rect key={`f${f}`} x={19.5 + f * 5.8} y={23.6 + i * 12} width="2.6" height="2.4" rx="0.4"
                fill={color} opacity="0.55" />
        ))}
      </g>
    ))}
    {/* vertical cable bundle down the side */}
    <path d="M50 14 v40" stroke={color} strokeWidth="2.2" strokeLinecap="round" opacity="0.6" />
    <rect x="18" y="55.5" width="28" height="2.5" rx="0.8" fill={SHELL_DARK} />
  </g>
);

// ── Registry ───────────────────────────────────────────────────────────────
export const DEVICE_ICONS = {
  // power distribution chain
  transformer: TransformerIcon,
  generator:   GeneratorIcon,
  mpp:         MPPIcon,
  pp:          PPIcon,
  ups:         UPSIcon,
  pdu:         PDUIcon,
  rack:        RackIcon,
  // compute & storage
  bladeserver: BladeServerIcon,
  storage:     StorageIcon,
  // cooling & environment
  crac:        CracIcon,
  chiller:     ChillerIcon,
  humidifier:  HumidifierIcon,
  // network
  switch:      SwitchIcon,
  router:      RouterIcon,
  firewall:    FirewallIcon,
  isprack:     ISPRackIcon,
  // network — Tier III deployment chain
  wan:           WanIcon,
  isplink:       IspUplinkIcon,
  corerouter:    CoreRouterIcon,
  distswitch:    DistSwitchIcon,
  torswitch:     TorSwitchIcon,
  loadbalancer:  LoadBalancerIcon,
  idsips:        IdsIpsIcon,
  patchpanel:    PatchPanelIcon,
  odf:           OdfIcon,
  consoleserver: ConsoleServerIcon,
  netrack:       NetworkRackIcon,
  // security & access
  camera:      CameraIcon,
  cardreader:  CardReaderIcon,
  biometric:   BiometricIcon,
  pushbutton:  PushButtonIcon,
  // safety
  fm200:       FM200SystemIcon,
  fm200cyl:    FM200CylinderIcon,
  exitsign:    ExitSignIcon,
  // power distribution accessories
  battery:     BatteryIcon,
  ipdu:        IPDUIcon,
  busway:      BuswayIcon,
  tapoff:      TapOffIcon,
  breaker:     BreakerIcon,
  wldpanel:    WLDPanelIcon,
  // infrastructure
  door:        DoorIcon,
  stairs:      StairsIcon,
};

// Kept as an alias so nothing that imported the original power-chain-only
// registry breaks; the two now point at the same complete map.
export const POWER_CHAIN_ICONS = DEVICE_ICONS;

/**
 * DeviceIcon — renders one of the device SVG icons.
 *
 * @param {string} type  key into DEVICE_ICONS ("transformer", "crac",
 *                       "switch", "camera", "battery", …)
 * @param {number} size  rendered px box (square)
 * @param {string} color accent colour, normally the device's category colour
 *
 * Returns null for an unknown key so callers can fall back to their existing
 * Font Awesome glyph without a special-case check.
 */
export const DeviceIcon = ({ type, size = 22, color = "#38bdf8", style }) => {
  const Shape = DEVICE_ICONS[type];
  if (!Shape) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", pointerEvents: "none", ...style }}
      aria-hidden="true"
      focusable="false"
    >
      <Shape color={color} />
    </svg>
  );
};

// Backwards-compatible alias for the original power-chain-only export.
export const PowerChainIcon = DeviceIcon;

export default DeviceIcon;
