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

          Navigator.of(context).pushReplacement(
            MaterialPageRoute(
              builder: (context) => StudentDetailsScreen(
                certificate: state.certificate,
                usn: state.certificate.studentUsn ?? '',
                approvalNumber: state.certificate.approvalNumber ?? '',
              ),
            ),
          );
        } else if (state is ScannerError) {
          // Show centered alert dialog for watchman
          showDialog(
            context: context,
            builder: (BuildContext context) {
              return AlertDialog(
                title: const Text('Scan Result'),
                content: Text(state.message),
                actions: [
                  TextButton(
                    onPressed: () {
                      Navigator.of(context).pop();
                      _hasScanned = false;
                      _controller.start(); // restart scanning
                    },
                    child: const Text('OK'),
                  ),
                ],
              );
            },
          );
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('QR Scanner'),
          actions: [
            IconButton(
              icon: const Icon(Icons.home),
              onPressed: () {
                // ✅ Pop back to HomeScreen
                Navigator.of(context).popUntil((route) => route.isFirst);
              },
            ),
          ],
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
