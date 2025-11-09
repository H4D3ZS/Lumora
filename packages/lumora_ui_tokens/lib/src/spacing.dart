import 'package:flutter/material.dart';

/// Design token spacing constants for Lumora framework
/// 
/// These EdgeInsets constants provide consistent spacing across the application
/// and can be referenced in both runtime schema interpretation and generated code.
class LumoraSpacing {
  LumoraSpacing._(); // Private constructor to prevent instantiation

  // Base spacing unit (4px)
  static const double unit = 4.0;

  // Spacing scale (multiples of base unit)
  static const double xs = unit; // 4px
  static const double sm = unit * 2; // 8px
  static const double md = unit * 3; // 12px
  static const double lg = unit * 4; // 16px
  static const double xl = unit * 6; // 24px
  static const double xxl = unit * 8; // 32px
  static const double xxxl = unit * 12; // 48px

  // EdgeInsets presets - All sides
  static const EdgeInsets allXs = EdgeInsets.all(xs);
  static const EdgeInsets allSm = EdgeInsets.all(sm);
  static const EdgeInsets allMd = EdgeInsets.all(md);
  static const EdgeInsets allLg = EdgeInsets.all(lg);
  static const EdgeInsets allXl = EdgeInsets.all(xl);
  static const EdgeInsets allXxl = EdgeInsets.all(xxl);
  static const EdgeInsets allXxxl = EdgeInsets.all(xxxl);

  // EdgeInsets presets - Horizontal
  static const EdgeInsets horizontalXs = EdgeInsets.symmetric(horizontal: xs);
  static const EdgeInsets horizontalSm = EdgeInsets.symmetric(horizontal: sm);
  static const EdgeInsets horizontalMd = EdgeInsets.symmetric(horizontal: md);
  static const EdgeInsets horizontalLg = EdgeInsets.symmetric(horizontal: lg);
  static const EdgeInsets horizontalXl = EdgeInsets.symmetric(horizontal: xl);
  static const EdgeInsets horizontalXxl = EdgeInsets.symmetric(horizontal: xxl);
  static const EdgeInsets horizontalXxxl = EdgeInsets.symmetric(horizontal: xxxl);

  // EdgeInsets presets - Vertical
  static const EdgeInsets verticalXs = EdgeInsets.symmetric(vertical: xs);
  static const EdgeInsets verticalSm = EdgeInsets.symmetric(vertical: sm);
  static const EdgeInsets verticalMd = EdgeInsets.symmetric(vertical: md);
  static const EdgeInsets verticalLg = EdgeInsets.symmetric(vertical: lg);
  static const EdgeInsets verticalXl = EdgeInsets.symmetric(vertical: xl);
  static const EdgeInsets verticalXxl = EdgeInsets.symmetric(vertical: xxl);
  static const EdgeInsets verticalXxxl = EdgeInsets.symmetric(vertical: xxxl);

  // EdgeInsets presets - Top only
  static const EdgeInsets topXs = EdgeInsets.only(top: xs);
  static const EdgeInsets topSm = EdgeInsets.only(top: sm);
  static const EdgeInsets topMd = EdgeInsets.only(top: md);
  static const EdgeInsets topLg = EdgeInsets.only(top: lg);
  static const EdgeInsets topXl = EdgeInsets.only(top: xl);
  static const EdgeInsets topXxl = EdgeInsets.only(top: xxl);
  static const EdgeInsets topXxxl = EdgeInsets.only(top: xxxl);

  // EdgeInsets presets - Bottom only
  static const EdgeInsets bottomXs = EdgeInsets.only(bottom: xs);
  static const EdgeInsets bottomSm = EdgeInsets.only(bottom: sm);
  static const EdgeInsets bottomMd = EdgeInsets.only(bottom: md);
  static const EdgeInsets bottomLg = EdgeInsets.only(bottom: lg);
  static const EdgeInsets bottomXl = EdgeInsets.only(bottom: xl);
  static const EdgeInsets bottomXxl = EdgeInsets.only(bottom: xxl);
  static const EdgeInsets bottomXxxl = EdgeInsets.only(bottom: xxxl);

  // EdgeInsets presets - Left only
  static const EdgeInsets leftXs = EdgeInsets.only(left: xs);
  static const EdgeInsets leftSm = EdgeInsets.only(left: sm);
  static const EdgeInsets leftMd = EdgeInsets.only(left: md);
  static const EdgeInsets leftLg = EdgeInsets.only(left: lg);
  static const EdgeInsets leftXl = EdgeInsets.only(left: xl);
  static const EdgeInsets leftXxl = EdgeInsets.only(left: xxl);
  static const EdgeInsets leftXxxl = EdgeInsets.only(left: xxxl);

  // EdgeInsets presets - Right only
  static const EdgeInsets rightXs = EdgeInsets.only(right: xs);
  static const EdgeInsets rightSm = EdgeInsets.only(right: sm);
  static const EdgeInsets rightMd = EdgeInsets.only(right: md);
  static const EdgeInsets rightLg = EdgeInsets.only(right: lg);
  static const EdgeInsets rightXl = EdgeInsets.only(right: xl);
  static const EdgeInsets rightXxl = EdgeInsets.only(right: xxl);
  static const EdgeInsets rightXxxl = EdgeInsets.only(right: xxxl);

  // Zero spacing
  static const EdgeInsets zero = EdgeInsets.zero;

  /// Parse a spacing value to EdgeInsets
  /// Supports numeric values and named spacing tokens
  static EdgeInsets parse(dynamic value) {
    if (value is num) {
      return EdgeInsets.all(value.toDouble());
    }

    if (value is String) {
      final lowerValue = value.toLowerCase().replaceAll('-', '').replaceAll('_', '');
      
      // Check for named tokens
      switch (lowerValue) {
        case 'xs':
          return allXs;
        case 'sm':
        case 'small':
          return allSm;
        case 'md':
        case 'medium':
          return allMd;
        case 'lg':
        case 'large':
          return allLg;
        case 'xl':
          return allXl;
        case 'xxl':
          return allXxl;
        case 'xxxl':
          return allXxxl;
        case 'zero':
        case 'none':
          return zero;
      }

      // Try to parse as number
      final numValue = double.tryParse(value);
      if (numValue != null) {
        return EdgeInsets.all(numValue);
      }
    }

    // Default to zero
    return zero;
  }

  /// Parse spacing with direction (horizontal, vertical, top, bottom, left, right)
  static EdgeInsets parseWithDirection(dynamic value, String direction) {
    double spacing = 0;

    if (value is num) {
      spacing = value.toDouble();
    } else if (value is String) {
      final lowerValue = value.toLowerCase().replaceAll('-', '').replaceAll('_', '');
      
      switch (lowerValue) {
        case 'xs':
          spacing = xs;
          break;
        case 'sm':
        case 'small':
          spacing = sm;
          break;
        case 'md':
        case 'medium':
          spacing = md;
          break;
        case 'lg':
        case 'large':
          spacing = lg;
          break;
        case 'xl':
          spacing = xl;
          break;
        case 'xxl':
          spacing = xxl;
          break;
        case 'xxxl':
          spacing = xxxl;
          break;
        default:
          spacing = double.tryParse(value) ?? 0;
      }
    }

    final lowerDirection = direction.toLowerCase();
    switch (lowerDirection) {
      case 'horizontal':
        return EdgeInsets.symmetric(horizontal: spacing);
      case 'vertical':
        return EdgeInsets.symmetric(vertical: spacing);
      case 'top':
        return EdgeInsets.only(top: spacing);
      case 'bottom':
        return EdgeInsets.only(bottom: spacing);
      case 'left':
        return EdgeInsets.only(left: spacing);
      case 'right':
        return EdgeInsets.only(right: spacing);
      default:
        return EdgeInsets.all(spacing);
    }
  }
}
