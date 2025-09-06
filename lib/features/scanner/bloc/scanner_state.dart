part of 'scanner_bloc.dart';

abstract class ScannerState extends Equatable {
  const ScannerState();

  @override
  List<Object> get props => [];
}

class ScannerInitial extends ScannerState {}

class ScannerLoading extends ScannerState {}

class QrCodeDetailsLoaded extends ScannerState {
  final ApprovalCertificate certificate;

  const QrCodeDetailsLoaded(this.certificate);

  @override
  List<Object> get props => [certificate];
}

class ScannerError extends ScannerState {
  final String message;

  const ScannerError(this.message);

  @override
  List<Object> get props => [message];
}
