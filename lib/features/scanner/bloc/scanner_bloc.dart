import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:scannerapp/core/models/approval_certificate.dart';
import 'package:scannerapp/core/services/firebase_service.dart';
import 'dart:convert';

part 'scanner_event.dart';
part 'scanner_state.dart';

class ScannerBloc extends Bloc<ScannerEvent, ScannerState> {
  final FirebaseService _firebaseService;

  ScannerBloc(this._firebaseService) : super(ScannerInitial()) {
    on<ScanQrCode>((event, emit) async {
      emit(ScannerLoading());

      try {
        print("📲 Raw QR code: ${event.qrCode}");
        final qrData = jsonDecode(event.qrCode);
        final approvalNumber = qrData['approvalNumber'];
        print("🔑 Parsed approvalNumber: $approvalNumber");

        final certificate = await _firebaseService.getApprovalDetails(approvalNumber);
        // // Decode the QR code into JSON
        // final qrData = jsonDecode(event.qrCode);
        // final approvalNumber = qrData['approvalNumber'];
        //
        // // Fetch details from Firestore
        //final certificate = await _firebaseService.getApprovalDetails(approvalNumber);

        if (certificate != null) {
          // Update approval certificate with scan logic (out → in → expired)
          final outcome = await _firebaseService.logScanToApprovalCertificate(approvalNumber);

          if (outcome == 'expired') {
            emit(const ScannerError('QR code expired'));
            return;
          }

          // Optionally keep legacy logs too
          await _firebaseService.logTime(approvalNumber);

          // Emit success with up-to-date certificate (re-fetch to reflect changes)
          final refreshed = await _firebaseService.getApprovalDetails(approvalNumber);
          emit(QrCodeDetailsLoaded(refreshed ?? certificate));
        } else {
          emit(const ScannerError('Approval Certificate not found'));
        }
      } catch (e) {
        emit(const ScannerError('Invalid QR Code format'));
      }
    });
  }
}
