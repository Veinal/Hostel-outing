import React from 'react';

export default function ScanResultOverlay({ result, error, onDismiss }) {
  if (error) {
    return (
      <div style={overlayStyle('red')}>
        <div style={cardStyle}>
          <h2>❌ Error</h2>
          <p style={{ fontSize: '1.2em' }}>{getErrorMessage(error.code) || error.message || 'Unknown error'}</p>
          <button onClick={onDismiss} style={btnStyle}>Dismiss</button>
        </div>
      </div>
    );
  }

  if (result) {
    const { scanType, student, permission } = result;
    return (
      <div style={overlayStyle('green')}>
        <div style={cardStyle}>
          <h2>{scanType === 'EXIT' ? '✓ EXIT LOGGED' : '✓ ENTRY LOGGED'}</h2>
          
          <div style={{ margin: '20px 0' }}>
            {student.photoUrl ? (
              <img src={student.photoUrl} alt="student" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 100, height: 100, borderRadius: '50%', backgroundColor: '#eee', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No Photo</div>
            )}
          </div>
          
          <h3>{student.fullName}</h3>
          <p>{student.usn} | {student.room}</p>
          
          <div style={{ marginTop: '20px', textAlign: 'left', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '5px' }}>
            <p><strong>Type:</strong> {permission.requestType}</p>
            {scanType === 'EXIT' && <p><strong>Expected Return:</strong><br/>{new Date(permission.expectedReturnDateTime).toLocaleString()}</p>}
          </div>
          
          <button onClick={onDismiss} style={{...btnStyle, marginTop: '20px'}}>Dismiss</button>
        </div>
      </div>
    );
  }

  return null;
}

const getErrorMessage = (code) => {
  switch(code) {
    case 'GATE_QR_INVALID': return "Invalid QR Code";
    case 'GATE_QR_EXPIRED': return "This pass has expired";
    case 'GATE_QR_ALREADY_COMPLETED': return "Already scanned in and out";
    case 'GATE_PERMISSION_CANCELLED': return "Permission was cancelled";
    case 'AUTH_UNAUTHORIZED': return "Scanner not authorized";
    default: return null;
  }
};

const overlayStyle = (color) => ({
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: color === 'red' ? 'rgba(255,0,0,0.85)' : 'rgba(0,128,0,0.85)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
});

const cardStyle = {
  backgroundColor: 'white',
  padding: '30px',
  borderRadius: '10px',
  textAlign: 'center',
  width: '90%',
  maxWidth: '400px',
  color: 'black'
};

const btnStyle = {
  padding: '10px 20px',
  fontSize: '1em',
  cursor: 'pointer'
};
