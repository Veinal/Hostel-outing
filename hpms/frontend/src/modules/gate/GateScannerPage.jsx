import React, { useEffect, useReducer, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { gateApi } from './gateApi';
import ScanResultOverlay from './ScanResultOverlay';
import ManualTokenEntry from './ManualTokenEntry';

const initialState = {
  status: 'IDLE', // IDLE | DECODING | CALLING_API | SUCCESS | ERROR
  result: null,
  error: null
};

function scannerReducer(state, action) {
  switch (action.type) {
    case 'START_DECODING':
      return { ...state, status: 'DECODING' };
    case 'START_API_CALL':
      return { ...state, status: 'CALLING_API' };
    case 'SUCCESS':
      return { ...state, status: 'SUCCESS', result: action.payload, error: null };
    case 'ERROR':
      return { ...state, status: 'ERROR', result: null, error: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export default function GateScannerPage() {
  const [state, dispatch] = useReducer(scannerReducer, initialState);
  const [showManual, setShowManual] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCode = useRef(null);

  useEffect(() => {
    html5QrCode.current = new Html5Qrcode("reader");

    const startScanner = async () => {
      try {
        await html5QrCode.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          onScanSuccess,
          onScanFailure
        );
      } catch (err) {
        console.warn('Camera failed to start', err);
      }
    };

    startScanner();

    return () => {
      if (html5QrCode.current && html5QrCode.current.isScanning) {
        html5QrCode.current.stop().catch(console.error);
      }
    };
  }, []);

  const onScanSuccess = (decodedText) => {
    if (state.status !== 'IDLE') return; // Prevent multiple scans
    
    // Pause scanner natively isn't explicitly supported in v2 in a clean way without stop/start,
    // but ignoring frames if not IDLE effectively "pauses" the processing logic.
    dispatch({ type: 'START_DECODING' });
    handleQrToken(decodedText);
  };

  const onScanFailure = (error) => {
    // Ignore frequent scan failures (just means no QR detected yet)
  };

  const handleQrToken = async (qrToken) => {
    dispatch({ type: 'START_API_CALL' });
    try {
      const response = await gateApi.scanQr(qrToken, 'GATE_WEB');
      dispatch({ type: 'SUCCESS', payload: response.data });
      
      setTimeout(() => {
        dispatch({ type: 'RESET' });
      }, 4000);
    } catch (err) {
      dispatch({ 
        type: 'ERROR', 
        payload: { 
          code: err.response?.data?.error?.code || 'UNKNOWN', 
          message: err.response?.data?.error?.message 
        } 
      });

      setTimeout(() => {
        dispatch({ type: 'RESET' });
      }, 3000);
    }
  };

  const handleManualScan = (qrToken) => {
    setShowManual(false);
    handleQrToken(qrToken);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col items-center pt-8 pb-12 px-4">
      <h2 className="text-2xl font-bold text-white mb-6">Gate Scanner App</h2>
      
      <div className="relative w-full max-w-md bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-800">
        <div id="reader" className="w-full"></div>
        
        {state.status === 'CALLING_API' && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
            <h3 className="text-lg font-medium text-white flex items-center gap-3">
              <span className="loading loading-spinner loading-sm"></span> Processing...
            </h3>
          </div>
        )}
      </div>

      <div className="mt-8">
        {!showManual ? (
          <button onClick={() => setShowManual(true)} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-colors ring-1 ring-slate-700 shadow-sm">
            Can't scan? Enter manually
          </button>
        ) : (
          <div className="bg-slate-800 p-4 rounded-xl ring-1 ring-slate-700 shadow-xl mt-4">
            <ManualTokenEntry onScanRequest={handleManualScan} onCancel={() => setShowManual(false)} />
          </div>
        )}
      </div>

      {(state.status === 'SUCCESS' || state.status === 'ERROR') && (
        <ScanResultOverlay 
          result={state.result} 
          error={state.error} 
          onDismiss={() => dispatch({ type: 'RESET' })}
        />
      )}
    </div>
  );
}
