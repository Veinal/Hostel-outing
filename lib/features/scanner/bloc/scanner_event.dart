part of 'scanner_bloc.dart';

abstract class ScannerEvent extends Equatable {
  const ScannerEvent();

  @override
  List<Object> get props => [];
}

class ScanQrCode extends ScannerEvent {
  final String qrCode;

  const ScanQrCode(this.qrCode);

  @override
  List<Object> get props => [qrCode];
}