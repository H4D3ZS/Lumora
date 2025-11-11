/**
 * Route Parser Tests
 */

import { RouteParser } from '../navigation/route-parser';
import type { Route, RouteParam } from '../navigation/navigation-types';

describe('RouteParser', () => {
  describe('extractParameters', () => {
    it('should extract required parameters from path', () => {
      const params = RouteParser.extractParameters('/users/:id/posts/:postId');
      
      expect(params).toHaveLength(2);
      expect(params[0]).toMatchObject({
        name: 'id',
        type: 'string',
        required: true,
      });
      expect(params[1]).toMatchObject({
        name: 'postId',
        type: 'string',
        required: true,
      });
    });

    it('should extract wildcard parameters', () => {
      const params = RouteParser.extractParameters('/files/*path');
      
      expect(params).toHaveLength(1);
      expect(params[0]).toMatchObject({
        name: 'path',
        type: 'string',
        required: false,
      });
    });

    it('should handle paths with no parameters', () => {
      const params = RouteParser.extractParameters('/home');
      
      expect(params).toHaveLength(0);
    });
  });

  describe('parsePathPattern', () => {
    it('should convert path to regex pattern', () => {
      const { regex, params } = RouteParser.parsePathPattern('/users/:id');
      
      expect(params).toEqual(['id']);
      expect(regex.test('/users/123')).toBe(true);
      expect(regex.test('/users/abc')).toBe(true);
      expect(regex.test('/users')).toBe(false);
      expect(regex.test('/users/123/posts')).toBe(false);
    });

    it('should handle multiple parameters', () => {
      const { regex, params } = RouteParser.parsePathPattern('/users/:userId/posts/:postId');
      
      expect(params).toEqual(['userId', 'postId']);
      expect(regex.test('/users/123/posts/456')).toBe(true);
      expect(regex.test('/users/123/posts')).toBe(false);
    });

    it('should handle wildcard parameters', () => {
      const { regex, params } = RouteParser.parsePathPattern('/files/*path');
      
      expect(params).toEqual(['path']);
      expect(regex.test('/files/docs/readme.md')).toBe(true);
      expect(regex.test('/files/a/b/c/d.txt')).toBe(true);
    });

    it('should handle static paths', () => {
      const { regex, params } = RouteParser.parsePathPattern('/home');
      
      expect(params).toEqual([]);
      expect(regex.test('/home')).toBe(true);
      expect(regex.test('/home/extra')).toBe(false);
    });
  });

  describe('matchPath', () => {
    it('should match path and extract parameters', () => {
      const params = RouteParser.matchPath('/users/:id', '/users/123');
      
      expect(params).toEqual({ id: '123' });
    });

    it('should match multiple parameters', () => {
      const params = RouteParser.matchPath(
        '/users/:userId/posts/:postId',
        '/users/123/posts/456'
      );
      
      expect(params).toEqual({ userId: '123', postId: '456' });
    });

    it('should return null for non-matching paths', () => {
      const params = RouteParser.matchPath('/users/:id', '/posts/123');
      
      expect(params).toBeNull();
    });

    it('should match wildcard parameters', () => {
      const params = RouteParser.matchPath('/files/*path', '/files/docs/readme.md');
      
      expect(params).toEqual({ path: 'docs/readme.md' });
    });
  });

  describe('findMatchingRoute', () => {
    const routes: Route[] = [
      {
        name: 'home',
        path: '/home',
        component: 'HomeScreen',
      },
      {
        name: 'user',
        path: '/users/:id',
        component: 'UserScreen',
      },
      {
        name: 'userPosts',
        path: '/users/:userId/posts/:postId',
        component: 'PostScreen',
      },
      {
        name: 'files',
        path: '/files/*path',
        component: 'FileScreen',
      },
    ];

    it('should find exact match', () => {
      const match = RouteParser.findMatchingRoute(routes, '/home');
      
      expect(match).not.toBeNull();
      expect(match?.route.name).toBe('home');
      expect(match?.params).toEqual({});
    });

    it('should find match with parameters', () => {
      const match = RouteParser.findMatchingRoute(routes, '/users/123');
      
      expect(match).not.toBeNull();
      expect(match?.route.name).toBe('user');
      expect(match?.params).toEqual({ id: '123' });
    });

    it('should find best match for multiple parameters', () => {
      const match = RouteParser.findMatchingRoute(routes, '/users/123/posts/456');
      
      expect(match).not.toBeNull();
      expect(match?.route.name).toBe('userPosts');
      expect(match?.params).toEqual({ userId: '123', postId: '456' });
    });

    it('should find wildcard match', () => {
      const match = RouteParser.findMatchingRoute(routes, '/files/docs/readme.md');
      
      expect(match).not.toBeNull();
      expect(match?.route.name).toBe('files');
      expect(match?.params).toEqual({ path: 'docs/readme.md' });
    });

    it('should return null for no match', () => {
      const match = RouteParser.findMatchingRoute(routes, '/unknown');
      
      expect(match).toBeNull();
    });

    it('should prefer exact matches over dynamic matches', () => {
      const routesWithExact: Route[] = [
        {
          name: 'userNew',
          path: '/users/new',
          component: 'NewUserScreen',
        },
        {
          name: 'user',
          path: '/users/:id',
          component: 'UserScreen',
        },
      ];

      const match = RouteParser.findMatchingRoute(routesWithExact, '/users/new');
      
      expect(match).not.toBeNull();
      expect(match?.route.name).toBe('userNew');
    });
  });

  describe('parseQueryString', () => {
    it('should parse query parameters', () => {
      const query = RouteParser.parseQueryString('/users?sort=name&page=2');
      
      expect(query).toEqual({ sort: 'name', page: '2' });
    });

    it('should handle empty query string', () => {
      const query = RouteParser.parseQueryString('/users');
      
      expect(query).toEqual({});
    });

    it('should handle array parameters', () => {
      const query = RouteParser.parseQueryString('/search?tags[]=js&tags[]=ts');
      
      expect(query).toEqual({ tags: ['js', 'ts'] });
    });

    it('should decode URL-encoded values', () => {
      const query = RouteParser.parseQueryString('/search?q=hello%20world');
      
      expect(query).toEqual({ q: 'hello world' });
    });
  });

  describe('buildPath', () => {
    it('should build path with parameters', () => {
      const route: Route = {
        name: 'user',
        path: '/users/:id',
        component: 'UserScreen',
      };

      const path = RouteParser.buildPath(route, { id: '123' });
      
      expect(path).toBe('/users/123');
    });

    it('should build path with query parameters', () => {
      const route: Route = {
        name: 'users',
        path: '/users',
        component: 'UsersScreen',
      };

      const path = RouteParser.buildPath(route, {}, { sort: 'name', page: 2 });
      
      expect(path).toBe('/users?sort=name&page=2');
    });

    it('should build path with both path and query parameters', () => {
      const route: Route = {
        name: 'user',
        path: '/users/:id',
        component: 'UserScreen',
      };

      const path = RouteParser.buildPath(route, { id: '123' }, { tab: 'posts' });
      
      expect(path).toBe('/users/123?tab=posts');
    });

    it('should throw error for missing required parameter', () => {
      const route: Route = {
        name: 'user',
        path: '/users/:id',
        component: 'UserScreen',
      };

      expect(() => {
        RouteParser.buildPath(route, {});
      }).toThrow("Required parameter 'id' is missing");
    });
  });

  describe('buildQueryString', () => {
    it('should build query string from object', () => {
      const query = RouteParser.buildQueryString({ sort: 'name', page: 2 });
      
      expect(query).toBe('sort=name&page=2');
    });

    it('should handle array values', () => {
      const query = RouteParser.buildQueryString({ tags: ['js', 'ts'] });
      
      expect(query).toBe('tags[]=js&tags[]=ts');
    });

    it('should skip undefined and null values', () => {
      const query = RouteParser.buildQueryString({ 
        a: 'value', 
        b: undefined, 
        c: null 
      });
      
      expect(query).toBe('a=value');
    });

    it('should encode special characters', () => {
      const query = RouteParser.buildQueryString({ q: 'hello world' });
      
      expect(query).toBe('q=hello%20world');
    });
  });

  describe('validateParameters', () => {
    it('should validate required parameters', () => {
      const definitions: RouteParam[] = [
        { name: 'id', type: 'string', required: true },
      ];

      const result = RouteParser.validateParameters({}, definitions);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Required parameter 'id' is missing");
    });

    it('should validate parameter types', () => {
      const definitions: RouteParam[] = [
        { name: 'page', type: 'number', required: true },
      ];

      const result = RouteParser.validateParameters({ page: 'abc' }, definitions);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Parameter 'page' must be a number");
    });

    it('should validate patterns', () => {
      const definitions: RouteParam[] = [
        { 
          name: 'id', 
          type: 'string', 
          required: true,
          pattern: '^[0-9]+$'
        },
      ];

      const result = RouteParser.validateParameters({ id: 'abc' }, definitions);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("does not match pattern");
    });

    it('should pass valid parameters', () => {
      const definitions: RouteParam[] = [
        { name: 'id', type: 'string', required: true },
        { name: 'page', type: 'number', required: false },
      ];

      const result = RouteParser.validateParameters({ id: '123' }, definitions);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('normalizePath', () => {
    it('should remove trailing slash', () => {
      expect(RouteParser.normalizePath('/users/')).toBe('/users');
    });

    it('should keep root slash', () => {
      expect(RouteParser.normalizePath('/')).toBe('/');
    });

    it('should add leading slash', () => {
      expect(RouteParser.normalizePath('users')).toBe('/users');
    });

    it('should remove duplicate slashes', () => {
      expect(RouteParser.normalizePath('/users//123')).toBe('/users/123');
    });
  });

  describe('isDynamicPath', () => {
    it('should detect dynamic paths with parameters', () => {
      expect(RouteParser.isDynamicPath('/users/:id')).toBe(true);
    });

    it('should detect dynamic paths with wildcards', () => {
      expect(RouteParser.isDynamicPath('/files/*path')).toBe(true);
    });

    it('should return false for static paths', () => {
      expect(RouteParser.isDynamicPath('/home')).toBe(false);
    });
  });
});
