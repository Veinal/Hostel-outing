import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { formatDate, formatTime, isCertificateValid } from '../utils/approvalUtils';
import QRCode from './QRCode';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import { Button, Box, Typography, Paper, Grid, Divider, Chip } from '@mui/material';

const ApprovalCertificate = ({ certificateId, onClose }) => {
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const certificateRef = doc(db, 'approvalCertificates', certificateId);
        const certificateSnap = await getDoc(certificateRef);
        
        if (certificateSnap.exists()) {
          setCertificate({ id: certificateSnap.id, ...certificateSnap.data() });
        } else {
          setError('Certificate not found');
        }
      } catch (err) {
        console.error('Error fetching certificate:', err);
        setError('Failed to load certificate');
      } finally {
        setLoading(false);
      }
    };

    if (certificateId) {
      fetchCertificate();
    }
  }, [certificateId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const element = document.getElementById('certificate-content');
    const html = element.outerHTML;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `approval-certificate-${certificate?.approvalNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading certificate...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!certificate) {
    return null;
  }

  const isValid = isCertificateValid(certificate.validUntil);

  return (
    <Box sx={{ p: 3, maxWidth: '800px', margin: '0 auto' }}>
      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
        >
          Print
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
        >
          Download
        </Button>
        {onClose && (
          <Button variant="contained" onClick={onClose}>
            Close
          </Button>
        )}
      </Box>

      {/* Certificate Content */}
      <Paper
        id="certificate-content"
        elevation={3}
        sx={{
          p: 4,
          border: '3px solid #1976d2',
          borderRadius: 2,
          backgroundColor: '#fafafa',
          '@media print': {
            boxShadow: 'none',
            border: '2px solid #000'
          }
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>
            HOSTEL OUTING APPROVAL CERTIFICATE
          </Typography>
          <Typography variant="h6" color="textSecondary">
            Official Approval Document
          </Typography>
        </Box>

        {/* Approval Number */}
        <Box sx={{ textAlign: 'center', mb: 4, p: 2, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
            Approval Number: {certificate.approvalNumber}
          </Typography>
          <Chip
            label={isValid ? 'VALID' : 'EXPIRED'}
            color={isValid ? 'success' : 'error'}
            sx={{ mt: 1 }}
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Student Information */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}>
              Student Information
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1"><strong>Name:</strong> {certificate.studentName}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1"><strong>Roll Number:</strong> {certificate.studentRollNo}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1"><strong>Branch:</strong> {certificate.studentBranch}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1"><strong>Year:</strong> {certificate.studentYear}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1"><strong>Block:</strong> {certificate.studentBlock}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1"><strong>Room:</strong> {certificate.studentRoom}</Typography>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 3 }} />

        {/* Outing Details */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}>
              Outing Details
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1"><strong>Type:</strong> {certificate.requestType}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1"><strong>Reason:</strong> {certificate.reason}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1"><strong>Out Date:</strong> {formatDate(certificate.outDate)}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1"><strong>Out Time:</strong> {formatTime(certificate.outTime)}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1"><strong>Return Date:</strong> {formatDate(certificate.returnDate)}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1"><strong>Return Time:</strong> {formatTime(certificate.returnTime)}</Typography>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 3 }} />

        {/* Approval Information */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}>
              Approval Information
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1"><strong>Approved By:</strong> {certificate.wardenName}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1"><strong>Approved On:</strong> {formatDate(certificate.approvedAt)}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1"><strong>Valid Until:</strong> {formatDate(certificate.validUntil)}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1"><strong>Status:</strong> {certificate.status}</Typography>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 3 }} />

        {/* QR Code and Footer */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              Scan to verify certificate
            </Typography>
            <QRCode data={certificate.approvalNumber} size={120} />
          </Box>
          
          <Typography variant="body2" color="textSecondary" sx={{ mt: 3 }}>
            This certificate serves as official proof of approval for the specified outing request.
            It must be presented when leaving and entering the hostel premises.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default ApprovalCertificate;
