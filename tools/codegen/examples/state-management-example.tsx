/**
 * State Management Example
 * Demonstrates React useState and useEffect conversion to Flutter
 */

import React, { useState, useEffect } from 'react';

export default function TodoApp() {
  // State management with useState
  const [todos, setTodos] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [filter, setFilter] = useState('all');

  // Effect hook for mount
  useEffect(() => {
    console.log('TodoApp mounted');
    // Load todos from storage
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
    }
  }, []);

  // Effect hook with dependencies
  useEffect(() => {
    console.log('Todos changed:', todos.length);
    // Save todos to storage
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  // Effect hook with cleanup
  useEffect(() => {
    const timer = setInterval(() => {
      console.log('Timer tick');
    }, 1000);

    return () => {
      clearInterval(timer);
      console.log('Timer cleaned up');
    };
  }, []);

  // Event handlers
  const handleAddTodo = () => {
    if (inputValue.trim()) {
      setTodos([...todos, inputValue]);
      setInputValue('');
    }
  };

  const handleRemoveTodo = (index: number) => {
    setTodos(todos.filter((_, i) => i !== index));
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
  };

  // Filtered todos
  const filteredTodos = todos.filter(todo => {
    if (filter === 'all') return true;
    if (filter === 'completed') return todo.includes('[x]');
    if (filter === 'active') return !todo.includes('[x]');
    return true;
  });

  return (
    <div>
      <h1>Todo App</h1>
      
      <div>
        <input 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter todo"
        />
        <button onClick={handleAddTodo}>Add</button>
      </div>

      <div>
        <button onClick={() => handleFilterChange('all')}>All</button>
        <button onClick={() => handleFilterChange('active')}>Active</button>
        <button onClick={() => handleFilterChange('completed')}>Completed</button>
      </div>

      <ul>
        {filteredTodos.map((todo, index) => (
          <li key={index}>
            <span>{todo}</span>
            <button onClick={() => handleRemoveTodo(index)}>Remove</button>
          </li>
        ))}
      </ul>

      <div>
        <p>Total: {todos.length}</p>
        <p>Showing: {filteredTodos.length}</p>
      </div>
    </div>
  );
}
