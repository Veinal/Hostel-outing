part of 'student_details_bloc.dart';

abstract class StudentDetailsState extends Equatable {
  const StudentDetailsState();

  @override
  List<Object?> get props => [];
}

class StudentDetailsInitial extends StudentDetailsState {}

class StudentDetailsLoading extends StudentDetailsState {}

class StudentDetailsLoaded extends StudentDetailsState {
  final ApprovalCertificate approvalCertificate;
  final DocumentSnapshot? log;
  final Student? student;

  const StudentDetailsLoaded(this.approvalCertificate, this.log, this.student);

  @override
  List<Object?> get props => [approvalCertificate, log];
}

class StudentDetailsError extends StudentDetailsState {
  final String message;

  const StudentDetailsError(this.message);

  @override
  List<Object?> get props => [message];
}
