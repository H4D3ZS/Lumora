/**
 * State Management Pattern Detector
 * Detects and classifies state management patterns in React and Flutter code
 */

class StateManagementDetector {
  constructor() {
    this.patterns = {
      react: {
        redux: ['useSelector', 'useDispatch', 'connect', 'Provider', 'createStore'],
        mobx: ['observer', 'observable', 'action', 'makeObservable'],
        recoil: ['useRecoilState', 'useRecoilValue', 'useSetRecoilState', 'atom', 'selector'],
        zustand: ['create', 'useStore'],
        jotai: ['atom', 'useAtom', 'useAtomValue', 'useSetAtom']
      },
      flutter: {
        bloc: ['BlocProvider', 'BlocBuilder', 'BlocListener', 'Bloc', 'Cubit'],
        riverpod: ['ProviderScope', 'ConsumerWidget', 'StateNotifier', 'Provider'],
        provider: ['ChangeNotifierProvider', 'Consumer', 'ChangeNotifier'],
        getx: ['GetX', 'Obx', 'GetBuilder', 'GetxController']
      }
    };
  }

  /**
   * Detect state management pattern in React code
   * @param {string} code - React code
   * @param {object} metadata - Component metadata
   * @returns {object} Detection result
   */
  detectReactPattern(code, metadata) {
    const result = {
      pattern: 'useState', // default
      confidence: 0,
      features: []
    };

    // Check for Redux
    if (this.containsPatterns(code, this.patterns.react.redux)) {
      result.pattern = 'redux';
      result.confidence = this.calculateConfidence(code, this.patterns.react.redux);
      result.features = this.extractReduxFeatures(code, metadata);
      return result;
    }

    // Check for MobX
    if (this.containsPatterns(code, this.patterns.react.mobx)) {
      result.pattern = 'mobx';
      result.confidence = this.calculateConfidence(code, this.patterns.react.mobx);
      result.features = this.extractMobXFeatures(code, metadata);
      return result;
    }

    // Check for Recoil
    if (this.containsPatterns(code, this.patterns.react.recoil)) {
      result.pattern = 'recoil';
      result.confidence = this.calculateConfidence(code, this.patterns.react.recoil);
      result.features = this.extractRecoilFeatures(code, metadata);
      return result;
    }

    // Check for Zustand
    if (this.containsPatterns(code, this.patterns.react.zustand)) {
      result.pattern = 'zustand';
      result.confidence = this.calculateConfidence(code, this.patterns.react.zustand);
      result.features = this.extractZustandFeatures(code, metadata);
      return result;
    }

    // Check for Jotai
    if (this.containsPatterns(code, this.patterns.react.jotai)) {
      result.pattern = 'jotai';
      result.confidence = this.calculateConfidence(code, this.patterns.react.jotai);
      result.features = this.extractJotaiFeatures(code, metadata);
      return result;
    }

    // Default to useState if no complex pattern detected
    result.confidence = 1.0;
    return result;
  }

  /**
   * Detect state management pattern in Flutter code
   * @param {string} code - Flutter code
   * @param {object} metadata - Widget metadata
   * @returns {object} Detection result
   */
  detectFlutterPattern(code, metadata) {
    const result = {
      pattern: 'setState', // default
      confidence: 0,
      features: []
    };

    // Check for Bloc
    if (this.containsPatterns(code, this.patterns.flutter.bloc)) {
      result.pattern = 'bloc';
      result.confidence = this.calculateConfidence(code, this.patterns.flutter.bloc);
      result.features = this.extractBlocFeatures(code, metadata);
      return result;
    }

    // Check for Riverpod
    if (this.containsPatterns(code, this.patterns.flutter.riverpod)) {
      result.pattern = 'riverpod';
      result.confidence = this.calculateConfidence(code, this.patterns.flutter.riverpod);
      result.features = this.extractRiverpodFeatures(code, metadata);
      return result;
    }

    // Check for Provider
    if (this.containsPatterns(code, this.patterns.flutter.provider)) {
      result.pattern = 'provider';
      result.confidence = this.calculateConfidence(code, this.patterns.flutter.provider);
      result.features = this.extractProviderFeatures(code, metadata);
      return result;
    }

    // Check for GetX
    if (this.containsPatterns(code, this.patterns.flutter.getx)) {
      result.pattern = 'getx';
      result.confidence = this.calculateConfidence(code, this.patterns.flutter.getx);
      result.features = this.extractGetXFeatures(code, metadata);
      return result;
    }

    // Default to setState if no complex pattern detected
    result.confidence = 1.0;
    return result;
  }

  /**
   * Check if code contains patterns
   * @param {string} code - Code to check
   * @param {array} patterns - Array of pattern strings
   * @returns {boolean} True if patterns found
   */
  containsPatterns(code, patterns) {
    return patterns.some(pattern => code.includes(pattern));
  }

  /**
   * Calculate confidence score based on pattern matches
   * @param {string} code - Code to analyze
   * @param {array} patterns - Array of pattern strings
   * @returns {number} Confidence score (0-1)
   */
  calculateConfidence(code, patterns) {
    const matches = patterns.filter(pattern => code.includes(pattern)).length;
    return Math.min(matches / patterns.length, 1.0);
  }

  /**
   * Extract Redux features from code
   * @param {string} code - React code
   * @param {object} metadata - Component metadata
   * @returns {array} Array of features
   */
  extractReduxFeatures(code, metadata) {
    const features = [];

    if (code.includes('useSelector')) {
      features.push({ type: 'selector', name: 'useSelector' });
    }

    if (code.includes('useDispatch')) {
      features.push({ type: 'dispatch', name: 'useDispatch' });
    }

    if (code.includes('connect')) {
      features.push({ type: 'hoc', name: 'connect' });
    }

    return features;
  }

  /**
   * Extract MobX features from code
   * @param {string} code - React code
   * @param {object} metadata - Component metadata
   * @returns {array} Array of features
   */
  extractMobXFeatures(code, metadata) {
    const features = [];

    if (code.includes('observer')) {
      features.push({ type: 'observer', name: 'observer' });
    }

    if (code.includes('observable')) {
      features.push({ type: 'observable', name: 'observable' });
    }

    return features;
  }

  /**
   * Extract Recoil features from code
   * @param {string} code - React code
   * @param {object} metadata - Component metadata
   * @returns {array} Array of features
   */
  extractRecoilFeatures(code, metadata) {
    const features = [];

    if (code.includes('useRecoilState')) {
      features.push({ type: 'state', name: 'useRecoilState' });
    }

    if (code.includes('atom')) {
      features.push({ type: 'atom', name: 'atom' });
    }

    return features;
  }

  /**
   * Extract Zustand features from code
   * @param {string} code - React code
   * @param {object} metadata - Component metadata
   * @returns {array} Array of features
   */
  extractZustandFeatures(code, metadata) {
    const features = [];

    if (code.includes('create')) {
      features.push({ type: 'store', name: 'create' });
    }

    return features;
  }

  /**
   * Extract Jotai features from code
   * @param {string} code - React code
   * @param {object} metadata - Component metadata
   * @returns {array} Array of features
   */
  extractJotaiFeatures(code, metadata) {
    const features = [];

    if (code.includes('useAtom')) {
      features.push({ type: 'atom', name: 'useAtom' });
    }

    return features;
  }

  /**
   * Extract Bloc features from code
   * @param {string} code - Flutter code
   * @param {object} metadata - Widget metadata
   * @returns {array} Array of features
   */
  extractBlocFeatures(code, metadata) {
    const features = [];

    if (code.includes('BlocProvider')) {
      features.push({ type: 'provider', name: 'BlocProvider' });
    }

    if (code.includes('BlocBuilder')) {
      features.push({ type: 'builder', name: 'BlocBuilder' });
    }

    if (code.includes('BlocListener')) {
      features.push({ type: 'listener', name: 'BlocListener' });
    }

    return features;
  }

  /**
   * Extract Riverpod features from code
   * @param {string} code - Flutter code
   * @param {object} metadata - Widget metadata
   * @returns {array} Array of features
   */
  extractRiverpodFeatures(code, metadata) {
    const features = [];

    if (code.includes('ConsumerWidget')) {
      features.push({ type: 'consumer', name: 'ConsumerWidget' });
    }

    if (code.includes('StateNotifier')) {
      features.push({ type: 'notifier', name: 'StateNotifier' });
    }

    return features;
  }

  /**
   * Extract Provider features from code
   * @param {string} code - Flutter code
   * @param {object} metadata - Widget metadata
   * @returns {array} Array of features
   */
  extractProviderFeatures(code, metadata) {
    const features = [];

    if (code.includes('ChangeNotifierProvider')) {
      features.push({ type: 'provider', name: 'ChangeNotifierProvider' });
    }

    if (code.includes('Consumer')) {
      features.push({ type: 'consumer', name: 'Consumer' });
    }

    return features;
  }

  /**
   * Extract GetX features from code
   * @param {string} code - Flutter code
   * @param {object} metadata - Widget metadata
   * @returns {array} Array of features
   */
  extractGetXFeatures(code, metadata) {
    const features = [];

    if (code.includes('GetX')) {
      features.push({ type: 'reactive', name: 'GetX' });
    }

    if (code.includes('Obx')) {
      features.push({ type: 'reactive', name: 'Obx' });
    }

    if (code.includes('GetxController')) {
      features.push({ type: 'controller', name: 'GetxController' });
    }

    return features;
  }

  /**
   * Map React pattern to Flutter equivalent
   * @param {string} reactPattern - React state management pattern
   * @returns {string} Flutter equivalent pattern
   */
  mapReactToFlutter(reactPattern) {
    const mapping = {
      'redux': 'bloc',
      'mobx': 'provider',
      'recoil': 'riverpod',
      'zustand': 'riverpod',
      'jotai': 'riverpod',
      'useState': 'setState'
    };

    return mapping[reactPattern] || 'setState';
  }

  /**
   * Map Flutter pattern to React equivalent
   * @param {string} flutterPattern - Flutter state management pattern
   * @returns {string} React equivalent pattern
   */
  mapFlutterToReact(flutterPattern) {
    const mapping = {
      'bloc': 'redux',
      'riverpod': 'recoil',
      'provider': 'mobx',
      'getx': 'zustand',
      'setState': 'useState'
    };

    return mapping[flutterPattern] || 'useState';
  }
}

module.exports = StateManagementDetector;
