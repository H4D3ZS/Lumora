import 'package:flutter/material.dart';
import 'colors.dart';

/// Design token typography constants for Lumora framework
/// 
/// These TextStyle constants provide consistent typography across the application
/// and can be referenced in both runtime schema interpretation and generated code.
class LumoraTypography {
  LumoraTypography._(); // Private constructor to prevent instantiation

  // Display styles (largest)
  static const TextStyle displayLarge = TextStyle(
    fontSize: 57,
    fontWeight: FontWeight.w400,
    letterSpacing: -0.25,
    height: 1.12,
    color: LumoraColors.textPrimary,
  );

  static const TextStyle displayMedium = TextStyle(
    fontSize: 45,
    fontWeight: FontWeight.w400,
    letterSpacing: 0,
    height: 1.16,
    color: LumoraColors.textPrimary,
  );

  static const TextStyle displaySmall = TextStyle(
    fontSize: 36,
    fontWeight: FontWeight.w400,
    letterSpacing: 0,
    height: 1.22,
    color: LumoraColors.textPrimary,
  );

  // Headline styles
  static const TextStyle headlineLarge = TextStyle(
    fontSize: 32,
    fontWeight: FontWeight.w600,
    letterSpacing: 0,
    height: 1.25,
    color: LumoraColors.textPrimary,
  );

  static const TextStyle headlineMedium = TextStyle(
    fontSize: 28,
    fontWeight: FontWeight.w600,
    letterSpacing: 0,
    height: 1.29,
    color: LumoraColors.textPrimary,
  );

  static const TextStyle headlineSmall = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.w600,
    letterSpacing: 0,
    height: 1.33,
    color: LumoraColors.textPrimary,
  );

  // Title styles
  static const TextStyle titleLarge = TextStyle(
    fontSize: 22,
    fontWeight: FontWeight.w500,
    letterSpacing: 0,
    height: 1.27,
    color: LumoraColors.textPrimary,
  );

  static const TextStyle titleMedium = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.15,
    height: 1.5,
    color: LumoraColors.textPrimary,
  );

  static const TextStyle titleSmall = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.1,
    height: 1.43,
    color: LumoraColors.textPrimary,
  );

  // Body styles
  static const TextStyle bodyLarge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.5,
    height: 1.5,
    color: LumoraColors.textPrimary,
  );

  static const TextStyle bodyMedium = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.25,
    height: 1.43,
    color: LumoraColors.textPrimary,
  );

  static const TextStyle bodySmall = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.4,
    height: 1.33,
    color: LumoraColors.textSecondary,
  );

  // Label styles
  static const TextStyle labelLarge = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.1,
    height: 1.43,
    color: LumoraColors.textPrimary,
  );

  static const TextStyle labelMedium = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.5,
    height: 1.33,
    color: LumoraColors.textPrimary,
  );

  static const TextStyle labelSmall = TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.5,
    height: 1.45,
    color: LumoraColors.textSecondary,
  );

  // Caption styles
  static const TextStyle caption = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.4,
    height: 1.33,
    color: LumoraColors.textSecondary,
  );

  static const TextStyle captionSmall = TextStyle(
    fontSize: 10,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.4,
    height: 1.4,
    color: LumoraColors.textTertiary,
  );

  // Button styles
  static const TextStyle button = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.1,
    height: 1.43,
    color: LumoraColors.textOnPrimary,
  );

  static const TextStyle buttonLarge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.1,
    height: 1.5,
    color: LumoraColors.textOnPrimary,
  );

  static const TextStyle buttonSmall = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.5,
    height: 1.33,
    color: LumoraColors.textOnPrimary,
  );

  /// Parse a typography style name to a TextStyle object
  /// Supports named typography tokens
  static TextStyle? parse(String styleName) {
    final lowerStyle = styleName.toLowerCase().replaceAll('-', '').replaceAll('_', '');
    
    switch (lowerStyle) {
      case 'displaylarge':
        return displayLarge;
      case 'displaymedium':
        return displayMedium;
      case 'displaysmall':
        return displaySmall;
      case 'headlinelarge':
      case 'h1':
        return headlineLarge;
      case 'headlinemedium':
      case 'h2':
        return headlineMedium;
      case 'headlinesmall':
      case 'h3':
        return headlineSmall;
      case 'titlelarge':
      case 'h4':
        return titleLarge;
      case 'titlemedium':
      case 'h5':
        return titleMedium;
      case 'titlesmall':
      case 'h6':
        return titleSmall;
      case 'bodylarge':
      case 'body1':
        return bodyLarge;
      case 'bodymedium':
      case 'body':
      case 'body2':
        return bodyMedium;
      case 'bodysmall':
        return bodySmall;
      case 'labellarge':
        return labelLarge;
      case 'labelmedium':
        return labelMedium;
      case 'labelsmall':
        return labelSmall;
      case 'caption':
        return caption;
      case 'captionsmall':
        return captionSmall;
      case 'button':
        return button;
      case 'buttonlarge':
        return buttonLarge;
      case 'buttonsmall':
        return buttonSmall;
      default:
        return null;
    }
  }
}
