import type { CSSProperties } from 'react';
import type { FabledLabAtmosphere } from '../../shared/labs';

interface FabledAtmosphereProps {
  atmosphere: FabledLabAtmosphere;
  showMascot?: boolean;
}

export function FabledAtmosphere({ atmosphere, showMascot = true }: FabledAtmosphereProps) {
  const style = {
    '--lab-accent': atmosphere.accent,
    '--lab-glow': atmosphere.glow,
    '--lab-deep': atmosphere.deep,
    '--lava-start': atmosphere.lavaStart,
    '--lava-mid': atmosphere.lavaMid,
    '--lava-end': atmosphere.lavaEnd
  } as CSSProperties;

  return (
    <>
      <div className={`fabled-atmosphere fabled-atmosphere-${atmosphere.base}`} style={style} aria-hidden="true">
        <div className="lava-background">
          <span className="lava-blob lava-blob-a" />
          <span className="lava-blob lava-blob-b" />
          <span className="lava-blob lava-blob-c" />
          <span className="lava-blob lava-blob-d" />
          <span className="lava-blob lava-blob-e" />
          <span className="lava-blob lava-blob-f" />
        </div>
      </div>
      {showMascot ? <div className="fabled-mascot-layer" style={style} aria-hidden="true"><MascotMark /></div> : null}
    </>
  );
}

function MascotMark() {
  return (
    <div className="fabled-mascot">
      <svg viewBox="0 0 220 260" role="img" focusable="false">
        <defs>
          <radialGradient id="mascot-glass" cx="50%" cy="42%" r="62%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
            <stop offset="34%" stopColor="#111827" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#030407" stopOpacity="1" />
          </radialGradient>
          <linearGradient id="mascot-mirror" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="46%" stopColor="#d9d9d9" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#2a2f3a" stopOpacity="0.92" />
          </linearGradient>
        </defs>
        <path className="mascot-headband" d="M28 108 C36 36 184 36 192 108" />
        <rect className="mascot-ear mascot-ear-left" x="8" y="111" width="36" height="72" rx="15" />
        <rect className="mascot-ear mascot-ear-right" x="176" y="111" width="36" height="72" rx="15" />
        <line className="mascot-antenna" x1="110" y1="36" x2="110" y2="5" />
        <circle className="mascot-antenna-orb" cx="110" cy="5" r="9" />
        <circle className="mascot-body" cx="110" cy="128" r="82" />
        <path className="mascot-band" d="M34 114 C64 89 156 89 186 114 L186 148 C145 130 75 130 34 148 Z" />
        <circle className="mascot-face" cx="110" cy="132" r="42" />
        <path className="mascot-smile" d="M78 141 C92 168 128 168 142 141" />
        <path className="mascot-eye" d="M71 122 C82 104 99 104 111 121" />
        <path className="mascot-eye" d="M112 121 C124 104 141 105 150 124" />
        <path className="mascot-jet mascot-jet-left" d="M77 200 L52 258 L93 214 Z" />
        <path className="mascot-jet mascot-jet-right" d="M143 200 L168 258 L127 214 Z" />
      </svg>
    </div>
  );
}
