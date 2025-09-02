import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:scannerapp/features/scanner/bloc/scanner_bloc.dart';
import 'package:scannerapp/features/student_details/views/student_details_screen.dart';

class ScannerScreen extends StatelessWidget {
  const ScannerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocListener<ScannerBloc, ScannerState>(
      listener: (context, state) {
        if (state is QrCodeScanned) {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => StudentDetailsScreen(usn: state.usn),
            ),
          );
        } else if (state is ScannerError) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message),
            ),
          );
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('QR Scanner'),
        ),
        body: MobileScanner(
          onDetect: (capture) {
            final List<Barcode> barcodes = capture.barcodes;
            for (final barcode in barcodes) {
              if (barcode.rawValue != null) {
                context.read<ScannerBloc>().add(ScanQrCode(barcode.rawValue!));
              }
            }
          },
        ),
      ),
    );
  }
}
