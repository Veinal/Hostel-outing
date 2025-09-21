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
          // Log the scan (in/out) using the proper method
          final scanResult = await _firebaseService.logScanToApprovalCertificate(approvalNumber);
          print("📊 Scan result: $scanResult");

          // Emit success
          emit(QrCodeDetailsLoaded(certificate));
        } else {
          emit(const ScannerError('Approval Certificate not found'));
        }
      } catch (e) {
        emit(const ScannerError('Invalid QR Code format'));
      }
    });
  }
}
