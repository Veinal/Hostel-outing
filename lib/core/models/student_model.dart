import 'package:cloud_firestore/cloud_firestore.dart';

class Student {
  final String usn;
  final String name;
  final String imageUrl;
  final DateTime? outTime;
  final DateTime? inTime;

  Student({
    required this.usn,
    required this.name,
    required this.imageUrl,
    this.outTime,
    this.inTime,
  });

  factory Student.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    return Student(
      usn: doc.id,
      name: data['name'] ?? '',
      imageUrl: data['imageUrl'] ?? '',
      outTime: data['outTime']?.toDate(),
      inTime: data['inTime']?.toDate(),
    );
  }
}
