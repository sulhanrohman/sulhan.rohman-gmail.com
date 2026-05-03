import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Task, TaskStatus } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock persistent login check
    const savedUser = localStorage.getItem('mock_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const signIn = (email: string) => {
    const isNotary = email.includes('notary');
    const newUser: User = {
      id: isNotary ? '1' : '2',
      name: isNotary ? 'John Notary' : 'Banking Agent Sarah',
      email,
      role: isNotary ? 'notary' : 'member',
    };
    setUser(newUser);
    localStorage.setItem('mock_user', JSON.stringify(newUser));
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('mock_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// --- Mock Data Management ---

export const useTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('mock_tasks');
    if (saved) {
      setTasks(JSON.parse(saved));
    } else {
      const initial: Task[] = [
        {
          id: '1',
          title: 'Mortgage Document Verification',
          description: 'Verify the income statements for the new mortgage application #8821.',
          assignedTo: '2',
          assignedToName: 'Sarah Agent',
          status: TaskStatus.PENDING,
          createdAt: Date.now() - 86400000,
          updatedAt: Date.now() - 86400000,
          dueDate: Date.now() + 172800000,
        },
        {
          id: '2',
          title: 'Signature Certification - Bond #445',
          description: 'Awaiting signature verification for the municipal bond document.',
          assignedTo: '2',
          assignedToName: 'Sarah Agent',
          status: TaskStatus.UPLOADED,
          createdAt: Date.now() - 43200000,
          updatedAt: Date.now() - 10000,
          dueDate: Date.now() + 86400000,
          resultUrl: 'https://example.com/result.pdf',
          resultNotes: 'Attached the scanned and verified document.',
        }
      ];
      setTasks(initial);
      localStorage.setItem('mock_tasks', JSON.stringify(initial));
    }
  }, []);

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const newTasks = tasks.map(t => t.id === taskId ? { ...t, ...updates, updatedAt: Date.now() } : t);
    setTasks(newTasks);
    localStorage.setItem('mock_tasks', JSON.stringify(newTasks));
  };

  const createTask = (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...task,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const newTasks = [...tasks, newTask];
    setTasks(newTasks);
    localStorage.setItem('mock_tasks', JSON.stringify(newTasks));
  };

  return { tasks, updateTask, createTask };
};
