import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import client from '../../api/client';
import ScanResultOverlay from './ScanResultOverlay';
import ManualTokenEntry from './ManualTokenEntry';

export default function GateScannerPage() {
  const [scanState, setScanState] = useState('IDLE'); // IDLE | CALLING_API | SUCCESS | ERROR
  const [resultData, setResultData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showManual, setShowManual] = useState(false);
  
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const isProcessingRef = useRef(false);

  const startScanner = async () => {
    // If the element doesn't exist yet, wait
    if (!document.getElementById('qr-scanner-region')) return;
    
    try {
      // Stop any existing instance first
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
        } catch (e) {
          // Ignore stop errors
        }
      }
      
      const html5QrCode = new Html5Qrcode('qr-scanner-region');
      html5QrCodeRef.current = html5QrCode;
      
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        onScanFailure
      );
    } catch (err) {
      console.error('Scanner start error:', err);
      // Only set error if we aren't already showing one
      if (scanState === 'IDLE') {
        setErrorMessage('Camera failed to start. Use manual entry.');
        setScanState('ERROR');
      }
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current = null;
      } catch (e) {
        console.warn('Stop scanner error:', e);
      }
    }
  };

  const restartScanner = async () => {
    await stopScanner();
    // Small delay to let the DOM settle
    setTimeout(() => startScanner(), 300);
  };

  const onScanSuccess = async (decodedText) => {
    // Guard against double-firing
    if (isProcessingRef.current) return;
    if (scanState !== 'IDLE') return;
    
    isProcessingRef.current = true;
    setScanState('CALLING_API');
    
    try {
      await stopScanner();
      const response = await client.post('/gate/scan', {
        qrToken: decodedText,
        deviceId: 'GATE_WEB'
      });
      setResultData(response.data.data);
      setScanState('SUCCESS');
    } catch (err) {
      setErrorMessage(
        err.response?.data?.error?.message || 'Scan failed'
      );
      setScanState('ERROR');
    } finally {
      isProcessingRef.current = false;
    }
  };

  const onScanFailure = (error) => {
    // Ignore frequent scan failures
  };

  // Start on mount
  useEffect(() => {
    startScanner();
    return () => { stopScanner(); };
  }, []);

  // Stop scanner while showing result, restart on IDLE
  useEffect(() => {
    if (scanState === 'IDLE') {
      startScanner();
    } else if (scanState === 'CALLING_API' || 
               scanState === 'SUCCESS' || 
               scanState === 'ERROR') {
      stopScanner();
    }
  }, [scanState]);

  // After transitioning to SUCCESS or ERROR: auto-reset after 4s
  useEffect(() => {
    if (scanState === 'SUCCESS' || scanState === 'ERROR') {
      const timer = setTimeout(() => {
        setScanState('IDLE');
        setResultData(null);
        setErrorMessage(null);
        restartScanner();
      }, 4000); // 4 seconds display time
      
      return () => clearTimeout(timer);
    }
  }, [scanState]);

  const handleManualScan = (qrToken) => {
    setShowManual(false);
    onScanSuccess(qrToken);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col items-center pt-8 pb-12 px-4 relative">
      
      {/* Top bar with Dashboard link */}
      <div className="absolute top-4 right-4 z-10">
        <a 
          href="/gate/dashboard"
          className="bg-slate-700 hover:bg-slate-600 text-white 
            px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          📋 View Scan Log
        </a>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Gate Scanner</h1>
        <p className="text-slate-400">Scan student QR code for entry/exit</p>
      </div>
      
      <div className="relative w-full max-w-md bg-black rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 aspect-square flex items-center justify-center">
        <div id="qr-scanner-region" className="w-full h-full"></div>
        
        {scanState === 'CALLING_API' && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <h3 className="text-lg font-medium text-white">Verifying Certificate...</h3>
          </div>
        )}

        {scanState === 'IDLE' && (
          <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40">
            <div className="w-full h-full border-2 border-white/20 rounded-xl relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
              
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-blue-500/30 animate-pulse"></div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-10 w-full max-w-md">
        {!showManual ? (
          <button 
            onClick={() => setShowManual(true)} 
            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-semibold transition-all border border-white/5 flex items-center justify-center gap-2"
          >
            ⌨️ Enter Token Manually
          </button>
        ) : (
          <div className="bg-slate-800 p-6 rounded-2xl border border-white/10 shadow-xl">
            <ManualTokenEntry onScanRequest={handleManualScan} onCancel={() => setShowManual(false)} />
          </div>
        )}
      </div>

      {(scanState === 'SUCCESS' || scanState === 'ERROR') && (
        <ScanResultOverlay 
          result={resultData} 
          error={errorMessage} 
          setScanState={setScanState}
          setResultData={setResultData}
          setErrorMessage={setErrorMessage}
        />
      )}
    </div>
  );
}
