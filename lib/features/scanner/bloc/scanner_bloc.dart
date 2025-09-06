import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:scannerapp/core/models/approval_certificate.dart';
import 'package:scannerapp/core/services/firebase_service.dart';

part 'scanner_event.dart';
part 'scanner_state.dart';

class ScannerBloc extends Bloc<ScannerEvent, ScannerState> {
  final FirebaseService _firebaseService;

  ScannerBloc(this._firebaseService) : super(ScannerInitial()) {
    on<ScanQrCode>((event, emit) async {
      emit(ScannerLoading());

      final certificate =
      await _firebaseService.getApprovalDetails(event.qrCode);

      if (certificate != null) {
        // Log the verification
        await _firebaseService.logTime(certificate.approvalNumber);

        // Emit the certificate details to the UI
        emit(QrCodeDetailsLoaded(certificate));
      } else {
        emit(const ScannerError('Approval Certificate not found'));
      }
    });
  }
}
