import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:scannerapp/core/models/approval_certificate.dart';
import 'package:scannerapp/core/models/student_model.dart';

class FirebaseService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Fetch approval certificate details using approvalNumber
  // Future<ApprovalCertificate?> getApprovalDetails(String approvalNumber) async {
  //   try {
  //     print("🔍 Fetching approval certificate for: $approvalNumber");
  //
  //     final snapshot = await _firestore
  //         .collection('approvalCertificates')
  //         .where('approvalNumber', isEqualTo: approvalNumber)
  //         .limit(1)
  //         .get();
  //
  //     print("📦 Firestore returned ${snapshot.docs.length} docs");
  //
  //     if (snapshot.docs.isNotEmpty) {
  //       print("✅ Certificate data: ${snapshot.docs.first.data()}");
  //       return ApprovalCertificate.fromFirestore(snapshot.docs.first);
  //     } else {
  //       print("❌ No approval certificate found for $approvalNumber");
  //       return null;
  //     }
  //   } catch (e, st) {
  //     print("🔥 Error in getApprovalDetails: $e\n$st");
  //     return null;
  //   }
  // }

  Future<ApprovalCertificate?> getApprovalDetails(String approvalNumber) async {
    try {
      // Query by approvalNumber field
      final query = await _firestore
          .collection('approvalCertificates')
          .where('approvalNumber', isEqualTo: approvalNumber)
          .limit(1)
          .get();

      if (query.docs.isNotEmpty) {
        return ApprovalCertificate.fromFirestore(query.docs.first);
      }

      return null;
    } catch (e) {
      print("Error in getApprovalDetails: $e");
      return null;
    }
  }

  Future<Student?> getStudentDetails(String usn) async {
    try {
      final doc = await _firestore.collection('students').doc(usn).get();
      if (doc.exists) {
        return Student.fromFirestore(doc);
      }
      return null;
    } catch (e) {
      print('Error getting student details: $e');
      return null;
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
      if (data['inTime'] != null && data['outTime'] == null) {
        // Log out time
        await logRef.update({'outTime': now});
      }
    } else {
      // Log in time
      await logRef.set({'inTime': now});
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
