import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { formatDate, formatTime, isCertificateValid } from '../utils/approvalUtils';
import QRCode from './QRCode';
import SearchIcon from '@mui/icons-material/Search';
import QrCodeIcon from '@mui/icons-material/QrCode';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Grid, 
  Divider, 
  Chip,
  Alert,
  Card,
  CardContent
} from '@mui/material';

const CertificateVerification = () => {
  const [approvalNumber, setApprovalNumber] = useState('');
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleVerification = async () => {
    if (!approvalNumber.trim()) {
      setError('Please enter an approval number');
      return;
    }

    setLoading(true);
    setError('');
    setCertificate(null);
    setSearched(true);

    try {
      const certificatesRef = collection(db, 'approvalCertificates');
      const q = query(certificatesRef, where('approvalNumber', '==', approvalNumber.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('Certificate not found. Please check the approval number.');
      } else {
        const certData = querySnapshot.docs[0].data();
        setCertificate({ id: querySnapshot.docs[0].id, ...certData });
      }
    } catch (err) {
      console.error('Error verifying certificate:', err);
      setError('Failed to verify certificate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleVerification();
    }
  };

  const clearResults = () => {
    setApprovalNumber('');
    setCertificate(null);
    setError('');
    setSearched(false);
  };

  return (
    <Box sx={{ p: 3, maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 2 }}>
          Certificate Verification
        </Typography>
        <Typography variant="h6" color="textSecondary">
          Security Guard Interface - Verify Approval Certificates
        </Typography>
      </Box>

      {/* Search Section */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#1976d2' }}>
          Enter Approval Number
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField
            fullWidth
            label="Approval Number"
            placeholder="e.g., HO-2024-1703123456789-001"
            value={approvalNumber}
            onChange={(e) => setApprovalNumber(e.target.value)}
            onKeyPress={handleKeyPress}
            variant="outlined"
            size="large"
          />
          <Button
            variant="contained"
            size="large"
            onClick={handleVerification}
            disabled={loading || !approvalNumber.trim()}
            startIcon={<SearchIcon />}
            sx={{ minWidth: '120px' }}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<QrCodeIcon />}
            disabled
            title="QR Code scanning will be implemented in future versions"
          >
            Scan QR Code
          </Button>
          {searched && (
            <Button variant="outlined" onClick={clearResults}>
              Clear Results
            </Button>
          )}
        </Box>

        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
          Enter the approval number manually or scan the QR code on the certificate to verify its authenticity.
        </Typography>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Certificate Display */}
      {certificate && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>
              Verification Results
            </Typography>
            <Chip
              label={isCertificateValid(certificate.validUntil) ? 'VALID' : 'EXPIRED'}
              color={isCertificateValid(certificate.validUntil) ? 'success' : 'error'}
              size="large"
            />
          </Box>

          <Grid container spacing={3}>
            {/* Certificate Details */}
            <Grid item xs={12} md={8}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}>
                    Certificate Information
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">Approval Number</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {certificate.approvalNumber}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">Status</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {certificate.status}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">Valid Until</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {formatDate(certificate.validUntil)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">Approved On</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {formatDate(certificate.approvedAt)}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* QR Code */}
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    Certificate QR Code
                  </Typography>
                  <QRCode data={certificate.approvalNumber} size={120} />
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 2 }}>
                    Scan to verify
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Student Information */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}>
                Student Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="textSecondary">Name</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {certificate.studentName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="textSecondary">Roll Number</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {certificate.studentRollNo}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="textSecondary">Branch</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {certificate.studentBranch}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="textSecondary">Year</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {certificate.studentYear}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="textSecondary">Block</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {certificate.studentBlock}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="textSecondary">Room</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {certificate.studentRoom}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Outing Details */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}>
                Outing Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="textSecondary">Type</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {certificate.requestType}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="textSecondary">Reason</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {certificate.reason}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="textSecondary">Out Date</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {formatDate(certificate.outDate)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="textSecondary">Out Time</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {formatTime(certificate.outTime)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="textSecondary">Return Date</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {formatDate(certificate.returnDate)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="textSecondary">Return Time</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {formatTime(certificate.returnTime)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Approval Information */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}>
                Approval Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Approved By</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {certificate.wardenName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Request ID</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {certificate.requestId}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Paper>
      )}

      {/* Instructions */}
      {!searched && (
        <Paper elevation={1} sx={{ p: 3, mt: 4, backgroundColor: '#f5f5f5' }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#1976d2' }}>
            How to Use
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            1. Enter the approval number from the certificate in the search field above
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            2. Click "Verify" to check the certificate's authenticity
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            3. Review the verification results and certificate details
          </Typography>
          <Typography variant="body2" color="textSecondary">
            4. Ensure the certificate is valid and not expired before allowing entry/exit
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default CertificateVerification;
