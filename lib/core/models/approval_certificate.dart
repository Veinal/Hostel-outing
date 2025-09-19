import 'package:cloud_firestore/cloud_firestore.dart';

class ApprovalCertificate {
  final String approvalNumber;
  final String studentName;
  final String studentUsn;
  final String studentBlock;
  final String studentBranch;
  final String outDate;
  final String outTime;
  final String returnDate;
  final String returnTime;
  final String status;
  final String? purpose;
  final String? roomNumber;
  final String? wardenName;

  ApprovalCertificate({
    required this.approvalNumber,
    required this.studentName,
    required this.studentUsn,
    required this.studentBlock,
    required this.studentBranch,
    required this.outDate,
    required this.outTime,
    required this.returnDate,
    required this.returnTime,
    required this.status,
    this.purpose,
    this.roomNumber,
    this.wardenName,
  });

  /// Factory constructor to create from Firestore document
  factory ApprovalCertificate.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return ApprovalCertificate(
      approvalNumber: data['approvalNumber'] ?? '',
      studentName: data['studentName'] ?? '',
      studentUsn: data['studentUsn'] ?? '',
      studentBlock: data['studentBlock'] ?? '',
      studentBranch: data['studentBranch'] ?? '',
      outDate: data['outDate'] ?? '',
      outTime: data['outTime'] ?? '',
      returnDate: data['returnDate'] ?? '',
      returnTime: data['returnTime'] ?? '',
      status: data['status'] ?? '',
      purpose: data['purpose'],
      roomNumber: data['roomNumber'],
      wardenName: data['wardenName'],
    );
  }
}
