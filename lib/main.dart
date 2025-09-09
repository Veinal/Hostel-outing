import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:scannerapp/core/services/firebase_service.dart';
import 'package:scannerapp/features/home/home_screen.dart';
import 'package:scannerapp/features/scanner/bloc/scanner_bloc.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return RepositoryProvider(
      create: (context) => FirebaseService(),
      child: BlocProvider(
        create: (context) => ScannerBloc(
          RepositoryProvider.of<FirebaseService>(context),
        ),
        child: MaterialApp(
          debugShowCheckedModeBanner: false,
          title: 'Hostel Outing System',
          theme: ThemeData(
            primarySwatch: Colors.blue,
          ),
          home: const HomeScreen(), // ✅ Start at Home, not Scanner
        ),
      ),
    );
  }
}
