part of 'student_details_bloc.dart';


abstract class StudentDetailsState extends Equatable {
  const StudentDetailsState();

  @override
  List<Object> get props => [];
}

class StudentDetailsInitial extends StudentDetailsState {}

class StudentDetailsLoading extends StudentDetailsState {}

class StudentDetailsLoaded extends StudentDetailsState {
  final Student student;
  final DocumentSnapshot? log;

  const StudentDetailsLoaded(this.student, this.log);

  @override
  List<Object> get props => [student, log!];
}

class StudentDetailsError extends StudentDetailsState {
  final String message;

  const StudentDetailsError(this.message);

  @override
  List<Object> get props => [message];
}