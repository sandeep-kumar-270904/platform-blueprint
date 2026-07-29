import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@/components/ui/button';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onError?: (error: any) => void;
}

export const QRScanner = ({ onScan, onError }: QRScannerProps) => {
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    
    if (scanning) {
      scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      
      scanner.render(
        (decodedText) => {
          setScanning(false);
          scanner?.clear();
          onScan(decodedText);
        },
        (error) => {
          if (onError) onError(error);
        }
      );
    }

    return () => {
      scanner?.clear().catch(console.error);
    };
  }, [scanning, onScan, onError]);

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center">
      {scanning ? (
        <div id="qr-reader" className="w-full"></div>
      ) : (
        <div className="text-center p-4">
          <p className="text-sm font-medium mb-4 text-success">Scan captured!</p>
          <Button onClick={() => setScanning(true)}>Scan Another</Button>
        </div>
      )}
    </div>
  );
};
