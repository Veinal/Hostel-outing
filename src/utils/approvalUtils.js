// Utility functions for approval system
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Generate a unique approval number
export const generateApprovalNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  const year = new Date().getFullYear();
  return `HO-${year}-${timestamp}-${random.toString().padStart(3, '0')}`;
};

// Create approval certificate data
export const createApprovalCertificate = async (requestData, wardenData, approvalNumber) => {
  try {
    const certificateData = {
      approvalNumber,
      requestId: requestData.id,
      studentId: requestData.studentId,
      wardenId: wardenData.uid,
      studentName: requestData.studentName,
      // Store student details from studentDetails object
      studentRollNo: requestData.studentDetails?.rollNo || 'Not Available', // Note: rollNo field represents the USN
      studentBranch: requestData.studentDetails?.branch || 'Not Available',
      studentYear: requestData.studentDetails?.year || 'Not Available',
      studentBlock: requestData.studentDetails?.block || 'Not Available',
      studentRoom: requestData.studentDetails?.room || 'Not Available',
      studentPhotoUrl: requestData.studentDetails?.photoUrl || '',
      requestType: requestData.requestType,
      reason: requestData.reason,
      outDate: requestData.outDate,
      outTime: requestData.outTime,
      returnDate: requestData.returnDate,
      returnTime: requestData.returnTime,
      wardenName: wardenData.displayName || wardenData.email,
      approvedAt: serverTimestamp(),
      status: 'active',
      validUntil: requestData.returnDate, // Certificate valid until return date
    };

    // Store the certificate in Firestore
    const certificateRef = await addDoc(collection(db, 'approvalCertificates'), certificateData);
    
    return {
      ...certificateData,
      id: certificateRef.id,
    };
  } catch (error) {
    console.error('Error creating approval certificate:', error);
    throw error;
  }
};

// Format date for display
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Format time for display
export const formatTime = (timeString) => {
  if (!timeString) return 'N/A';
  return timeString;
};

// Generate QR code data for the approval
export const generateQRData = (approvalNumber, requestId) => {
  return JSON.stringify({
    approvalNumber,
    requestId
  });
};
