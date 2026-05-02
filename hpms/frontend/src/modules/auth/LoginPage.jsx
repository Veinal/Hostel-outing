import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleRedirect = (role) => {
    switch (role) {
      case 'STUDENT': return navigate('/student/dashboard');
      case 'WARDEN':
      case 'CHIEF_WARDEN': return navigate('/warden/dashboard');
      case 'ADMIN': return navigate('/admin/dashboard');
      case 'SECURITY': return navigate('/gate/scan');
      default: return navigate('/');
    }
  };

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated && user) {
      handleRedirect(user.role);
    }
  }, [isAuthenticated, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      handleRedirect(res.data.user.role);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        if (err.response.data.error.code === 'AUTH_INVALID_CREDENTIALS') {
          setError('Invalid email or password');
        } else {
          setError(err.response.data.error.message || 'An error occurred during login');
        }
      } else {
        setError('Network error or server is down');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>HPMS Login</h2>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px' }}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
