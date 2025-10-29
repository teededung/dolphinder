import React, { useEffect, useRef, useState } from "react";
import type { Dev } from "../data/loadDevs";
import { useModalStore } from "../store/useModalStore";
import DeveloperModalCard from "./DeveloperModalCard";

type Bubble = {
  id: string;
  dev: Dev;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  img?: HTMLImageElement;
  imgLoaded: boolean;
  // If both primary and fallback fail, we still render initials
  color: string;
  stroke: string;
  score: number; // activity score
  dirAngle: number; // drift direction angle (radians)
  dirRotSpeed: number; // how fast the direction rotates
  driftSpeed: number; // per-frame drift magnitude
  w: number; // size weight (derived from score)
  hasWalrus: boolean; // true if developer has Walrus storage
};

// === Click splash tuning (you can tweak these) ===
// Increase to push bubbles farther on click
const CLICK_PUSH_STRENGTH = 6; // user-tunable push strength
// Increase/Decrease to change effect area
const CLICK_PUSH_RADIUS = 600; // user-tunable influence radius in px
// Ripple visuals
const RIPPLE_FADE_MS = 1200; // user-tunable ripple duration
const RIPPLE_MAX_RADIUS = 400; // user-tunable ripple max radius (px)
const RIPPLE_STROKE_WIDTH = 3; // user-tunable ripple stroke width (px)

type ActivityScore = {
  score: number;
  fetchedAt: number; // ms since epoch
};

type DevelopersCache = {
  developers: Dev[];
  fetchedAt: number;
};

const ACTIVITY_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const DEVELOPERS_CACHE_KEY = "developers-cache";
const GITHUB_API_BASE = "https://api.github.com";

function parseGithubUsername(url: string, fallback: string): string {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length >= 1) return parts[0];
  } catch (_) {
    // ignore
  }
  return fallback;
}

function getCachedActivity(username: string): ActivityScore | null {
  try {
    const raw = localStorage.getItem(`gh-activity:${username}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActivityScore;
    if (Date.now() - parsed.fetchedAt > ACTIVITY_CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function setCachedActivity(username: string, score: number): void {
  try {
    const payload: ActivityScore = { score, fetchedAt: Date.now() };
    localStorage.setItem(`gh-activity:${username}`, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

async function fetchGithubActivity(username: string): Promise<number> {
  // Simple heuristic using public metrics + recent events count
  try {
    const [userRes, eventsRes] = await Promise.all([
      fetch(`${GITHUB_API_BASE}/users/${username}`),
      fetch(`${GITHUB_API_BASE}/users/${username}/events/public`),
    ]);

    if (!userRes.ok) throw new Error("user fetch failed");
    const user = await userRes.json();
    const followers = Number(user.followers ?? 0);
    const publicRepos = Number(user.public_repos ?? 0);

    let eventsCount = 0;
    if (eventsRes.ok) {
      const events = (await eventsRes.json()) as unknown[];
      eventsCount = Array.isArray(events) ? events.length : 0; // up to 30 items
    }

    // Weighted score (cap values to reduce outliers)
    const normFollowers = Math.min(followers, 300) / 300; // 0..1
    const normRepos = Math.min(publicRepos, 120) / 120; // 0..1
    const normEvents = Math.min(eventsCount, 30) / 30; // 0..1
    const score = 0.45 * normFollowers + 0.35 * normRepos + 0.20 * normEvents;
    return score; // 0..1
  } catch {
    return 0.2; // fallback baseline
  }
}

function pickColor(seed: string): { fill: string; stroke: string } {
  // Deterministic pastel pair
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  const hue = (h + 300) % 360;
  const fill = `hsla(${hue}, 70%, 60%, 0.85)`;
  const stroke = `hsla(${hue}, 85%, 50%, 0.9)`;
  return { fill, stroke };
}

function computeRadiusRange(n: number, width: number): { min: number; max: number } {
  const base = Math.max(320, Math.min(1280, width));
  const density = Math.sqrt(Math.max(1, n));
  const max = Math.max(34, Math.min(96, base / (density * 1.2)));
  const min = Math.max(18, Math.min(max * 0.45, 42));
  return { min, max };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const DPR = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;

function getInitials(name: string, username?: string): string {
  if (name) {
    const chars = name
      .split(" ")
      .filter(Boolean)
      .map(w => w.charAt(0))
      .join("")
      .toUpperCase();
    if (chars.length >= 2) return chars.slice(0, 2);
    if (chars.length === 1 && username) return (chars + username.charAt(0)).toUpperCase();
    if (chars.length === 1) return (chars + "?").toUpperCase();
  }
  if (username) return username.slice(0, 2).toUpperCase();
  return "??";
}

type CanvasBubblesProps = {
  initialDevelopers: Dev[];
};

function getCachedDevelopers(): Dev[] | null {
  try {
    const raw = localStorage.getItem(DEVELOPERS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DevelopersCache;
    if (Date.now() - parsed.fetchedAt > ACTIVITY_CACHE_TTL_MS) return null;
    return parsed.developers;
  } catch {
    return null;
  }
}

function setCachedDevelopers(developers: Dev[]): void {
  try {
    const payload: DevelopersCache = { developers, fetchedAt: Date.now() };
    localStorage.setItem(DEVELOPERS_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

const CanvasBubbles: React.FC<CanvasBubblesProps> = ({ initialDevelopers }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [developers, setDevelopers] = useState<Dev[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; dev: Dev } | null>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const ripplesRef = useRef<Array<{ x: number; y: number; start: number }>>([]);
  const rafRef = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const lastSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Try cache first, fallback to SSR props
    const cached = getCachedDevelopers();
    if (cached && cached.length > 0) {
      setDevelopers(cached);
    } else {
      setDevelopers(initialDevelopers);
      setCachedDevelopers(initialDevelopers);
    }
  }, [initialDevelopers]);

  // Prepare bubbles whenever developers change or size changes
  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || developers.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const newWidth = Math.floor(rect.width * DPR);
      const newHeight = Math.floor(rect.height * DPR);
      canvas.width = newWidth;
      canvas.height = newHeight;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      return { width: newWidth / DPR, height: newHeight / DPR };
    };
    const initialSize = resize();
    lastSizeRef.current = initialSize;

    const width = canvas.width / DPR;
    const height = canvas.height / DPR;
    const minDim = Math.min(width, height);
    const TARGET_COVERAGE = 0.42; // ~42% of viewport area covered by circles
    const MIN_R = Math.max(16, Math.min(minDim * 0.05, 40));
    const MAX_R = Math.min(minDim * 0.16, 120);

    const assignRadiiByCoverage = () => {
      const sumW2 = bubbles.reduce((acc, b) => acc + b.w * b.w, 0);
      const targetArea = TARGET_COVERAGE * width * height;
      const k = Math.sqrt(targetArea / (Math.PI * Math.max(1e-6, sumW2)));
      for (const b of bubbles) {
        const desired = k * b.w;
        b.r = Math.max(MIN_R, Math.min(MAX_R, desired));
      }
    };

    const bubbles: Bubble[] = developers.map((dev, i) => {
      const ghUser = parseGithubUsername(dev.github, dev.username);
      const hasWalrus = Boolean(dev.walrusBlobId);
      const { fill, stroke } = pickColor(dev.username);
      const cached = getCachedActivity(ghUser);
      const baseScore = cached?.score ?? 0.2;
      const w = 0.9 + baseScore * 0.9; // weight range ~[0.9..1.8]
      const startX = (0.2 + 0.6 * Math.random()) * width;
      const startY = (0.2 + 0.6 * Math.random()) * height;
      return {
        id: dev.username,
        dev,
        x: startX,
        y: startY,
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08,
        r: 20, // temporary, will be set by assignRadiiByCoverage
        imgLoaded: false,
        color: fill,
        stroke,
        score: baseScore,
        dirAngle: Math.random() * Math.PI * 2,
        dirRotSpeed: (Math.random() - 0.5) * 0.0015, // very slow rotation
        driftSpeed: 0.006 + Math.random() * 0.008, // very gentle drift
        w,
        hasWalrus,
      };
    });

    // Initial radii to fill screen by percentage
    assignRadiiByCoverage();

    // Load images from Supabase only (no GitHub fallback)
    bubbles.forEach(b => {
      // Only load if Supabase avatar exists
      if (b.dev.avatar) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.referrerPolicy = "no-referrer";
        
        img.onload = () => {
          b.img = img;
          b.imgLoaded = true;
        };
        
        img.onerror = () => {
          // If Supabase avatar fails, render initials
          b.img = undefined;
          b.imgLoaded = false;
        };
        
        img.src = b.dev.avatar;
      } else {
        // No avatar in Supabase, render initials
        b.img = undefined;
        b.imgLoaded = false;
      }
    });

    bubblesRef.current = bubbles;

    // Progressive activity fetch with small concurrency to avoid rate limit bursts
    const queue = [...bubbles];
    let active = 0;
    const maxConcurrent = 3;
    let cancelled = false;

    const pump = () => {
      if (cancelled) return;
      while (active < maxConcurrent && queue.length > 0) {
        const b = queue.shift()!;
        const ghUser = parseGithubUsername(b.dev.github, b.dev.username);
        const cached = getCachedActivity(ghUser);
        if (cached) {
          b.score = cached.score;
          b.w = 0.9 + b.score * 0.9;
          assignRadiiByCoverage();
          continue;
        }
        active++;
        fetchGithubActivity(ghUser)
          .then(score => {
            console.log("fetched activity", ghUser, score);
            setCachedActivity(ghUser, score);
            b.score = score;
            b.w = 0.9 + score * 0.9;
            assignRadiiByCoverage();
          })
          .finally(() => {
            active--;
            pump();
          });
      }
    };
    pump();

    // Physics + render loop
    const maxSpeed = 0.55; // clamp velocity for stability (much slower)
    const restitution = 0.82; // bounciness for collisions (lower to reduce jitter)

    const step = () => {
      // Get current canvas dimensions (in case of resize)
      const currentWidth = canvas.width / DPR;
      const currentHeight = canvas.height / DPR;
      
      // Update positions
      for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i];

        // Random drift: slowly rotating direction
        b.vx += Math.cos(b.dirAngle) * b.driftSpeed;
        b.vy += Math.sin(b.dirAngle) * b.driftSpeed;
        b.dirAngle += b.dirRotSpeed;

        // Velocity damping (stronger to slow down)
        b.vx *= 0.995;
        b.vy *= 0.995;

        // Clamp speed
        const sp = Math.hypot(b.vx, b.vy);
        if (sp > maxSpeed) {
          const scale = maxSpeed / sp;
          b.vx *= scale;
          b.vy *= scale;
        }

        b.x += b.vx;
        b.y += b.vy;

        // Soft edge repulsion to keep bubbles off the borders (use current dimensions)
        const edgeMargin = Math.max(20, b.r * 0.75);
        if (b.x - b.r < edgeMargin) {
          const t = (edgeMargin - (b.x - b.r)) / edgeMargin; // 0..1
          b.vx += 0.18 * t;
        } else if (b.x + b.r > currentWidth - edgeMargin) {
          const t = (edgeMargin - (currentWidth - (b.x + b.r))) / edgeMargin;
          b.vx -= 0.18 * t;
        }
        if (b.y - b.r < edgeMargin) {
          const t = (edgeMargin - (b.y - b.r)) / edgeMargin;
          b.vy += 0.18 * t;
        } else if (b.y + b.r > currentHeight - edgeMargin) {
          const t = (edgeMargin - (currentHeight - (b.y + b.r))) / edgeMargin;
          b.vy -= 0.18 * t;
        }

        // Hard bounds as fallback (rare) - use current dimensions
        if (b.x - b.r < 0) { b.x = b.r; b.vx *= -restitution; }
        if (b.x + b.r > currentWidth) { b.x = currentWidth - b.r; b.vx *= -restitution; }
        if (b.y - b.r < 0) { b.y = b.r; b.vy *= -restitution; }
        if (b.y + b.r > currentHeight) { b.y = currentHeight - b.r; b.vy *= -restitution; }
      }

      // Resolve collisions (pairwise elastic, smoothed)
      for (let i = 0; i < bubbles.length; i++) {
        for (let j = i + 1; j < bubbles.length; j++) {
          const a = bubbles[i];
          const b = bubbles[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy);
          const minDist = a.r + b.r;
          if (dist > 0 && dist < minDist) {
            const nx = dx / dist;
            const ny = dy / dist;

            // Positional correction with slop to reduce jitter
            const slop = 1.0; // allow tiny penetration
            const percent = 0.6; // correction strength
            const penetration = minDist - dist;
            if (penetration > 0) {
              const corr = Math.max(penetration - slop, 0) * (percent / 2);
              a.x -= nx * corr; a.y -= ny * corr;
              b.x += nx * corr; b.y += ny * corr;
            }

            // Relative velocity components
            const rvx = b.vx - a.vx;
            const rvy = b.vy - a.vy;
            const vn = rvx * nx + rvy * ny; // normal component
            const tx = -ny; const ty = nx; // tangent
            const vt = rvx * tx + rvy * ty; // tangential component

            if (vn < 0) {
              // Elastic impulse along normal
              const j = (-(1 + restitution) * vn) / 2; // equal mass
              const jx = j * nx; const jy = j * ny;
              a.vx -= jx; a.vy -= jy;
              b.vx += jx; b.vy += jy;

              // Tangential friction to damp slide and ringing
              const muT = 0.06; // tangential friction coefficient
              const jt = (-vt * muT) / 2;
              const jtx = jt * tx; const jty = jt * ty;
              a.vx -= jtx; a.vy -= jty;
              b.vx += jtx; b.vy += jty;
            }
          }
        }
      }

      // Render - clear canvas with current dimensions
      ctx.clearRect(0, 0, currentWidth, currentHeight);
      // Draw ripples first (under bubbles)
      {
        const now = performance.now();
        const keep: Array<{ x: number; y: number; start: number }> = [];
        for (const r of ripplesRef.current) {
          const t = (now - r.start) / RIPPLE_FADE_MS; // 0..1
          if (t >= 1) continue;
          const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
          const radius = RIPPLE_MAX_RADIUS * eased;
          const alpha = Math.max(0, 1 - t);
          ctx.save();
          ctx.beginPath();
          ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255,255,255,${0.28 * alpha})`;
          ctx.lineWidth = RIPPLE_STROKE_WIDTH;
          ctx.shadowColor = `rgba(0,0,0,${0.25 * alpha})`;
          ctx.shadowBlur = 12 * alpha;
          ctx.stroke();
          ctx.restore();
          keep.push(r);
        }
        ripplesRef.current = keep;
      }

      // Then draw bubbles
      for (const b of bubbles) {
        // Glow shadow (only for Walrus bubbles - regular bubbles have no colored shadow)
        ctx.save();
        if (b.hasWalrus) {
          // Emerald glow for Walrus-enabled bubbles (bright and prominent)
          ctx.shadowColor = "rgb(16, 185, 129)"; // emerald-500
          ctx.shadowBlur = 32;
        } else {
          // Subtle neutral shadow for regular bubbles
          ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
          ctx.shadowBlur = 8;
        }
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();
        ctx.restore();

        // Image mask or initials fallback
        if (b.imgLoaded && b.img) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r - 3, 0, Math.PI * 2);
          ctx.clip();
          const size = (b.r - 3) * 2;
          ctx.drawImage(b.img, b.x - size / 2, b.y - size / 2, size, size);
          ctx.restore();
        } else {
          // Initials fallback
          const initials = getInitials(b.dev.name, b.dev.username);
          ctx.save();
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          // Choose font size relative to radius
          const fontSize = Math.max(10, Math.floor(b.r * 0.85));
          ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial`;
          // Subtle shadow for readability
          ctx.shadowColor = "rgba(0,0,0,0.35)";
          ctx.shadowBlur = 6;
          ctx.fillText(initials, b.x, b.y + 1);
          ctx.restore();
        }

        // Stroke (single border for all bubbles - white for regular, emerald for Walrus)
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        if (b.hasWalrus) {
          // Single emerald border for Walrus (matches ProfileAvatar ring-4 ring-emerald-400/70)
          ctx.strokeStyle = "rgba(52, 211, 153, 0.7)"; // emerald-400/70
          ctx.lineWidth = 4;
        } else {
          // Subtle white border for regular bubbles (border-white/20)
          ctx.strokeStyle = "rgba(255, 255, 255, 0.2)"; // white/20
          ctx.lineWidth = 3;
        }
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);

    // Resize handler with immediate canvas resize + debounced bubble recalculation
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      // Immediately resize canvas to avoid visual lag
      const newSize = resize();
      const oldSize = lastSizeRef.current;
      
      // Calculate scale ratios
      const scaleX = newSize.width / oldSize.width;
      const scaleY = newSize.height / oldSize.height;
      
      // Immediately scale bubble positions to match new canvas size
      if (oldSize.width > 0 && oldSize.height > 0) {
        for (const b of bubblesRef.current) {
          b.x *= scaleX;
          b.y *= scaleY;
        }
      }
      
      lastSizeRef.current = newSize;
      
      // Debounce the expensive recalculation of bubble sizes
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        // Recalculate MIN_R, MAX_R based on new dimensions
        const newMinDim = Math.min(newSize.width, newSize.height);
        const NEW_MIN_R = Math.max(16, Math.min(newMinDim * 0.05, 40));
        const NEW_MAX_R = Math.min(newMinDim * 0.16, 120);
        
        // Recalculate bubble radii for new viewport
        const sumW2 = bubblesRef.current.reduce((acc, b) => acc + b.w * b.w, 0);
        const targetArea = TARGET_COVERAGE * newSize.width * newSize.height;
        const k = Math.sqrt(targetArea / (Math.PI * Math.max(1e-6, sumW2)));
        
        for (const b of bubblesRef.current) {
          const desired = k * b.w;
          b.r = Math.max(NEW_MIN_R, Math.min(NEW_MAX_R, desired));
        }
      }, 200); // 200ms debounce for size recalculation
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      if (resizeTimeout) clearTimeout(resizeTimeout);
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [developers, mounted]);

  const handlePointer = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let found: Bubble | null = null;
    for (const b of bubblesRef.current) {
      const dx = x - b.x;
      const dy = y - b.y;
      if (dx * dx + dy * dy <= b.r * b.r) {
        found = b; break;
      }
    }
    if (found) {
      setHoveredId(found.id);
      setTooltip({ x, y: y - (found.r + 16), dev: found.dev });
      canvas.style.cursor = "pointer";
    } else {
      setHoveredId(null);
      setTooltip(null);
      canvas.style.cursor = "default";
    }
  };

  const onMouseMove = (e: React.MouseEvent) => handlePointer(e.clientX, e.clientY);
  const onTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (t) handlePointer(t.clientX, t.clientY);
  };

  const onClick = (e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // spawn ripple visual
    ripplesRef.current.push({ x, y, start: performance.now() });
    let clickedOnBubble = false;
    for (const b of bubblesRef.current) {
      const dx = x - b.x;
      const dy = y - b.y;
      if (dx * dx + dy * dy <= b.r * b.r) {
        clickedOnBubble = true;
        const { open } = useModalStore.getState();
        open({ title: b.dev.name, content: <DeveloperModalCard dev={b.dev} /> });
        break;
      }
    }
    if (!clickedOnBubble) {
      // Apply stronger radial push to nearby bubbles (splash effect)
      const radius = CLICK_PUSH_RADIUS; // influence radius in px
      for (const b of bubblesRef.current) {
        const dx = b.x - x;
        const dy = b.y - y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0 && dist < radius) {
          const nx = dx / dist;
          const ny = dy / dist;
          const t = (radius - dist) / radius; // 0..1 near click
          const impulse = CLICK_PUSH_STRENGTH * t; // scaled by distance to center
          b.vx += nx * impulse;
          b.vy += ny * impulse;
        }
      }
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    if (!t) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = t.clientX - rect.left;
    const y = t.clientY - rect.top;
    // spawn ripple visual
    ripplesRef.current.push({ x, y, start: performance.now() });
    let tappedOnBubble = false;
    for (const b of bubblesRef.current) {
      const dx = x - b.x;
      const dy = y - b.y;
      if (dx * dx + dy * dy <= b.r * b.r) {
        tappedOnBubble = true;
        const { open } = useModalStore.getState();
        open({ title: b.dev.name, content: <DeveloperModalCard dev={b.dev} /> });
        break;
      }
    }
    if (!tappedOnBubble) {
      const radius = CLICK_PUSH_RADIUS;
      for (const b of bubblesRef.current) {
        const dx = b.x - x;
        const dy = b.y - y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0 && dist < radius) {
          const nx = dx / dist;
          const ny = dy / dist;
          const t = (radius - dist) / radius;
          const impulse = CLICK_PUSH_STRENGTH * t;
          b.vx += nx * impulse;
          b.vy += ny * impulse;
        }
      }
    }
  };

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        onMouseMove={onMouseMove}
        onMouseLeave={() => { setHoveredId(null); setTooltip(null); }}
        onClick={onClick}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      />
      {tooltip && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full transform rounded-lg bg-black/85 px-3 py-2 text-white shadow-lg backdrop-blur"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="text-sm font-semibold">{tooltip.dev.name}</div>
          <div className="text-xs text-white/70">@{tooltip.dev.username}</div>
          {tooltip.dev.bio && (
            <div className="mt-1 max-w-56 truncate text-xs text-white/60">{tooltip.dev.bio}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default CanvasBubbles;


