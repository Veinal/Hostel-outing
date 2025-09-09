import 'package:flutter/material.dart';
import 'package:scannerapp/features/scanner/views/scanner_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Approval Certificate Scanner")),
      body: Center(
        child: ElevatedButton.icon(
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            textStyle: const TextStyle(fontSize: 18),
          ),
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const ScannerScreen()),
            );
          },
          icon: const Icon(Icons.qr_code_scanner, size: 28),
          label: const Text("Scan Approval Certificate"),
        ),
      ),
    );
  }
}
