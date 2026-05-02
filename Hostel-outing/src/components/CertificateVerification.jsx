import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { formatDate, formatTime } from '../utils/approvalUtils';
import { 
  QrCodeScanner as QrCodeScannerIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

export const CertificateVerification = () => {
  const [verificationMethod, setVerificationMethod] = useState('manual'); // 'manual' or 'qr'
  const [approvalNumber, setApprovalNumber] = useState('');
  const [certificate, setCertificate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null); // 'valid', 'invalid', 'expired'

  const handleVerification = async () => {
    if (!approvalNumber.trim()) {
      setError('Please enter an approval number');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCertificate(null);
    setVerificationStatus(null);

    try {
      // Search for the certificate in Firestore
      const certificatesRef = collection(db, 'approvalCertificates');
      const q = query(certificatesRef, where('approvalNumber', '==', approvalNumber.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('Approval number not found');
        setVerificationStatus('invalid');
        return;
      }

      const certDoc = querySnapshot.docs[0];
      const certData = certDoc.data();

      // Check if certificate is expired
      const returnDate = new Date(certData.returnDate);
      const currentDate = new Date();
      const isExpired = currentDate > returnDate;

      if (isExpired) {
        setVerificationStatus('expired');
        setError('Certificate has expired');
      } else {
        setVerificationStatus('valid');
      }

      setCertificate(certData);
    } catch (err) {
      console.error('Error verifying certificate:', err);
      setError('Failed to verify certificate');
      setVerificationStatus('invalid');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQRScan = (data) => {
    try {
      const qrData = JSON.parse(data);
      if (qrData.approvalNumber) {
        setApprovalNumber(qrData.approvalNumber);
        handleVerification();
      } else {
        setError('Invalid QR code format');
      }
    } catch (err) {
      setError('Invalid QR code data');
    }
  };

  const resetVerification = () => {
    setApprovalNumber('');
    setCertificate(null);
    setError(null);
    setVerificationStatus(null);
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'valid':
        return <CheckCircleIcon className="text-green-600 text-6xl" />;
      case 'invalid':
        return <CancelIcon className="text-red-600 text-6xl" />;
      case 'expired':
        return <WarningIcon className="text-orange-600 text-6xl" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (verificationStatus) {
      case 'valid':
        return 'Certificate is VALID';
      case 'invalid':
        return 'Certificate is INVALID';
      case 'expired':
        return 'Certificate has EXPIRED';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (verificationStatus) {
      case 'valid':
        return 'text-green-600';
      case 'invalid':
        return 'text-red-600';
      case 'expired':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <SecurityIcon className="text-blue-600 text-4xl" />
              <h1 className="text-3xl font-bold text-gray-800">
                Certificate Verification
              </h1>
            </div>
            <p className="text-gray-600">
              Verify hostel outing approval certificates for security purposes
            </p>
          </div>
        </div>

        {/* Verification Methods */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Verification Method</h2>
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setVerificationMethod('manual')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                verificationMethod === 'manual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <SearchIcon className="mr-2" />
              Manual Entry
            </button>
            <button
              onClick={() => setVerificationMethod('qr')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                verificationMethod === 'qr'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <QrCodeScannerIcon className="mr-2" />
              QR Code Scanner
            </button>
          </div>

          {/* Manual Entry */}
          {verificationMethod === 'manual' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Approval Number
                </label>
                <input
                  type="text"
                  value={approvalNumber}
                  onChange={(e) => setApprovalNumber(e.target.value)}
                  placeholder="Enter approval number (e.g., HO-2024-1234567890-001)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleVerification}
                disabled={isLoading || !approvalNumber.trim()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <SearchIcon />
                    Verify Certificate
                  </>
                )}
              </button>
            </div>
          )}

          {/* QR Code Scanner Placeholder */}
          {verificationMethod === 'qr' && (
            <div className="text-center py-8">
              <QrCodeScannerIcon className="text-gray-400 text-6xl mb-4" />
              <p className="text-gray-600 mb-4">
                QR Code Scanner functionality will be implemented here
              </p>
              <p className="text-sm text-gray-500">
                For now, please use the manual entry method above
              </p>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <CancelIcon className="text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Verification Result */}
        {verificationStatus && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="text-center mb-6">
              {getStatusIcon()}
              <h3 className={`text-2xl font-bold mt-2 ${getStatusColor()}`}>
                {getStatusMessage()}
              </h3>
            </div>

            {verificationStatus === 'valid' && certificate && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Student Information</h4>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium text-gray-600">Name:</span>
                        <span className="ml-2 text-gray-800">{certificate.studentName}</span>
                      </div>
                      <div>
                         <span className="font-medium text-gray-600">USN:</span>
                         <span className="ml-2 text-gray-800">{certificate.studentRollNo || 'Not Available'}</span>
                       </div>
                      <div>
                        <span className="font-medium text-gray-600">Branch:</span>
                        <span className="ml-2 text-gray-800">{certificate.studentBranch}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Block:</span>
                        <span className="ml-2 text-gray-800">{certificate.studentBlock}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Room:</span>
                        <span className="ml-2 text-gray-800">{certificate.studentRoom}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Outing Details</h4>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium text-gray-600">Type:</span>
                        <span className="ml-2 text-gray-800">{certificate.requestType}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Out Date:</span>
                        <span className="ml-2 text-gray-800">{formatDate(certificate.outDate)}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Out Time:</span>
                        <span className="ml-2 text-gray-800">{formatTime(certificate.outTime)}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Return Date:</span>
                        <span className="ml-2 text-gray-800">{formatDate(certificate.returnDate)}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Return Time:</span>
                        <span className="ml-2 text-gray-800">{formatTime(certificate.returnTime)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600">Approval Number</p>
                      <p className="font-mono font-bold text-lg text-green-600">
                        {certificate.approvalNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Approved By</p>
                      <p className="font-medium text-gray-800">{certificate.wardenName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Valid Until</p>
                      <p className="font-medium text-gray-800">{formatDate(certificate.returnDate)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {verificationStatus === 'expired' && certificate && (
              <div className="text-center py-4">
                <p className="text-orange-600 mb-2">
                  This certificate was valid for outing on {formatDate(certificate.outDate)}
                </p>
                <p className="text-sm text-gray-600">
                  The student should have returned by {formatDate(certificate.returnDate)}
                </p>
              </div>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={resetVerification}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
              >
                Verify Another Certificate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
