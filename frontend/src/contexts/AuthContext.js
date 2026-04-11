import React, { 
  createContext, 
  useState, 
  useContext, 
  useEffect 
} from 'react';
import { 
  login as apiLogin, 
  register as apiRegister, 
  getCurrentUser 
} from '../services/api';

// CREATE CONTEXT
const AuthContext = createContext();

// CUSTOM HOOK
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }
  return context;
};

// AUTH PROVIDER COMPONENT
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    localStorage.getItem('token')
  );
  const [loading, setLoading] = useState(true);

  // LOAD USER ON APP START
  useEffect(() => {
  if (token) {
    loadUser();
  } else {
    setLoading(false);
  }
}, [token]);

  const loadUser = async () => {
    try {
      const response = await getCurrentUser();
      setUser(response.data.data);
    } catch (error) {
      console.error('Load user error:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // LOGIN
  const login = async (email, password) => {
    const response = await apiLogin(email, password);
    const { token, ...userData } = response.data.data;

    localStorage.setItem('token', token);
    setToken(token);
    setUser(userData);

    return response;
  };

  // REGISTER
  const register = async (userData) => {
    const response = await apiRegister(userData);
    const { token, ...user } = response.data.data;

    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);

    return response;
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // UPDATE USER
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,           
    token,          
    loading,        
    login,          
    register,       
    logout,         
    updateUser,     
    isAuthenticated: !!token && !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};