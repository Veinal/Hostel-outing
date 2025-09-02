import 'package:bloc/bloc.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:equatable/equatable.dart';
import 'package:scannerapp/core/models/student_model.dart';
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
        final student = await _firebaseService.getStudentDetails(event.usn);
        final log = await _firebaseService.getLatestLog(event.usn);

        if (student != null) {
          emit(StudentDetailsLoaded(student, log));
        } else {
          emit(const StudentDetailsError('Student not found'));
        }
      } catch (e) {
        emit(const StudentDetailsError('Failed to fetch student details'));
      }
    });
  }
}
