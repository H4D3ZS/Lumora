import 'package:flutter/material.dart';
import 'package:lumora_runtime/src/registry/widget_registry.dart';
import 'package:lumora_runtime/src/utils/prop_parser.dart';

/// Register all core Flutter widgets in the registry
void registerCoreWidgets(WidgetRegistry registry) {
  _registerView(registry);
  _registerText(registry);
  _registerButton(registry);
  _registerImage(registry);
  _registerScrollView(registry);
  _registerListView(registry);
  _registerTextInput(registry);
  _registerSwitch(registry);
  _registerCheckbox(registry);
  _registerRadio(registry);
  _registerRow(registry);
  _registerColumn(registry);
}

/// Register View/Container widget
void _registerView(WidgetRegistry registry) {
  registry.register('View', ({required props, required children, key}) {
    final width = (props['width'] as num?)?.toDouble();
    final height = (props['height'] as num?)?.toDouble();
    final padding = PropParser.parsePadding(props['padding']);
    final margin = PropParser.parsePadding(props['margin']);
    final decoration = PropParser.parseDecoration(props);
    final alignment = PropParser.parseAlignment(props['alignment']);

    Widget? child;
    if (children.isEmpty) {
      child = null;
    } else if (children.length == 1) {
      child = children[0];
    } else {
      // Multiple children - wrap in Column
      child = Column(
        mainAxisSize: MainAxisSize.min,
        children: children,
      );
    }

    return Container(
      key: key,
      width: width,
      height: height,
      padding: padding,
      margin: margin,
      decoration: decoration,
      alignment: alignment,
      child: child,
    );
  });

  // Also register as 'Container' for compatibility
  registry.register('Container', registry.getBuilder('View')!);
}

/// Register Text widget
void _registerText(WidgetRegistry registry) {
  registry.register('Text', ({required props, required children, key}) {
    final text = props['text']?.toString() ?? 
                 props['children']?.toString() ?? 
                 '';
    final style = PropParser.parseTextStyle(props['style']);
    final textAlign = PropParser.parseTextAlign(props['textAlign']);
    final maxLines = props['maxLines'] as int?;
    final overflow = props['overflow'] == 'ellipsis' 
        ? TextOverflow.ellipsis 
        : null;

    return Text(
      text,
      key: key,
      style: style,
      textAlign: textAlign,
      maxLines: maxLines,
      overflow: overflow,
    );
  });
}

/// Register Button/ElevatedButton widget
void _registerButton(WidgetRegistry registry) {
  registry.register('Button', ({required props, required children, key}) {
    final onPress = props['onPress'] as VoidCallback?;
    final title = props['title']?.toString();
    final disabled = props['disabled'] == true;
    final style = _parseButtonStyle(props['style']);

    Widget child;
    if (children.isNotEmpty) {
      child = children[0];
    } else if (title != null) {
      child = Text(title);
    } else {
      child = const Text('Button');
    }

    return ElevatedButton(
      key: key,
      onPressed: disabled ? null : onPress,
      style: style,
      child: child,
    );
  });

  // Also register as 'ElevatedButton'
  registry.register('ElevatedButton', registry.getBuilder('Button')!);
}

ButtonStyle? _parseButtonStyle(dynamic value) {
  if (value == null) return null;
  if (value is! Map) return null;

  return ButtonStyle(
    backgroundColor: value['backgroundColor'] != null
        ? WidgetStateProperty.all(PropParser.parseColor(value['backgroundColor']))
        : null,
    foregroundColor: value['color'] != null
        ? WidgetStateProperty.all(PropParser.parseColor(value['color']))
        : null,
    padding: value['padding'] != null
        ? WidgetStateProperty.all(PropParser.parsePadding(value['padding']))
        : null,
  );
}

/// Register Image widget
void _registerImage(WidgetRegistry registry) {
  registry.register('Image', ({required props, required children, key}) {
    final source = props['source'];
    final width = (props['width'] as num?)?.toDouble();
    final height = (props['height'] as num?)?.toDouble();
    final fit = _parseBoxFit(props['fit']);

    if (source == null) {
      return Container(
        key: key,
        width: width,
        height: height,
        color: Colors.grey[300],
        child: const Icon(Icons.image, color: Colors.grey),
      );
    }

    if (source is String) {
      if (source.startsWith('http://') || source.startsWith('https://')) {
        return Image.network(
          source,
          key: key,
          width: width,
          height: height,
          fit: fit,
          errorBuilder: (context, error, stackTrace) {
            return Container(
              width: width,
              height: height,
              color: Colors.grey[300],
              child: const Icon(Icons.broken_image, color: Colors.grey),
            );
          },
        );
      } else {
        return Image.asset(
          source,
          key: key,
          width: width,
          height: height,
          fit: fit,
          errorBuilder: (context, error, stackTrace) {
            return Container(
              width: width,
              height: height,
              color: Colors.grey[300],
              child: const Icon(Icons.broken_image, color: Colors.grey),
            );
          },
        );
      }
    }

    if (source is Map) {
      final uri = source['uri']?.toString();
      if (uri != null) {
        return Image.network(
          uri,
          key: key,
          width: width,
          height: height,
          fit: fit,
        );
      }
    }

    return Container(
      key: key,
      width: width,
      height: height,
      color: Colors.grey[300],
      child: const Icon(Icons.image, color: Colors.grey),
    );
  });
}

BoxFit? _parseBoxFit(dynamic value) {
  if (value == null) return null;
  if (value is! String) return null;

  switch (value.toLowerCase()) {
    case 'contain':
      return BoxFit.contain;
    case 'cover':
      return BoxFit.cover;
    case 'fill':
      return BoxFit.fill;
    case 'fitwidth':
      return BoxFit.fitWidth;
    case 'fitheight':
      return BoxFit.fitHeight;
    case 'none':
      return BoxFit.none;
    case 'scaledown':
      return BoxFit.scaleDown;
    default:
      return null;
  }
}

/// Register ScrollView widget
void _registerScrollView(WidgetRegistry registry) {
  registry.register('ScrollView', ({required props, required children, key}) {
    final horizontal = props['horizontal'] == true;
    final padding = PropParser.parsePadding(props['padding']);

    Widget child;
    if (children.isEmpty) {
      child = Container();
    } else if (children.length == 1) {
      child = children[0];
    } else {
      child = horizontal
          ? Row(children: children)
          : Column(children: children);
    }

    return SingleChildScrollView(
      key: key,
      scrollDirection: horizontal ? Axis.horizontal : Axis.vertical,
      padding: padding,
      child: child,
    );
  });
}

/// Register ListView widget
void _registerListView(WidgetRegistry registry) {
  registry.register('ListView', ({required props, required children, key}) {
    final horizontal = props['horizontal'] == true;
    final padding = PropParser.parsePadding(props['padding']);
    final separator = props['separator'] == true;

    if (separator && children.length > 1) {
      return ListView.separated(
        key: key,
        scrollDirection: horizontal ? Axis.horizontal : Axis.vertical,
        padding: padding,
        itemCount: children.length,
        itemBuilder: (context, index) => children[index],
        separatorBuilder: (context, index) => const Divider(),
      );
    }

    return ListView.builder(
      key: key,
      scrollDirection: horizontal ? Axis.horizontal : Axis.vertical,
      padding: padding,
      itemCount: children.length,
      itemBuilder: (context, index) => children[index],
    );
  });
}

/// Register TextInput/TextField widget
void _registerTextInput(WidgetRegistry registry) {
  registry.register('TextInput', ({required props, required children, key}) {
    final controller = _getOrCreateController(props['value']);
    final onChanged = props['onChange'] as ValueChanged<String>?;
    final placeholder = props['placeholder']?.toString();
    final label = props['label']?.toString();
    final secureTextEntry = props['secureTextEntry'] == true;
    final keyboardType = PropParser.parseKeyboardType(props['keyboardType']);
    final maxLines = props['maxLines'] as int? ?? 1;
    final enabled = props['enabled'] != false;

    return TextField(
      key: key,
      controller: controller,
      onChanged: onChanged,
      decoration: InputDecoration(
        hintText: placeholder,
        labelText: label,
        border: const OutlineInputBorder(),
      ),
      obscureText: secureTextEntry,
      keyboardType: keyboardType,
      maxLines: maxLines,
      enabled: enabled,
    );
  });

  // Also register as 'TextField'
  registry.register('TextField', registry.getBuilder('TextInput')!);
}

// Simple controller cache to avoid creating new controllers on every rebuild
final Map<String, TextEditingController> _controllerCache = {};

TextEditingController _getOrCreateController(dynamic value) {
  final text = value?.toString() ?? '';
  final key = 'controller_$text';
  
  if (!_controllerCache.containsKey(key)) {
    _controllerCache[key] = TextEditingController(text: text);
  }
  
  return _controllerCache[key]!;
}

/// Register Switch widget
void _registerSwitch(WidgetRegistry registry) {
  registry.register('Switch', ({required props, required children, key}) {
    final value = props['value'] == true;
    final onChanged = props['onChanged'] as ValueChanged<bool>?;
    final thumbColor = PropParser.parseColor(props['activeColor']);

    return Switch(
      key: key,
      value: value,
      onChanged: onChanged,
      thumbColor: thumbColor != null ? WidgetStateProperty.all(thumbColor) : null,
    );
  });
}

/// Register Checkbox widget
void _registerCheckbox(WidgetRegistry registry) {
  registry.register('Checkbox', ({required props, required children, key}) {
    final value = props['value'] == true;
    final onChanged = props['onChanged'] as ValueChanged<bool?>?;
    final activeColor = PropParser.parseColor(props['activeColor']);

    return Checkbox(
      key: key,
      value: value,
      onChanged: onChanged,
      activeColor: activeColor,
    );
  });
}

/// Register Radio widget
/// 
/// Note: groupValue and onChanged are deprecated in Flutter 3.32+
/// but still functional. Future versions should use RadioGroup.
void _registerRadio(WidgetRegistry registry) {
  registry.register('Radio', ({required props, required children, key}) {
    final value = props['value'];
    final groupValue = props['groupValue'];
    final onChanged = props['onChanged'] as ValueChanged?;
    final fillColor = PropParser.parseColor(props['activeColor']);

    // ignore: deprecated_member_use
    return Radio(
      key: key,
      value: value,
      // ignore: deprecated_member_use
      groupValue: groupValue,
      // ignore: deprecated_member_use
      onChanged: onChanged,
      fillColor: fillColor != null ? WidgetStateProperty.all(fillColor) : null,
    );
  });
}

/// Register Row widget
void _registerRow(WidgetRegistry registry) {
  registry.register('Row', ({required props, required children, key}) {
    final mainAxisAlignment = PropParser.parseMainAxisAlignment(
      props['mainAxisAlignment'],
    ) ?? MainAxisAlignment.start;
    final crossAxisAlignment = PropParser.parseCrossAxisAlignment(
      props['crossAxisAlignment'],
    ) ?? CrossAxisAlignment.center;
    final mainAxisSize = props['mainAxisSize'] == 'min'
        ? MainAxisSize.min
        : MainAxisSize.max;

    return Row(
      key: key,
      mainAxisAlignment: mainAxisAlignment,
      crossAxisAlignment: crossAxisAlignment,
      mainAxisSize: mainAxisSize,
      children: children,
    );
  });
}

/// Register Column widget
void _registerColumn(WidgetRegistry registry) {
  registry.register('Column', ({required props, required children, key}) {
    final mainAxisAlignment = PropParser.parseMainAxisAlignment(
      props['mainAxisAlignment'],
    ) ?? MainAxisAlignment.start;
    final crossAxisAlignment = PropParser.parseCrossAxisAlignment(
      props['crossAxisAlignment'],
    ) ?? CrossAxisAlignment.center;
    final mainAxisSize = props['mainAxisSize'] == 'min'
        ? MainAxisSize.min
        : MainAxisSize.max;

    return Column(
      key: key,
      mainAxisAlignment: mainAxisAlignment,
      crossAxisAlignment: crossAxisAlignment,
      mainAxisSize: mainAxisSize,
      children: children,
    );
  });
}
