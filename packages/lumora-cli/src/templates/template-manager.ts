/**
 * Template Manager
 * Manages project templates for quick start
 */

import * as fs from 'fs-extra';
import * as path from 'path';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'basic' | 'navigation' | 'auth' | 'data' | 'ui' | 'advanced';
  features: string[];
  dependencies: Record<string, string>;
  files: TemplateFile[];
}

export interface TemplateFile {
  path: string;
  content: string;
}

/**
 * Template Manager
 */
export class TemplateManager {
  private templates: Map<string, Template> = new Map();

  constructor() {
    this.registerDefaultTemplates();
  }

  /**
   * Register default templates
   */
  private registerDefaultTemplates() {
    this.templates.set('blank', this.createBlankTemplate());
    this.templates.set('tabs', this.createTabsTemplate());
    this.templates.set('drawer', this.createDrawerTemplate());
    this.templates.set('auth', this.createAuthTemplate());
    this.templates.set('camera-app', this.createCameraAppTemplate());
    this.templates.set('todo-list', this.createTodoListTemplate());
    this.templates.set('weather-app', this.createWeatherAppTemplate());
    this.templates.set('social-feed', this.createSocialFeedTemplate());
    this.templates.set('e-commerce', this.createECommerceTemplate());
    this.templates.set('chat-app', this.createChatAppTemplate());
    this.templates.set('music-player', this.createMusicPlayerTemplate());
    this.templates.set('fitness-tracker', this.createFitnessTrackerTemplate());
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): Template | undefined {
    return this.templates.get(id);
  }

  /**
   * List all templates
   */
  listTemplates(): Template[] {
    return Array.from(this.templates.values());
  }

  /**
   * Create project from template
   */
  async createFromTemplate(templateId: string, projectPath: string, projectName: string): Promise<void> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    await fs.ensureDir(projectPath);

    // Create all template files
    for (const file of template.files) {
      const filePath = path.join(projectPath, file.path);
      const content = file.content
        .replace(/{{PROJECT_NAME}}/g, projectName)
        .replace(/{{PROJECT_NAME_PASCAL}}/g, this.toPascalCase(projectName));

      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, content);
    }

    // Create package.json
    await this.createPackageJson(projectPath, projectName, template);

    // Create lumora.config.json
    await this.createLumoraConfig(projectPath, projectName, template);
  }

  /**
   * Create package.json
   */
  private async createPackageJson(
    projectPath: string,
    projectName: string,
    template: Template
  ): Promise<void> {
    const packageJson = {
      name: projectName,
      version: '1.0.0',
      description: `A Lumora project based on ${template.name} template`,
      main: 'src/index.tsx',
      scripts: {
        start: 'lumora start',
        build: 'lumora build',
        test: 'jest',
      },
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        ...template.dependencies,
      },
      devDependencies: {
        typescript: '^5.0.0',
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
      },
    };

    await fs.writeFile(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
  }

  /**
   * Create lumora.config.json
   */
  private async createLumoraConfig(
    projectPath: string,
    projectName: string,
    template: Template
  ): Promise<void> {
    const config = {
      name: projectName,
      description: `A Lumora project based on ${template.name} template`,
      version: '1.0.0',
      platforms: ['ios', 'android', 'web'],
      ios: {
        bundleIdentifier: `com.example.${projectName.toLowerCase()}`,
      },
      android: {
        package: `com.example.${projectName.toLowerCase()}`,
      },
    };

    await fs.writeFile(
      path.join(projectPath, 'lumora.config.json'),
      JSON.stringify(config, null, 2)
    );
  }

  // Template Definitions

  private createBlankTemplate(): Template {
    return {
      id: 'blank',
      name: 'Blank',
      description: 'A minimal template with no pre-configured screens',
      category: 'basic',
      features: ['Basic structure', 'TypeScript support'],
      dependencies: {},
      files: [
        {
          path: 'src/App.tsx',
          content: `import React from 'react';

export default function App() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Welcome to {{PROJECT_NAME}}!</h1>
      <p>Start building your app here.</p>
    </div>
  );
}
`,
        },
        {
          path: 'src/index.tsx',
          content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
        },
      ],
    };
  }

  private createTabsTemplate(): Template {
    return {
      id: 'tabs',
      name: 'Tabs Navigation',
      description: 'Bottom tab navigation with multiple screens',
      category: 'navigation',
      features: ['Tab navigation', 'Multiple screens', 'Icons'],
      dependencies: {},
      files: [
        {
          path: 'src/App.tsx',
          content: `import React, { useState } from 'react';

function HomeScreen() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Home</h1>
      <p>Welcome to {{PROJECT_NAME}}!</p>
    </div>
  );
}

function ExploreScreen() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Explore</h1>
      <p>Discover new content</p>
    </div>
  );
}

function ProfileScreen() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Profile</h1>
      <p>Your profile information</p>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'explore' && <ExploreScreen />}
        {activeTab === 'profile' && <ProfileScreen />}
      </div>

      <div style={{
        display: 'flex',
        borderTop: '1px solid #ccc',
        backgroundColor: '#f5f5f5'
      }}>
        {['home', 'explore', 'profile'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: 15,
              border: 'none',
              background: activeTab === tab ? '#fff' : 'transparent',
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              cursor: 'pointer'
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
`,
        },
      ],
    };
  }

  private createDrawerTemplate(): Template {
    return {
      id: 'drawer',
      name: 'Drawer Navigation',
      description: 'Side drawer navigation pattern',
      category: 'navigation',
      features: ['Drawer navigation', 'Multiple screens'],
      dependencies: {},
      files: [
        {
          path: 'src/App.tsx',
          content: `import React, { useState } from 'react';

export default function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('home');

  const navigate = (screen: string) => {
    setCurrentScreen(screen);
    setDrawerOpen(false);
  };

  return (
    <div style={{ height: '100vh', display: 'flex' }}>
      {/* Drawer */}
      {drawerOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 999
            }}
            onClick={() => setDrawerOpen(false)}
          />
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            width: 250,
            background: '#fff',
            zIndex: 1000,
            padding: 20,
            boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
          }}>
            <h2>{{PROJECT_NAME}}</h2>
            {['home', 'settings', 'about'].map(screen => (
              <button
                key={screen}
                onClick={() => navigate(screen)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: 15,
                  marginBottom: 10,
                  border: 'none',
                  background: currentScreen === screen ? '#e0e0e0' : 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                {screen.charAt(0).toUpperCase() + screen.slice(1)}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Main Content */}
      <div style={{ flex: 1 }}>
        <div style={{
          padding: 20,
          borderBottom: '1px solid #ccc',
          display: 'flex',
          alignItems: 'center'
        }}>
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              padding: 10,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 20
            }}
          >
            ☰
          </button>
          <h1 style={{ margin: 0, marginLeft: 20 }}>
            {currentScreen.charAt(0).toUpperCase() + currentScreen.slice(1)}
          </h1>
        </div>
        <div style={{ padding: 20 }}>
          {currentScreen === 'home' && <p>Welcome to the home screen!</p>}
          {currentScreen === 'settings' && <p>Settings page</p>}
          {currentScreen === 'about' && <p>About page</p>}
        </div>
      </div>
    </div>
  );
}
`,
        },
      ],
    };
  }

  private createAuthTemplate(): Template {
    return {
      id: 'auth',
      name: 'Authentication',
      description: 'Login and signup screens with authentication flow',
      category: 'auth',
      features: ['Login screen', 'Signup screen', 'Protected routes'],
      dependencies: {},
      files: [
        {
          path: 'src/App.tsx',
          content: `import React, { useState } from 'react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  if (!isAuthenticated) {
    return showSignup ? (
      <SignupScreen
        onSignup={() => setIsAuthenticated(true)}
        onSwitchToLogin={() => setShowSignup(false)}
      />
    ) : (
      <LoginScreen
        onLogin={() => setIsAuthenticated(true)}
        onSwitchToSignup={() => setShowSignup(true)}
      />
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Welcome to {{PROJECT_NAME}}!</h1>
      <p>You are logged in.</p>
      <button onClick={() => setIsAuthenticated(false)}>Logout</button>
    </div>
  );
}

function LoginScreen({ onLogin, onSwitchToSignup }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh'
    }}>
      <div style={{ width: 300 }}>
        <h1>Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', padding: 10, marginBottom: 10 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', padding: 10, marginBottom: 10 }}
        />
        <button
          onClick={onLogin}
          style={{ width: '100%', padding: 10 }}
        >
          Login
        </button>
        <button
          onClick={onSwitchToSignup}
          style={{ width: '100%', padding: 10, marginTop: 10 }}
        >
          Create Account
        </button>
      </div>
    </div>
  );
}

function SignupScreen({ onSignup, onSwitchToLogin }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh'
    }}>
      <div style={{ width: 300 }}>
        <h1>Sign Up</h1>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ width: '100%', padding: 10, marginBottom: 10 }}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', padding: 10, marginBottom: 10 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', padding: 10, marginBottom: 10 }}
        />
        <button
          onClick={onSignup}
          style={{ width: '100%', padding: 10 }}
        >
          Sign Up
        </button>
        <button
          onClick={onSwitchToLogin}
          style={{ width: '100%', padding: 10, marginTop: 10 }}
        >
          Already have an account? Login
        </button>
      </div>
    </div>
  );
}
`,
        },
      ],
    };
  }

  private createCameraAppTemplate(): Template {
    return {
      id: 'camera-app',
      name: 'Camera App',
      description: 'Photo and video capture with @lumora/camera',
      category: 'ui',
      features: ['Camera access', 'Photo capture', 'Gallery'],
      dependencies: {
        '@lumora/camera': '^1.0.0',
      },
      files: [
        {
          path: 'src/App.tsx',
          content: `import React, { useState } from 'react';
import Camera from '@lumora/camera';

export default function App() {
  const [photos, setPhotos] = useState<string[]>([]);

  const takePicture = async () => {
    try {
      const result = await Camera.takePicture({
        quality: 0.9,
        camera: 'back'
      });
      setPhotos([...photos, result.uri]);
    } catch (error) {
      console.error('Failed to take picture:', error);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>{{PROJECT_NAME}}</h1>
      <button onClick={takePicture} style={{ padding: 15, fontSize: 16 }}>
        📷 Take Photo
      </button>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10,
        marginTop: 20
      }}>
        {photos.map((photo, index) => (
          <img
            key={index}
            src={photo}
            alt={\`Photo \${index + 1}\`}
            style={{ width: '100%', height: 150, objectFit: 'cover' }}
          />
        ))}
      </div>
    </div>
  );
}
`,
        },
      ],
    };
  }

  private createTodoListTemplate(): Template {
    return {
      id: 'todo-list',
      name: 'Todo List',
      description: 'Simple todo list with local storage',
      category: 'data',
      features: ['CRUD operations', 'Local storage', 'State management'],
      dependencies: {},
      files: [
        {
          path: 'src/App.tsx',
          content: `import React, { useState } from 'react';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, { id: Date.now(), text: input, completed: false }]);
      setInput('');
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
      <h1>{{PROJECT_NAME}}</h1>

      <div style={{ display: 'flex', marginBottom: 20 }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && addTodo()}
          placeholder="Add a new task..."
          style={{ flex: 1, padding: 10, fontSize: 16 }}
        />
        <button onClick={addTodo} style={{ padding: 10, marginLeft: 10 }}>
          Add
        </button>
      </div>

      {todos.map(todo => (
        <div
          key={todo.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: 10,
            marginBottom: 10,
            background: '#f5f5f5',
            borderRadius: 5
          }}
        >
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleTodo(todo.id)}
            style={{ marginRight: 10 }}
          />
          <span style={{
            flex: 1,
            textDecoration: todo.completed ? 'line-through' : 'none'
          }}>
            {todo.text}
          </span>
          <button onClick={() => deleteTodo(todo.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
`,
        },
      ],
    };
  }

  private createWeatherAppTemplate(): Template {
    return {
      id: 'weather-app',
      name: 'Weather App',
      description: 'Weather app with location and API integration',
      category: 'data',
      features: ['API calls', 'Location services', 'Real-time data'],
      dependencies: {
        '@lumora/location': '^1.0.0',
      },
      files: [
        {
          path: 'src/App.tsx',
          content: `import React, { useState, useEffect } from 'react';
import Location from '@lumora/location';

export default function App() {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeather();
  }, []);

  const loadWeather = async () => {
    try {
      const position = await Location.getCurrentPosition({ accuracy: 'high' });

      // Fetch weather data (use a real API in production)
      const mockWeather = {
        temperature: 72,
        condition: 'Sunny',
        location: 'San Francisco, CA',
        humidity: 65,
        wind: 10
      };

      setWeather(mockWeather);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load weather:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <p>Loading weather...</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(to bottom, #87CEEB, #4682B4)',
      color: 'white'
    }}>
      <h1>{weather.location}</h1>
      <div style={{ fontSize: 72, margin: 20 }}>
        {weather.temperature}°F
      </div>
      <div style={{ fontSize: 24 }}>{weather.condition}</div>
      <div style={{ marginTop: 40, display: 'flex', gap: 20 }}>
        <div>Humidity: {weather.humidity}%</div>
        <div>Wind: {weather.wind} mph</div>
      </div>
      <button
        onClick={loadWeather}
        style={{
          marginTop: 40,
          padding: '10px 20px',
          fontSize: 16,
          background: 'white',
          color: '#4682B4',
          border: 'none',
          borderRadius: 5,
          cursor: 'pointer'
        }}
      >
        Refresh
      </button>
    </div>
  );
}
`,
        },
      ],
    };
  }

  private createSocialFeedTemplate(): Template {
    return {
      id: 'social-feed',
      name: 'Social Feed',
      description: 'Social media feed with posts and interactions',
      category: 'ui',
      features: ['Feed', 'Posts', 'Likes', 'Comments'],
      dependencies: {},
      files: [
        {
          path: 'src/App.tsx',
          content: `import React, { useState } from 'react';

interface Post {
  id: number;
  author: string;
  content: string;
  likes: number;
  timestamp: Date;
}

export default function App() {
  const [posts, setPosts] = useState<Post[]>([
    {
      id: 1,
      author: 'John Doe',
      content: 'Just launched my new app with Lumora! 🚀',
      likes: 42,
      timestamp: new Date()
    },
    {
      id: 2,
      author: 'Jane Smith',
      content: 'Beautiful day for coding!',
      likes: 17,
      timestamp: new Date()
    }
  ]);

  const likePost = (id: number) => {
    setPosts(posts.map(post =>
      post.id === id ? { ...post, likes: post.likes + 1 } : post
    ));
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <h1>{{PROJECT_NAME}}</h1>

      {posts.map(post => (
        <div
          key={post.id}
          style={{
            padding: 20,
            marginBottom: 20,
            background: '#fff',
            borderRadius: 10,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: '#007bff',
              marginRight: 10
            }} />
            <div>
              <div style={{ fontWeight: 'bold' }}>{post.author}</div>
              <div style={{ fontSize: 12, color: '#666' }}>
                {post.timestamp.toLocaleString()}
              </div>
            </div>
          </div>

          <p>{post.content}</p>

          <button
            onClick={() => likePost(post.id)}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: '#f0f0f0',
              borderRadius: 5,
              cursor: 'pointer'
            }}
          >
            ❤️ {post.likes}
          </button>
        </div>
      ))}
    </div>
  );
}
`,
        },
      ],
    };
  }

  private createECommerceTemplate(): Template {
    return {
      id: 'e-commerce',
      name: 'E-Commerce',
      description: 'Product catalog with shopping cart',
      category: 'advanced',
      features: ['Product list', 'Shopping cart', 'Checkout flow'],
      dependencies: {},
      files: [
        {
          path: 'src/App.tsx',
          content: `import React, { useState } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
}

const products: Product[] = [
  { id: 1, name: 'Product 1', price: 29.99, image: '📱' },
  { id: 2, name: 'Product 2', price: 49.99, image: '💻' },
  { id: 3, name: 'Product 3', price: 19.99, image: '⌚' },
];

export default function App() {
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <div style={{ padding: 20 }}>
      <h1>{{PROJECT_NAME}}</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {products.map(product => (
          <div key={product.id} style={{ border: '1px solid #ccc', padding: 20 }}>
            <div style={{ fontSize: 48, textAlign: 'center' }}>{product.image}</div>
            <h3>{product.name}</h3>
            <p>\${product.price}</p>
            <button onClick={() => addToCart(product)}>Add to Cart</button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 40, padding: 20, background: '#f5f5f5' }}>
        <h2>Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)</h2>
        {cart.map(item => (
          <div key={item.product.id} style={{ marginBottom: 10 }}>
            {item.product.name} x {item.quantity} = \${(item.product.price * item.quantity).toFixed(2)}
          </div>
        ))}
        <div style={{ fontWeight: 'bold', marginTop: 20 }}>
          Total: \${total.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
`,
        },
      ],
    };
  }

  private createChatAppTemplate(): Template {
    return {
      id: 'chat-app',
      name: 'Chat App',
      description: 'Real-time chat interface',
      category: 'advanced',
      features: ['Messages', 'Real-time updates', 'User interface'],
      dependencies: {},
      files: [
        {
          path: 'src/App.tsx',
          content: `import React, { useState } from 'react';

interface Message {
  id: number;
  text: string;
  sender: 'me' | 'other';
  timestamp: Date;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'Hello!', sender: 'other', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (input.trim()) {
      setMessages([...messages, {
        id: Date.now(),
        text: input,
        sender: 'me',
        timestamp: new Date()
      }]);
      setInput('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ padding: 20, borderBottom: '1px solid #ccc' }}>
        <h1>{{PROJECT_NAME}}</h1>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.sender === 'me' ? 'flex-end' : 'flex-start',
              marginBottom: 10
            }}
          >
            <div style={{
              maxWidth: '70%',
              padding: 10,
              borderRadius: 10,
              background: msg.sender === 'me' ? '#007bff' : '#e5e5ea',
              color: msg.sender === 'me' ? 'white' : 'black'
            }}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        padding: 20,
        borderTop: '1px solid #ccc',
        display: 'flex'
      }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          style={{ flex: 1, padding: 10, fontSize: 16 }}
        />
        <button onClick={sendMessage} style={{ marginLeft: 10, padding: 10 }}>
          Send
        </button>
      </div>
    </div>
  );
}
`,
        },
      ],
    };
  }

  private createMusicPlayerTemplate(): Template {
    return {
      id: 'music-player',
      name: 'Music Player',
      description: 'Audio player with playlist',
      category: 'ui',
      features: ['Audio playback', 'Playlist', 'Controls'],
      dependencies: {},
      files: [
        {
          path: 'src/App.tsx',
          content: `import React, { useState } from 'react';

interface Track {
  id: number;
  title: string;
  artist: string;
  duration: string;
}

const playlist: Track[] = [
  { id: 1, title: 'Song 1', artist: 'Artist 1', duration: '3:45' },
  { id: 2, title: 'Song 2', artist: 'Artist 2', duration: '4:12' },
  { id: 3, title: 'Song 3', artist: 'Artist 3', duration: '3:30' },
];

export default function App() {
  const [currentTrack, setCurrentTrack] = useState(playlist[0]);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'linear-gradient(to bottom, #667eea 0%, #764ba2 100%)',
      color: 'white'
    }}>
      <div style={{ padding: 20 }}>
        <h1>{{PROJECT_NAME}}</h1>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          width: 200,
          height: 200,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 10,
          marginBottom: 40
        }} />

        <h2>{currentTrack.title}</h2>
        <p>{currentTrack.artist}</p>

        <div style={{ display: 'flex', gap: 20, marginTop: 40 }}>
          <button style={{
            width: 50,
            height: 50,
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            fontSize: 20,
            cursor: 'pointer'
          }}>
            ⏮️
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              border: 'none',
              background: 'white',
              color: '#667eea',
              fontSize: 24,
              cursor: 'pointer'
            }}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          <button style={{
            width: 50,
            height: 50,
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            fontSize: 20,
            cursor: 'pointer'
          }}>
            ⏭️
          </button>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        <h3>Playlist</h3>
        {playlist.map(track => (
          <div
            key={track.id}
            onClick={() => setCurrentTrack(track)}
            style={{
              padding: 15,
              marginBottom: 10,
              background: track.id === currentTrack.id ? 'rgba(255,255,255,0.2)' : 'transparent',
              borderRadius: 5,
              cursor: 'pointer'
            }}
          >
            <div style={{ fontWeight: 'bold' }}>{track.title}</div>
            <div style={{ fontSize: 14, opacity: 0.8 }}>
              {track.artist} • {track.duration}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
`,
        },
      ],
    };
  }

  private createFitnessTrackerTemplate(): Template {
    return {
      id: 'fitness-tracker',
      name: 'Fitness Tracker',
      description: 'Track workouts and progress',
      category: 'advanced',
      features: ['Activity tracking', 'Statistics', 'Progress charts'],
      dependencies: {},
      files: [
        {
          path: 'src/App.tsx',
          content: `import React, { useState } from 'react';

interface Workout {
  id: number;
  type: string;
  duration: number;
  calories: number;
  date: Date;
}

export default function App() {
  const [workouts, setWorkouts] = useState<Workout[]>([
    { id: 1, type: 'Running', duration: 30, calories: 300, date: new Date() }
  ]);

  const totalCalories = workouts.reduce((sum, w) => sum + w.calories, 0);
  const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1>{{PROJECT_NAME}}</h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 20,
        marginBottom: 40
      }}>
        <div style={{
          padding: 20,
          background: '#4CAF50',
          color: 'white',
          borderRadius: 10
        }}>
          <div style={{ fontSize: 36, fontWeight: 'bold' }}>{workouts.length}</div>
          <div>Workouts</div>
        </div>
        <div style={{
          padding: 20,
          background: '#2196F3',
          color: 'white',
          borderRadius: 10
        }}>
          <div style={{ fontSize: 36, fontWeight: 'bold' }}>{totalDuration}</div>
          <div>Minutes</div>
        </div>
        <div style={{
          padding: 20,
          background: '#FF9800',
          color: 'white',
          borderRadius: 10
        }}>
          <div style={{ fontSize: 36, fontWeight: 'bold' }}>{totalCalories}</div>
          <div>Calories</div>
        </div>
      </div>

      <h2>Recent Workouts</h2>
      {workouts.map(workout => (
        <div
          key={workout.id}
          style={{
            padding: 20,
            marginBottom: 10,
            background: '#f5f5f5',
            borderRadius: 10
          }}
        >
          <div style={{ fontWeight: 'bold', fontSize: 18 }}>{workout.type}</div>
          <div style={{ display: 'flex', gap: 20, marginTop: 10, color: '#666' }}>
            <span>⏱️ {workout.duration} min</span>
            <span>🔥 {workout.calories} cal</span>
            <span>📅 {workout.date.toLocaleDateString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
`,
        },
      ],
    };
  }

  // Helper methods

  private toPascalCase(str: string): string {
    return str
      .split(/[-_\s]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }
}

// Singleton instance
let templateManagerInstance: TemplateManager | null = null;

export function getTemplateManager(): TemplateManager {
  if (!templateManagerInstance) {
    templateManagerInstance = new TemplateManager();
  }
  return templateManagerInstance;
}
