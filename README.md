
Build a complete TypeScript React video editor (Next.js 15) with these exact requirements:

## CORE FEATURES
1. **Timeline**: Drag/drop video clips, audio, text overlays, images. Scrub timeline → realtime canvas preview (60fps)
2. **Realtime Preview**: HTMLVideoElement + Canvas2D draw overlays/effects on video.currentTime scrub (NO full re-render)
3. **Export**: ffmpeg.wasm → MP4/WebM Blob download with progress bar (5-60s for 30s clips)
4. **UI**: Glassmorphism design, responsive, keyboard shortcuts (space=play, ctrl+Z=undo)

## TECH STACK (MANDATORY)
```
Frontend: Next.js 15 + React 19 + TypeScript + TailwindCSS + @radix-ui primitives
Video Engine: Etro (timeline/render) + ffmpeg.wasm (@ffmpeg/ffmpeg)
Preview: HTMLVideo + Canvas2D + requestAnimationFrame
State: Zustand (timeline state) + React hooks
Drag/Drop: @dnd-kit/core
Upload: Local files + temp URL preview (file.io fallback)
```

## PROJECT STRUCTURE
```
src/
├── app/                 # Next.js pages + layout
│   ├── editor/page.tsx  # Main editor page
│   └── layout.tsx
├── components/
│   ├── Timeline.tsx     # Tracks, clips, scrubber
│   ├── PreviewCanvas.tsx # Realtime video preview
│   ├── ClipCard.tsx     # Draggable clip UI
│   ├── ExportButton.tsx # ffmpeg.wasm export
│   └── UploadZone.tsx   # File dropzone
├── lib/
│   ├── etro-movie.ts    # Timeline movie builder
│   ├── ffmpeg-export.ts # WASM export logic
│   └── types.ts         # Clip, Layer, Timeline types
├── store/               # Zustand stores
└── hooks/               # usePreview, useTimeline, etc.
```

## STEP-BY-STEP IMPLEMENTATION ORDER

### 1. SETUP (10min)
```
npx create-next-app@latest video-editor --ts --tailwind --eslint --app
cd video-editor
npm i etro @ffmpeg/ffmpeg @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm i zustand @radix-ui/accordion lucide-react
npm i -D @types/ffmpeg.js
```

### 2. TYPES (types.ts)
```
export interface Clip { id: string; start: number; duration: number; file: File; type: 'video'|'audio' }
export interface TextLayer { id: string; text: string; start: number; duration: number; style: any }
export interface Timeline { clips: Clip[]; textLayers: TextLayer[]; }
```

### 3. ZUSTAND STORE (store/timelineStore.ts)
Full timeline state with clips, layers, currentTime, preview state.

### 4. UPLOAD ZONE (UploadZone.tsx)
Drag/drop → FileReader → thumbnail preview → add to timeline.

### 5. TIMELINE (Timeline.tsx)
- Horizontal scrollable tracks (video/audio/text)
- @dnd-kit drag clips between tracks/positions
- Scrubber line syncs with preview.currentTime

### 6. REALTIME PREVIEW (PreviewCanvas.tsx) - CRITICAL
```
const PreviewCanvas = () => {
  const { timeline, currentTime } = useTimelineStore()
  const videoRef = useRef<HTMLVideoElement>()
  const canvasRef = useRef<HTMLCanvasElement>()
  
  useEffect(() => {
    videoRef.current!.currentTime = currentTime // Instant seek
    const raf = () => {
      const ctx = canvasRef.current!.getContext('2d')!
      ctx.drawImage(videoRef.current!, 0, 0) // Base video
      renderOverlays(ctx, timeline.textLayers, currentTime) // Effects
      requestAnimationFrame(raf)
    }
    raf()
  }, [currentTime])
}
```

### 7. ETRO MOVIE BUILDER (lib/etro-movie.ts)
Convert timeline → etro.Movie → add layers → movie.record() → Blob.

### 8. FFMPEG EXPORT (lib/ffmpeg-export.ts)
```
1. FS.writeFile(input clips)
2. ffmpeg.run('-i input -vf "drawtext=..." output.mp4')
3. const data = FS.readFile('output.mp4')
4. Blob + <a download> trigger
```

### 9. GLASSMORPHISM UI
```
bg-white/20 backdrop-blur-xl border border-white/20 shadow-2xl
hover:bg-white/30 transition-all duration-300
```

## MVP SUCCESS CRITERIA
✅ Drag video → timeline → scrub → realtime preview with text overlay
✅ Export 10s clip → MP4 download in <20s  
✅ Responsive mobile/desktop
✅ No backend needed

## KNOWN LIMITS (SHOW TO USER)
- Export = full re-encode (no progressive)
- Chrome/Edge best perf (Safari WebCodecs lag)
- 60s+ clips → suggest backend later

## BONUS FEATURES (AFTER MVP)
- Undo/redo (Zustand history)
- Presets/templates JSON
- Temp upload API integration (file.io)
- Backend export queue (Next API + native FFmpeg)

Generate COMPLETE working code with zero broken imports. Test export flow works on localhost:3000/editor
