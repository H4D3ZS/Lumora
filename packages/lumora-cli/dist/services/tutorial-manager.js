"use strict";
/**
 * Tutorial Manager
 * Interactive tutorials for learning Lumora
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorialManager = void 0;
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
/**
 * Tutorial Manager
 */
class TutorialManager {
    constructor() {
        this.tutorials = new Map();
        this.currentStep = 0;
        this.currentTutorial = null;
        this.registerDefaultTutorials();
    }
    /**
     * Register default tutorials
     */
    registerDefaultTutorials() {
        this.tutorials.set('getting-started', this.createGettingStartedTutorial());
        this.tutorials.set('first-app', this.createFirstAppTutorial());
        this.tutorials.set('ota-updates', this.createOTAUpdatesTutorial());
        this.tutorials.set('native-modules', this.createNativeModulesTutorial());
        this.tutorials.set('state-management', this.createStateManagementTutorial());
        this.tutorials.set('building-production', this.createBuildingProductionTutorial());
    }
    /**
     * List all tutorials
     */
    listTutorials(category) {
        let tutorials = Array.from(this.tutorials.values());
        if (category) {
            tutorials = tutorials.filter(t => t.category === category);
        }
        return tutorials;
    }
    /**
     * Get tutorial by ID
     */
    getTutorial(id) {
        return this.tutorials.get(id);
    }
    /**
     * Start a tutorial
     */
    async startTutorial(tutorialId) {
        const tutorial = this.tutorials.get(tutorialId);
        if (!tutorial) {
            throw new Error(`Tutorial "${tutorialId}" not found`);
        }
        this.currentTutorial = tutorial;
        this.currentStep = 0;
        console.log(chalk_1.default.bold.cyan(`\n📚 ${tutorial.title}\n`));
        console.log(chalk_1.default.white(tutorial.description));
        console.log(chalk_1.default.gray(`\nDifficulty: ${tutorial.difficulty}`));
        console.log(chalk_1.default.gray(`Duration: ~${tutorial.duration} minutes`));
        console.log(chalk_1.default.gray(`Steps: ${tutorial.steps.length}\n`));
        if (tutorial.prerequisites.length > 0) {
            console.log(chalk_1.default.yellow('Prerequisites:'));
            tutorial.prerequisites.forEach(prereq => {
                console.log(chalk_1.default.gray(`  • ${prereq}`));
            });
            console.log('');
        }
        const { proceed } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'proceed',
                message: 'Ready to start?',
                default: true,
            },
        ]);
        if (!proceed) {
            console.log(chalk_1.default.yellow('\nTutorial cancelled\n'));
            return;
        }
        await this.runTutorial();
    }
    /**
     * Run the tutorial
     */
    async runTutorial() {
        if (!this.currentTutorial)
            return;
        while (this.currentStep < this.currentTutorial.steps.length) {
            await this.displayStep(this.currentTutorial.steps[this.currentStep]);
            const { action } = await inquirer_1.default.prompt([
                {
                    type: 'list',
                    name: 'action',
                    message: 'What would you like to do?',
                    choices: [
                        { name: 'Continue to next step', value: 'next' },
                        { name: 'Repeat current step', value: 'repeat' },
                        { name: 'Go back', value: 'back' },
                        { name: 'Exit tutorial', value: 'exit' },
                    ],
                },
            ]);
            switch (action) {
                case 'next':
                    this.currentStep++;
                    break;
                case 'repeat':
                    // Stay on current step
                    break;
                case 'back':
                    if (this.currentStep > 0) {
                        this.currentStep--;
                    }
                    break;
                case 'exit':
                    console.log(chalk_1.default.yellow('\nTutorial exited\n'));
                    return;
            }
        }
        // Tutorial completed
        this.displayCompletion();
    }
    /**
     * Display a tutorial step
     */
    async displayStep(step) {
        console.log(chalk_1.default.bold.cyan(`\n📝 Step ${this.currentStep + 1}/${this.currentTutorial.steps.length}: ${step.title}\n`));
        console.log(chalk_1.default.white(step.description));
        console.log('');
        // Show code example
        if (step.code) {
            console.log(chalk_1.default.cyan('Code:'));
            console.log(chalk_1.default.gray('─'.repeat(60)));
            console.log(step.code);
            console.log(chalk_1.default.gray('─'.repeat(60)));
            console.log('');
        }
        // Show code file
        if (step.codeFile) {
            console.log(chalk_1.default.cyan(`File: ${step.codeFile}`));
            console.log('');
        }
        // Show command
        if (step.command) {
            console.log(chalk_1.default.cyan('Run this command:'));
            console.log(chalk_1.default.green(`  $ ${step.command}`));
            console.log('');
        }
        // Show explanation
        if (step.explanation) {
            console.log(chalk_1.default.yellow('💡 Explanation:'));
            console.log(chalk_1.default.gray(step.explanation));
            console.log('');
        }
        // Show tips
        if (step.tips && step.tips.length > 0) {
            console.log(chalk_1.default.yellow('💡 Tips:'));
            step.tips.forEach(tip => {
                console.log(chalk_1.default.gray(`  • ${tip}`));
            });
            console.log('');
        }
        // Check condition
        if (step.checkCondition) {
            const passed = await step.checkCondition();
            if (passed) {
                console.log(chalk_1.default.green('✓ Step completed successfully!\n'));
            }
            else {
                console.log(chalk_1.default.yellow('⚠ Complete the step before continuing\n'));
            }
        }
    }
    /**
     * Display completion message
     */
    displayCompletion() {
        if (!this.currentTutorial?.completion)
            return;
        console.log(chalk_1.default.bold.green('\n🎉 Tutorial Completed!\n'));
        console.log(chalk_1.default.white(this.currentTutorial.completion.message));
        console.log('');
        if (this.currentTutorial.completion.nextSteps.length > 0) {
            console.log(chalk_1.default.cyan('Next Steps:'));
            this.currentTutorial.completion.nextSteps.forEach(step => {
                console.log(chalk_1.default.gray(`  • ${step}`));
            });
            console.log('');
        }
    }
    /**
     * Create Getting Started tutorial
     */
    createGettingStartedTutorial() {
        return {
            id: 'getting-started',
            title: 'Getting Started with Lumora',
            description: 'Learn the basics of Lumora framework and create your first project',
            category: 'getting-started',
            difficulty: 'beginner',
            duration: 10,
            prerequisites: ['Node.js installed', 'Flutter SDK installed'],
            steps: [
                {
                    title: 'Install Lumora CLI',
                    description: 'First, install the Lumora CLI globally using npm',
                    command: 'npm install -g lumora-cli',
                    explanation: 'The Lumora CLI provides commands to create, develop, and build your apps',
                    tips: [
                        'Make sure you have Node.js 16+ installed',
                        'Use "lumora --version" to verify installation',
                    ],
                },
                {
                    title: 'Create a New Project',
                    description: 'Create your first Lumora project using the blank template',
                    command: 'lumora init my-first-app',
                    explanation: 'This creates a new project with all necessary files and dependencies',
                    tips: [
                        'Choose "blank" template when prompted',
                        'The project will be created in a new directory',
                    ],
                },
                {
                    title: 'Navigate to Project',
                    description: 'Change into the project directory',
                    command: 'cd my-first-app',
                },
                {
                    title: 'Install Dependencies',
                    description: 'Install all required npm packages',
                    command: 'npm install',
                    explanation: 'This installs React, TypeScript, and other dependencies',
                },
                {
                    title: 'Start Development Server',
                    description: 'Start the Lumora development server',
                    command: 'lumora start',
                    explanation: 'This starts the dev server with hot reload and automatic Flutter conversion',
                    tips: [
                        'The server will show a QR code',
                        'Open the Flutter app to scan the QR code',
                        'Changes to React code update Flutter in real-time',
                    ],
                },
            ],
            completion: {
                message: 'Congratulations! You\'ve set up your first Lumora project.',
                nextSteps: [
                    'Try the "first-app" tutorial to build something',
                    'Explore the starter templates with "lumora template list"',
                    'Read the documentation at docs.lumora.dev',
                ],
            },
        };
    }
    /**
     * Create First App tutorial
     */
    createFirstAppTutorial() {
        return {
            id: 'first-app',
            title: 'Build Your First App',
            description: 'Create a simple counter app with state management',
            category: 'getting-started',
            difficulty: 'beginner',
            duration: 15,
            prerequisites: ['Completed getting-started tutorial', 'Basic React knowledge'],
            steps: [
                {
                    title: 'Create App Component',
                    description: 'Create a new App.tsx file with a counter component',
                    codeFile: 'src/App.tsx',
                    code: `import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Counter App</Text>
      <Text style={styles.count}>{count}</Text>
      <Button title="Increment" onPress={() => setCount(count + 1)} />
      <Button title="Decrement" onPress={() => setCount(count - 1)} />
      <Button title="Reset" onPress={() => setCount(0)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  count: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 30,
  },
});`,
                    explanation: 'This uses React hooks for state management. Lumora automatically converts this to Flutter!',
                    tips: [
                        'The View component becomes a Flutter Container',
                        'Text becomes Flutter Text widget',
                        'Button becomes Flutter ElevatedButton',
                        'StyleSheet becomes Flutter styling',
                    ],
                },
                {
                    title: 'See It in Action',
                    description: 'Save the file and watch the Flutter app update automatically',
                    explanation: 'Lumora detects the change and updates the Flutter UI in real-time',
                    tips: [
                        'No need to rebuild - hot reload is automatic',
                        'Try changing the styles or text',
                        'The state persists during hot reload',
                    ],
                },
                {
                    title: 'Add More Features',
                    description: 'Enhance the counter with a step size control',
                    code: `const [count, setCount] = useState(0);
const [step, setStep] = useState(1);

// Update buttons to use step
<Button title="Increment" onPress={() => setCount(count + step)} />
<Button title="Decrement" onPress={() => setCount(count - step)} />

// Add step controls
<Text>Step: {step}</Text>
<Button title="Step +1" onPress={() => setStep(step + 1)} />
<Button title="Step -1" onPress={() => setStep(Math.max(1, step - 1))} />`,
                    tips: [
                        'You can have multiple state variables',
                        'State updates trigger re-renders automatically',
                    ],
                },
            ],
            completion: {
                message: 'Great job! You\'ve built a fully functional counter app with React that runs on Flutter.',
                nextSteps: [
                    'Try the "state-management" tutorial for advanced patterns',
                    'Explore the "todo-list" template',
                    'Learn about styling and animations',
                ],
            },
        };
    }
    /**
     * Create OTA Updates tutorial
     */
    createOTAUpdatesTutorial() {
        return {
            id: 'ota-updates',
            title: 'Deploy OTA Updates',
            description: 'Learn how to publish over-the-air updates to your app',
            category: 'intermediate',
            difficulty: 'intermediate',
            duration: 20,
            prerequisites: ['Deployed app', 'Lumora account'],
            steps: [
                {
                    title: 'Make Changes to Your App',
                    description: 'Update your app code - change text, styling, or functionality',
                    explanation: 'OTA updates allow you to push changes without rebuilding the entire app',
                },
                {
                    title: 'Publish Update',
                    description: 'Publish your changes to the update server',
                    command: 'lumora publish --channel production',
                    explanation: 'This bundles your changes and uploads them to the OTA server',
                    tips: [
                        'Use --channel to target specific deployment channels',
                        'Add a release message with --message',
                        'Set rollout percentage with --rollout',
                    ],
                },
                {
                    title: 'View Update Status',
                    description: 'Check the status of your update deployment',
                    command: 'lumora updates list',
                    explanation: 'See all published updates and their deployment status',
                },
                {
                    title: 'Monitor Rollout',
                    description: 'Watch as users download the update',
                    command: 'lumora updates stats',
                    explanation: 'View download statistics and success rates',
                },
                {
                    title: 'Rollback if Needed',
                    description: 'If there are issues, rollback to a previous version',
                    command: 'lumora updates rollback <update-id>',
                    explanation: 'Instantly revert all users to a previous working version',
                },
            ],
            completion: {
                message: 'You\'ve mastered OTA updates! You can now deploy changes instantly.',
                nextSteps: [
                    'Set up multiple deployment channels (dev, staging, production)',
                    'Configure automatic update checks',
                    'Implement update notifications in your app',
                ],
            },
        };
    }
    /**
     * Create Native Modules tutorial
     */
    createNativeModulesTutorial() {
        return {
            id: 'native-modules',
            title: 'Using Native Modules',
            description: 'Add native functionality like camera, location, and notifications',
            category: 'intermediate',
            difficulty: 'intermediate',
            duration: 25,
            prerequisites: ['Basic Lumora project'],
            steps: [
                {
                    title: 'Browse Available Modules',
                    description: 'See all available native modules',
                    command: 'lumora plugin search',
                    explanation: 'Lumora provides modules similar to Expo - camera, location, notifications, etc.',
                },
                {
                    title: 'Install Camera Module',
                    description: 'Add the camera module to your project',
                    command: 'lumora plugin add @lumora/camera',
                    explanation: 'This installs the module and links it to your Flutter project',
                },
                {
                    title: 'Use Camera in Your App',
                    description: 'Import and use the camera module',
                    code: `import { Camera } from '@lumora/camera';

async function takePicture() {
  const photo = await Camera.takePicture({
    quality: 0.8,
    width: 1920,
    height: 1080,
  });

  console.log('Photo saved:', photo.uri);
  return photo;
}`,
                    explanation: 'The camera module provides a simple async API for taking photos',
                    tips: [
                        'Request permissions before using camera',
                        'Handle errors with try/catch',
                        'Photos are saved to the device automatically',
                    ],
                },
                {
                    title: 'Add Location Tracking',
                    description: 'Install and use the location module',
                    command: 'lumora plugin add @lumora/location',
                    code: `import { Location } from '@lumora/location';

async function getCurrentLocation() {
  const location = await Location.getCurrentPosition({
    accuracy: 'high',
  });

  console.log(location.latitude, location.longitude);
}

// Watch location changes
Location.watchPosition(
  (position) => console.log('New position:', position),
  (error) => console.error('Location error:', error),
  { accuracy: 'high', distanceFilter: 10 }
);`,
                    tips: [
                        'Always request location permissions',
                        'Use watchPosition for continuous tracking',
                        'Remember to remove listeners when done',
                    ],
                },
                {
                    title: 'Add Push Notifications',
                    description: 'Set up push notifications',
                    command: 'lumora plugin add @lumora/notifications',
                    code: `import { Notifications } from '@lumora/notifications';

// Request permission
await Notifications.requestPermissions();

// Schedule local notification
await Notifications.scheduleNotification({
  title: 'Hello!',
  body: 'This is a notification',
  trigger: {
    seconds: 5,
  },
});

// Listen for notifications
Notifications.addListener('received', (notification) => {
  console.log('Notification received:', notification);
});`,
                },
            ],
            completion: {
                message: 'You\'re now using native device features in your Lumora app!',
                nextSteps: [
                    'Explore other modules: secure-store, filesystem, device',
                    'Build a camera app with the camera-app template',
                    'Learn about permission handling',
                ],
            },
        };
    }
    /**
     * Create State Management tutorial
     */
    createStateManagementTutorial() {
        return {
            id: 'state-management',
            title: 'Advanced State Management',
            description: 'Master complex state with useReducer, Context, and Redux',
            category: 'advanced',
            difficulty: 'advanced',
            duration: 30,
            prerequisites: ['React useState knowledge', 'Understanding of React Context'],
            steps: [
                {
                    title: 'Using useReducer',
                    description: 'Learn useReducer for complex state logic',
                    code: `import { useReducer } from 'react';

type State = {
  count: number;
  history: number[];
};

type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'reset' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment':
      return {
        count: state.count + 1,
        history: [...state.history, state.count + 1],
      };
    case 'decrement':
      return {
        count: state.count - 1,
        history: [...state.history, state.count - 1],
      };
    case 'reset':
      return { count: 0, history: [] };
    default:
      return state;
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, {
    count: 0,
    history: [],
  });

  // Use dispatch to update state
}`,
                    explanation: 'Lumora converts useReducer to Flutter Bloc pattern automatically',
                },
                {
                    title: 'Global State with Context',
                    description: 'Share state across components with Context',
                    code: `import { createContext, useContext, useReducer } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  return useContext(AppContext);
}`,
                    explanation: 'Context becomes Provider pattern in Flutter',
                },
                {
                    title: 'Redux Integration',
                    description: 'Use Redux for predictable state management',
                    code: `import { createStore } from 'redux';
import { Provider, useSelector, useDispatch } from 'react-redux';

const store = createStore(rootReducer);

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

function Counter() {
  const count = useSelector((state) => state.count);
  const dispatch = useDispatch();

  return (
    <View>
      <Text>{count}</Text>
      <Button onPress={() => dispatch({ type: 'INCREMENT' })} />
    </View>
  );
}`,
                    explanation: 'Redux becomes Redux for Flutter with automatic conversion',
                },
            ],
            completion: {
                message: 'You\'ve mastered advanced state management patterns in Lumora!',
                nextSteps: [
                    'Try the e-commerce template for complex state',
                    'Learn about state persistence',
                    'Explore MobX for reactive state',
                ],
            },
        };
    }
    /**
     * Create Building for Production tutorial
     */
    createBuildingProductionTutorial() {
        return {
            id: 'building-production',
            title: 'Building for Production',
            description: 'Build and deploy your app to the App Store and Play Store',
            category: 'advanced',
            difficulty: 'advanced',
            duration: 45,
            prerequisites: ['Completed app', 'Developer accounts'],
            steps: [
                {
                    title: 'Generate App Assets',
                    description: 'Create app icons and screenshots',
                    command: 'lumora store generate-assets',
                    explanation: 'This creates all required icons for iOS and Android',
                    tips: [
                        'Provide a high-res icon (1024x1024)',
                        'Generate screenshots for all device sizes',
                    ],
                },
                {
                    title: 'Configure App Metadata',
                    description: 'Set up app name, description, keywords',
                    command: 'lumora store metadata',
                    explanation: 'This creates template metadata files for both stores',
                },
                {
                    title: 'Build iOS App',
                    description: 'Create iOS production build',
                    command: 'lumora build --platform ios --release',
                    explanation: 'This creates an IPA file for App Store submission',
                    tips: [
                        'Configure signing in Xcode',
                        'Set up provisioning profiles',
                        'Test on real devices first',
                    ],
                },
                {
                    title: 'Build Android App',
                    description: 'Create Android production build',
                    command: 'lumora build --platform android --release',
                    explanation: 'This creates AAB and APK files for Play Store',
                    tips: [
                        'Configure signing key in android/app/build.gradle',
                        'Test with internal testing track first',
                    ],
                },
                {
                    title: 'Test Production Build',
                    description: 'Thoroughly test the production builds',
                    explanation: 'Test all features, check performance, verify OTA updates work',
                    tips: [
                        'Test on multiple devices',
                        'Check app size and performance',
                        'Verify all permissions work',
                        'Test OTA update mechanism',
                    ],
                },
                {
                    title: 'Submit to Stores',
                    description: 'Upload to App Store Connect and Play Console',
                    explanation: 'Follow platform-specific submission guidelines',
                    tips: [
                        'Prepare screenshots and description',
                        'Set up privacy policy',
                        'Fill out questionnaires carefully',
                        'Allow time for review (1-7 days)',
                    ],
                },
            ],
            completion: {
                message: 'Congratulations! Your app is ready for the world!',
                nextSteps: [
                    'Monitor crash reports and analytics',
                    'Use OTA updates for quick fixes',
                    'Gather user feedback',
                    'Plan next features',
                ],
            },
        };
    }
}
exports.TutorialManager = TutorialManager;
//# sourceMappingURL=tutorial-manager.js.map