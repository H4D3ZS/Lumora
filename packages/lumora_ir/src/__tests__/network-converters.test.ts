/**
 * Network Converters Tests
 * Tests for React and Flutter network parsers
 */

import { parseReactNetwork } from '../parsers/react-network-parser';
import { parseFlutterNetwork } from '../parsers/flutter-network-parser';
import { NetworkSchema } from '../types/network-types';

describe('React Network Parser', () => {
  describe('fetch() calls', () => {
    it('should parse simple GET request', () => {
      const source = `
        async function fetchUsers() {
          const response = await fetch('https://api.example.com/users');
          return response.json();
        }
      `;
      
      const schema = parseReactNetwork(source, 'test.tsx');
      
      expect(schema.endpoints).toHaveLength(1);
      expect(schema.endpoints[0].method).toBe('GET');
      expect(schema.endpoints[0].path).toBe('/users');
    });

    it('should parse POST request with body', () => {
      const source = `
        async function createUser(data) {
          const response = await fetch('https://api.example.com/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          return response.json();
        }
      `;
      
      const schema = parseReactNetwork(source, 'test.tsx');
      
      expect(schema.endpoints).toHaveLength(1);
      expect(schema.endpoints[0].method).toBe('POST');
      expect(schema.endpoints[0].headers).toBeDefined();
    });

    it('should parse URL with path parameters', () => {
      const source = `
        async function getUser(id) {
          const response = await fetch(\`https://api.example.com/users/\${id}\`);
          return response.json();
        }
      `;
      
      const schema = parseReactNetwork(source, 'test.tsx');
      
      expect(schema.endpoints).toHaveLength(1);
      expect(schema.endpoints[0].pathParams).toBeDefined();
      expect(schema.endpoints[0].pathParams?.length).toBeGreaterThan(0);
    });
  });

  describe('axios calls', () => {
    it('should parse axios.get()', () => {
      const source = `
        import axios from 'axios';
        
        async function fetchUsers() {
          const response = await axios.get('https://api.example.com/users');
          return response.data;
        }
      `;
      
      const schema = parseReactNetwork(source, 'test.tsx');
      
      expect(schema.endpoints).toHaveLength(1);
      expect(schema.endpoints[0].method).toBe('GET');
      expect(schema.endpoints[0].metadata?.sourceAPI).toBe('axios');
    });

    it('should parse axios.post() with data', () => {
      const source = `
        import axios from 'axios';
        
        async function createUser(userData) {
          const response = await axios.post('https://api.example.com/users', userData);
          return response.data;
        }
      `;
      
      const schema = parseReactNetwork(source, 'test.tsx');
      
      expect(schema.endpoints).toHaveLength(1);
      expect(schema.endpoints[0].method).toBe('POST');
    });

    it('should parse axios() with config', () => {
      const source = `
        import axios from 'axios';
        
        async function updateUser(id, data) {
          const response = await axios({
            method: 'PUT',
            url: \`https://api.example.com/users/\${id}\`,
            data: data
          });
          return response.data;
        }
      `;
      
      const schema = parseReactNetwork(source, 'test.tsx');
      
      expect(schema.endpoints).toHaveLength(1);
      expect(schema.endpoints[0].method).toBe('PUT');
    });

    it('should extract axios interceptors', () => {
      const source = `
        import axios from 'axios';
        
        axios.interceptors.request.use(
          config => {
            config.headers.Authorization = 'Bearer token';
            return config;
          }
        );
        
        axios.interceptors.response.use(
          response => response,
          error => Promise.reject(error)
        );
      `;
      
      const schema = parseReactNetwork(source, 'test.tsx');
      
      expect(schema.interceptors).toBeDefined();
      expect(schema.interceptors?.length).toBeGreaterThan(0);
    });
  });

  describe('React Query', () => {
    it('should parse useQuery hook', () => {
      const source = `
        import { useQuery } from 'react-query';
        
        function UserProfile({ userId }) {
          const { data } = useQuery(['user', userId], async () => {
            const response = await fetch(\`/api/users/\${userId}\`);
            return response.json();
          });
          
          return <div>{data?.name}</div>;
        }
      `;
      
      const schema = parseReactNetwork(source, 'test.tsx');
      
      expect(schema.endpoints).toHaveLength(1);
    });
  });
});

describe('Flutter Network Parser', () => {
  describe('http package calls', () => {
    it('should parse http.get()', () => {
      const source = `
        import 'package:http/http.dart' as http;
        
        Future<List<User>> fetchUsers() async {
          final response = await http.get(Uri.parse('https://api.example.com/users'));
          return parseUsers(response.body);
        }
      `;
      
      const schema = parseFlutterNetwork(source, 'test.dart');
      
      expect(schema.endpoints).toHaveLength(1);
      expect(schema.endpoints[0].method).toBe('GET');
      expect(schema.endpoints[0].path).toBe('/users');
    });

    it('should parse http.post() with body', () => {
      const source = `
        import 'package:http/http.dart' as http;
        import 'dart:convert';
        
        Future<User> createUser(Map<String, dynamic> userData) async {
          final response = await http.post(
            Uri.parse('https://api.example.com/users'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(userData),
          );
          return User.fromJson(jsonDecode(response.body));
        }
      `;
      
      const schema = parseFlutterNetwork(source, 'test.dart');
      
      expect(schema.endpoints).toHaveLength(1);
      expect(schema.endpoints[0].method).toBe('POST');
      expect(schema.endpoints[0].headers).toBeDefined();
    });

    it('should parse URL with path parameters', () => {
      const source = `
        import 'package:http/http.dart' as http;
        
        Future<User> getUser(String id) async {
          final response = await http.get(Uri.parse('https://api.example.com/users/\$id'));
          return User.fromJson(jsonDecode(response.body));
        }
      `;
      
      const schema = parseFlutterNetwork(source, 'test.dart');
      
      expect(schema.endpoints).toHaveLength(1);
      expect(schema.endpoints[0].pathParams).toBeDefined();
      expect(schema.endpoints[0].pathParams?.length).toBeGreaterThan(0);
    });
  });

  describe('dio calls', () => {
    it('should parse dio.get()', () => {
      const source = `
        import 'package:dio/dio.dart';
        
        final dio = Dio();
        
        Future<List<User>> fetchUsers() async {
          final response = await dio.get('https://api.example.com/users');
          return (response.data as List).map((e) => User.fromJson(e)).toList();
        }
      `;
      
      const schema = parseFlutterNetwork(source, 'test.dart');
      
      expect(schema.endpoints).toHaveLength(1);
      expect(schema.endpoints[0].method).toBe('GET');
      expect(schema.endpoints[0].metadata?.sourceAPI).toBe('dio');
    });

    it('should parse dio.post() with data', () => {
      const source = `
        import 'package:dio/dio.dart';
        
        final dio = Dio();
        
        Future<User> createUser(Map<String, dynamic> userData) async {
          final response = await dio.post(
            'https://api.example.com/users',
            data: userData,
          );
          return User.fromJson(response.data);
        }
      `;
      
      const schema = parseFlutterNetwork(source, 'test.dart');
      
      expect(schema.endpoints).toHaveLength(1);
      expect(schema.endpoints[0].method).toBe('POST');
    });

    it('should extract dio interceptors', () => {
      const source = `
        import 'package:dio/dio.dart';
        
        final dio = Dio();
        
        void setupInterceptors() {
          dio.interceptors.request.add(AuthInterceptor());
          dio.interceptors.response.add(LoggingInterceptor());
        }
      `;
      
      const schema = parseFlutterNetwork(source, 'test.dart');
      
      expect(schema.interceptors).toBeDefined();
      expect(schema.interceptors?.length).toBeGreaterThan(0);
    });
  });

  describe('GraphQL calls', () => {
    it('should parse GraphQL query', () => {
      const source = `
        import 'package:graphql_flutter/graphql_flutter.dart';
        
        Future<List<User>> fetchUsers() async {
          final result = await client.query(
            QueryOptions(
              document: gql(r'''
                query GetUsers {
                  users {
                    id
                    name
                  }
                }
              '''),
            ),
          );
          return parseUsers(result.data);
        }
      `;
      
      const schema = parseFlutterNetwork(source, 'test.dart');
      
      expect(schema.endpoints).toHaveLength(1);
      expect(schema.endpoints[0].metadata?.sourceAPI).toBe('graphql');
    });
  });
});

describe('Network Schema Generation', () => {
  it('should generate valid network schema from React code', () => {
    const source = `
      import axios from 'axios';
      
      const api = axios.create({
        baseURL: 'https://api.example.com',
        timeout: 5000,
      });
      
      export async function getUsers() {
        return api.get('/users');
      }
      
      export async function createUser(data) {
        return api.post('/users', data);
      }
    `;
    
    const schema = parseReactNetwork(source, 'api.ts');
    
    expect(schema).toBeDefined();
    expect(schema.endpoints).toBeDefined();
    expect(schema.metadata?.sourceFramework).toBe('react');
  });

  it('should generate valid network schema from Flutter code', () => {
    const source = `
      import 'package:dio/dio.dart';
      
      class ApiService {
        final dio = Dio(BaseOptions(
          baseUrl: 'https://api.example.com',
          connectTimeout: Duration(seconds: 5),
        ));
        
        Future<List<User>> getUsers() async {
          final response = await dio.get('/users');
          return parseUsers(response.data);
        }
        
        Future<User> createUser(Map<String, dynamic> data) async {
          final response = await dio.post('/users', data: data);
          return User.fromJson(response.data);
        }
      }
    `;
    
    const schema = parseFlutterNetwork(source, 'api_service.dart');
    
    expect(schema).toBeDefined();
    expect(schema.endpoints).toBeDefined();
    expect(schema.metadata?.sourceFramework).toBe('flutter');
  });
});
