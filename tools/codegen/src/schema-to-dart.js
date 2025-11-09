const fs = require('fs');
const path = require('path');

/**
 * SchemaToD art - Converts JSON UI schemas to Dart widget code
 */
class SchemaToDart {
  constructor() {
    this.mapping = null;
    this.indent = '  ';
    this.currentIndentLevel = 0;
  }

  /**
   * Load ui-mapping.json configuration
   * @param {string} mappingPath - Path to ui-mapping.json file
   */
  loadMapping(mappingPath) {
    try {
      const mappingContent = fs.readFileSync(mappingPath, 'utf-8');
      this.mapping = JSON.parse(mappingContent);
    } catch (error) {
      throw new Error(`Failed to load ui-mapping.json: ${error.message}`);
    }
  }

  /**
   * Load schema JSON from file
   * @param {string} schemaPath - Path to schema JSON file
   * @returns {object} Schema object
   */
  loadSchema(schemaPath) {
    try {
      const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
      return JSON.parse(schemaContent);
    } catch (error) {
      throw new Error(`Failed to load schema file: ${error.message}`);
    }
  }

  /**
   * Convert schema to Dart widget code
   * @param {object} schema - Schema object
   * @returns {string} Dart widget code
   */
  convertToDart(schema) {
    if (!this.mapping) {
      throw new Error('UI mapping not loaded. Call loadMapping() first.');
    }

    if (!schema || !schema.root) {
      throw new Error('Invalid schema: missing root node');
    }

    // Generate widget tree
    this.currentIndentLevel = 0;
    const widgetCode = this.generateWidget(schema.root);

    return widgetCode;
  }

  /**
   * Generate Dart widget code for a schema node
   * @param {object} node - Schema node
   * @returns {string} Dart widget code
   */
  generateWidget(node) {
    if (!node || !node.type) {
      return 'Container()';
    }

    const nodeType = node.type;
    const widgetMapping = this.mapping[nodeType];

    if (!widgetMapping) {
      // Unknown type, return placeholder
      return `Container(child: Text('Unknown type: ${nodeType}'))`;
    }

    const dartWidget = widgetMapping.dart;
    const props = node.props || {};
    const children = node.children || [];

    // Generate widget based on type
    if (dartWidget === 'Container') {
      return this.generateContainer(props, children);
    } else if (dartWidget === 'Text') {
      return this.generateText(props);
    } else if (dartWidget === 'ElevatedButton') {
      return this.generateButton(props, children);
    } else if (dartWidget === 'ListView') {
      return this.generateListView(props, children);
    } else if (dartWidget === 'Image.network') {
      return this.generateImage(props);
    } else if (dartWidget === 'TextField') {
      return this.generateTextField(props);
    }

    return 'Container()';
  }

  /**
   * Generate Container widget
   * @param {object} props - Props object
   * @param {array} children - Children nodes
   * @returns {string} Dart code
   */
  generateContainer(props, children) {
    const params = [];

    // Handle padding using design tokens
    if (props.padding !== undefined) {
      const paddingCode = this.convertSpacing(props.padding);
      params.push(`padding: ${paddingCode}`);
    }

    // Handle margin using design tokens
    if (props.margin !== undefined) {
      const marginCode = this.convertSpacing(props.margin);
      params.push(`margin: ${marginCode}`);
    }

    // Handle backgroundColor using design tokens
    if (props.backgroundColor) {
      const colorCode = this.convertColor(props.backgroundColor);
      params.push(`decoration: BoxDecoration(color: ${colorCode})`);
    }

    // Handle width
    if (props.width !== undefined) {
      params.push(`width: ${props.width}`);
    }

    // Handle height
    if (props.height !== undefined) {
      params.push(`height: ${props.height}`);
    }

    // Handle children
    if (children && children.length > 0) {
      if (children.length === 1) {
        const childCode = this.generateWidget(children[0]);
        params.push(`child: ${childCode}`);
      } else {
        const childrenCode = this.generateChildren(children);
        params.push(`child: Column(children: ${childrenCode})`);
      }
    }

    if (params.length === 0) {
      return 'Container()';
    }

    return `Container(${params.join(', ')})`;
  }

  /**
   * Generate Text widget
   * @param {object} props - Props object
   * @returns {string} Dart code
   */
  generateText(props) {
    const text = props.text || '';
    const params = [`'${this.escapeString(text)}'`];

    // Handle style - check for typography token first
    if (props.style) {
      // Check if a typography token is specified
      if (props.style.typography) {
        const typographyToken = this.convertTypography(props.style.typography);
        if (typographyToken) {
          // Use typography token as base, then apply overrides
          const overrides = [];
          
          if (props.style.fontSize !== undefined) {
            overrides.push(`fontSize: ${props.style.fontSize}`);
          }
          
          if (props.style.fontWeight) {
            const fontWeight = this.convertFontWeight(props.style.fontWeight);
            overrides.push(`fontWeight: ${fontWeight}`);
          }
          
          if (props.style.color) {
            const colorCode = this.convertColor(props.style.color);
            overrides.push(`color: ${colorCode}`);
          }

          if (overrides.length > 0) {
            params.push(`style: ${typographyToken}.copyWith(${overrides.join(', ')})`);
          } else {
            params.push(`style: ${typographyToken}`);
          }
        } else {
          // Fallback to individual properties
          params.push(`style: ${this.generateTextStyle(props.style)}`);
        }
      } else {
        // No typography token, use individual properties
        params.push(`style: ${this.generateTextStyle(props.style)}`);
      }
    }

    // Handle textAlign
    if (props.textAlign) {
      const textAlign = this.convertTextAlign(props.textAlign);
      params.push(`textAlign: ${textAlign}`);
    }

    return `Text(${params.join(', ')})`;
  }

  /**
   * Generate TextStyle from individual properties
   * @param {object} style - Style properties
   * @returns {string} Dart TextStyle code
   */
  generateTextStyle(style) {
    const styleParams = [];
    
    if (style.fontSize !== undefined) {
      styleParams.push(`fontSize: ${style.fontSize}`);
    }
    
    if (style.fontWeight) {
      const fontWeight = this.convertFontWeight(style.fontWeight);
      styleParams.push(`fontWeight: ${fontWeight}`);
    }
    
    if (style.color) {
      const colorCode = this.convertColor(style.color);
      styleParams.push(`color: ${colorCode}`);
    }

    if (styleParams.length > 0) {
      return `TextStyle(${styleParams.join(', ')})`;
    }

    return 'TextStyle()';
  }

  /**
   * Generate ElevatedButton widget
   * @param {object} props - Props object
   * @param {array} children - Children nodes
   * @returns {string} Dart code
   */
  generateButton(props, children) {
    const params = [];

    // Handle onPressed (onTap -> onPressed)
    if (props.onTap) {
      params.push(`onPressed: () { /* ${props.onTap} */ }`);
    } else {
      params.push('onPressed: null');
    }

    // Handle child (title)
    if (props.title) {
      if (typeof props.title === 'string') {
        params.push(`child: Text('${this.escapeString(props.title)}')`);
      } else if (typeof props.title === 'object' && props.title.type) {
        // Title is a widget node
        const childCode = this.generateWidget(props.title);
        params.push(`child: ${childCode}`);
      }
    } else if (children && children.length > 0) {
      const childCode = this.generateWidget(children[0]);
      params.push(`child: ${childCode}`);
    }

    return `ElevatedButton(${params.join(', ')})`;
  }

  /**
   * Generate ListView widget
   * @param {object} props - Props object
   * @param {array} children - Children nodes
   * @returns {string} Dart code
   */
  generateListView(props, children) {
    const params = [];

    // Handle children
    if (children && children.length > 0) {
      const childrenCode = this.generateChildren(children);
      params.push(`children: ${childrenCode}`);
    }

    // Handle scrollDirection
    if (props.scrollDirection) {
      const axis = this.convertAxis(props.scrollDirection);
      params.push(`scrollDirection: ${axis}`);
    }

    if (params.length === 0) {
      return 'ListView()';
    }

    return `ListView(${params.join(', ')})`;
  }

  /**
   * Generate Image.network widget
   * @param {object} props - Props object
   * @returns {string} Dart code
   */
  generateImage(props) {
    const src = props.src || '';
    const params = [`'${this.escapeString(src)}'`];

    // Handle width
    if (props.width !== undefined) {
      params.push(`width: ${props.width}`);
    }

    // Handle height
    if (props.height !== undefined) {
      params.push(`height: ${props.height}`);
    }

    return `Image.network(${params.join(', ')})`;
  }

  /**
   * Generate TextField widget
   * @param {object} props - Props object
   * @returns {string} Dart code
   */
  generateTextField(props) {
    const params = [];

    // Handle decoration (placeholder -> hintText)
    if (props.placeholder) {
      params.push(`decoration: InputDecoration(hintText: '${this.escapeString(props.placeholder)}')`);
    }

    // Handle onChange
    if (props.onChange) {
      params.push(`onChanged: (value) { /* ${props.onChange} */ }`);
    }

    if (params.length === 0) {
      return 'TextField()';
    }

    return `TextField(${params.join(', ')})`;
  }

  /**
   * Generate children array code
   * @param {array} children - Children nodes
   * @returns {string} Dart code for children array
   */
  generateChildren(children) {
    if (!children || children.length === 0) {
      return '[]';
    }

    const childrenCode = children.map(child => this.generateWidget(child));
    return `[${childrenCode.join(', ')}]`;
  }

  /**
   * Convert color value to Dart Color code using design tokens
   * @param {string} color - Color value (hex, rgb, or design token name)
   * @returns {string} Dart Color code
   */
  convertColor(color) {
    if (typeof color !== 'string') {
      return 'LumoraColors.black';
    }

    // Handle hex colors
    if (color.startsWith('#')) {
      const hex = color.substring(1);
      if (hex.length === 6) {
        return `Color(0xFF${hex})`;
      } else if (hex.length === 8) {
        return `Color(0x${hex})`;
      }
    }

    // Check for design token names first
    const lowerColor = color.toLowerCase().replace(/-/g, '').replace(/_/g, '');
    const tokenMap = {
      'primary': 'LumoraColors.primary',
      'primarylight': 'LumoraColors.primaryLight',
      'primarydark': 'LumoraColors.primaryDark',
      'secondary': 'LumoraColors.secondary',
      'secondarylight': 'LumoraColors.secondaryLight',
      'secondarydark': 'LumoraColors.secondaryDark',
      'background': 'LumoraColors.background',
      'backgrounddark': 'LumoraColors.backgroundDark',
      'surface': 'LumoraColors.surface',
      'surfacedark': 'LumoraColors.surfaceDark',
      'textprimary': 'LumoraColors.textPrimary',
      'textsecondary': 'LumoraColors.textSecondary',
      'texttertiary': 'LumoraColors.textTertiary',
      'textonprimary': 'LumoraColors.textOnPrimary',
      'textonsecondary': 'LumoraColors.textOnSecondary',
      'success': 'LumoraColors.success',
      'successlight': 'LumoraColors.successLight',
      'successdark': 'LumoraColors.successDark',
      'warning': 'LumoraColors.warning',
      'warninglight': 'LumoraColors.warningLight',
      'warningdark': 'LumoraColors.warningDark',
      'error': 'LumoraColors.error',
      'errorlight': 'LumoraColors.errorLight',
      'errordark': 'LumoraColors.errorDark',
      'info': 'LumoraColors.info',
      'infolight': 'LumoraColors.infoLight',
      'infodark': 'LumoraColors.infoDark',
      'border': 'LumoraColors.border',
      'borderdark': 'LumoraColors.borderDark',
      'transparent': 'LumoraColors.transparent',
      'black': 'LumoraColors.black',
      'white': 'LumoraColors.white'
    };

    if (tokenMap[lowerColor]) {
      return tokenMap[lowerColor];
    }

    // Fallback to standard Colors for common color names
    const colorMap = {
      'red': 'Colors.red',
      'blue': 'Colors.blue',
      'green': 'Colors.green',
      'yellow': 'Colors.yellow',
      'orange': 'Colors.orange',
      'purple': 'Colors.purple',
      'pink': 'Colors.pink',
      'grey': 'Colors.grey',
      'gray': 'Colors.grey'
    };

    return colorMap[lowerColor] || 'LumoraColors.black';
  }

  /**
   * Convert font weight value to Dart FontWeight
   * @param {string} fontWeight - Font weight value
   * @returns {string} Dart FontWeight code
   */
  convertFontWeight(fontWeight) {
    const weightMap = {
      'normal': 'FontWeight.normal',
      'bold': 'FontWeight.bold',
      '100': 'FontWeight.w100',
      '200': 'FontWeight.w200',
      '300': 'FontWeight.w300',
      '400': 'FontWeight.w400',
      '500': 'FontWeight.w500',
      '600': 'FontWeight.w600',
      '700': 'FontWeight.w700',
      '800': 'FontWeight.w800',
      '900': 'FontWeight.w900'
    };

    return weightMap[String(fontWeight)] || 'FontWeight.normal';
  }

  /**
   * Convert text align value to Dart TextAlign
   * @param {string} textAlign - Text align value
   * @returns {string} Dart TextAlign code
   */
  convertTextAlign(textAlign) {
    const alignMap = {
      'left': 'TextAlign.left',
      'center': 'TextAlign.center',
      'right': 'TextAlign.right',
      'justify': 'TextAlign.justify'
    };

    return alignMap[textAlign] || 'TextAlign.left';
  }

  /**
   * Convert axis value to Dart Axis
   * @param {string} axis - Axis value
   * @returns {string} Dart Axis code
   */
  convertAxis(axis) {
    const axisMap = {
      'horizontal': 'Axis.horizontal',
      'vertical': 'Axis.vertical'
    };

    return axisMap[axis] || 'Axis.vertical';
  }

  /**
   * Convert spacing value to Dart EdgeInsets using design tokens
   * @param {number|string} spacing - Spacing value or token name
   * @returns {string} Dart EdgeInsets code
   */
  convertSpacing(spacing) {
    if (typeof spacing === 'number') {
      return `EdgeInsets.all(${spacing})`;
    }

    if (typeof spacing === 'string') {
      const lowerSpacing = spacing.toLowerCase().replace(/-/g, '').replace(/_/g, '');
      
      const tokenMap = {
        'xs': 'LumoraSpacing.allXs',
        'sm': 'LumoraSpacing.allSm',
        'small': 'LumoraSpacing.allSm',
        'md': 'LumoraSpacing.allMd',
        'medium': 'LumoraSpacing.allMd',
        'lg': 'LumoraSpacing.allLg',
        'large': 'LumoraSpacing.allLg',
        'xl': 'LumoraSpacing.allXl',
        'xxl': 'LumoraSpacing.allXxl',
        'xxxl': 'LumoraSpacing.allXxxl',
        'zero': 'LumoraSpacing.zero',
        'none': 'LumoraSpacing.zero'
      };

      if (tokenMap[lowerSpacing]) {
        return tokenMap[lowerSpacing];
      }

      // Try to parse as number
      const numValue = parseFloat(spacing);
      if (!isNaN(numValue)) {
        return `EdgeInsets.all(${numValue})`;
      }
    }

    return 'EdgeInsets.zero';
  }

  /**
   * Convert typography token name to Dart TextStyle
   * @param {string} typography - Typography token name
   * @returns {string|null} Dart TextStyle code or null if not found
   */
  convertTypography(typography) {
    if (typeof typography !== 'string') {
      return null;
    }

    const lowerTypography = typography.toLowerCase().replace(/-/g, '').replace(/_/g, '');
    
    const tokenMap = {
      'displaylarge': 'LumoraTypography.displayLarge',
      'displaymedium': 'LumoraTypography.displayMedium',
      'displaysmall': 'LumoraTypography.displaySmall',
      'headlinelarge': 'LumoraTypography.headlineLarge',
      'h1': 'LumoraTypography.headlineLarge',
      'headlinemedium': 'LumoraTypography.headlineMedium',
      'h2': 'LumoraTypography.headlineMedium',
      'headlinesmall': 'LumoraTypography.headlineSmall',
      'h3': 'LumoraTypography.headlineSmall',
      'titlelarge': 'LumoraTypography.titleLarge',
      'h4': 'LumoraTypography.titleLarge',
      'titlemedium': 'LumoraTypography.titleMedium',
      'h5': 'LumoraTypography.titleMedium',
      'titlesmall': 'LumoraTypography.titleSmall',
      'h6': 'LumoraTypography.titleSmall',
      'bodylarge': 'LumoraTypography.bodyLarge',
      'body1': 'LumoraTypography.bodyLarge',
      'bodymedium': 'LumoraTypography.bodyMedium',
      'body': 'LumoraTypography.bodyMedium',
      'body2': 'LumoraTypography.bodyMedium',
      'bodysmall': 'LumoraTypography.bodySmall',
      'labellarge': 'LumoraTypography.labelLarge',
      'labelmedium': 'LumoraTypography.labelMedium',
      'labelsmall': 'LumoraTypography.labelSmall',
      'caption': 'LumoraTypography.caption',
      'captionsmall': 'LumoraTypography.captionSmall',
      'button': 'LumoraTypography.button',
      'buttonlarge': 'LumoraTypography.buttonLarge',
      'buttonsmall': 'LumoraTypography.buttonSmall'
    };

    return tokenMap[lowerTypography] || null;
  }

  /**
   * Escape string for Dart code
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  escapeString(str) {
    if (typeof str !== 'string') {
      return String(str);
    }
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
  }

  /**
   * Convert schema file to Dart widget code and return as string
   * @param {string} schemaPath - Path to schema JSON file
   * @param {string} mappingPath - Path to ui-mapping.json file
   * @returns {string} Dart widget code
   */
  convertFile(schemaPath, mappingPath) {
    // Load mapping
    this.loadMapping(mappingPath);

    // Load schema
    const schema = this.loadSchema(schemaPath);

    // Convert to Dart
    const dartCode = this.convertToDart(schema);

    return dartCode;
  }
}

module.exports = SchemaToDart;
