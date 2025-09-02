import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:scannerapp/core/services/firebase_service.dart';

part 'scanner_event.dart';
part 'scanner_state.dart';

class ScannerBloc extends Bloc<ScannerEvent, ScannerState> {
  final FirebaseService _firebaseService;

  ScannerBloc(this._firebaseService) : super(ScannerInitial()) {
    on<ScanQrCode>((event, emit) async {
      final studentDetails =
          await _firebaseService.getStudentDetails(event.qrCode);

      if (studentDetails != null) {
        await _firebaseService.logTime(event.qrCode);
        emit(QrCodeScanned(event.qrCode));
      } else {
        emit(const ScannerError('Student not found'));
      }
    });
  }
}
