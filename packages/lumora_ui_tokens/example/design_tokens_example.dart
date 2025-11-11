import 'package:flutter/material.dart';
import 'package:lumora_ui_tokens/kiro_ui_tokens.dart';

/// Example demonstrating the usage of Kiro UI design tokens
void main() {
  runApp(const DesignTokensExample());
}

class DesignTokensExample extends StatelessWidget {
  const DesignTokensExample({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Design Tokens Example',
      theme: ThemeData(
        primaryColor: LumoraColors.primary,
        scaffoldBackgroundColor: LumoraColors.background,
      ),
      home: const ExamplePage(),
    );
  }
}

class ExamplePage extends StatelessWidget {
  const ExamplePage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Design Tokens Example'),
        backgroundColor: LumoraColors.primary,
      ),
      body: SingleChildScrollView(
        padding: LumoraSpacing.allLg,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Typography examples
            Text('Display Large', style: LumoraTypography.displayLarge),
            const SizedBox(height: 8),
            Text('Headline Large', style: LumoraTypography.headlineLarge),
            const SizedBox(height: 8),
            Text('Title Large', style: LumoraTypography.titleLarge),
            const SizedBox(height: 8),
            Text('Body Large', style: LumoraTypography.bodyLarge),
            const SizedBox(height: 8),
            Text('Caption', style: LumoraTypography.caption),
            
            const SizedBox(height: 32),
            
            // Color examples
            Container(
              padding: LumoraSpacing.allMd,
              decoration: BoxDecoration(
                color: LumoraColors.primary,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'Primary Color',
                style: LumoraTypography.bodyLarge.copyWith(
                  color: LumoraColors.textOnPrimary,
                ),
              ),
            ),
            
            const SizedBox(height: 16),
            
            Container(
              padding: LumoraSpacing.allMd,
              decoration: BoxDecoration(
                color: LumoraColors.success,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'Success Color',
                style: LumoraTypography.bodyLarge.copyWith(
                  color: LumoraColors.white,
                ),
              ),
            ),
            
            const SizedBox(height: 16),
            
            Container(
              padding: LumoraSpacing.allMd,
              decoration: BoxDecoration(
                color: LumoraColors.error,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'Error Color',
                style: LumoraTypography.bodyLarge.copyWith(
                  color: LumoraColors.white,
                ),
              ),
            ),
            
            const SizedBox(height: 32),
            
            // Spacing examples
            Text('Spacing Examples', style: LumoraTypography.titleLarge),
            const SizedBox(height: 16),
            
            Container(
              padding: LumoraSpacing.allXs,
              color: LumoraColors.surface,
              child: const Text('Extra Small Padding (4px)'),
            ),
            const SizedBox(height: 8),
            
            Container(
              padding: LumoraSpacing.allSm,
              color: LumoraColors.surface,
              child: const Text('Small Padding (8px)'),
            ),
            const SizedBox(height: 8),
            
            Container(
              padding: LumoraSpacing.allMd,
              color: LumoraColors.surface,
              child: const Text('Medium Padding (12px)'),
            ),
            const SizedBox(height: 8),
            
            Container(
              padding: LumoraSpacing.allLg,
              color: LumoraColors.surface,
              child: const Text('Large Padding (16px)'),
            ),
            const SizedBox(height: 8),
            
            Container(
              padding: LumoraSpacing.allXl,
              color: LumoraColors.surface,
              child: const Text('Extra Large Padding (24px)'),
            ),
          ],
        ),
      ),
    );
  }
}
