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

  Future<DocumentSnapshot?> getApprovalDocument(String approvalNumber) async {
    try {
      // Query by approvalNumber field
      final query = await _firestore
          .collection('approvalCertificates')
          .where('approvalNumber', isEqualTo: approvalNumber)
          .limit(1)
          .get();

      if (query.docs.isNotEmpty) {
        return query.docs.first;
      }

      return null;
    } catch (e) {
      print("Error in getApprovalDocument: $e");
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
    // Kept for backward compatibility with existing logs collection if used elsewhere
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
        await logRef.update({'inTime': now});
      }
    } else {
      await logRef.set({'outTime': now});
    }
  }

  /// Update approval certificate with step-out / step-in times.
  /// Returns one of: 'logged_out', 'logged_in', 'expired'
  Future<String> logScanToApprovalCertificate(String approvalNumber) async {
    print("🚀 logScanToApprovalCertificate called with: $approvalNumber");
    
    try {
      String twoDigits(int n) => n.toString().padLeft(2, '0');
      String formatDate(DateTime dt) =>
          '${dt.year}-${twoDigits(dt.month)}-${twoDigits(dt.day)}';
      String formatTime(DateTime dt) =>
          '${twoDigits(dt.hour)}:${twoDigits(dt.minute)}';

      final now = DateTime.now();
      final outDate = formatDate(now);
      final outTime = formatTime(now);
      
      print("📅 Formatted date/time: $outDate at $outTime");

      final query = await _firestore
          .collection('approvalCertificates')
          .where('approvalNumber', isEqualTo: approvalNumber)
          .limit(1)
          .get();

      print("🔍 Firestore query returned ${query.docs.length} documents");

      if (query.docs.isEmpty) {
        print("❌ No approval certificate found");
        throw Exception('Approval Certificate not found');
      }

    final doc = query.docs.first;
    final data = doc.data();

    final currentStatus = (data['status'] ?? '') as String;
    // Check for actual scan times, not the original planned times
    final actualOutTime = (data['actualOutTime'] ?? '') as String;
    final actualReturnTime = (data['actualReturnTime'] ?? '') as String;

    print("🔍 Debug scan logic:");
    print("  - currentStatus: '$currentStatus'");
    print("  - actualOutTime: '$actualOutTime'");
    print("  - actualReturnTime: '$actualReturnTime'");
    print("  - status == 'expired': ${currentStatus.toLowerCase() == 'expired'}");
    print("  - both times present: ${actualOutTime.isNotEmpty && actualReturnTime.isNotEmpty}");

    // If already completed/expired (both actual scan times present or explicit status)
    if ((actualOutTime.isNotEmpty && actualReturnTime.isNotEmpty) ||
        currentStatus.toLowerCase() == 'expired') {
      print("  - Returning 'expired'");
      return 'expired';
    }

    if (actualOutTime.isEmpty) {
      // First scan → step out
      print("  - First scan: logging out time");
      await doc.reference.update({
        'actualOutDate': outDate,
        'actualOutTime': outTime,
        'status': 'stepped_out',
        'updatedAt': FieldValue.serverTimestamp(),
      });
      print("  - Returning 'logged_out'");
      return 'logged_out';
    }

    if (actualReturnTime.isEmpty) {
      // Second scan → step in and expire
      print("  - Second scan: logging in time");
      await doc.reference.update({
        'actualReturnDate': outDate,
        'actualReturnTime': outTime,
        'status': 'expired',
        'updatedAt': FieldValue.serverTimestamp(),
      });
      print("  - Returning 'logged_in'");
      return 'logged_in';
    }

      print("  - Fallback: returning 'expired'");
      return 'expired';
    } catch (e, stackTrace) {
      print("💥 Exception in logScanToApprovalCertificate: $e");
      print("📚 Stack trace: $stackTrace");
      rethrow;
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
