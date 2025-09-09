import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:scannerapp/core/models/approval_certificate.dart';
import 'package:scannerapp/core/models/student_model.dart';
import 'package:scannerapp/core/services/firebase_service.dart';
import 'package:scannerapp/features/scanner/views/scanner_screen.dart';
import 'package:scannerapp/features/home/home_screen.dart';
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
              return const Center(child: CircularProgressIndicator());
            } else if (state is StudentDetailsLoaded) {
              final approval = state.approvalCertificate;
              final log = state.log?.data() as Map<String, dynamic>?;
              final Student? student = state.student;

              return LayoutBuilder(
                builder: (context, constraints) {
                  bool isWide = constraints.maxWidth > 600;

                  Widget studentImage = ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: student != null && student.photoUrl.isNotEmpty
                        ? Image.network(
                      student.photoUrl,
                      height: isWide ? 220 : 180,
                      width: isWide ? 220 : 180,
                      fit: BoxFit.cover,
                    )
                        : Container(
                      height: isWide ? 220 : 180,
                      width: isWide ? 220 : 180,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Icon(Icons.person,
                          size: 100, color: Colors.white),
                    ),
                  );

                  Widget detailsSection = Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Student Info
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.blue.shade50,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Name: ${approval.studentName}',
                                  style: const TextStyle(
                                      fontSize: 22,
                                      fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(height: 8),
                                Text('USN: ${approval.studentUsn}',
                                    style: const TextStyle(fontSize: 18)),
                                const SizedBox(height: 8),
                                Text('Out: ${approval.outDate} at ${approval.outTime}',
                                    style: const TextStyle(fontSize: 18)),
                              ],
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Other details
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade100,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Branch: ${approval.studentBranch}',
                                    style: const TextStyle(fontSize: 18)),
                                Text('Block: ${approval.studentBlock}',
                                    style: const TextStyle(fontSize: 18)),
                                Text('Room: ${approval.roomNumber ?? "N/A"}',
                                    style: const TextStyle(fontSize: 18)),
                                Text('Warden: ${approval.wardenName ?? "N/A"}',
                                    style: const TextStyle(fontSize: 18)),
                                Text('Purpose: ${approval.status}',
                                    style: const TextStyle(fontSize: 18)),
                                Text('Return: ${approval.returnDate} at ${approval.returnTime}',
                                    style: const TextStyle(fontSize: 18)),
                              ],
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Log Times
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.green.shade50,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Log Times',
                                    style: TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.bold)),
                                const SizedBox(height: 8),
                                if (log != null) ...[
                                  if (log['outTime'] != null)
                                    Text(
                                      'Out Time: ${log['outTime'].toDate()}',
                                      style: const TextStyle(fontSize: 18),
                                    ),
                                  if (log['inTime'] != null)
                                    Text(
                                      'In Time: ${log['inTime'].toDate()}',
                                      style: const TextStyle(fontSize: 18),
                                    ),
                                ] else
                                  const Text('No log times found for today.',
                                      style: TextStyle(fontSize: 18)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  );

                  return isWide
                      ? Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(20),
                        child: studentImage,
                      ),
                      detailsSection,
                    ],
                  )
                      : Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      const SizedBox(height: 20),
                      Center(child: studentImage),
                      const SizedBox(height: 20),
                      detailsSection,
                    ],
                  );
                },
              );
            } else if (state is StudentDetailsError) {
              return Center(child: Text(state.message));
            } else {
              return const Center(child: Text('Fetching approval details...'));
            }
          },
        ),

        // ✅ Bottom buttons
        bottomNavigationBar: Padding(
          padding: const EdgeInsets.all(12.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              ElevatedButton.icon(
                icon: const Icon(Icons.qr_code_scanner),
                label: const Text("Scan Again"),
                onPressed: () {
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(builder: (_) => const ScannerScreen()),
                  );
                },
              ),
              ElevatedButton.icon(
                icon: const Icon(Icons.home),
                label: const Text("Home"),
                onPressed: () {
                  Navigator.pushAndRemoveUntil(
                    context,
                    MaterialPageRoute(builder: (_) => const HomeScreen()),
                        (route) => false,
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
