import 'package:flutter/material.dart';

/// Design token color constants for Lumora framework
/// 
/// These colors provide a consistent color palette across the application
/// and can be referenced in both runtime schema interpretation and generated code.
class LumoraColors {
  LumoraColors._(); // Private constructor to prevent instantiation

  // Primary colors
  static const Color primary = Color(0xFF6366F1); // Indigo
  static const Color primaryLight = Color(0xFF818CF8);
  static const Color primaryDark = Color(0xFF4F46E5);

  // Secondary colors
  static const Color secondary = Color(0xFF8B5CF6); // Purple
  static const Color secondaryLight = Color(0xFFA78BFA);
  static const Color secondaryDark = Color(0xFF7C3AED);

  // Background colors
  static const Color background = Color(0xFFFFFFFF); // White
  static const Color backgroundDark = Color(0xFF1F2937); // Dark gray
  static const Color surface = Color(0xFFF9FAFB); // Light gray
  static const Color surfaceDark = Color(0xFF374151);

  // Text colors
  static const Color textPrimary = Color(0xFF111827); // Almost black
  static const Color textSecondary = Color(0xFF6B7280); // Medium gray
  static const Color textTertiary = Color(0xFF9CA3AF); // Light gray
  static const Color textOnPrimary = Color(0xFFFFFFFF); // White
  static const Color textOnSecondary = Color(0xFFFFFFFF); // White

  // Semantic colors
  static const Color success = Color(0xFF10B981); // Green
  static const Color successLight = Color(0xFF34D399);
  static const Color successDark = Color(0xFF059669);

  static const Color warning = Color(0xFFF59E0B); // Amber
  static const Color warningLight = Color(0xFFFBBF24);
  static const Color warningDark = Color(0xFFD97706);

  static const Color error = Color(0xFFEF4444); // Red
  static const Color errorLight = Color(0xFFF87171);
  static const Color errorDark = Color(0xFFDC2626);

  static const Color info = Color(0xFF3B82F6); // Blue
  static const Color infoLight = Color(0xFF60A5FA);
  static const Color infoDark = Color(0xFF2563EB);

  // Border colors
  static const Color border = Color(0xFFE5E7EB);
  static const Color borderDark = Color(0xFF4B5563);

  // Utility colors
  static const Color transparent = Color(0x00000000);
  static const Color black = Color(0xFF000000);
  static const Color white = Color(0xFFFFFFFF);

  /// Parse a color string to a Color object
  /// Supports hex colors (#RRGGBB or #AARRGGBB) and named colors
  static Color parse(String colorString) {
    // Remove whitespace
    final trimmed = colorString.trim();

    // Check for hex color
    if (trimmed.startsWith('#')) {
      String hexColor = trimmed.replaceAll('#', '');
      
      // Add alpha if not present
      if (hexColor.length == 6) {
        hexColor = 'FF$hexColor';
      }
      
      try {
        return Color(int.parse(hexColor, radix: 16));
      } catch (e) {
        return black; // Fallback
      }
    }

    // Check for named colors (case-insensitive)
    final lowerColor = trimmed.toLowerCase();
    switch (lowerColor) {
      case 'primary':
        return primary;
      case 'primarylight':
      case 'primary-light':
        return primaryLight;
      case 'primarydark':
      case 'primary-dark':
        return primaryDark;
      case 'secondary':
        return secondary;
      case 'secondarylight':
      case 'secondary-light':
        return secondaryLight;
      case 'secondarydark':
      case 'secondary-dark':
        return secondaryDark;
      case 'background':
        return background;
      case 'backgrounddark':
      case 'background-dark':
        return backgroundDark;
      case 'surface':
        return surface;
      case 'surfacedark':
      case 'surface-dark':
        return surfaceDark;
      case 'textprimary':
      case 'text-primary':
        return textPrimary;
      case 'textsecondary':
      case 'text-secondary':
        return textSecondary;
      case 'texttertiary':
      case 'text-tertiary':
        return textTertiary;
      case 'textonprimary':
      case 'text-on-primary':
        return textOnPrimary;
      case 'textonsecondary':
      case 'text-on-secondary':
        return textOnSecondary;
      case 'success':
        return success;
      case 'successlight':
      case 'success-light':
        return successLight;
      case 'successdark':
      case 'success-dark':
        return successDark;
      case 'warning':
        return warning;
      case 'warninglight':
      case 'warning-light':
        return warningLight;
      case 'warningdark':
      case 'warning-dark':
        return warningDark;
      case 'error':
        return error;
      case 'errorlight':
      case 'error-light':
        return errorLight;
      case 'errordark':
      case 'error-dark':
        return errorDark;
      case 'info':
        return info;
      case 'infolight':
      case 'info-light':
        return infoLight;
      case 'infodark':
      case 'info-dark':
        return infoDark;
      case 'border':
        return border;
      case 'borderdark':
      case 'border-dark':
        return borderDark;
      case 'transparent':
        return transparent;
      case 'black':
        return black;
      case 'white':
        return white;
      default:
        return black; // Fallback
    }
  }
}
