import 'package:flutter/widgets.dart';

/// Function signature for building widgets from props and children
typedef WidgetBuilderFunction = Widget Function({
  required Map<String, dynamic> props,
  required List<Widget> children,
  Key? key,
});
