import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:scannerapp/features/scanner/bloc/scanner_bloc.dart';
import 'package:scannerapp/features/student_details/views/student_details_screen.dart';

class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  final MobileScannerController _controller = MobileScannerController();
  bool _hasScanned = false; // ✅ prevents multiple scans

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<ScannerBloc, ScannerState>(
      listener: (context, state) async {
        if (state is QrCodeDetailsLoaded && !_hasScanned) {
          _hasScanned = true;
          await _controller.stop(); // ✅ stop scanning before navigation

          Navigator.of(context).pushReplacement( // replace so scanner doesn’t stay behind
            MaterialPageRoute(
              builder: (context) => StudentDetailsScreen(
                certificate: state.certificate,
                usn: state.certificate.studentUsn ?? '', // ✅ extract if available
                approvalNumber: state.certificate.approvalNumber ?? '',
              ),
            ),
          );
        } else if (state is ScannerError) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.message)),
          );
          _hasScanned = false; // allow retry if error
          _controller.start(); // restart scanning if failed
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('QR Scanner'),
        ),
        body: MobileScanner(
          controller: _controller,
          onDetect: (capture) {
            if (_hasScanned) return; // ✅ ignore extra scans
            final List<Barcode> barcodes = capture.barcodes;
            for (final barcode in barcodes) {
              if (barcode.rawValue != null) {
                context.read<ScannerBloc>().add(ScanQrCode(barcode.rawValue!));
                break;
              }
            }
          },
        ),
      ),
    );
  }
}
