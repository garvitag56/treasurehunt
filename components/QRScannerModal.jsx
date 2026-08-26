'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Camera } from 'lucide-react';

export default function QRScannerModal({ open, onClose, onScan }) {
  const [error, setError] = useState('');
  const scannerRef = useRef(null);
  const handledRef = useRef(false);

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;
    handledRef.current = false;
    setError('');

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (handledRef.current) return;
            handledRef.current = true;
            onScan(decodedText);
          }
        );
      } catch (err) {
        if (!cancelled) {
          setError('Camera access failed. Allow camera permission and try again.');
        }
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
      }
    };
  }, [open, onScan]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-300">
            <Camera className="h-5 w-5" />
            <h2 className="text-lg font-semibold text-white">Scan checkpoint QR</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 p-2 text-white"
            aria-label="Close scanner"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div id="qr-reader" className="overflow-hidden rounded-2xl bg-black" />
        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : (
          <p className="mt-3 text-sm text-slate-400">Point your camera at the checkpoint QR code.</p>
        )}
      </div>
    </div>
  );
}
