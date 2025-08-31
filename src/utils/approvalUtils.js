import { addDoc, collection, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Generates a unique approval number
 * Format: HO-{YEAR}-{TIMESTAMP}-{RANDOM}
 * Example: HO-2024-1703123456789-001
 */
export const generateApprovalNumber = () => {
  const year = new Date().getFullYear();
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `HO-${year}-${timestamp}-${random}`;
};

/**
 * Creates an approval certificate in the database
 */
export const createApprovalCertificate = async (requestData, wardenData, approvalNumber, studentDetails) => {
  try {
    const certificateData = {
      approvalNumber,
      requestId: requestData.id,
      studentId: requestData.studentId,
      wardenId: wardenData.uid,
      studentName: requestData.studentName,
      studentRollNo: studentDetails?.rollNo || 'Not Available',
      studentBranch: studentDetails?.branch || 'Not Available',
      studentYear: studentDetails?.year || 'Not Available',
      studentBlock: studentDetails?.block || 'Not Available',
      studentRoom: studentDetails?.room || 'Not Available',
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

    // Add certificate to database
    const certificateRef = await addDoc(collection(db, 'approvalCertificates'), certificateData);
    
    // Update the outing request with approval number and certificate ID
    const requestRef = doc(db, 'outingRequests', requestData.id);
    await updateDoc(requestRef, {
      approvalNumber,
      certificateId: certificateRef.id
    });

    return certificateRef.id;
  } catch (error) {
    console.error('Error creating approval certificate:', error);
    throw error;
  }
};

/**
 * Formats date for display
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Formats time for display
 */
export const formatTime = (timeString) => {
  if (!timeString) return '';
  return timeString;
};

/**
 * Checks if certificate is still valid
 */
export const isCertificateValid = (validUntil) => {
  if (!validUntil) return false;
  const validDate = new Date(validUntil);
  const currentDate = new Date();
  return currentDate <= validDate;
};
