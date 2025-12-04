import 'dart:async';

class AppError {
  final Object error;
  final StackTrace? stackTrace;
  
  AppError(this.error, this.stackTrace);
}

class GlobalErrorHandler {
  static final GlobalErrorHandler _instance = GlobalErrorHandler._internal();
  
  factory GlobalErrorHandler() {
    return _instance;
  }
  
  GlobalErrorHandler._internal();
  
  final StreamController<AppError> _errorController = StreamController<AppError>.broadcast();
  
  Stream<AppError> get errorStream => _errorController.stream;
  
  void handleError(Object error, StackTrace? stackTrace) {
    _errorController.add(AppError(error, stackTrace));
  }
  
  void dispose() {
    _errorController.close();
  }
}
