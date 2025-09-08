import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:scannerapp/core/models/approval_certificate.dart';
import 'package:scannerapp/core/models/student_model.dart';
import 'package:scannerapp/core/services/firebase_service.dart';
import 'package:scannerapp/features/student_details/bloc/student_details_bloc.dart';

class StudentDetailsScreen extends StatelessWidget {
  final String approvalNumber;
  final ApprovalCertificate certificate;
  final String usn;

  const StudentDetailsScreen({
    super.key,
    required this.approvalNumber,
    required this.certificate,
    required this.usn,
  });

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => StudentDetailsBloc(
        RepositoryProvider.of<FirebaseService>(context),
      )..add(FetchStudentDetails(approvalNumber, usn)),
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Approval Details'),
        ),
        body: BlocBuilder<StudentDetailsBloc, StudentDetailsState>(
          builder: (context, state) {
            if (state is StudentDetailsLoading) {
              return const Center(
                child: CircularProgressIndicator(),
              );
            } else if (state is StudentDetailsLoaded) {
              final approval = state.approvalCertificate;
              final log = state.log?.data() as Map<String, dynamic>?;

              // Assuming you also fetch Student object for image
              final Student? student = state.student;

              return SingleChildScrollView(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    // Top Row: Key info + photo
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Left: Key info
                        Expanded(
                          flex: 2,
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.blue.shade50,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Name: ${approval.studentName}',
                                  style: const TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'USN: ${approval.studentUsn}',
                                  style: const TextStyle(fontSize: 18),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Out: ${approval.outDate} at ${approval.outTime}',
                                  style: const TextStyle(fontSize: 18),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        // Right: Student photo
                        Expanded(
                          flex: 1,
                          child: student != null && student.imageUrl.isNotEmpty
                              ? ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: Image.network(
                              student.imageUrl,
                              height: 120,
                              width: 120,
                              fit: BoxFit.cover,
                            ),
                          )
                              : Container(
                            height: 120,
                            width: 120,
                            decoration: BoxDecoration(
                              color: Colors.grey.shade300,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(
                              Icons.person,
                              size: 60,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    // Other details
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Branch: ${approval.studentBranch}',
                            style: const TextStyle(fontSize: 16),
                          ),
                          Text(
                            'Block: ${approval.studentBlock}',
                            style: const TextStyle(fontSize: 16),
                          ),
                          Text(
                            'Room: ${approval.roomNumber ?? "N/A"}',
                            style: const TextStyle(fontSize: 16),
                          ),
                          Text(
                            'Warden: ${approval.wardenName ?? "N/A"}',
                            style: const TextStyle(fontSize: 16),
                          ),
                          Text(
                            'Purpose: ${approval.status}',
                            style: const TextStyle(fontSize: 16),
                          ),
                          Text(
                            'Return: ${approval.returnDate} at ${approval.returnTime}',
                            style: const TextStyle(fontSize: 16),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    // Log Times Section
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.green.shade50,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Log Times',
                            style: TextStyle(
                                fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 8),
                          if (log != null)
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (log['outTime'] != null)
                                  Text(
                                    'Out Time: ${log['outTime'].toDate()}',
                                    style: const TextStyle(fontSize: 16),
                                  ),
                                if (log['inTime'] != null)
                                  Text(
                                    'In Time: ${log['inTime'].toDate()}',
                                    style: const TextStyle(fontSize: 16),
                                  ),
                              ],
                            )
                          else
                            const Text(
                              'No log times found for today.',
                              style: TextStyle(fontSize: 16),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            } else if (state is StudentDetailsError) {
              return Center(
                child: Text(state.message),
              );
            } else {
              return const Center(
                child: Text('Fetching approval details...'),
              );
            }
          },
        ),
      ),
    );
  }
}
