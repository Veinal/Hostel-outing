import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:scannerapp/core/models/approval_certificate.dart';
import 'package:scannerapp/core/services/firebase_service.dart';
import 'package:scannerapp/features/student_details/bloc/student_details_bloc.dart';

class StudentDetailsScreen extends StatelessWidget {
  final String approvalNumber;

  const StudentDetailsScreen({
    super.key,
    required this.approvalNumber, required ApprovalCertificate certificate, required String usn,
  });

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => StudentDetailsBloc(
        RepositoryProvider.of<FirebaseService>(context),
      )..add(FetchStudentDetails(approvalNumber)),
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

              return SingleChildScrollView(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Approval Number: ${approval.approvalNumber}',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text('Name: ${approval.studentName}',
                        style: const TextStyle(fontSize: 16)),
                    Text('Block: ${approval.studentBlock}',
                        style: const TextStyle(fontSize: 16)),
                    Text('Branch: ${approval.studentBranch}',
                        style: const TextStyle(fontSize: 16)),
                    const SizedBox(height: 12),
                    Text('Reason: ${approval.status}',
                        style: const TextStyle(fontSize: 16)),
                    Text('Out: ${approval.outDate} at ${approval.outTime}',
                        style: const TextStyle(fontSize: 16)),
                    Text(
                        'Return: ${approval.returnDate} at ${approval.returnTime}',
                        style: const TextStyle(fontSize: 16)),
                    const SizedBox(height: 20),
                    const Text(
                      'Log Times',
                      style:
                      TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
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
                      const Text('No log times found for today.'),
                  ],
                ),
              );
            } else if (state is StudentDetailsError) {
              return Center(
                child: Text(state.message),
              );
            } else {
              return const Center(
                child: Text('Something went wrong.'),
              );
            }
          },
        ),
      ),
    );
  }
}
