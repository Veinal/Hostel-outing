import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:scannerapp/core/models/student_model.dart';

class FirebaseService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Future<Student?> getStudentDetails(String usn) async {
    final snapshot = await _firestore.collection('students').doc(usn).get();
    if (snapshot.exists) {
      return Student.fromFirestore(snapshot);
    } else {
      return null;
    }
  }

  Future<void> logTime(String usn) async {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final logRef = _firestore.collection('logs').doc(usn).collection('scans').doc(today.toIso8601String());

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

  Future<DocumentSnapshot?> getLatestLog(String usn) async {
     final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final logRef = _firestore.collection('logs').doc(usn).collection('scans').doc(today.toIso8601String());

    final snapshot = await logRef.get();

    if (snapshot.exists) {
      return snapshot;
    } else {
      return null;
    }
  }
}