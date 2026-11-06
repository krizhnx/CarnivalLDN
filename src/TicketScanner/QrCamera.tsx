// Camera + QR reader for the door.
//
// - Starts on its own, asks for the back camera at high resolution with continuous focus.
// - Reads QR codes with the phone's built-in reader where there is one (Android Chrome),
//   otherwise with zxing-cpp compiled to WebAssembly (iPhone), served from our own site.
// - On iPhones with several back lenses it picks the combined camera so it can switch to the
//   close-up lens; held-close QR codes otherwise stay blurry.
// - Torch and camera switch buttons where the phone supports them.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Flashlight, FlashlightOff, Loader2, RefreshCw, SwitchCamera } from 'lucide-react';
import { cn } from '../lib/utils';

type Detector = { detect(source: CanvasImageSource): Promise<{ rawValue: string }[]> };

let detectorPromise: Promise<Detector> | null = null;

/** QR reader: native BarcodeDetector if it reads QR codes, otherwise the WebAssembly one. */
const getDetector = (): Promise<Detector> => {
  detectorPromise ??= (async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Native = (window as any).BarcodeDetector;
    if (Native?.getSupportedFormats) {
      try {
        const formats: string[] = await Native.getSupportedFormats();
        if (formats.includes('qr_code')) return new Native({ formats: ['qr_code'] }) as Detector;
      } catch {
        // fall through to WebAssembly
      }
    }
    const [{ BarcodeDetector, prepareZXingModule }, { default: wasmUrl }] = await Promise.all([
      import('barcode-detector/ponyfill'),
      import('zxing-wasm/reader/zxing_reader.wasm?url'),
    ]);
    await prepareZXingModule({
      overrides: { locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? wasmUrl : prefix + path) },
      fireImmediately: true,
    });
    return new BarcodeDetector({ formats: ['qr_code'] }) as Detector;
  })().catch((err) => {
    detectorPromise = null; // let "Try again" retry the download
    throw err;
  });
  return detectorPromise;
};

const CAMERA_KEY = 'cldn.door.camera.v1';
const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** iPhone "virtual" back cameras switch lenses automatically, including the close-focus one. */
const pickIphoneCamera = (devices: MediaDeviceInfo[]) => {
  if (!isIOS()) return null;
  for (const pattern of [/back triple camera/i, /back dual wide camera/i, /back dual camera/i]) {
    const d = devices.find((x) => pattern.test(x.label));
    if (d) return d;
  }
  return null;
};

const openStream = (deviceId: string | null) =>
  navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: { ideal: 'environment' } }),
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
  });

const stopStream = (stream: MediaStream | null) => stream?.getTracks().forEach((t) => t.stop());

type Status = 'starting' | 'running' | 'denied' | 'nocamera' | 'unsupported' | 'error';

type Props = {
  /** camera on (off when another tab is showing) */
  enabled: boolean;
  /** reading codes (paused while a result is on screen) */
  reading: boolean;
  onCode: (text: string) => void;
};

const QrCamera: React.FC<Props> = ({ enabled, reading, onCode }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const runRef = useRef(0);
  const readingRef = useRef(reading);
  const onCodeRef = useRef(onCode);
  readingRef.current = reading;
  onCodeRef.current = onCode;

  const [status, setStatus] = useState<Status>('starting');
  const [errorText, setErrorText] = useState('');
  const [torch, setTorch] = useState({ supported: false, on: false });
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string | null>(() => localStorage.getItem(CAMERA_KEY));

  const stop = useCallback(() => {
    runRef.current += 1;
    stopStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const readLoop = useCallback(async (run: number, detector: Detector) => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    while (runRef.current === run) {
      if (!readingRef.current || document.hidden || video.readyState < 2 || !video.videoWidth) {
        await sleep(120);
        continue;
      }
      const started = performance.now();
      // Read the middle of the frame (what's inside the on-screen frame), at up to 1000px.
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const side = Math.min(vw, vh) * 0.9;
      const out = Math.round(Math.min(side, 1000));
      if (canvas.width !== out) {
        canvas.width = out;
        canvas.height = out;
      }
      ctx.drawImage(video, (vw - side) / 2, (vh - side) / 2, side, side, 0, 0, out, out);
      try {
        const codes = await detector.detect(canvas);
        const hit = codes.find((c) => c.rawValue);
        if (hit && readingRef.current && runRef.current === run) onCodeRef.current(hit.rawValue);
      } catch {
        // a bad frame - keep going
      }
      await sleep(Math.max(0, 70 - (performance.now() - started)));
    }
  }, []);

  const start = useCallback(
    async (preferred: string | null) => {
      stop();
      const run = runRef.current;
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('unsupported');
        return;
      }
      setStatus('starting');
      setErrorText('');
      const detectorReady = getDetector();
      detectorReady.catch(() => undefined);
      try {
        let stream = await openStream(preferred).catch((err) => {
          if (preferred && (err?.name === 'OverconstrainedError' || err?.name === 'NotFoundError')) return openStream(null);
          throw err;
        });
        if (runRef.current !== run) return stopStream(stream);

        const devices = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput');
        setCameras(devices);
        if (!preferred) {
          const better = pickIphoneCamera(devices);
          const current = stream.getVideoTracks()[0]?.getSettings().deviceId;
          if (better && better.deviceId !== current) {
            stopStream(stream);
            stream = await openStream(better.deviceId).catch(() => openStream(null));
            if (runRef.current !== run) return stopStream(stream);
          }
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return stopStream(stream);
        video.srcObject = stream;
        video.muted = true;
        video.setAttribute('playsinline', 'true');
        await video.play().catch(() => undefined);

        const track = stream.getVideoTracks()[0];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const caps: any = track?.getCapabilities?.() ?? {};
        if (Array.isArray(caps.focusMode) && caps.focusMode.includes('continuous')) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as any] }).catch(() => undefined);
        }
        setTorch({ supported: !!caps.torch, on: false });

        const detector = await detectorReady;
        if (runRef.current !== run) return;
        setStatus('running');
        readLoop(run, detector);
      } catch (err) {
        if (runRef.current !== run) return;
        const name = (err as Error)?.name;
        stopStream(streamRef.current);
        streamRef.current = null;
        if (name === 'NotAllowedError' || name === 'SecurityError') setStatus('denied');
        else if (name === 'NotFoundError' || name === 'OverconstrainedError') setStatus('nocamera');
        else {
          setStatus('error');
          setErrorText(name === 'NotReadableError' ? 'The camera is being used by another app.' : "The scanner couldn't start. Check the signal and try again.");
        }
      }
    },
    [readLoop, stop]
  );

  // Camera on/off with the tab, and released while the page is in the background.
  useEffect(() => {
    if (!enabled) {
      stop();
      return;
    }
    start(deviceId);
    const onVisibility = () => {
      if (document.hidden) stop();
      else start(localStorage.getItem(CAMERA_KEY));
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const on = !torch.on;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await track.applyConstraints({ advanced: [{ torch: on } as any] });
      setTorch({ supported: true, on });
    } catch {
      setTorch({ supported: false, on: false });
    }
  };

  const switchCamera = () => {
    if (cameras.length < 2) return;
    const current = streamRef.current?.getVideoTracks()[0]?.getSettings().deviceId ?? deviceId;
    // Back cameras first, then the rest
    const ordered = [...cameras].sort((a, b) => Number(/front|user|facetime/i.test(a.label)) - Number(/front|user|facetime/i.test(b.label)));
    const next = ordered[(ordered.findIndex((c) => c.deviceId === current) + 1) % ordered.length];
    localStorage.setItem(CAMERA_KEY, next.deviceId);
    setDeviceId(next.deviceId);
    start(next.deviceId);
  };

  const currentLabel = cameras.find((c) => c.deviceId === streamRef.current?.getVideoTracks()[0]?.getSettings().deviceId)?.label;

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-zinc-900">
        <video ref={videoRef} className={cn('h-full w-full object-cover transition-opacity', reading ? 'opacity-100' : 'opacity-40')} playsInline muted />

        {status === 'running' && (
          <div className="pointer-events-none absolute inset-[5%]">
            {/* corner brackets */}
            <span className="absolute left-0 top-0 h-10 w-10 rounded-tl-2xl border-l-4 border-t-4 border-white/90" />
            <span className="absolute right-0 top-0 h-10 w-10 rounded-tr-2xl border-r-4 border-t-4 border-white/90" />
            <span className="absolute bottom-0 left-0 h-10 w-10 rounded-bl-2xl border-b-4 border-l-4 border-white/90" />
            <span className="absolute bottom-0 right-0 h-10 w-10 rounded-br-2xl border-b-4 border-r-4 border-white/90" />
          </div>
        )}

        {status !== 'running' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
            {status === 'starting' ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-white/80" />
                <p className="text-sm text-white/80">Starting camera…</p>
              </>
            ) : (
              <>
                <Camera className="h-8 w-8 text-white/70" />
                <p className="max-w-xs text-sm text-white/90">
                  {status === 'denied'
                    ? 'Camera access is blocked. Allow the camera for this site in your browser settings, then tap Try again.'
                    : status === 'nocamera'
                      ? 'No camera found on this device.'
                      : status === 'unsupported'
                        ? 'This browser can’t use the camera here. Open the scanner in Safari or Chrome over https.'
                        : errorText}
                </p>
                <button
                  type="button"
                  onClick={() => start(deviceId)}
                  className="mt-1 inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-zinc-900"
                >
                  <RefreshCw className="h-4 w-4" /> Try again
                </button>
                <p className="text-xs text-white/60">You can still check people in with Look up.</p>
              </>
            )}
          </div>
        )}

        {status === 'running' && (torch.supported || cameras.length > 1) && (
          <div className="absolute bottom-3 right-3 flex gap-2">
            {torch.supported && (
              <button
                type="button"
                onClick={toggleTorch}
                className={cn('grid h-11 w-11 place-items-center rounded-full backdrop-blur', torch.on ? 'bg-amber-300 text-zinc-900' : 'bg-black/50 text-white')}
                aria-label={torch.on ? 'Turn torch off' : 'Turn torch on'}
              >
                {torch.on ? <FlashlightOff className="h-5 w-5" /> : <Flashlight className="h-5 w-5" />}
              </button>
            )}
            {cameras.length > 1 && (
              <button
                type="button"
                onClick={switchCamera}
                className="grid h-11 w-11 place-items-center rounded-full bg-black/50 text-white backdrop-blur"
                aria-label="Switch camera"
                title={currentLabel}
              >
                <SwitchCamera className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QrCamera;
