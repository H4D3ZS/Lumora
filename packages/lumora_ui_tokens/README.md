# Kiro UI Tokens

Design tokens package for the Kiro/Lumora framework providing consistent colors, typography, and spacing constants across the application.

## Features

- **Colors**: Comprehensive color palette including primary, secondary, semantic colors (success, warning, error, info), and text colors
- **Typography**: Pre-defined TextStyle constants for headings, body text, labels, captions, and buttons
- **Spacing**: EdgeInsets constants based on a 4px grid system for consistent spacing

## Installation

Add this package to your `pubspec.yaml`:

```yaml
dependencies:
  kiro_ui_tokens:
    path: ../../packages/lumora_ui_tokens
```

## Usage

### Colors

```dart
import 'package:kiro_ui_tokens/kiro_ui_tokens.dart';

// Use predefined colors
Container(
  color: LumoraColors.primary,
  child: Text(
    'Hello',
    style: TextStyle(color: LumoraColors.textOnPrimary),
  ),
)

// Parse color strings (supports hex and named colors)
final color = LumoraColors.parse('#6366F1');
final namedColor = LumoraColors.parse('primary');
```

### Typography

```dart
import 'package:kiro_ui_tokens/kiro_ui_tokens.dart';

// Use predefined text styles
Text('Headline', style: LumoraTypography.headlineLarge)
Text('Body text', style: LumoraTypography.bodyMedium)
Text('Caption', style: LumoraTypography.caption)

// Parse typography token names
final style = LumoraTypography.parse('h1'); // Returns headlineLarge
```

### Spacing

```dart
import 'package:kiro_ui_tokens/kiro_ui_tokens.dart';

// Use predefined spacing
Container(
  padding: LumoraSpacing.allLg,  // 16px all sides
  margin: LumoraSpacing.horizontalMd,  // 12px horizontal
  child: Text('Content'),
)

// Parse spacing values
final spacing = LumoraSpacing.parse('lg');  // Returns allLg
final numSpacing = LumoraSpacing.parse(16);  // Returns EdgeInsets.all(16)
```

## Design Token Reference

### Color Tokens

**Primary Colors:**
- `primary` - Main brand color (Indigo)
- `primaryLight` - Lighter variant
- `primaryDark` - Darker variant

**Secondary Colors:**
- `secondary` - Secondary brand color (Purple)
- `secondaryLight` - Lighter variant
- `secondaryDark` - Darker variant

**Background Colors:**
- `background` - Main background (White)
- `backgroundDark` - Dark background
- `surface` - Surface color (Light gray)
- `surfaceDark` - Dark surface

**Text Colors:**
- `textPrimary` - Primary text color
- `textSecondary` - Secondary text color
- `textTertiary` - Tertiary text color
- `textOnPrimary` - Text on primary color
- `textOnSecondary` - Text on secondary color

**Semantic Colors:**
- `success` / `successLight` / `successDark` - Green
- `warning` / `warningLight` / `warningDark` - Amber
- `error` / `errorLight` / `errorDark` - Red
- `info` / `infoLight` / `infoDark` - Blue

### Typography Tokens

**Display Styles:**
- `displayLarge` (57px)
- `displayMedium` (45px)
- `displaySmall` (36px)

**Headline Styles:**
- `headlineLarge` / `h1` (32px, bold)
- `headlineMedium` / `h2` (28px, bold)
- `headlineSmall` / `h3` (24px, bold)

**Title Styles:**
- `titleLarge` / `h4` (22px, medium)
- `titleMedium` / `h5` (16px, medium)
- `titleSmall` / `h6` (14px, medium)

**Body Styles:**
- `bodyLarge` / `body1` (16px)
- `bodyMedium` / `body` / `body2` (14px)
- `bodySmall` (12px)

**Label Styles:**
- `labelLarge` (14px, medium)
- `labelMedium` (12px, medium)
- `labelSmall` (11px, medium)

**Caption Styles:**
- `caption` (12px)
- `captionSmall` (10px)

**Button Styles:**
- `buttonLarge` (16px, medium)
- `button` (14px, medium)
- `buttonSmall` (12px, medium)

### Spacing Tokens

Based on a 4px grid system:

- `xs` - 4px
- `sm` / `small` - 8px
- `md` / `medium` - 12px
- `lg` / `large` - 16px
- `xl` - 24px
- `xxl` - 32px
- `xxxl` - 48px

Available as:
- `allXs`, `allSm`, `allMd`, `allLg`, `allXl`, `allXxl`, `allXxxl` - All sides
- `horizontalXs`, `horizontalSm`, etc. - Horizontal only
- `verticalXs`, `verticalSm`, etc. - Vertical only
- `topXs`, `bottomXs`, `leftXs`, `rightXs`, etc. - Single side

## Integration with Schema Interpreter

The design tokens are automatically used by the SchemaInterpreter when parsing JSON schemas:

```json
{
  "type": "View",
  "props": {
    "padding": "lg",
    "backgroundColor": "primary"
  },
  "children": [
    {
      "type": "Text",
      "props": {
        "text": "Hello World",
        "style": {
          "typography": "h1",
          "color": "textOnPrimary"
        }
      }
    }
  ]
}
```

## Integration with Codegen

Generated Dart code automatically references design tokens:

```dart
Container(
  padding: LumoraSpacing.allLg,
  decoration: BoxDecoration(color: LumoraColors.primary),
  child: Text(
    'Hello World',
    style: LumoraTypography.headlineLarge.copyWith(
      color: LumoraColors.textOnPrimary,
    ),
  ),
)
```

## License

MIT License - See LICENSE file for details
