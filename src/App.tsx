import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./App.css"

type TrailItem = { id: number; x: number; y: number; rotation: number; content: string };

export default function App() {
  const [trail, setTrail] = useState<TrailItem[]>([]);
  const portalRootRef = useRef<HTMLElement | null>(null);
  const lastSpawnRef = useRef<number>(0);

  // config
  const spawnInterval = 30; // ms between spawns while moving
  const life = 1200; // ms before a particle is removed
  const maxTrail = 300;
  const text = "HieuDz";

  // create a portal root attached directly to <body> so particles are always on top
  useEffect(() => {
    let root = document.getElementById("trail-portal") as HTMLElement | null;
    if (!root) {
      root = document.createElement("div");
      root.id = "trail-portal";
      // make sure the portal covers the viewport and doesn't create stacking/transform issues
      Object.assign(root.style, {
        position: "fixed",
        inset: "0px",
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: "2147483647",
        top: "0",
        left: "0",
      });
      document.body.appendChild(root);
    }
    portalRootRef.current = root;

    // reset body margins (fixes the left/top indent you'll sometimes see)
    const prevHtmlMargin = document.documentElement.style.margin;
    const prevBodyMargin = document.body.style.margin;
    document.documentElement.style.margin = "0";
    document.body.style.margin = "0";

    return () => {
      if (portalRootRef.current && portalRootRef.current.parentElement) {
        portalRootRef.current.parentElement.removeChild(portalRootRef.current);
      }
      portalRootRef.current = null;
      document.documentElement.style.margin = prevHtmlMargin;
      document.body.style.margin = prevBodyMargin;
    };
  }, []);

  // mousemove spawns
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastSpawnRef.current < spawnInterval) return;
      lastSpawnRef.current = now;
      spawnAt(e.clientX, e.clientY, text);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const spawnAt = (x: number, y: number, content: string) => {
    const id = Date.now() + Math.random();
    const rotation = Math.random() * 60 - 30; // -30 .. 30 deg
    setTrail((prev) => {
      const next = [...prev, { id, x, y, rotation, content }];
      if (next.length > maxTrail) next.splice(0, next.length - maxTrail);
      return next;
    });

    // remove after life ms
    window.setTimeout(() => {
      setTrail((prev) => prev.filter((p) => p.id !== id));
    }, life);
  };

  const floodEmojis = () => {
    const count = 60;
    for (let i = 0; i < count; i++) {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      // mix some HieuDz with hearts so it looks playful
      const content = Math.random() < 0.45 ? "😍" : text;
      spawnAt(x, y, content);
    }
  };

  // build portal content (directly rendered into body so it can't be hidden by app stacking contexts)
  const portalContent = (
    <>
      <style>{`
        /* particle animation */
        @keyframes floatUpFade {
          0% { transform: translate(-50%, -50%) translateY(0px) scale(1) rotate(var(--rot)); opacity: 1; filter: blur(0px); }
          100% { transform: translate(-50%, -50%) translateY(-36px) scale(0.98) rotate(var(--rot)); opacity: 0; filter: blur(0.6px); }
        }
        .trail-item {
          position: fixed; /* fixed to viewport */
          left: 0;
          top: 0;
          pointer-events: none;
          user-select: none;
          transform: translate(-50%, -50%);
          will-change: transform, opacity;
          font-weight: 800;
          font-size: 36px; /* slightly bigger */
          color: white;
          text-shadow: 0 2px 10px rgba(0,0,0,0.45);
        }
      `}</style>

      {trail.map((p) => (
        <span
          key={p.id}
          className="trail-item"
          style={{
            left: p.x,
            top: p.y,
            transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`,
            animation: `floatUpFade ${life}ms ease-out forwards`,
            // ensure it's above everything
            zIndex: 2147483647,
            // use CSS custom prop so keyframes can read rotation if needed
            ["--rot" as any]: `${p.rotation}deg`,
          }}
        >
          {p.content}
        </span>
      ))}
    </>
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // nice animated gradient background (kept simple inline so nothing else transforms the container)
        background: "linear-gradient(90deg,#6d28d9,#ec4899,#f59e0b)",
        backgroundSize: "200% 200%",
      }}
    >
      {/* small inline animation for the background to subtly move */}
      <style>{`
        @keyframes bgMove { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        div[style] { animation: bgMove 10s ease-in-out infinite; }
      `}</style>

      <button
        onClick={floodEmojis}
        style={{
          position: "relative",
          zIndex: 2147483648,
          padding: "12px 22px",
          borderRadius: 30,
          background: "white",
          border: "none",
          fontWeight: 800,
          cursor: "pointer",
          boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
        }}
      >
        Spawn Word
      </button>

      {/* render portal items into the portal root (body) so they are always on top and precisely aligned with cursor coords */}
      {portalRootRef.current ? createPortal(portalContent, portalRootRef.current) : null}
    </div>
  );
}
