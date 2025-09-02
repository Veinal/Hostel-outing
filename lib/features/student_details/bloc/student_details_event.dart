part of 'student_details_bloc.dart';

abstract class StudentDetailsEvent extends Equatable {
  const StudentDetailsEvent();

  @override
  List<Object> get props => [];
}

class FetchStudentDetails extends StudentDetailsEvent {
  final String usn;

  const FetchStudentDetails(this.usn);

  @override
  List<Object> get props => [usn];
}