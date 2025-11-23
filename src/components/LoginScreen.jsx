import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Home, AlertCircle, Loader2 } from 'lucide-react';

const LoginScreen = () => {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!code.trim()) {
      setError('Veuillez entrer le code secret');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const result = await login(code);

    if (!result.success) {
      setError(result.error || 'Code incorrect');
      setCode('');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="login-screen">
      <div className="login-background">
        <div className="gradient-overlay"></div>
      </div>

      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="icon-container">
              <Home className="icon-home" />
            </div>
            <h1>Family Dashboard</h1>
            <p>Entrez le code secret pour accéder au tableau de bord familial</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <Lock className="input-icon" />
              <input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Code secret"
                className="code-input"
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            {error && (
              <div className="error-message">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="spinner" />
                  Vérification...
                </>
              ) : (
                'Accéder au Dashboard'
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>🔐 Connexion sécurisée</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-screen {
          min-height: 100vh;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }

        .login-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          z-index: -1;
        }

        .gradient-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background:
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3), transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3), transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.1), transparent 50%);
        }

        .login-container {
          width: 100%;
          max-width: 420px;
          padding: 20px;
          z-index: 1;
        }

        .login-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .login-header {
          text-align: center;
          margin-bottom: 35px;
        }

        .icon-container {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          margin-bottom: 20px;
        }

        .icon-home {
          color: white;
          width: 40px;
          height: 40px;
        }

        .login-header h1 {
          margin: 0 0 10px 0;
          font-size: 28px;
          font-weight: 700;
          color: #1a202c;
        }

        .login-header p {
          margin: 0;
          font-size: 14px;
          color: #718096;
        }

        .login-form {
          margin-bottom: 30px;
        }

        .input-group {
          position: relative;
          margin-bottom: 20px;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #a0aec0;
          width: 20px;
          height: 20px;
        }

        .code-input {
          width: 100%;
          padding: 12px 16px 12px 48px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 16px;
          transition: all 0.3s ease;
          background: white;
          color: #1a202c;
        }

        .code-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .code-input:disabled {
          background: #f7fafc;
          cursor: not-allowed;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
          padding: 10px 14px;
          background: #fff5f5;
          border: 1px solid #feb2b2;
          border-radius: 8px;
          color: #c53030;
          font-size: 14px;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .submit-button {
          width: 100%;
          padding: 12px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .login-footer {
          text-align: center;
        }

        .login-footer p {
          margin: 0;
          font-size: 12px;
          color: #a0aec0;
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 30px 20px;
          }

          .login-header h1 {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginScreen;