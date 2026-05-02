part of 'student_details_bloc.dart';

abstract class StudentDetailsEvent extends Equatable {
  const StudentDetailsEvent();

  @override
  List<Object> get props => [];
}

class FetchStudentDetails extends StudentDetailsEvent {
  final String approvalNumber;
  final String studentId;

  const FetchStudentDetails(this.approvalNumber, this.studentId);

  @override
  List<Object> get props => [approvalNumber, studentId];
}

