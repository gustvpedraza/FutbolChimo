import { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';

/** Un trazo: puntos normalizados 0–1 y estilo */
type DrawingStroke = { color: string; lineWidth: number; points: { x: number; y: number }[] };

/** Formaciones más usadas en el fútbol actual (x,y en % de la cancha) */
const FORMATION_POSITIONS: Record<string, { x: number; y: number }[]> = {
  '4-3-3': [
    { x: 50, y: 8 },
    { x: 18, y: 25 },
    { x: 42, y: 25 },
    { x: 58, y: 25 },
    { x: 82, y: 25 },
    { x: 35, y: 48 },
    { x: 50, y: 48 },
    { x: 65, y: 48 },
    { x: 22, y: 75 },
    { x: 50, y: 75 },
    { x: 78, y: 75 },
  ],
  '4-4-2': [
    { x: 50, y: 8 },
    { x: 18, y: 25 },
    { x: 42, y: 25 },
    { x: 58, y: 25 },
    { x: 82, y: 25 },
    { x: 22, y: 50 },
    { x: 42, y: 50 },
    { x: 58, y: 50 },
    { x: 78, y: 50 },
    { x: 38, y: 78 },
    { x: 62, y: 78 },
  ],
  '4-2-3-1': [
    { x: 50, y: 8 },
    { x: 18, y: 25 },
    { x: 42, y: 25 },
    { x: 58, y: 25 },
    { x: 82, y: 25 },
    { x: 38, y: 42 },
    { x: 62, y: 42 },
    { x: 22, y: 58 },
    { x: 50, y: 58 },
    { x: 78, y: 58 },
    { x: 50, y: 82 },
  ],
  '3-5-2': [
    { x: 50, y: 8 },
    { x: 35, y: 25 },
    { x: 50, y: 25 },
    { x: 65, y: 25 },
    { x: 15, y: 48 },
    { x: 35, y: 48 },
    { x: 50, y: 48 },
    { x: 65, y: 48 },
    { x: 85, y: 48 },
    { x: 38, y: 78 },
    { x: 62, y: 78 },
  ],
  '3-4-3': [
    { x: 50, y: 8 },
    { x: 35, y: 25 },
    { x: 50, y: 25 },
    { x: 65, y: 25 },
    { x: 25, y: 50 },
    { x: 42, y: 50 },
    { x: 58, y: 50 },
    { x: 75, y: 50 },
    { x: 22, y: 78 },
    { x: 50, y: 78 },
    { x: 78, y: 78 },
  ],
  '5-3-2': [
    { x: 50, y: 8 },
    { x: 15, y: 25 },
    { x: 35, y: 25 },
    { x: 50, y: 25 },
    { x: 65, y: 25 },
    { x: 85, y: 25 },
    { x: 35, y: 50 },
    { x: 50, y: 50 },
    { x: 65, y: 50 },
    { x: 38, y: 75 },
    { x: 62, y: 75 },
  ],
  '4-5-1': [
    { x: 50, y: 8 },
    { x: 18, y: 25 },
    { x: 42, y: 25 },
    { x: 58, y: 25 },
    { x: 82, y: 25 },
    { x: 22, y: 45 },
    { x: 38, y: 45 },
    { x: 50, y: 45 },
    { x: 62, y: 45 },
    { x: 78, y: 45 },
    { x: 50, y: 82 },
  ],
  '5-4-1': [
    { x: 50, y: 8 },
    { x: 15, y: 25 },
    { x: 35, y: 25 },
    { x: 50, y: 25 },
    { x: 65, y: 25 },
    { x: 85, y: 25 },
    { x: 28, y: 52 },
    { x: 42, y: 52 },
    { x: 58, y: 52 },
    { x: 72, y: 52 },
    { x: 50, y: 82 },
  ],
};

const FORMATION_KEYS = Object.keys(FORMATION_POSITIONS) as string[];

/** Jugadores ficticios (titulares/banquillo) */
const PLACEHOLDER_PLAYERS = [
  'Wuilker Faríñez',
  'Alexander González',
  'Yordan Osorio',
  'Wilker Ángel',
  'Ronald Hernández',
  'Tomás Rincón',
  'Yangel Herrera',
  'Jefferson Savarino',
  'Darwin Machís',
  'Salomón Rondón',
  'Joseph Martínez',
];

/** Suplentes ficticios (8 jugadores) */
const PLACEHOLDER_SUPLENTES = [
  'Rafael Romo',
  'Jhon Chancellor',
  'Miguel Navarro',
  'Junior Moreno',
  'Cristian Cásseres',
  'Erickson Gallardo',
  'Jhon Murillo',
  'Jesus Ramirez',
];

/** Devuelve solo el apellido (última palabra) para la ficha */
function getApellido(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1]! : fullName;
}

interface FieldSlot {
  playerName: string | null;
  x: number;
  y: number;
  /** Origen del jugador: para devolverlo al listado correcto al vaciar cancha */
  from?: 'bench' | 'suplentes';
}

const initialSlots = (): FieldSlot[] =>
  Array.from({ length: 11 }, () => ({ playerName: null, x: 50, y: 50 }));

interface DraggablePlayerProps {
  name: string;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  small?: boolean;
  /** Número a mostrar en el centro de la ficha (ej. dorsal) */
  number?: number;
  /** Si se pasa, doble clic en el número permite editarlo */
  onNumberChange?: (n: number) => void;
  /** Si se pasa, doble clic en el nombre permite editarlo */
  onNameChange?: (newName: string) => void;
}

/** Ficha compacta: círculo vinotinto con apellido encima (sin truncar) */
const VINOTINTO = '#47162a';
const VINOTINTO_DARK = '#351220';
const CARD_DARK = '#1a0d10';
const GOLD = '#d4af37';
/** Borrador elimina solo trazos del lápiz (no pinta encima). */
const BORDER_WHITE = 'rgba(255,255,255,0.1)';
const BORDER_WHITE_20 = 'rgba(255,255,255,0.2)';

/** Ficha de balón: emoji de balón de fútbol, arrastrable */
function DraggableBall({ onDragStart, onDragEnd }: { onDragStart: (e: React.DragEvent) => void; onDragEnd: () => void }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="cursor-grab active:cursor-grabbing select-none flex items-center justify-center"
      style={{
        width: 36,
        height: 36,
        fontSize: '1.75rem',
        lineHeight: 1,
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
      }}
      title="Arrastra el balón"
    >
      ⚽
    </div>
  );
}

function DraggablePlayer({ name, onDragStart, onDragEnd, small, number, onNumberChange, onNameChange }: DraggablePlayerProps) {
  const [editing, setEditing] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [inputValue, setInputValue] = useState(String(number ?? ''));
  const [nameInputValue, setNameInputValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const nameMeasureRef = useRef<HTMLSpanElement>(null);
  const [nameInputWidth, setNameInputWidth] = useState(0);
  const size = small ? { d: 36, text: '0.6rem' } : { d: 42, text: '0.7rem' };
  const canEditNumber = number != null && onNumberChange != null;
  const canEditName = onNameChange != null;

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  useEffect(() => {
    if (!editingName) setNameInputValue(name);
  }, [name, editingName]);

  useLayoutEffect(() => {
    if (!editingName) return;
    if (nameMeasureRef.current) {
      const w = nameMeasureRef.current.offsetWidth;
      setNameInputWidth(Math.max(w, 12));
    }
  }, [editingName, nameInputValue]);

  const commitNumber = () => {
    const n = parseInt(inputValue.trim(), 10);
    if (!Number.isNaN(n) && n >= 0 && n <= 99) {
      onNumberChange?.(n);
    }
    setEditing(false);
  };

  const commitName = () => {
    const trimmed = nameInputValue.trim();
    if (trimmed) onNameChange?.(trimmed);
    setEditingName(false);
  };

  return (
    <div
      draggable={!editing && !editingName}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={editing || editingName ? 'flex flex-col items-center gap-0.5' : 'cursor-grab active:cursor-grabbing flex flex-col items-center gap-0.5 select-none'}
      style={{ minWidth: size.d, maxWidth: small ? '100%' : undefined }}
    >
      {!editingName ? (
        <span
          className={`font-bold uppercase tracking-wide text-white leading-tight text-center ${small ? 'whitespace-normal' : 'whitespace-nowrap'}`}
          style={{
            fontSize: size.text,
            padding: '4px',
            borderRadius: '0.5rem',
            backgroundColor: 'rgba(0,0,0,0.6)',
            maxWidth: small ? '100%' : undefined,
            wordBreak: small ? 'break-word' : undefined,
          }}
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (canEditName) {
              setNameInputValue(name);
              setEditingName(true);
            }
          }}
        >
          {name}
        </span>
      ) : (
        <span style={{ display: 'inline-block', position: 'relative' }}>
          <span
            ref={nameMeasureRef}
            aria-hidden
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              visibility: 'hidden',
              whiteSpace: 'pre',
              fontSize: size.text,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              lineHeight: 1.25,
            }}
          >
            {nameInputValue || '\u00A0'}
          </span>
          <input
            ref={nameInputRef}
            type="text"
            value={nameInputValue}
            onChange={(e) => setNameInputValue(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitName();
              if (e.key === 'Escape') {
                setNameInputValue(name);
                setEditingName(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              fontSize: size.text,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              lineHeight: 1.25,
              padding: '4px',
              borderRadius: '0.5rem',
              backgroundColor: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              width: nameInputWidth || undefined,
              minWidth: 12,
              outline: 'none',
              boxSizing: 'content-box',
            }}
          />
        </span>
      )}
      <div
        className="ficha-jugador hover:ring-2 hover:ring-[#d4af37] hover:scale-105 transition-transform flex items-center justify-center"
        style={{
          width: size.d,
          height: size.d,
          borderRadius: '50%',
          backgroundColor: VINOTINTO,
          border: '2px solid #fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
        }}
        onDoubleClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (canEditNumber) {
            setInputValue(String(number));
            setEditing(true);
          }
        }}
      >
        {number != null && !editing && (
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>
            {number}
          </span>
        )}
        {editing && (
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.replace(/\D/g, '').slice(0, 2))}
            onBlur={commitNumber}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitNumber();
              if (e.key === 'Escape') {
                setInputValue(String(number));
                setEditing(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: size.d - 8,
              fontSize: '16px',
              fontWeight: 700,
              color: '#fff',
              background: 'transparent',
              border: 'none',
              textAlign: 'center',
              outline: 'none',
              padding: 0,
            }}
          />
        )}
      </div>
    </div>
  );
}

const PENCIL_COLORS = [
  '#ffffff',
  '#ffff00',
  '#00ff00',
  '#00ffff',
  '#ff0000',
  '#ff00ff',
  '#000000',
  GOLD,
];

/** Título de sección con icono (i) que muestra tooltip en forma de lista */
function SectionTitleWithTooltip({ title }: { title: string }) {
  const [showTooltip, setShowTooltip] = useState(false);
  return (
    <h3
      style={{ marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: 600, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.35rem', position: 'relative' }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 0 }}>{title}</span>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 16,
          height: 16,
          borderRadius: '50%',
          border: `1px solid ${BORDER_WHITE_20}`,
          color: 'rgba(248,250,252,0.8)',
          fontSize: '10px',
          fontWeight: 700,
          cursor: 'help',
        }}
        aria-label="Instrucciones"
      >
        i
      </span>
      {showTooltip && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            left: 0,
            top: '100%',
            marginTop: '0.25rem',
            padding: '0.5rem 0.75rem',
            background: CARD_DARK,
            border: `1px solid ${BORDER_WHITE_20}`,
            borderRadius: '0.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            zIndex: 20,
            minWidth: '12rem',
            fontSize: '0.75rem',
            color: 'rgba(248,250,252,0.95)',
          }}
        >
          <ul style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.5, fontWeight: 400 }}>
            <li style={{ marginBottom: '0.35rem' }}>Arrastra al campo o suelta aquí para devolver</li>
            <li style={{ marginBottom: '0.35rem' }}>Haz doble clic para editar el nombre del jugador</li>
            <li style={{ marginBottom: 0 }}>Haz doble clic para cambiar el número del jugador</li>
          </ul>
        </div>
      )}
    </h3>
  );
}

export default function LineupBuilder() {
  const fieldRef = useRef<HTMLDivElement>(null);
  const innerFieldRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathsRef = useRef<DrawingStroke[]>([]);
  const [slots, setSlots] = useState<FieldSlot[]>(initialSlots);
  const [bench, setBench] = useState<string[]>(() => [...PLACEHOLDER_PLAYERS]);
  const [suplentes, setSuplentes] = useState<string[]>(() => [...PLACEHOLDER_SUPLENTES]);
  const [dragged, setDragged] = useState<
    | { type: 'player'; from: 'bench' | 'suplentes' | 'field'; index: number; name: string }
    | { type: 'ball' }
    | null
  >(null);
  const [ballVisible, setBallVisible] = useState(false);
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 50 });
  const [pencilMode, setPencilMode] = useState(false);
  const [eraserMode, setEraserMode] = useState(false);
  const [pencilColor, setPencilColor] = useState('#000000');
  const [pencilWidth, setPencilWidth] = useState(4);
  const [selectedFormation, setSelectedFormation] = useState<string>(FORMATION_KEYS[0] ?? '4-3-3');
  const [customNumbers, setCustomNumbers] = useState<Record<string, number>>({});
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<DrawingStroke | null>(null);

  /** Posición relativa al rectángulo de la cancha (inner div). Permite 0-100 % para poder poner en área rival. */
  const getDropPosition = useCallback((e: React.DragEvent): { x: number; y: number } | null => {
    const el = innerFieldRef.current ?? fieldRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const horizontalPct = ((e.clientX - rect.left) / rect.width) * 100; // largo → slot.y
    const verticalPct = ((e.clientY - rect.top) / rect.height) * 100;   // ancho → slot.x
    return {
      x: Math.max(1, Math.min(99, verticalPct)),
      y: Math.max(1, Math.min(99, horizontalPct)),
    };
  }, []);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const inner = innerFieldRef.current;
    if (!canvas || !inner) return;
    const w = inner.clientWidth;
    const h = inner.clientHeight;
    if (w <= 0 || h <= 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pathsRef.current.forEach((stroke) => {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (stroke.points.length === 1) {
        const p = stroke.points[0]!;
        ctx.beginPath();
        ctx.arc(p.x * canvas.width, p.y * canvas.height, stroke.lineWidth / 2, 0, Math.PI * 2);
        ctx.fillStyle = stroke.color;
        ctx.fill();
      } else if (stroke.points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(stroke.points[0]!.x * canvas.width, stroke.points[0]!.y * canvas.height);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i]!.x * canvas.width, stroke.points[i]!.y * canvas.height);
        }
        ctx.stroke();
      }
    });
  }, []);

  useEffect(() => {
    const inner = innerFieldRef.current;
    if (!inner) return;
    const ro = new ResizeObserver(() => redrawCanvas());
    ro.observe(inner);
    redrawCanvas();
    return () => ro.disconnect();
  }, [redrawCanvas]);

  const getCanvasPoint = useCallback((e: React.PointerEvent): { x: number; y: number } | null => {
    const el = canvasRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
  }, []);

  const hasPlayersOnField = slots.some((s) => !!s.playerName);
  const drawingActive = (pencilMode || eraserMode) && hasPlayersOnField;
  const eraserRadiusPx = Math.max(pencilWidth, 8);

  /** Borra solo los trazos del lápiz que tocan el punto (no pinta nada encima) */
  const eraseStrokesAtPoint = useCallback(
    (normalizedPoint: { x: number; y: number }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      if (w <= 0 || h <= 0) return;
      const r = (eraserRadiusPx / 2) / Math.min(w, h);
      const r2 = r * r;
      pathsRef.current = pathsRef.current.filter((stroke) => {
        return !stroke.points.some(
          (p) => (p.x - normalizedPoint.x) ** 2 + (p.y - normalizedPoint.y) ** 2 <= r2
        );
      });
      redrawCanvas();
    },
    [eraserRadiusPx, redrawCanvas]
  );

  const handlePointerDownCanvas = useCallback(
    (e: React.PointerEvent) => {
      if (!drawingActive) return;
      e.preventDefault();
      const pt = getCanvasPoint(e);
      if (!pt) return;
      isDrawingRef.current = true;
      if (eraserMode) {
        eraseStrokesAtPoint(pt);
        return;
      }
      currentStrokeRef.current = {
        color: pencilColor,
        lineWidth: pencilWidth,
        points: [pt],
      };
      pathsRef.current = [...pathsRef.current, currentStrokeRef.current];
    },
    [drawingActive, eraserMode, pencilColor, pencilWidth, getCanvasPoint, eraseStrokesAtPoint]
  );

  const handlePointerMoveCanvas = useCallback(
    (e: React.PointerEvent) => {
      if (!drawingActive || !isDrawingRef.current) return;
      e.preventDefault();
      const pt = getCanvasPoint(e);
      if (!pt) return;
      if (eraserMode) {
        eraseStrokesAtPoint(pt);
        return;
      }
      if (!currentStrokeRef.current) return;
      currentStrokeRef.current.points.push(pt);
      redrawCanvas();
    },
    [drawingActive, eraserMode, getCanvasPoint, eraseStrokesAtPoint, redrawCanvas]
  );

  const handlePointerUpCanvas = useCallback(() => {
    if (drawingActive) isDrawingRef.current = false;
    currentStrokeRef.current = null;
  }, [drawingActive]);

  const handleClearDrawing = useCallback(() => {
    pathsRef.current = [];
    redrawCanvas();
  }, [redrawCanvas]);

  const handleDropOnField = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!dragged) return;
      const pos = getDropPosition(e);
      if (!pos) return;

      if (dragged.type === 'ball') {
        setBallPosition(pos);
      } else if (dragged.from === 'bench') {
        const emptyIndex = slots.findIndex((s) => !s.playerName);
        if (emptyIndex === -1) return;
        setBench((b) => b.filter((_, i) => i !== dragged.index));
        setSlots((prev) => {
          const next = [...prev];
          next[emptyIndex] = { playerName: dragged.name, x: pos.x, y: pos.y, from: 'bench' };
          return next;
        });
      } else if (dragged.from === 'suplentes') {
        const emptyIndex = slots.findIndex((s) => !s.playerName);
        if (emptyIndex === -1) return;
        setSuplentes((s) => s.filter((_, i) => i !== dragged.index));
        setSlots((prev) => {
          const next = [...prev];
          next[emptyIndex] = { playerName: dragged.name, x: pos.x, y: pos.y, from: 'suplentes' };
          return next;
        });
      } else {
        setSlots((prev) => {
          const next = [...prev];
          next[dragged.index] = { ...next[dragged.index], x: pos.x, y: pos.y };
          return next;
        });
      }
      setDragged(null);
    },
    [dragged, getDropPosition, slots]
  );

  const handleDragStartBench = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', bench[index]);
    e.dataTransfer.effectAllowed = 'move';
    setDragged({ type: 'player', from: 'bench', index, name: bench[index] });
  }, [bench]);

  const handleDragStartSuplentes = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', suplentes[index]);
    e.dataTransfer.effectAllowed = 'move';
    setDragged({ type: 'player', from: 'suplentes', index, name: suplentes[index] });
  }, [suplentes]);

  const handleDragStartField = useCallback((e: React.DragEvent, slotIndex: number) => {
    const name = slots[slotIndex].playerName;
    if (!name) return;
    e.dataTransfer.setData('text/plain', name);
    e.dataTransfer.effectAllowed = 'move';
    setDragged({ type: 'player', from: 'field', index: slotIndex, name });
  }, [slots]);

  const handleDragStartBall = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', 'ball');
    e.dataTransfer.effectAllowed = 'move';
    setDragged({ type: 'ball' });
  }, []);

  const handleDragEnd = useCallback(() => setDragged(null), []);

  const handleDropOnBench = useCallback(() => {
    if (!dragged || dragged.type !== 'player' || dragged.from !== 'field') return;
    setSlots((prev) => {
      const next = [...prev];
      next[dragged.index] = { ...next[dragged.index], playerName: null };
      return next;
    });
    setBench((b) => [...b, dragged.name]);
    setDragged(null);
  }, [dragged]);

  const handleDropOnSuplentes = useCallback(() => {
    if (!dragged || dragged.type !== 'player' || dragged.from !== 'field') return;
    setSlots((prev) => {
      const next = [...prev];
      next[dragged.index] = { ...next[dragged.index], playerName: null };
      return next;
    });
    setSuplentes((s) => [...s, dragged.name]);
    setDragged(null);
  }, [dragged]);

  const applyFormation = useCallback((formationKey: string) => {
    const positions = FORMATION_POSITIONS[formationKey];
    if (!positions) return;
    setSelectedFormation(formationKey);
    setSlots((prev) => {
      const currentPlayers = prev.map((s) => s.playerName);
      return positions.map((pos, i) => ({
        ...prev[i],
        playerName: currentPlayers[i],
        x: pos.x,
        y: pos.y,
      }));
    });
  }, []);

  const fillFormationFromBench = useCallback((formationKey: string) => {
    const positions = FORMATION_POSITIONS[formationKey];
    if (!positions || bench.length < 11) return;
    const toPlace = bench.slice(0, 11);
    setBench((b) => b.slice(11));
    setSlots(positions.map((pos, i) => ({ playerName: toPlace[i], x: pos.x, y: pos.y, from: 'bench' as const })));
  }, [bench]);

  const handleClearField = useCallback(() => {
    const toBench: string[] = [];
    const toSuplentes: string[] = [];
    slots.forEach((s) => {
      if (s.playerName) {
        if (s.from === 'suplentes') toSuplentes.push(s.playerName);
        else toBench.push(s.playerName);
      }
    });
    setSlots(initialSlots());
    setBench((b) => [...toBench, ...b]);
    setSuplentes((s) => [...toSuplentes, ...s]);
    setBallVisible(false);
    pathsRef.current = [];
    redrawCanvas();
  }, [slots, redrawCanvas]);

  const cardStyle: React.CSSProperties = {
    borderRadius: '0.75rem',
    border: `1px solid ${BORDER_WHITE}`,
    backgroundColor: CARD_DARK,
    padding: '0.875rem 1rem',
  };
  const cardTitleStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: GOLD,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };
  const btnBase: React.CSSProperties = {
    padding: '0.4rem 0.75rem',
    borderRadius: '0.5rem',
    border: `1px solid ${BORDER_WHITE_20}`,
    background: 'rgba(255,255,255,0.05)',
    color: '#f1f5f9',
    fontSize: '0.8125rem',
    fontWeight: 500,
    cursor: 'pointer',
  };

  const sidebarWidth = '20rem';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      {/* Header: Formación (centro) + Cancha (derecha) tipo TACTICAL PRO */}
      <header
        style={{
          ...cardStyle,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={cardTitleStyle}>Formación</span>
          {FORMATION_KEYS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => applyFormation(f)}
              title={`Aplicar ${f}`}
              style={{
                ...btnBase,
                border: selectedFormation === f ? `1px solid ${GOLD}` : undefined,
                background: selectedFormation === f ? 'rgba(212,175,55,0.15)' : undefined,
                color: selectedFormation === f ? GOLD : '#f1f5f9',
              }}
              className="hover:bg-white/10 hover:border-gold/50 transition-colors"
            >
              {f}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
          {ballVisible ? (
            <button type="button" onClick={() => setBallVisible(false)} style={btnBase} className="hover:bg-white/10 transition-colors">
              ⚽ Quitar balón
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { setBallVisible(true); setBallPosition({ x: 50, y: 50 }); }}
              style={btnBase}
              className="hover:bg-white/10 transition-colors"
            >
              ⚽ Agregar balón
            </button>
          )}
          <button
            type="button"
            onClick={handleClearField}
            style={{
              ...btnBase,
              border: '1px solid rgba(194,10,56,0.5)',
              background: '#c20a38',
              color: '#fff',
            }}
            className="hover:opacity-90 transition-opacity"
          >
            Vaciar cancha
          </button>
          {bench.length >= 11 && (
            <button
              type="button"
              onClick={() => fillFormationFromBench(selectedFormation)}
              style={{
                ...btnBase,
                border: `1px solid rgba(212,175,55,0.5)`,
                background: GOLD,
                color: '#1a0d10',
              }}
              className="hover:opacity-90 transition-opacity"
            >
              Llenar cancha ({selectedFormation})
            </button>
          )}
        </div>
      </header>

      {/* Cuerpo: 3 columnas — Izq: Titulares | Centro: Cancha | Der: Herramientas + Suplentes */}
      <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', alignItems: 'stretch', minHeight: '420px', flexWrap: 'wrap' }}>
        {/* Columna izquierda: Titulares (Squad list) */}
        <aside
          style={{
            width: sidebarWidth,
            minWidth: sidebarWidth,
            maxWidth: '100%',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '0.75rem',
            border: `1px solid ${BORDER_WHITE}`,
            backgroundColor: CARD_DARK,
            padding: '1rem',
            overflow: 'hidden',
          }}
        >
          <SectionTitleWithTooltip title="Titulares" />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gridAutoRows: '1fr',
              gap: '0.5rem',
              minHeight: '52px',
              flex: 1,
              alignContent: 'flex-start',
              overflowY: 'auto',
              overflowX: 'hidden',
              minWidth: 0,
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropOnBench}
          >
            {bench.length === 0 && (
              <div
                style={{
                  gridColumn: '1 / -1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  border: `1px dashed ${BORDER_WHITE_20}`,
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  color: 'rgba(248,250,252,0.6)',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  pointerEvents: 'none',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                  <path d="M9 14L4 9l5-5" /><path d="M4 9h10a5 5 0 015 5v0" />
                </svg>
                <span>Suelta aquí para devolver</span>
              </div>
            )}
            {bench.map((name, i) => (
              <DraggablePlayer
                key={`${name}-${i}`}
                name={name}
                small
                onDragStart={(e) => handleDragStartBench(e, i)}
                onDragEnd={handleDragEnd}
                number={customNumbers[`bench-${i}`] ?? i + 1}
                onNumberChange={(n) => setCustomNumbers((prev) => ({ ...prev, [`bench-${i}`]: n }))}
                onNameChange={(newName) =>
                  setBench((prev) => {
                    const next = [...prev];
                    next[i] = newName;
                    return next;
                  })
                }
              />
            ))}
          </div>
        </aside>

        {/* Columna central: Cancha */}
        <div
          ref={fieldRef}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropOnField}
          style={{
            flex: '1 1 0',
            minWidth: 0,
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '0.75rem',
            border: '2px solid rgba(46,125,50,0.9)',
            backgroundColor: '#2E7D32',
            padding: 0,
            minHeight: '320px',
            aspectRatio: '105/68',
            cursor: 'default',
            alignSelf: 'center',
          }}
        >
          {/* Cancha horizontal: franjas de césped (dos tonos de verde) + zona de drop. */}
          <div
            ref={innerFieldRef}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleDropOnField(e); }}
            style={{
              position: 'absolute',
              inset: 0,
              cursor: dragged ? 'copy' : 'default',
              background: 'repeating-linear-gradient(180deg, #2a7230 0px, #2a7230 56px, #358338 56px, #358338 112px)',
            }}
          >
          {/* Líneas del campo — viewBox largo x ancho (105 x 68). Líneas de banda + meta cierran el rectángulo. */}
          <svg
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
            viewBox="0 0 105 68"
            fill="none"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="0.4"
          >
            {/* Líneas de banda (superior e inferior) */}
            <line x1="0" y1="0" x2="105" y2="0" strokeWidth="0.6" />
            <line x1="0" y1="68" x2="105" y2="68" strokeWidth="0.6" />
            {/* Líneas de meta (izquierda y derecha) */}
            <line x1="0" y1="0" x2="0" y2="68" strokeWidth="0.6" />
            <line x1="105" y1="0" x2="105" y2="68" strokeWidth="0.6" />
            {/* Línea de medio campo */}
            <line x1="52.5" y1="0" x2="52.5" y2="68" />
            {/* Círculo central (radio 9.15 m) */}
            <circle cx="52.5" cy="34" r="9.15" />
            {/* Punto central */}
            <circle cx="52.5" cy="34" r="0.8" fill="rgba(255,255,255,0.9)" />
            {/* Área de penal izquierda */}
            <rect x="0" y="13.84" width="16.5" height="40.32" />
            {/* Área de meta izquierda */}
            <rect x="0" y="24.84" width="5.5" height="18.32" />
            {/* Área de penal derecha */}
            <rect x="88.5" y="13.84" width="16.5" height="40.32" />
            {/* Área de meta derecha */}
            <rect x="99.5" y="24.84" width="5.5" height="18.32" />
          </svg>
          {/* Canvas para dibujar (pizarra): solo captura eventos cuando lápiz está activo */}
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDownCanvas}
            onPointerMove={handlePointerMoveCanvas}
            onPointerUp={handlePointerUpCanvas}
            onPointerLeave={handlePointerUpCanvas}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: drawingActive ? 'auto' : 'none',
              cursor: drawingActive ? 'crosshair' : 'default',
              touchAction: drawingActive ? 'none' : 'auto',
            }}
          />
          {/* Placeholder cuando no hay jugadores en la cancha */}
          {slots.every((s) => !s.playerName) && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px dashed rgba(255,255,255,0.35)',
                backgroundColor: 'rgba(0,0,0,0.6)',
                color: 'rgba(248,250,252,0.9)',
                fontSize: '1.125rem',
                fontWeight: 500,
                pointerEvents: 'none',
                zIndex: 0,
              }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.9 }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Arrastra jugadores aquí</span>
            </div>
          )}
          {/* slot.x = ancho del campo (arriba-abajo) → top%; slot.y = largo (izq-der) → left%. Solo se muestran posiciones con jugador. */}
          {slots.map((slot, i) =>
            slot.playerName ? (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${slot.y}%`,
                  top: `${slot.x}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: dragged?.type === 'player' && dragged?.from === 'field' && dragged?.index === i ? 10 : 1,
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDropOnField(e);
                }}
              >
                <DraggablePlayer
                  name={slot.playerName}
                  onDragStart={(e) => handleDragStartField(e, i)}
                  onDragEnd={handleDragEnd}
                  small
                  number={customNumbers[`field-${i}`] ?? i + 1}
                  onNumberChange={(n) => setCustomNumbers((prev) => ({ ...prev, [`field-${i}`]: n }))}
                  onNameChange={(newName) =>
                    setSlots((prev) => {
                      const next = [...prev];
                      next[i] = { ...next[i], playerName: newName };
                      return next;
                    })
                  }
                />
              </div>
            ) : null
          )}
          {/* Balón: ficha arrastrable cuando está visible */}
          {ballVisible && (
            <div
              style={{
                position: 'absolute',
                left: `${ballPosition.y}%`,
                top: `${ballPosition.x}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: dragged?.type === 'ball' ? 10 : 2,
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDropOnField(e);
              }}
            >
              <DraggableBall onDragStart={handleDragStartBall} onDragEnd={handleDragEnd} />
            </div>
          )}
          </div>
        </div>

        {/* Columna derecha: Herramientas tácticas + Suplentes */}
        <aside
          style={{
            width: sidebarWidth,
            minWidth: sidebarWidth,
            maxWidth: '100%',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* TACTICAL TOOLS — Dibujar en la cancha */}
          <section
            style={{
              borderRadius: '0.75rem',
              border: `1px solid ${BORDER_WHITE}`,
              backgroundColor: CARD_DARK,
              padding: '1rem',
            }}
          >
            <h3 style={{ ...cardTitleStyle, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ✏️ Dibujar en la cancha
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setEraserMode(false);
                    setPencilMode((v) => !v);
                  }}
                  title={pencilMode ? 'Desactivar lápiz' : 'Activar lápiz'}
                  style={{
                    ...btnBase,
                    border: `1px solid ${pencilMode ? GOLD : BORDER_WHITE_20}`,
                    color: pencilMode ? GOLD : '#f1f5f9',
                    background: pencilMode ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
                  }}
                >
                  ✏️ Lápiz
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPencilMode(false);
                    setEraserMode((v) => !v);
                  }}
                  title={eraserMode ? 'Desactivar borrador' : 'Activar borrador'}
                  style={{
                    ...btnBase,
                    border: `1px solid ${eraserMode ? GOLD : BORDER_WHITE_20}`,
                    color: eraserMode ? GOLD : '#f1f5f9',
                    background: eraserMode ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
                  }}
                >
                  🧽 Borrador
                </button>
                <button type="button" onClick={handleClearDrawing} style={btnBase} className="hover:bg-white/10 transition-colors">
                  Borrar todo
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: 'rgba(248,250,252,0.8)' }}>Color:</span>
                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                  {PENCIL_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      title={c}
                      onClick={() => setPencilColor(c)}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        backgroundColor: c,
                        border: pencilColor === c ? `2px solid ${GOLD}` : `1px solid ${BORDER_WHITE_20}`,
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'rgba(248,250,252,0.8)' }}>
                Grosor:
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={pencilWidth}
                  onChange={(e) => setPencilWidth(Number(e.target.value))}
                  style={{ width: 80 }}
                />
                <span style={{ minWidth: '1.5rem', color: '#f1f5f9' }}>{pencilWidth}px</span>
              </label>
            </div>
          </section>

          {/* Suplentes */}
          <section
            style={{
              borderRadius: '0.75rem',
              border: `1px solid ${BORDER_WHITE}`,
              backgroundColor: CARD_DARK,
              padding: '1rem',
            }}
          >
            <SectionTitleWithTooltip title="Suplentes" />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gridAutoRows: '1fr',
                gap: '0.5rem',
                minHeight: '52px',
                alignContent: 'flex-start',
                overflowX: 'hidden',
                minWidth: 0,
                paddingBottom: '0.75rem',
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDropOnSuplentes}
            >
              {suplentes.length === 0 && (
                <div
                  style={{
                    gridColumn: '1 / -1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    padding: '1rem 1.25rem',
                    borderRadius: '0.5rem',
                    border: `1px dashed ${BORDER_WHITE_20}`,
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    color: 'rgba(248,250,252,0.6)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    pointerEvents: 'none',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                    <path d="M9 14L4 9l5-5" />
                    <path d="M4 9h10a5 5 0 015 5v0" />
                  </svg>
                  <span>Suelta aquí para devolver</span>
                </div>
              )}
              {suplentes.map((name, i) => (
                <DraggablePlayer
                  key={`supl-${name}-${i}`}
                  name={name}
                  small
                  onDragStart={(e) => handleDragStartSuplentes(e, i)}
                  onDragEnd={handleDragEnd}
                  number={customNumbers[`supl-${i}`] ?? i + 1}
                  onNumberChange={(n) => setCustomNumbers((prev) => ({ ...prev, [`supl-${i}`]: n }))}
                  onNameChange={(newName) =>
                    setSuplentes((prev) => {
                      const next = [...prev];
                      next[i] = newName;
                      return next;
                    })
                  }
                />
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
