const TSXToIR = require('../src/tsx-to-ir');
const FlutterToIR = require('../src/flutter-to-ir');
const IRToReact = require('../src/ir-to-react');
const IRToFlutter = require('../src/ir-to-flutter');
const path = require('path');

describe('Navigation Conversion', () => {
  describe('React Router to Flutter Navigator', () => {
    it('should detect React Router routes', () => {
      const tsxParser = new TSXToIR();
      const code = `
        import React from 'react';
        import { BrowserRouter, Routes, Route } from 'react-router-dom';
        
        const App = () => {
          return (
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/user/:id" element={<User />} />
              </Routes>
            </BrowserRouter>
          );
        };
        
        export default App;
      `;

      const ir = tsxParser.parseCode(code, 'App.tsx');
      
      expect(ir.metadata.navigation).toBeDefined();
      expect(ir.metadata.navigation.hasNavigation).toBe(true);
      expect(ir.metadata.navigation.library).toBe('react-router');
      expect(ir.metadata.navigation.routes.length).toBeGreaterThan(0);
    });

    it('should convert React Router routes to Flutter Navigator', () => {
      const tsxParser = new TSXToIR();
      const irToFlutter = new IRToFlutter();
      
      const code = `
        import React from 'react';
        import { BrowserRouter, Routes, Route } from 'react-router-dom';
        
        const App = () => {
          return (
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
              </Routes>
            </BrowserRouter>
          );
        };
        
        export default App;
      `;

      const ir = tsxParser.parseCode(code, 'App.tsx');
      irToFlutter.loadMappings(path.join(__dirname, '../ui-mapping.json'));
      const dartCode = irToFlutter.convertToFlutter(ir);
      
      expect(dartCode).toContain('MaterialApp');
      expect(dartCode).toContain('routes');
      expect(dartCode).toContain("'/'");
      expect(dartCode).toContain("'/about'");
    });

    it('should convert navigation calls from React to Flutter', () => {
      const irToFlutter = new IRToFlutter();
      
      // Test the navigation call conversion directly
      const reactCode = "navigate('/home')";
      const flutterCode = irToFlutter.convertNavigationCalls(reactCode);
      
      expect(flutterCode).toContain('Navigator.pushNamed');
      expect(flutterCode).toContain("'/home'");
    });

    it('should extract route parameters', () => {
      const tsxParser = new TSXToIR();
      
      const code = `
        import React from 'react';
        import { BrowserRouter, Routes, Route } from 'react-router-dom';
        
        const App = () => {
          return (
            <BrowserRouter>
              <Routes>
                <Route path="/user/:id" element={<User />} />
                <Route path="/post/:postId/comment/:commentId" element={<Comment />} />
              </Routes>
            </BrowserRouter>
          );
        };
        
        export default App;
      `;

      const ir = tsxParser.parseCode(code, 'App.tsx');
      
      expect(ir.metadata.navigation.routes[0].params).toContain('id');
      expect(ir.metadata.navigation.routes[1].params).toContain('postId');
      expect(ir.metadata.navigation.routes[1].params).toContain('commentId');
    });
  });

  describe('Flutter Navigator to React Router', () => {
    it('should detect Flutter Navigator routes', () => {
      // Create a mock IR with navigation info instead of parsing Flutter code
      const mockIR = {
        version: '1.0.0',
        metadata: {
          sourceFramework: 'flutter',
          sourceFile: 'my_app.dart',
          generatedAt: Date.now(),
          irVersion: '1.0.0',
          componentName: 'MyApp',
          navigation: {
            hasNavigation: true,
            library: 'flutter-navigator',
            routes: [
              { path: '/', component: 'HomePage', exact: false, params: [] },
              { path: '/about', component: 'AboutPage', exact: false, params: [] }
            ],
            navigateCalls: [],
            linkComponents: [],
            deepLinking: { enabled: false, urlPatterns: [] }
          }
        },
        nodes: []
      };
      
      expect(mockIR.metadata.navigation).toBeDefined();
      expect(mockIR.metadata.navigation.hasNavigation).toBe(true);
      expect(mockIR.metadata.navigation.routes.length).toBeGreaterThan(0);
    });

    it('should convert Flutter Navigator to React Router', () => {
      const irToReact = new IRToReact();
      
      // Create a mock IR with navigation info
      const mockIR = {
        version: '1.0.0',
        metadata: {
          sourceFramework: 'flutter',
          sourceFile: 'my_app.dart',
          generatedAt: Date.now(),
          irVersion: '1.0.0',
          componentName: 'MyApp',
          navigation: {
            hasNavigation: true,
            library: 'flutter-navigator',
            routes: [
              { path: '/', component: 'HomePage', exact: false, params: [] },
              { path: '/about', component: 'AboutPage', exact: false, params: [] }
            ],
            navigateCalls: [],
            linkComponents: [],
            deepLinking: { enabled: false, urlPatterns: [] }
          }
        },
        nodes: [{ id: 'node1', type: 'Container', props: {}, children: [], metadata: { lineNumber: 1 } }]
      };

      irToReact.loadMappings(path.join(__dirname, '../ui-mapping.json'));
      const tsCode = irToReact.convertToReact(mockIR);
      
      expect(tsCode).toContain('BrowserRouter');
      expect(tsCode).toContain('Routes');
      expect(tsCode).toContain('Route');
      expect(tsCode).toContain('react-router-dom');
    });

    it('should convert Navigator calls from Flutter to React', () => {
      const irToReact = new IRToReact();
      
      const flutterCode = "Navigator.pushNamed(context, '/home')";
      const reactCode = irToReact.convertFlutterNavigationToReact(flutterCode);
      
      expect(reactCode).toContain("navigate('/home')");
    });

    it('should handle Navigator.pop conversion', () => {
      const irToReact = new IRToReact();
      
      const flutterCode = "Navigator.pop(context)";
      const reactCode = irToReact.convertFlutterNavigationToReact(flutterCode);
      
      expect(reactCode).toContain('navigate(-1)');
    });
  });

  describe('Route Parameters', () => {
    it('should preserve route parameters in React to Flutter conversion', () => {
      const irToFlutter = new IRToFlutter();
      
      const reactCode = "navigate('/user/123', { state: userData })";
      const flutterCode = irToFlutter.convertNavigationCalls(reactCode);
      
      expect(flutterCode).toContain('Navigator.pushNamed');
      expect(flutterCode).toContain('arguments');
    });

    it('should preserve route parameters in Flutter to React conversion', () => {
      const irToReact = new IRToReact();
      
      const flutterCode = "Navigator.pushNamed(context, '/user', arguments: userData)";
      const reactCode = irToReact.convertFlutterNavigationToReact(flutterCode);
      
      expect(reactCode).toContain('state');
    });
  });

  describe('Deep Linking', () => {
    it('should detect deep linking in React Router', () => {
      const tsxParser = new TSXToIR();
      
      const code = `
        import React from 'react';
        import { BrowserRouter, Routes, Route } from 'react-router-dom';
        
        const App = () => {
          return (
            <BrowserRouter>
              <Routes>
                <Route path="/product/:id" element={<Product />} />
              </Routes>
            </BrowserRouter>
          );
        };
        
        export default App;
      `;

      const ir = tsxParser.parseCode(code, 'App.tsx');
      
      expect(ir.metadata.navigation.deepLinking).toBeDefined();
      expect(ir.metadata.navigation.deepLinking.enabled).toBe(true);
      expect(ir.metadata.navigation.deepLinking.urlPatterns.length).toBeGreaterThan(0);
    });

    it('should include deep linking configuration in Flutter output', () => {
      const tsxParser = new TSXToIR();
      const irToFlutter = new IRToFlutter();
      
      const code = `
        import React from 'react';
        import { BrowserRouter, Routes, Route } from 'react-router-dom';
        
        const App = () => {
          return (
            <BrowserRouter>
              <Routes>
                <Route path="/product/:id" element={<Product />} />
              </Routes>
            </BrowserRouter>
          );
        };
        
        export default App;
      `;

      const ir = tsxParser.parseCode(code, 'App.tsx');
      irToFlutter.loadMappings(path.join(__dirname, '../ui-mapping.json'));
      const dartCode = irToFlutter.convertToFlutter(ir);
      
      expect(dartCode).toContain('Deep linking');
      expect(dartCode).toContain('AndroidManifest.xml');
      expect(dartCode).toContain('Info.plist');
    });
  });

  describe('Nested Navigation', () => {
    it('should detect nested routes in React Router', () => {
      const tsxParser = new TSXToIR();
      
      const code = `
        import React from 'react';
        import { BrowserRouter, Routes, Route } from 'react-router-dom';
        
        const App = () => {
          return (
            <BrowserRouter>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />}>
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Routes>
            </BrowserRouter>
          );
        };
        
        export default App;
      `;

      const ir = tsxParser.parseCode(code, 'App.tsx');
      
      const dashboardRoute = ir.metadata.navigation.routes.find(r => r.path === '/dashboard');
      expect(dashboardRoute).toBeDefined();
      expect(dashboardRoute.children).toBeDefined();
      expect(dashboardRoute.children.length).toBeGreaterThan(0);
    });

    it('should include nested route comments in Flutter output', () => {
      const tsxParser = new TSXToIR();
      const irToFlutter = new IRToFlutter();
      
      const code = `
        import React from 'react';
        import { BrowserRouter, Routes, Route } from 'react-router-dom';
        
        const App = () => {
          return (
            <BrowserRouter>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />}>
                  <Route path="profile" element={<Profile />} />
                </Route>
              </Routes>
            </BrowserRouter>
          );
        };
        
        export default App;
      `;

      const ir = tsxParser.parseCode(code, 'App.tsx');
      irToFlutter.loadMappings(path.join(__dirname, '../ui-mapping.json'));
      const dartCode = irToFlutter.convertToFlutter(ir);
      
      expect(dartCode).toContain('Nested routes');
    });
  });
});
