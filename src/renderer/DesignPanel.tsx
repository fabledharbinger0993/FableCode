import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Grid, TransformControls, Plane } from '@react-three/drei';
import * as THREE from 'three';
import {
  BuildSpec,
  Part,
  PartKind,
  PartTransform,
  DEFAULT_HUMANOID,
  loadSpecFromStorage,
  saveSpecToStorage,
  downloadSpecAsJson,
} from '../shared/buildSpec';
import './DesignPanel.css';

// ─── Geometry renderer ───────────────────────────────────────────────────────

function PartGeometry({ kind, args }: { kind: PartKind; args: number[] }) {
  switch (kind) {
    case 'sphere':
      return <sphereGeometry args={args as [number, number, number]} />;
    case 'capsule':
      return <capsuleGeometry args={args as [number, number, number, number]} />;
    case 'box':
      return <boxGeometry args={args as [number, number, number]} />;
    case 'cylinder':
      return <cylinderGeometry args={args as [number, number, number, number]} />;
    default:
      return <boxGeometry args={[0.3, 0.3, 0.3]} />;
  }
}

// ─── Individual Part mesh ─────────────────────────────────────────────────────

interface PartMeshProps {
  part: Part;
  selected: boolean;
  transformMode: 'translate' | 'rotate' | 'scale';
  wireframeAll: boolean;
  onSelect: (id: string) => void;
  onTransformChange: (id: string, t: PartTransform) => void;
}

function PartMeshComponent({
  part,
  selected,
  transformMode,
  wireframeAll,
  onSelect,
  onTransformChange,
}: PartMeshProps) {
  // useRef typed without null so it satisfies RefObject<Group> for TransformControls
  const groupRef = useRef<THREE.Group>(null!);

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onSelect(part.id);
    },
    [part.id, onSelect]
  );

  const handleTransformChange = useCallback(() => {
    const g = groupRef.current;
    if (!g) return;
    onTransformChange(part.id, {
      position: [g.position.x, g.position.y, g.position.z],
      rotation: [g.rotation.x, g.rotation.y, g.rotation.z],
      scale: [g.scale.x, g.scale.y, g.scale.z],
    });
  }, [part.id, onTransformChange]);

  const mat = {
    color: part.material.color,
    roughness: part.material.roughness,
    metalness: part.material.metalness,
    wireframe: wireframeAll || (part.material.wireframe ?? false),
  };

  const group = (
    <group
      ref={groupRef}
      position={part.transform.position}
      rotation={part.transform.rotation}
      scale={part.transform.scale}
    >
      <mesh onClick={handleClick}>
        <PartGeometry kind={part.kind} args={part.geometry.args} />
        <meshStandardMaterial {...mat} />
      </mesh>
    </group>
  );

  if (selected) {
    return (
      <TransformControls
        object={groupRef}
        mode={transformMode}
        onObjectChange={handleTransformChange}
      >
        {group}
      </TransformControls>
    );
  }

  return group;
}

// ─── Reference image plane ────────────────────────────────────────────────────

function ReferencePlane({ dataUrl }: { dataUrl: string }) {
  const texture = useMemo(() => {
    const tex = new THREE.TextureLoader().load(dataUrl);
    return tex;
  }, [dataUrl]);

  return (
    <Plane args={[2.4, 3.2]} position={[0, 0.9, -2.5]}>
      <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
    </Plane>
  );
}

// ─── Spinning accent orb ─────────────────────────────────────────────────────

function AccentOrb() {
  const orbRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!orbRef.current) return;
    const t = state.clock.elapsedTime;
    orbRef.current.position.x = Math.sin(t * 0.7) * 1.1;
    orbRef.current.position.y = 1.4 + Math.cos(t * 0.9) * 0.25;
    orbRef.current.position.z = Math.cos(t * 0.7) * 1.1;
  });
  return (
    <mesh ref={orbRef}>
      <sphereGeometry args={[0.07, 16, 16]} />
      <meshStandardMaterial color="#4fc3f7" emissive="#4fc3f7" emissiveIntensity={1.8} />
    </mesh>
  );
}

// ─── Deselect on background click ────────────────────────────────────────────

function CanvasDeselect({ onDeselect }: { onDeselect: () => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const handler = (e: MouseEvent) => {
      // Only deselect on direct canvas click (not on mesh)
      if (e.target === canvas) onDeselect();
    };
    canvas.addEventListener('click', handler);
    return () => canvas.removeEventListener('click', handler);
  }, [gl, onDeselect]);
  return null;
}

// ─── Scene ────────────────────────────────────────────────────────────────────

interface SceneProps {
  spec: BuildSpec;
  selectedPartId: string | null;
  transformMode: 'translate' | 'rotate' | 'scale';
  wireframeAll: boolean;
  showRefPlane: boolean;
  onSelectPart: (id: string) => void;
  onDeselectPart: () => void;
  onTransformChange: (id: string, t: PartTransform) => void;
}

function Scene({
  spec,
  selectedPartId,
  transformMode,
  wireframeAll,
  showRefPlane,
  onSelectPart,
  onDeselectPart,
  onTransformChange,
}: SceneProps) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[3, 4, 3]} intensity={1.8} color="#e085e0" />
      <pointLight position={[-3, 2, -2]} intensity={0.9} color="#4fc3f7" />
      <directionalLight position={[0, 8, 4]} intensity={0.5} />

      {spec.parts.map((part) => (
        <PartMeshComponent
          key={part.id}
          part={part}
          selected={part.id === selectedPartId}
          transformMode={transformMode}
          wireframeAll={wireframeAll}
          onSelect={onSelectPart}
          onTransformChange={onTransformChange}
        />
      ))}

      {showRefPlane && spec.referenceImageDataUrl && (
        <ReferencePlane dataUrl={spec.referenceImageDataUrl} />
      )}

      <AccentOrb />

      <Grid
        infiniteGrid
        cellSize={0.5}
        cellThickness={0.4}
        cellColor="#22263a"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#323650"
        fadeDistance={16}
        fadeStrength={1.5}
      />

      <OrbitControls makeDefault minDistance={1.5} maxDistance={14} target={[0, 0.9, 0]} />
      <CanvasDeselect onDeselect={onDeselectPart} />
    </>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nextId(kind: PartKind): string {
  return `${kind}-${Date.now()}`;
}

function defaultPart(kind: PartKind): Part {
  const defaults: Record<PartKind, number[]> = {
    sphere: [0.25, 16, 16],
    capsule: [0.12, 0.4, 4, 8],
    box: [0.3, 0.3, 0.3],
    cylinder: [0.15, 0.15, 0.4, 16],
  };
  return {
    id: nextId(kind),
    name: kind.charAt(0).toUpperCase() + kind.slice(1),
    kind,
    geometry: { args: defaults[kind] },
    transform: { position: [0, 1, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    material: { color: '#c045b0', roughness: 0.28, metalness: 0.55 },
  };
}

function Vec3Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: [number, number, number];
  onChange: (v: [number, number, number]) => void;
}) {
  const axes = ['X', 'Y', 'Z'] as const;
  return (
    <div className="dp-prop-vec3">
      <span className="dp-prop-vec3-label">{label}</span>
      <div className="dp-prop-vec3-inputs">
        {axes.map((ax, i) => (
          <label key={ax} className="dp-prop-axis-label">
            <span>{ax}</span>
            <input
              type="number"
              className="dp-prop-num"
              value={Number(value[i].toFixed(3))}
              step={0.01}
              onChange={(e) => {
                const v: [number, number, number] = [...value] as [number, number, number];
                v[i] = parseFloat(e.target.value) || 0;
                onChange(v);
              }}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

// ─── DesignPanel ─────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
}

export default function DesignPanel({ onClose }: Props) {
  const [buildSpec, setBuildSpec] = useState<BuildSpec>(() => loadSpecFromStorage() ?? {
    ...DEFAULT_HUMANOID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const [wireframeAll, setWireframeAll] = useState(false);
  const [showRefImage, setShowRefImage] = useState(false);
  const [showRefPlane, setShowRefPlane] = useState(false);
  const [showProps, setShowProps] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadJsonRef = useRef<HTMLInputElement>(null);

  const selectedPart = useMemo(
    () => buildSpec.parts.find((p) => p.id === selectedPartId) ?? null,
    [buildSpec.parts, selectedPartId]
  );

  const updateSpec = useCallback((updater: (prev: BuildSpec) => BuildSpec) => {
    setBuildSpec((prev) => {
      const next = updater(prev);
      next.updatedAt = new Date().toISOString();
      return next;
    });
  }, []);

  const updateSelectedPart = useCallback(
    (updater: (p: Part) => Part) => {
      if (!selectedPartId) return;
      updateSpec((spec) => ({
        ...spec,
        parts: spec.parts.map((p) => (p.id === selectedPartId ? updater(p) : p)),
      }));
    },
    [selectedPartId, updateSpec]
  );

  const handleTransformChange = useCallback(
    (id: string, t: PartTransform) => {
      updateSpec((spec) => ({
        ...spec,
        parts: spec.parts.map((p) => (p.id === id ? { ...p, transform: t } : p)),
      }));
    },
    [updateSpec]
  );

  const handleAddPart = useCallback(
    (kind: PartKind) => {
      const part = defaultPart(kind);
      updateSpec((spec) => ({ ...spec, parts: [...spec.parts, part] }));
      setSelectedPartId(part.id);
    },
    [updateSpec]
  );

  const handleDuplicate = useCallback(() => {
    if (!selectedPart) return;
    const copy: Part = {
      ...selectedPart,
      id: nextId(selectedPart.kind),
      name: selectedPart.name + ' Copy',
      transform: {
        ...selectedPart.transform,
        position: [
          selectedPart.transform.position[0] + 0.3,
          selectedPart.transform.position[1],
          selectedPart.transform.position[2] + 0.3,
        ],
      },
    };
    updateSpec((spec) => ({ ...spec, parts: [...spec.parts, copy] }));
    setSelectedPartId(copy.id);
  }, [selectedPart, updateSpec]);

  const handleDelete = useCallback(() => {
    if (!selectedPartId) return;
    updateSpec((spec) => ({ ...spec, parts: spec.parts.filter((p) => p.id !== selectedPartId) }));
    setSelectedPartId(null);
  }, [selectedPartId, updateSpec]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      updateSpec((spec) => ({ ...spec, referenceImageDataUrl: dataUrl }));
      setShowRefImage(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [updateSpec]);

  const handleClearReference = useCallback(() => {
    updateSpec((spec) => {
      const next = { ...spec };
      delete next.referenceImageDataUrl;
      return next;
    });
    setShowRefImage(false);
    setShowRefPlane(false);
  }, [updateSpec]);

  const handleLoadJson = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as BuildSpec;
        if (!parsed.id || !parsed.parts || !Array.isArray(parsed.parts)) {
          alert('Invalid BuildSpec JSON: missing id or parts array.');
          return;
        }
        setBuildSpec(parsed);
        setSelectedPartId(null);
      } catch {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        handleDuplicate();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDelete();
      }
      if (e.key === 't' || e.key === 'T') setTransformMode('translate');
      if (e.key === 'r' || e.key === 'R') setTransformMode('rotate');
      if (e.key === 's' || e.key === 'S') setTransformMode('scale');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleDuplicate, handleDelete]);

  const geomArgLabels: Record<PartKind, string[]> = {
    sphere: ['Radius', 'W Seg', 'H Seg'],
    capsule: ['Radius', 'Length', 'Cap Seg', 'Radial Seg'],
    box: ['Width', 'Height', 'Depth'],
    cylinder: ['Top Radius', 'Bot Radius', 'Height', 'Radial Seg'],
  };

  return (
    <div className="dp-container">
      {/* ── Header ── */}
      <div className="dp-header">
        <span className="dp-header-title">Design Space</span>
        <span className="dp-header-sub">3D Character Designer · BuildSpec v1</span>
        <button className="dp-close-btn" onClick={onClose} title="Exit Design Space">
          ✕ Exit Design
        </button>
      </div>

      <div className="dp-workspace">
        {/* ── Canvas ── */}
        <div className="dp-canvas-wrap">
          <Canvas camera={{ position: [0, 1.6, 3.8], fov: 48 }} gl={{ antialias: true }} shadows>
            <color attach="background" args={['#0d0f14']} />
            <Scene
              spec={buildSpec}
              selectedPartId={selectedPartId}
              transformMode={transformMode}
              wireframeAll={wireframeAll}
              showRefPlane={showRefPlane}
              onSelectPart={setSelectedPartId}
              onDeselectPart={() => setSelectedPartId(null)}
              onTransformChange={handleTransformChange}
            />
          </Canvas>

          {/* Reference image side panel (2D) */}
          {showRefImage && buildSpec.referenceImageDataUrl && (
            <div className="dp-ref-panel">
              <div className="dp-ref-panel-head">
                <span>Reference</span>
                <button
                  type="button"
                  className="dp-ref-close"
                  onClick={() => setShowRefImage(false)}
                >×</button>
              </div>
              <img
                src={buildSpec.referenceImageDataUrl}
                alt="Reference"
                className="dp-ref-img"
              />
            </div>
          )}
        </div>

        {/* ── Properties sidebar ── */}
        {showProps && selectedPart && (
          <div className="dp-props-panel">
            <div className="dp-props-head">
              <span className="dp-props-title">Properties</span>
              <button
                type="button"
                className="dp-props-close"
                onClick={() => setShowProps(false)}
                aria-label="Close properties"
              >×</button>
            </div>
            <div className="dp-props-body">
              {/* Name */}
              <div className="dp-prop-group">
                <label className="dp-prop-label">Name</label>
                <input
                  type="text"
                  className="dp-prop-text"
                  value={selectedPart.name}
                  onChange={(e) =>
                    updateSelectedPart((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>

              {/* Material */}
              <div className="dp-prop-group">
                <label className="dp-prop-label">Color</label>
                <input
                  type="color"
                  className="dp-prop-color"
                  value={selectedPart.material.color}
                  onChange={(e) =>
                    updateSelectedPart((p) => ({
                      ...p,
                      material: { ...p.material, color: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="dp-prop-group">
                <label className="dp-prop-label">Roughness</label>
                <input
                  type="range"
                  className="dp-prop-slider"
                  min={0} max={1} step={0.01}
                  value={selectedPart.material.roughness}
                  onChange={(e) =>
                    updateSelectedPart((p) => ({
                      ...p,
                      material: { ...p.material, roughness: parseFloat(e.target.value) },
                    }))
                  }
                />
                <span className="dp-prop-slider-val">
                  {selectedPart.material.roughness.toFixed(2)}
                </span>
              </div>
              <div className="dp-prop-group">
                <label className="dp-prop-label">Metalness</label>
                <input
                  type="range"
                  className="dp-prop-slider"
                  min={0} max={1} step={0.01}
                  value={selectedPart.material.metalness}
                  onChange={(e) =>
                    updateSelectedPart((p) => ({
                      ...p,
                      material: { ...p.material, metalness: parseFloat(e.target.value) },
                    }))
                  }
                />
                <span className="dp-prop-slider-val">
                  {selectedPart.material.metalness.toFixed(2)}
                </span>
              </div>
              <div className="dp-prop-group dp-prop-group--row">
                <label className="dp-prop-label">Wireframe</label>
                <input
                  type="checkbox"
                  checked={selectedPart.material.wireframe ?? false}
                  onChange={(e) =>
                    updateSelectedPart((p) => ({
                      ...p,
                      material: { ...p.material, wireframe: e.target.checked },
                    }))
                  }
                />
              </div>

              {/* Geometry args */}
              <div className="dp-prop-section-title">Geometry ({selectedPart.kind})</div>
              {selectedPart.geometry.args.map((val, ai) => (
                <div key={ai} className="dp-prop-group">
                  <label className="dp-prop-label">
                    {geomArgLabels[selectedPart.kind]?.[ai] ?? `Arg ${ai}`}
                  </label>
                  <input
                    type="number"
                    className="dp-prop-num dp-prop-num--full"
                    value={Number(val.toFixed(3))}
                    step={0.01}
                    onChange={(e) => {
                      const args = [...selectedPart.geometry.args];
                      args[ai] = parseFloat(e.target.value) || 0;
                      updateSelectedPart((p) => ({
                        ...p,
                        geometry: { args },
                      }));
                    }}
                  />
                </div>
              ))}

              {/* Transform */}
              <div className="dp-prop-section-title">Transform</div>
              <Vec3Input
                label="Position"
                value={selectedPart.transform.position}
                onChange={(v) =>
                  updateSelectedPart((p) => ({ ...p, transform: { ...p.transform, position: v } }))
                }
              />
              <Vec3Input
                label="Rotation"
                value={selectedPart.transform.rotation}
                onChange={(v) =>
                  updateSelectedPart((p) => ({ ...p, transform: { ...p.transform, rotation: v } }))
                }
              />
              <Vec3Input
                label="Scale"
                value={selectedPart.transform.scale}
                onChange={(v) =>
                  updateSelectedPart((p) => ({ ...p, transform: { ...p.transform, scale: v } }))
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Toolbar ── */}
      <div className="dp-toolbar">
        {/* Transform mode */}
        <div className="dp-toolbar-group">
          {(['translate', 'rotate', 'scale'] as const).map((mode) => (
            <button
              key={mode}
              className={`dp-tool-btn${transformMode === mode ? ' dp-tool-btn--active' : ''}`}
              onClick={() => setTransformMode(mode)}
              title={`${mode.charAt(0).toUpperCase() + mode.slice(1)} (${mode[0].toUpperCase()})`}
            >
              {mode === 'translate' ? 'T' : mode === 'rotate' ? 'R' : 'S'}
            </button>
          ))}
        </div>

        <div className="dp-toolbar-sep" />

        {/* Wireframe */}
        <button
          className={`dp-tool-btn${wireframeAll ? ' dp-tool-btn--active' : ''}`}
          onClick={() => setWireframeAll((w) => !w)}
        >
          Wireframe
        </button>

        <div className="dp-toolbar-sep" />

        {/* Add part */}
        <div className="dp-toolbar-group">
          {(['sphere', 'capsule', 'box', 'cylinder'] as PartKind[]).map((kind) => (
            <button
              key={kind}
              className="dp-tool-btn"
              onClick={() => handleAddPart(kind)}
              title={`Add ${kind}`}
            >
              + {kind.charAt(0).toUpperCase() + kind.slice(1)}
            </button>
          ))}
        </div>

        <div className="dp-toolbar-sep" />

        {/* Part actions */}
        <button
          className="dp-tool-btn"
          onClick={handleDuplicate}
          disabled={!selectedPartId}
          title="Duplicate part (⌘D)"
        >
          Duplicate
        </button>
        <button
          className="dp-tool-btn dp-tool-btn--danger"
          onClick={handleDelete}
          disabled={!selectedPartId}
          title="Delete part (Del)"
        >
          Delete
        </button>

        {/* Properties toggle */}
        <button
          className={`dp-tool-btn${showProps ? ' dp-tool-btn--active' : ''}`}
          onClick={() => setShowProps((v) => !v)}
          disabled={!selectedPartId}
        >
          Properties
        </button>

        <div className="dp-toolbar-sep" />

        {/* Reference image */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageUpload}
        />
        <button
          className="dp-tool-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Upload reference image"
        >
          Upload Reference
        </button>
        {buildSpec.referenceImageDataUrl && (
          <>
            <button
              className={`dp-tool-btn${showRefImage ? ' dp-tool-btn--active' : ''}`}
              onClick={() => setShowRefImage((v) => !v)}
            >
              Ref Panel
            </button>
            <button
              className={`dp-tool-btn${showRefPlane ? ' dp-tool-btn--active' : ''}`}
              onClick={() => setShowRefPlane((v) => !v)}
            >
              Ref Plane
            </button>
            <button className="dp-tool-btn dp-tool-btn--danger" onClick={handleClearReference}>
              Clear Ref
            </button>
          </>
        )}

        <div className="dp-toolbar-sep" />

        {/* Persistence */}
        <button
          className="dp-tool-btn"
          onClick={() => {
            const spec = { ...buildSpec, updatedAt: new Date().toISOString() };
            saveSpecToStorage(spec);
            downloadSpecAsJson(spec);
          }}
          title="Save to localStorage and download .json"
        >
          Save
        </button>
        <input
          ref={loadJsonRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleLoadJson}
        />
        <button
          className="dp-tool-btn"
          onClick={() => loadJsonRef.current?.click()}
          title="Load a .json BuildSpec file"
        >
          Load
        </button>

        <div className="dp-toolbar-sep" />

        {/* Coming-soon AI button */}
        <button
          className="dp-tool-btn dp-tool-btn--disabled"
          disabled
          title="Coming soon: generate BuildSpec from reference image via AI"
        >
          Generate from Reference
        </button>

        <span className="dp-toolbar-hint">
          {selectedPartId
            ? `Selected: ${selectedPart?.name ?? selectedPartId}`
            : 'Click a part to select · T/R/S · ⌘D duplicate · Del remove'}
        </span>
      </div>
    </div>
  );
}
