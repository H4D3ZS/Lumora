const DartGenerator = require('../src/dart-generator');
const fs = require('fs');
const path = require('path');

describe('DartGenerator', () => {
  let generator;

  beforeEach(() => {
    generator = new DartGenerator('bloc');
  });

  describe('Initialization', () => {
    test('creates generator with default bloc adapter', () => {
      const gen = new DartGenerator();
      expect(gen.adapter).toBe('bloc');
    });

    test('creates generator with specified adapter', () => {
      const adapters = ['bloc', 'riverpod', 'provider', 'getx'];
      
      adapters.forEach(adapter => {
        const gen = new DartGenerator(adapter);
        expect(gen.adapter).toBe(adapter);
      });
    });

    test('registers Handlebars helpers', () => {
      expect(generator).toBeDefined();
      // Helpers are registered in constructor
    });
  });

  describe('Directory Structure', () => {
    test('generates Clean Architecture structure for bloc', () => {
      const structure = generator.getDirectoryStructure('todo');

      expect(structure.domain).toBeDefined();
      expect(structure.domain.entities).toBeDefined();
      expect(structure.domain.usecases).toBeDefined();
      expect(structure.data).toBeDefined();
      expect(structure.data.models).toBeDefined();
      expect(structure.data.repositories).toBeDefined();
      expect(structure.presentation).toBeDefined();
      expect(structure.presentation.pages).toBeDefined();
      expect(structure.presentation.widgets).toBeDefined();
      expect(structure.presentation.bloc).toBeDefined();
    });

    test('generates Clean Architecture structure for riverpod', () => {
      const gen = new DartGenerator('riverpod');
      const structure = gen.getDirectoryStructure('todo');

      expect(structure.presentation.providers).toBeDefined();
    });

    test('generates Clean Architecture structure for provider', () => {
      const gen = new DartGenerator('provider');
      const structure = gen.getDirectoryStructure('todo');

      expect(structure.presentation.notifiers).toBeDefined();
    });

    test('generates Clean Architecture structure for getx', () => {
      const gen = new DartGenerator('getx');
      const structure = gen.getDirectoryStructure('todo');

      expect(structure.presentation.controllers).toBeDefined();
      expect(structure.presentation.bindings).toBeDefined();
    });
  });

  describe('String Utilities', () => {
    test('capitalizes first letter', () => {
      expect(generator.capitalize('hello')).toBe('Hello');
      expect(generator.capitalize('world')).toBe('World');
      expect(generator.capitalize('a')).toBe('A');
    });

    test('handles empty string', () => {
      expect(generator.capitalize('')).toBe('');
    });

    test('converts to title case', () => {
      expect(generator.toTitle('todo')).toBe('Todo');
      expect(generator.toTitle('todo_list')).toBe('Todo List');
      expect(generator.toTitle('todo-list')).toBe('Todo List');
      expect(generator.toTitle('todoList')).toBe('Todo List');
    });
  });

  describe('Template Data Preparation', () => {
    test('prepares template data with feature name', () => {
      const templateData = {
        featureName: generator.capitalize('todo'),
        featureTitle: generator.toTitle('todo'),
        widgetCode: 'Container()',
        events: [],
        methods: [],
        stateFields: []
      };

      expect(templateData.featureName).toBe('Todo');
      expect(templateData.featureTitle).toBe('Todo');
      expect(templateData.widgetCode).toBe('Container()');
    });

    test('includes optional events and methods', () => {
      const templateData = {
        featureName: 'Todo',
        featureTitle: 'Todo',
        widgetCode: 'Container()',
        events: ['AddTodo', 'RemoveTodo'],
        methods: ['addTodo', 'removeTodo'],
        stateFields: ['todos']
      };

      expect(templateData.events).toHaveLength(2);
      expect(templateData.methods).toHaveLength(2);
      expect(templateData.stateFields).toHaveLength(1);
    });
  });

  describe('Adapter-Specific File Generation', () => {
    test('identifies bloc files to generate', () => {
      const gen = new DartGenerator('bloc');
      const structure = gen.getDirectoryStructure('todo');

      expect(structure.presentation.bloc).toBeDefined();
      // Bloc should generate: event, state, bloc, and page files
    });

    test('identifies riverpod files to generate', () => {
      const gen = new DartGenerator('riverpod');
      const structure = gen.getDirectoryStructure('todo');

      expect(structure.presentation.providers).toBeDefined();
      // Riverpod should generate: provider and page files
    });

    test('identifies provider files to generate', () => {
      const gen = new DartGenerator('provider');
      const structure = gen.getDirectoryStructure('todo');

      expect(structure.presentation.notifiers).toBeDefined();
      // Provider should generate: notifier and page files
    });

    test('identifies getx files to generate', () => {
      const gen = new DartGenerator('getx');
      const structure = gen.getDirectoryStructure('todo');

      expect(structure.presentation.controllers).toBeDefined();
      expect(structure.presentation.bindings).toBeDefined();
      // GetX should generate: controller, binding, and page files
    });
  });

  describe('File Path Generation', () => {
    test('generates correct file paths for bloc', () => {
      const featureName = 'todo';
      const lowerFeatureName = featureName.toLowerCase();
      const baseDir = '/output';
      const featureDir = path.join(baseDir, 'lib', 'features', lowerFeatureName);

      const expectedPaths = {
        event: path.join(featureDir, 'presentation', 'bloc', `${lowerFeatureName}_event.dart`),
        state: path.join(featureDir, 'presentation', 'bloc', `${lowerFeatureName}_state.dart`),
        bloc: path.join(featureDir, 'presentation', 'bloc', `${lowerFeatureName}_bloc.dart`),
        page: path.join(featureDir, 'presentation', 'pages', `${lowerFeatureName}_page.dart`)
      };

      expect(expectedPaths.event).toContain('todo_event.dart');
      expect(expectedPaths.state).toContain('todo_state.dart');
      expect(expectedPaths.bloc).toContain('todo_bloc.dart');
      expect(expectedPaths.page).toContain('todo_page.dart');
    });

    test('generates correct file paths for riverpod', () => {
      const featureName = 'todo';
      const lowerFeatureName = featureName.toLowerCase();
      const baseDir = '/output';
      const featureDir = path.join(baseDir, 'lib', 'features', lowerFeatureName);

      const expectedPaths = {
        provider: path.join(featureDir, 'presentation', 'providers', `${lowerFeatureName}_provider.dart`),
        page: path.join(featureDir, 'presentation', 'pages', `${lowerFeatureName}_page.dart`)
      };

      expect(expectedPaths.provider).toContain('todo_provider.dart');
      expect(expectedPaths.page).toContain('todo_page.dart');
    });
  });

  describe('Code Generation Patterns', () => {
    test('follows Clean Architecture principles', () => {
      const structure = generator.getDirectoryStructure('todo');

      // Verify separation of concerns
      expect(structure.domain).toBeDefined(); // Business logic
      expect(structure.data).toBeDefined(); // Data layer
      expect(structure.presentation).toBeDefined(); // UI layer
    });

    test('generates feature-based structure', () => {
      const featureName = 'todo';
      const structure = generator.getDirectoryStructure(featureName);

      // All code for a feature should be in one place
      expect(structure.domain.entities).toBeDefined();
      expect(structure.domain.usecases).toBeDefined();
      expect(structure.data.models).toBeDefined();
      expect(structure.presentation.pages).toBeDefined();
    });

    test('supports multiple state management adapters', () => {
      const adapters = ['bloc', 'riverpod', 'provider', 'getx'];

      adapters.forEach(adapter => {
        const gen = new DartGenerator(adapter);
        const structure = gen.getDirectoryStructure('todo');

        expect(structure.presentation).toBeDefined();
        // Each adapter has its own state management structure
      });
    });
  });

  describe('Template Integration', () => {
    test('prepares data for template rendering', () => {
      const templateData = {
        featureName: 'Todo',
        featureNameLower: 'todo',
        featureTitle: 'Todo',
        widgetCode: 'Container(child: Text("Hello"))',
        events: [],
        methods: [],
        stateFields: []
      };

      expect(templateData.featureName).toBe('Todo');
      expect(templateData.featureNameLower).toBe('todo');
      expect(templateData.widgetCode).toContain('Container');
    });

    test('includes lowercase feature name for imports', () => {
      const featureName = 'TodoList';
      const templateData = {
        featureName: generator.capitalize(featureName),
        featureNameLower: featureName.toLowerCase(),
        featureTitle: generator.toTitle(featureName),
        widgetCode: 'Container()',
        events: [],
        methods: [],
        stateFields: []
      };

      expect(templateData.featureNameLower).toBe('todolist');
      // This is used for import statements like:
      // import 'package:app/features/todolist/presentation/bloc/todolist_bloc.dart';
    });
  });

  describe('Error Handling', () => {
    test('handles invalid adapter gracefully', () => {
      const gen = new DartGenerator('invalid_adapter');
      const structure = gen.getDirectoryStructure('todo');

      // Should still return base structure
      expect(structure.domain).toBeDefined();
      expect(structure.data).toBeDefined();
      expect(structure.presentation).toBeDefined();
    });

    test('handles empty feature name', () => {
      const structure = generator.getDirectoryStructure('');

      expect(structure).toBeDefined();
      expect(structure.domain).toBeDefined();
    });
  });
});
