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
    <div style={{ position: 'relative', minHeight: '100vh', backgroundColor: '#333', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '20px' }}>
      <h2>Gate Scanner App</h2>
      
      <div style={{ position: 'relative', width: '100%', maxWidth: '500px', backgroundColor: 'black', borderRadius: '10px', overflow: 'hidden' }}>
        <div id="reader" style={{ width: '100%' }}></div>
        
        {state.status === 'CALLING_API' && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <h3>Processing...</h3>
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        {!showManual ? (
          <button onClick={() => setShowManual(true)} style={{ padding: '10px 20px', fontSize: '1em', cursor: 'pointer' }}>
            Can't scan? Enter manually
          </button>
        ) : (
          <ManualTokenEntry onScanRequest={handleManualScan} onCancel={() => setShowManual(false)} />
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
