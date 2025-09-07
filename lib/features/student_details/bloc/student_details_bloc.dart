import 'package:bloc/bloc.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:equatable/equatable.dart';
import 'package:scannerapp/core/models/approval_certificate.dart';
import 'package:scannerapp/core/services/firebase_service.dart';

part 'student_details_event.dart';
part 'student_details_state.dart';

class StudentDetailsBloc
    extends Bloc<StudentDetailsEvent, StudentDetailsState> {
  final FirebaseService _firebaseService;

  StudentDetailsBloc(this._firebaseService) : super(StudentDetailsInitial()) {
    on<FetchStudentDetails>((event, emit) async {
      emit(StudentDetailsLoading());
      try {
        final approval =
        await _firebaseService.getApprovalDetails(event.approvalNumber);
        final log =
        await _firebaseService.getLatestLog(event.approvalNumber);

        if (approval != null) {
          emit(StudentDetailsLoaded(approval, log));
        } else {
          emit(const StudentDetailsError('Approval not found'));
        }
      } catch (e) {
        emit(const StudentDetailsError('Failed to fetch approval details'));
      }
    });
  }
}
