import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import client from '../../api/client';

export default function CertificatePage() {
  const { id } = useParams();
  const [cert, setCert] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    client.get(`/certificates/${id}`).then(res => {
      setCert(res.data.data.certificate);
    }).catch(err => {
      setError('Failed to load certificate');
    });
  }, [id]);

  if (error) return <div>{error}</div>;
  if (!cert) return <div>Loading certificate...</div>;

  const handlePrint = () => {
    window.print();
  };

  const { request } = cert;
  const { student } = request;

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <button className="no-print" onClick={() => navigate('/student/dashboard')} style={{ marginBottom: '20px' }}>Back to Dashboard</button>
      
      <div style={{ border: '2px solid black', padding: '30px', borderRadius: '10px' }} className="print-area">
        <h2>Hostel Approval Certificate</h2>
        <h3>{request.approvalNumber}</h3>
        
        <div style={{ margin: '30px 0' }}>
          <QRCodeSVG value={cert.qrToken} size={200} />
        </div>
        
        <div style={{ textAlign: 'left', lineHeight: '1.6' }}>
          <p><strong>Name:</strong> {student.fullName}</p>
          <p><strong>USN:</strong> {student.usn}</p>
          <p><strong>Room:</strong> {student.room?.displayName || 'N/A'}</p>
          <p><strong>Type:</strong> {request.requestType}</p>
          {request.requestType === 'OUTING' && <p><strong>Destination:</strong> {request.location}</p>}
          <p><strong>Out Time:</strong> {new Date(request.outDateTime).toLocaleString()}</p>
          <p><strong>Expected Return:</strong> {new Date(request.expectedReturnDateTime).toLocaleString()}</p>
          <p><strong>Approved By:</strong> Warden</p>
          <p><strong>Status:</strong> {cert.status}</p>
        </div>
      </div>
      
      <button className="no-print" onClick={handlePrint} style={{ marginTop: '20px', padding: '10px 20px' }}>Download / Print</button>
      
      <style>{`
        @media print {
          .no-print { display: none; }
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; border: none; }
        }
      `}</style>
    </div>
  );
}
