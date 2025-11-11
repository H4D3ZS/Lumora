import 'package:flutter/material.dart';

/// Utilities for parsing widget properties from JSON
class PropParser {
  /// Parse EdgeInsets from various formats
  static EdgeInsets? parsePadding(dynamic value) {
    if (value == null) return null;

    if (value is num) {
      return EdgeInsets.all(value.toDouble());
    }

    if (value is Map) {
      final top = (value['top'] as num?)?.toDouble() ?? 0;
      final right = (value['right'] as num?)?.toDouble() ?? 0;
      final bottom = (value['bottom'] as num?)?.toDouble() ?? 0;
      final left = (value['left'] as num?)?.toDouble() ?? 0;

      return EdgeInsets.only(
        top: top,
        right: right,
        bottom: bottom,
        left: left,
      );
    }

    return null;
  }

  /// Parse Color from hex string or color name
  static Color? parseColor(dynamic value) {
    if (value == null) return null;

    if (value is String) {
      // Handle hex colors (#RRGGBB or #AARRGGBB)
      if (value.startsWith('#')) {
        final hex = value.substring(1);
        if (hex.length == 6) {
          return Color(int.parse('FF$hex', radix: 16));
        } else if (hex.length == 8) {
          return Color(int.parse(hex, radix: 16));
        }
      }

      // Handle named colors
      return _namedColors[value.toLowerCase()];
    }

    if (value is int) {
      return Color(value);
    }

    return null;
  }

  /// Parse TextStyle from props
  static TextStyle? parseTextStyle(dynamic value) {
    if (value == null) return null;
    if (value is! Map) return null;

    return TextStyle(
      fontSize: (value['fontSize'] as num?)?.toDouble(),
      fontWeight: _parseFontWeight(value['fontWeight']),
      fontStyle: value['fontStyle'] == 'italic' ? FontStyle.italic : null,
      color: parseColor(value['color']),
      decoration: _parseTextDecoration(value['textDecoration']),
      letterSpacing: (value['letterSpacing'] as num?)?.toDouble(),
      height: (value['lineHeight'] as num?)?.toDouble(),
    );
  }

  /// Parse TextAlign from string
  static TextAlign? parseTextAlign(dynamic value) {
    if (value == null) return null;
    if (value is! String) return null;

    switch (value.toLowerCase()) {
      case 'left':
        return TextAlign.left;
      case 'right':
        return TextAlign.right;
      case 'center':
        return TextAlign.center;
      case 'justify':
        return TextAlign.justify;
      default:
        return null;
    }
  }

  /// Parse Alignment from string
  static Alignment? parseAlignment(dynamic value) {
    if (value == null) return null;
    if (value is! String) return null;

    switch (value.toLowerCase()) {
      case 'topleft':
        return Alignment.topLeft;
      case 'topcenter':
        return Alignment.topCenter;
      case 'topright':
        return Alignment.topRight;
      case 'centerleft':
        return Alignment.centerLeft;
      case 'center':
        return Alignment.center;
      case 'centerright':
        return Alignment.centerRight;
      case 'bottomleft':
        return Alignment.bottomLeft;
      case 'bottomcenter':
        return Alignment.bottomCenter;
      case 'bottomright':
        return Alignment.bottomRight;
      default:
        return null;
    }
  }

  static FontWeight? _parseFontWeight(dynamic value) {
    if (value == null) return null;

    if (value is String) {
      switch (value.toLowerCase()) {
        case 'bold':
          return FontWeight.bold;
        case 'normal':
          return FontWeight.normal;
        default:
          return null;
      }
    }

    if (value is int) {
      return FontWeight.values[(value ~/ 100).clamp(0, 8)];
    }

    return null;
  }

  static TextDecoration? _parseTextDecoration(dynamic value) {
    if (value == null) return null;
    if (value is! String) return null;

    switch (value.toLowerCase()) {
      case 'underline':
        return TextDecoration.underline;
      case 'linethrough':
        return TextDecoration.lineThrough;
      case 'overline':
        return TextDecoration.overline;
      default:
        return null;
    }
  }

  /// Parse BoxDecoration from props
  static BoxDecoration? parseDecoration(Map<String, dynamic> props) {
    final backgroundColor = parseColor(props['backgroundColor']);
    final border = _parseBorder(props['border']);
    final borderRadius = _parseBorderRadius(props['borderRadius']);
    final boxShadow = _parseBoxShadow(props['boxShadow']);

    if (backgroundColor == null &&
        border == null &&
        borderRadius == null &&
        boxShadow == null) {
      return null;
    }

    return BoxDecoration(
      color: backgroundColor,
      border: border,
      borderRadius: borderRadius,
      boxShadow: boxShadow,
    );
  }

  /// Parse Border from props
  static Border? _parseBorder(dynamic value) {
    if (value == null) return null;

    if (value is Map) {
      final width = (value['width'] as num?)?.toDouble() ?? 1.0;
      final color = parseColor(value['color']) ?? const Color(0xFF000000);
      final style = value['style'] == 'solid' ? BorderStyle.solid : BorderStyle.solid;

      if (value.containsKey('top') ||
          value.containsKey('right') ||
          value.containsKey('bottom') ||
          value.containsKey('left')) {
        return Border(
          top: value['top'] == true
              ? BorderSide(width: width, color: color, style: style)
              : BorderSide.none,
          right: value['right'] == true
              ? BorderSide(width: width, color: color, style: style)
              : BorderSide.none,
          bottom: value['bottom'] == true
              ? BorderSide(width: width, color: color, style: style)
              : BorderSide.none,
          left: value['left'] == true
              ? BorderSide(width: width, color: color, style: style)
              : BorderSide.none,
        );
      }

      return Border.all(width: width, color: color, style: style);
    }

    return null;
  }

  /// Parse BorderRadius from props
  static BorderRadius? _parseBorderRadius(dynamic value) {
    if (value == null) return null;

    if (value is num) {
      return BorderRadius.circular(value.toDouble());
    }

    if (value is Map) {
      final topLeft = (value['topLeft'] as num?)?.toDouble() ?? 0;
      final topRight = (value['topRight'] as num?)?.toDouble() ?? 0;
      final bottomLeft = (value['bottomLeft'] as num?)?.toDouble() ?? 0;
      final bottomRight = (value['bottomRight'] as num?)?.toDouble() ?? 0;

      return BorderRadius.only(
        topLeft: Radius.circular(topLeft),
        topRight: Radius.circular(topRight),
        bottomLeft: Radius.circular(bottomLeft),
        bottomRight: Radius.circular(bottomRight),
      );
    }

    return null;
  }

  /// Parse BoxShadow list from props
  static List<BoxShadow>? _parseBoxShadow(dynamic value) {
    if (value == null) return null;

    if (value is List) {
      return value
          .map((shadow) => _parseSingleBoxShadow(shadow))
          .whereType<BoxShadow>()
          .toList();
    }

    final shadow = _parseSingleBoxShadow(value);
    return shadow != null ? [shadow] : null;
  }

  /// Parse a single BoxShadow
  static BoxShadow? _parseSingleBoxShadow(dynamic value) {
    if (value is! Map) return null;

    return BoxShadow(
      color: parseColor(value['color']) ?? const Color(0x33000000),
      offset: Offset(
        (value['offsetX'] as num?)?.toDouble() ?? 0,
        (value['offsetY'] as num?)?.toDouble() ?? 0,
      ),
      blurRadius: (value['blurRadius'] as num?)?.toDouble() ?? 0,
      spreadRadius: (value['spreadRadius'] as num?)?.toDouble() ?? 0,
    );
  }

  /// Parse MainAxisAlignment from string
  static MainAxisAlignment? parseMainAxisAlignment(dynamic value) {
    if (value == null) return null;
    if (value is! String) return null;

    switch (value.toLowerCase()) {
      case 'start':
        return MainAxisAlignment.start;
      case 'end':
        return MainAxisAlignment.end;
      case 'center':
        return MainAxisAlignment.center;
      case 'spacebetween':
        return MainAxisAlignment.spaceBetween;
      case 'spacearound':
        return MainAxisAlignment.spaceAround;
      case 'spaceevenly':
        return MainAxisAlignment.spaceEvenly;
      default:
        return null;
    }
  }

  /// Parse CrossAxisAlignment from string
  static CrossAxisAlignment? parseCrossAxisAlignment(dynamic value) {
    if (value == null) return null;
    if (value is! String) return null;

    switch (value.toLowerCase()) {
      case 'start':
        return CrossAxisAlignment.start;
      case 'end':
        return CrossAxisAlignment.end;
      case 'center':
        return CrossAxisAlignment.center;
      case 'stretch':
        return CrossAxisAlignment.stretch;
      case 'baseline':
        return CrossAxisAlignment.baseline;
      default:
        return null;
    }
  }

  /// Parse TextInputType from string
  static TextInputType? parseKeyboardType(dynamic value) {
    if (value == null) return null;
    if (value is! String) return null;

    switch (value.toLowerCase()) {
      case 'text':
        return TextInputType.text;
      case 'number':
        return TextInputType.number;
      case 'phone':
        return TextInputType.phone;
      case 'email':
        return TextInputType.emailAddress;
      case 'url':
        return TextInputType.url;
      case 'multiline':
        return TextInputType.multiline;
      default:
        return TextInputType.text;
    }
  }

  static const Map<String, Color> _namedColors = {
    'black': Color(0xFF000000),
    'white': Color(0xFFFFFFFF),
    'red': Color(0xFFFF0000),
    'green': Color(0xFF00FF00),
    'blue': Color(0xFF0000FF),
    'yellow': Color(0xFFFFFF00),
    'cyan': Color(0xFF00FFFF),
    'magenta': Color(0xFFFF00FF),
    'gray': Color(0xFF808080),
    'grey': Color(0xFF808080),
    'transparent': Color(0x00000000),
  };
}
