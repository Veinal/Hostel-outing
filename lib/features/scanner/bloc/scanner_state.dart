part of 'scanner_bloc.dart';

abstract class ScannerState extends Equatable {
  const ScannerState();

  @override
  List<Object> get props => [];
}

class ScannerInitial extends ScannerState {}

class QrCodeScanned extends ScannerState {
  final String usn;

  const QrCodeScanned(this.usn);

  @override
  List<Object> get props => [usn];
}

class ScannerError extends ScannerState {
  final String message;

  const ScannerError(this.message);

  @override
  List<Object> get props => [message];
}
