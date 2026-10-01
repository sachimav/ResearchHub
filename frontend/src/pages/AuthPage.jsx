import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import projectLogo from '../assets/logo.png';
import {
  registerUser,
  loginUser,
  isValidEmail,
  emailExists
} from '../services/authService';

export default function AuthPage({ initialMode = 'login' }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Mode: 'login' | 'register'
  const urlMode = searchParams.get('mode');
  const [authMode, setAuthMode] = useState(
    urlMode === 'register' || initialMode === 'register' ? 'register' : 'login'
  );

  // Role: 'student' | 'public' | 'supervisor'
  const urlRole = searchParams.get('role');
  const [selectedRole, setSelectedRole] = useState(
    urlRole === 'supervisor' || urlRole === 'public' || urlRole === 'student'
      ? urlRole
      : 'student'
  );

  // Form Fields State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    institution: '',
    designation: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  // Validation errors & submission message states
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [registeredUserInfo, setRegisteredUserInfo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset or adjust form on role or mode change
  useEffect(() => {
    setErrors({});
    setServerError('');
  }, [authMode, selectedRole]);

  // Keep state synced with query params if they change
  useEffect(() => {
    if (urlMode === 'register' || urlMode === 'login') {
      setAuthMode(urlMode);
    }
    if (urlRole === 'student' || urlRole === 'public' || urlRole === 'supervisor') {
      setSelectedRole(urlRole);
    }
  }, [urlMode, urlRole]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear inline error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  // Field validation
  const validateForm = () => {
    const errs = {};

    // Validate email
    if (!formData.email.trim()) {
      errs.email = 'User Email is required';
    } else if (!isValidEmail(formData.email)) {
      errs.email = 'Please enter a valid email address (e.g. name@domain.com)';
    }

    // Validate password
    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    // Registration specific validations
    if (authMode === 'register') {
      if (!formData.name.trim()) {
        errs.name = 'Name is required';
      }

      if (!formData.confirmPassword) {
        errs.confirmPassword = 'Confirm Password is required';
      } else if (formData.password !== formData.confirmPassword) {
        errs.confirmPassword = 'Password and Confirm Password do not match';
      }

      // Public User specific registration fields
      if (selectedRole === 'public') {
        if (!formData.institution.trim()) {
          errs.institution = 'Institution is required';
        }
        if (!formData.designation.trim()) {
          errs.designation = 'Designation is required';
        }
        if (!formData.phone.trim()) {
          errs.phone = 'Phone Number is required';
        }
      }

      // Duplicate email check
      if (formData.email.trim() && isValidEmail(formData.email) && emailExists(formData.email)) {
        errs.email = 'An account with this email already exists. Please login.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (authMode === 'register') {
        // Perform registration
        const result = registerUser(selectedRole, formData);
        if (result.success) {
          setRegisteredUserInfo({
            name: formData.name,
            email: formData.email,
            role: selectedRole
          });
          setShowSuccessPopup(true);
          // Reset form fields
          setFormData((prev) => ({
            ...prev,
            password: '',
            confirmPassword: '',
            phone: '',
            institution: '',
            designation: ''
          }));
        } else {
          setServerError(result.error);
        }
      } else {
        // Perform login
        const result = loginUser(selectedRole, formData.email, formData.password);
        if (result.success) {
          // Role-based Navigation as per requirements:
          // - Student -> Navigate to the Student Portal.
          // - Public User -> Navigate to the Research Showcase page.
          // - Supervisor -> Navigate to the Supervisor Portal.
          if (selectedRole === 'student') {
            navigate('/student-portal');
          } else if (selectedRole === 'public') {
            navigate('/showcase');
          } else if (selectedRole === 'supervisor') {
            navigate('/supervisor-portal');
          }
        } else {
          setServerError(result.error);
        }
      }
    } catch (err) {
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccessPopup = () => {
    setShowSuccessPopup(false);
    // Switch to Login tab with pre-filled email
    setAuthMode('login');
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'student':
        return 'Student';
      case 'public':
        return 'Public User';
      case 'supervisor':
        return 'Supervisor';
      default:
        return 'User';
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card-container">
        {/* Back Link */}
        <div className="auth-top-nav">
          <Link to="/" className="auth-back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Main Glass Card */}
        <div className="auth-main-card glass-card">
          {/* Header with Project Logo */}
          <div className="auth-header">
            <Link to="/" className="auth-logo-link" title="ResearchHub - University of Vavuniya">
              <img
                src={projectLogo}
                alt="ResearchHub Logo"
                className="auth-project-logo"
              />
            </Link>
            <h1 className="auth-title">ResearchHub Authentication</h1>
            <p className="auth-subtitle">
              University of Vavuniya Research Project Management System
            </p>
          </div>

          {/* Mode Switcher: Login / Register */}
          <div className="auth-mode-toggle">
            <button
              type="button"
              id="mode-login-btn"
              className={`mode-toggle-btn ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => setAuthMode('login')}
            >
              Sign In
            </button>
            <button
              type="button"
              id="mode-register-btn"
              className={`mode-toggle-btn ${authMode === 'register' ? 'active' : ''}`}
              onClick={() => setAuthMode('register')}
            >
              Register
            </button>
          </div>

          {/* Role Switcher: Student | Public User | Supervisor */}
          <div className="auth-role-tabs-wrap">
            <span className="auth-role-label">Select User Role:</span>
            <div className="auth-role-tabs">
              <button
                type="button"
                id="role-student-btn"
                className={`auth-role-btn ${selectedRole === 'student' ? 'active' : ''}`}
                onClick={() => setSelectedRole('student')}
              >
                <span className="role-icon">🎓</span>
                <span className="role-title">Student</span>
              </button>

              <button
                type="button"
                id="role-public-btn"
                className={`auth-role-btn ${selectedRole === 'public' ? 'active' : ''}`}
                onClick={() => setSelectedRole('public')}
              >
                <span className="role-icon">👥</span>
                <span className="role-title">Public User</span>
              </button>

              <button
                type="button"
                id="role-supervisor-btn"
                className={`auth-role-btn ${selectedRole === 'supervisor' ? 'active' : ''}`}
                onClick={() => setSelectedRole('supervisor')}
              >
                <span className="role-icon">👨‍🏫</span>
                <span className="role-title">Supervisor</span>
              </button>
            </div>
          </div>

          {/* Dynamic Title for Current Selection */}
          <div className="auth-form-heading">
            <h2 className="auth-form-title">
              {authMode === 'login' ? 'Login as' : 'Register as'}{' '}
              <span className="highlight-role">{getRoleDisplayName(selectedRole)}</span>
            </h2>
            <p className="auth-form-desc">
              {authMode === 'login'
                ? `Enter your registered email and password to access the ${getRoleDisplayName(selectedRole)} portal.`
                : `Create your verified ${getRoleDisplayName(selectedRole)} account to get started.`}
            </p>
          </div>

          {/* Global Server / Validation Alert */}
          {serverError && (
            <div className="auth-alert auth-alert-error" role="alert">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{serverError}</span>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {/* === Registration Fields: Name (For Student, Public User, Supervisor) === */}
            {authMode === 'register' && (
              <div className="form-group">
                <label className="input-label" htmlFor="auth-name">
                  Name <span className="field-required">*</span>
                </label>
                <input
                  id="auth-name"
                  type="text"
                  className={`form-input-styled ${errors.name ? 'input-error' : ''}`}
                  placeholder={
                    selectedRole === 'supervisor'
                      ? 'e.g. Dr. T. Kartheepan'
                      : selectedRole === 'student'
                      ? 'e.g. S. Mithun'
                      : 'e.g. Dr. Anura Perera'
                  }
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  autoComplete="name"
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>
            )}

            {/* === Public User Registration Specific Fields: Institution, Designation, Phone === */}
            {authMode === 'register' && selectedRole === 'public' && (
              <>
                <div className="form-row-dual">
                  <div className="form-group">
                    <label className="input-label" htmlFor="auth-institution">
                      Institution <span className="field-required">*</span>
                    </label>
                    <input
                      id="auth-institution"
                      type="text"
                      className={`form-input-styled ${errors.institution ? 'input-error' : ''}`}
                      placeholder="e.g. AgriTech Lanka PLC / Company"
                      value={formData.institution}
                      onChange={(e) => handleInputChange('institution', e.target.value)}
                    />
                    {errors.institution && (
                      <span className="error-text">{errors.institution}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="input-label" htmlFor="auth-designation">
                      Designation <span className="field-required">*</span>
                    </label>
                    <input
                      id="auth-designation"
                      type="text"
                      className={`form-input-styled ${errors.designation ? 'input-error' : ''}`}
                      placeholder="e.g. Senior Research Analyst"
                      value={formData.designation}
                      onChange={(e) => handleInputChange('designation', e.target.value)}
                    />
                    {errors.designation && (
                      <span className="error-text">{errors.designation}</span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="input-label" htmlFor="auth-phone">
                    Phone Number <span className="field-required">*</span>
                  </label>
                  <input
                    id="auth-phone"
                    type="tel"
                    className={`form-input-styled ${errors.phone ? 'input-error' : ''}`}
                    placeholder="e.g. +94 77 123 4567"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    autoComplete="tel"
                  />
                  {errors.phone && <span className="error-text">{errors.phone}</span>}
                </div>
              </>
            )}

            {/* === User Email (All Roles & Both Modes) === */}
            <div className="form-group">
              <label className="input-label" htmlFor="auth-email">
                User Email <span className="field-required">*</span>
              </label>
              <input
                id="auth-email"
                type="email"
                className={`form-input-styled ${errors.email ? 'input-error' : ''}`}
                placeholder={
                  selectedRole === 'student'
                    ? 'e.g. student@vau.ac.lk'
                    : selectedRole === 'supervisor'
                    ? 'e.g. supervisor@vau.ac.lk'
                    : 'e.g. user@organization.com'
                }
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                autoComplete="email"
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
              <span className="input-helper">
                {selectedRole === 'student'
                  ? 'University student email address'
                  : selectedRole === 'supervisor'
                  ? 'Faculty or institutional staff email'
                  : 'Valid professional or personal email'}
              </span>
            </div>

            {/* === Password (All Roles & Both Modes) === */}
            <div className="form-group">
              <label className="input-label" htmlFor="auth-password">
                Password <span className="field-required">*</span>
              </label>
              <input
                id="auth-password"
                type="password"
                className={`form-input-styled ${errors.password ? 'input-error' : ''}`}
                placeholder="Enter password (min. 6 characters)"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            {/* === Confirm Password (All Roles, Registration Only) === */}
            {authMode === 'register' && (
              <div className="form-group">
                <label className="input-label" htmlFor="auth-confirm-password">
                  Confirm Password <span className="field-required">*</span>
                </label>
                <input
                  id="auth-confirm-password"
                  type="password"
                  className={`form-input-styled ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <span className="error-text">{errors.confirmPassword}</span>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="form-submit-row">
              <button
                type="submit"
                id="auth-submit-btn"
                className="btn btn-primary btn-block auth-submit-btn"
                disabled={isSubmitting}
              >
                <span>
                  {isSubmitting
                    ? 'Processing...'
                    : authMode === 'login'
                    ? `Sign In as ${getRoleDisplayName(selectedRole)}`
                    : `Complete ${getRoleDisplayName(selectedRole)} Registration`}
                </span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Switch Mode Prompt */}
            <div className="auth-mode-footer">
              {authMode === 'login' ? (
                <p>
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    className="auth-link-btn"
                    onClick={() => setAuthMode('register')}
                  >
                    Register here
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="auth-link-btn"
                    onClick={() => setAuthMode('login')}
                  >
                    Sign in here
                  </button>
                </p>
              )}
            </div>
          </form>

          {/* Quick Demo Credentials Info for Evaluation */}
          <div className="auth-demo-hint">
            <details>
              <summary>Need demo credentials for instant testing?</summary>
              <div className="demo-credentials-box">
                <p><strong>Student:</strong> student@vau.ac.lk / password123</p>
                <p><strong>Supervisor:</strong> supervisor@vau.ac.lk / password123</p>
                <p><strong>Public User:</strong> anura.perera@agritech.lk / password123</p>
                <p className="demo-note">Or register a brand new account with any valid email!</p>
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* ============================================================
          POPUP MODAL: "Successfully Registered"
          Explicit requirement: After successful registration:
          Show a popup message: "Successfully Registered"
         ============================================================ */}
      {showSuccessPopup && (
        <div className="modal-overlay" onClick={handleCloseSuccessPopup}>
          <div
            className="success-popup-modal glass-card animate-popup-in"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="popup-title"
          >
            <div className="popup-icon-wrap">
              <div className="popup-icon-bubble">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>

            <h3 id="popup-title" className="popup-title">
              Successfully Registered
            </h3>

            <p className="popup-desc">
              Your account has been created successfully as a{' '}
              <strong>{getRoleDisplayName(registeredUserInfo?.role)}</strong>.
            </p>

            <div className="popup-details-card">
              <div className="popup-detail-row">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{registeredUserInfo?.name}</span>
              </div>
              <div className="popup-detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{registeredUserInfo?.email}</span>
              </div>
              <div className="popup-detail-row">
                <span className="detail-label">Role:</span>
                <span className="badge-pill badge-plum">
                  {getRoleDisplayName(registeredUserInfo?.role)}
                </span>
              </div>
            </div>

            <div className="popup-actions">
              <button
                type="button"
                id="popup-proceed-login-btn"
                className="btn btn-primary btn-block"
                onClick={handleCloseSuccessPopup}
              >
                <span>Proceed to Login</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
