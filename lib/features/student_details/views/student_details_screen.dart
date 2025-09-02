import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:scannerapp/core/services/firebase_service.dart';
import 'package:scannerapp/features/student_details/bloc/student_details_bloc.dart';

class StudentDetailsScreen extends StatelessWidget {
  final String usn;

  const StudentDetailsScreen({super.key, required this.usn});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => StudentDetailsBloc(
        RepositoryProvider.of<FirebaseService>(context),
      )..add(FetchStudentDetails(usn)),
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Student Details'),
        ),
        body: BlocBuilder<StudentDetailsBloc, StudentDetailsState>(
          builder: (context, state) {
            if (state is StudentDetailsLoading) {
              return const Center(
                child: CircularProgressIndicator(),
              );
            } else if (state is StudentDetailsLoaded) {
              final student = state.student;
              final log = state.log?.data() as Map<String, dynamic>?;

              return Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (student.imageUrl.isNotEmpty)
                      Center(
                        child: CircleAvatar(
                          radius: 50,
                          backgroundImage: NetworkImage(student.imageUrl),
                        ),
                      ),
                    const SizedBox(height: 16),
                    Text(
                      'Name: ${student.name}',
                      style: const TextStyle(fontSize: 18),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'USN: ${student.usn}',
                      style: const TextStyle(fontSize: 18),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Log Times',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
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