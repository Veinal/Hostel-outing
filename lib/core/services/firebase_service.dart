import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:scannerapp/core/models/approval_certificate.dart';

class FirebaseService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Fetch approval certificate details using approvalNumber
  Future<ApprovalCertificate?> getApprovalDetails(String approvalNumber) async {
    try {
      final snapshot = await _firestore
          .collection('approvalCertificates')
          .doc(approvalNumber)
          .get();

      if (snapshot.exists) {
        return ApprovalCertificate.fromFirestore(snapshot);
      } else {
        return null;
      }
    } catch (e) {
      rethrow;
    }
  }

  /// Log student scan time (in/out)
  Future<void> logTime(String approvalNumber) async {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    final logRef = _firestore
        .collection('logs')
        .doc(approvalNumber)
        .collection('scans')
        .doc(today.toIso8601String());

    final snapshot = await logRef.get();

    if (snapshot.exists) {
      final data = snapshot.data() as Map<String, dynamic>;
      if (data['outTime'] != null && data['inTime'] == null) {
        // Log in time
        await logRef.update({'inTime': now});
      }
    } else {
      // Log out time
      await logRef.set({'outTime': now});
    }
  }

  /// Get latest log for given approvalNumber
  Future<DocumentSnapshot?> getLatestLog(String approvalNumber) async {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    final logRef = _firestore
        .collection('logs')
        .doc(approvalNumber)
        .collection('scans')
        .doc(today.toIso8601String());

    final snapshot = await logRef.get();

    if (snapshot.exists) {
      return snapshot;
    } else {
      return null;
    }
  }
}
