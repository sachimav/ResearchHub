import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  registerUser,
  loginUser,
  isValidEmail,
  emailExists,
  regNoExists,
  getRegistrationOptions,
  DEGREE_PROGRAMS,
  SUPERVISOR_DESIGNATIONS
} from '../services/authService';

export default function AuthPage({ initialMode = 'login' }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Mode: 'login' | 'register'
  const urlMode = searchParams.get('mode');
  const [authMode, setAuthMode] = useState(
    urlMode === 'register' || initialMode === 'register' ? 'register' : 'login'
  );

  // Role: 'student' | 'supervisor' | 'public'
  const urlRole = searchParams.get('role');
  const validRoles = ['student', 'supervisor', 'public'];
  const [selectedRole, setSelectedRole] = useState(
    validRoles.includes(urlRole) ? urlRole : 'student'
  );

  // Form Fields State matching Database Models
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Student model fields (Student.js)
    regNo: '',
    department: '',
    batch: '',
    program: '',
    // Supervisor model fields (supervisor.js)
    designation: '',
    expertise: '',
    // Public User model fields (user.js extended)
    institution: '',
    phone: ''
  });

  // Validation errors & submission message states
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successPopupMode, setSuccessPopupMode] = useState('register');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [registrationOptionsError, setRegistrationOptionsError] = useState('');
  const [isLoadingRegistrationOptions, setIsLoadingRegistrationOptions] = useState(true);

  // Clear errors when changing mode or role
  useEffect(() => {
    setErrors({});
    setServerError('');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [authMode, selectedRole]);

  useEffect(() => {
    let isCurrent = true;

    getRegistrationOptions()
      .then(({ departments: departmentOptions, batches: batchOptions }) => {
        if (isCurrent) {
          setDepartments(departmentOptions);
          setBatches(batchOptions);
          setIsLoadingRegistrationOptions(false);
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setRegistrationOptionsError(error.message);
          setIsLoadingRegistrationOptions(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  // Keep state synced with query params and ensure page starts from top
  useEffect(() => {
    if (urlMode === 'register' || urlMode === 'login') {
      setAuthMode(urlMode);
    }
    if (validRoles.includes(urlRole)) {
      setSelectedRole(urlRole);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [urlMode, urlRole]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  // Comprehensive validation strictly conforming to Database Models
  const validateForm = () => {
    const errs = {};

    // Validate email (required in user.js)
    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!isValidEmail(formData.email)) {
      errs.email = 'Please enter a valid email address.';
    }

    // Validate password (required in user.js)
    if (!formData.password) {
      errs.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }

    // Registration specific validations matching Mongoose models
    if (authMode === 'register') {
      // Name (required in user.js)
      if (!formData.name.trim()) {
        errs.name = 'Full Name is required.';
      }

      // Password Confirmation
      if (!formData.confirmPassword) {
        errs.confirmPassword = 'Confirm Password is required.';
      } else if (formData.password !== formData.confirmPassword) {
        errs.confirmPassword = 'Password and Confirm Password do not match.';
      }

      // Duplicate email check (unique in user.js)
      if (formData.email.trim() && isValidEmail(formData.email) && emailExists(formData.email)) {
        errs.email = 'An account with this email already exists. Please login.';
      }

      if (isValidEmail(formData.email)) {
        const emailDomain = formData.email.trim().toLowerCase().split('@')[1];
        if (selectedRole === 'student' && emailDomain !== 'stu.vau.ac.lk') {
          errs.email = 'Student accounts must use an @stu.vau.ac.lk email address.';
        } else if (selectedRole === 'supervisor' && emailDomain !== 'vau.ac.lk') {
          errs.email = 'Supervisor accounts must use an @vau.ac.lk email address.';
        }
      }

      // ── Role: Student (models/Student.js) ──
      if (selectedRole === 'student') {
        const regNo = (formData.regNo || '').trim().toUpperCase();
        if (!regNo) {
          errs.regNo = 'Student Registration Number (e.g. 2020/ICT/042) is required.';
        } else if (regNoExists(regNo)) {
          errs.regNo = `Registration Number "${regNo}" is already registered.`;
        }

        if (!formData.department.trim()) {
          errs.department = 'Academic Department is required.';
        }

        if (!formData.batch.trim()) {
          errs.batch = 'Academic Batch / Year is required.';
        }

        if (!formData.program.trim()) {
          errs.program = 'Degree Program is required.';
        }
      }

      // ── Role: Supervisor (models/supervisor.js) ──
      if (selectedRole === 'supervisor') {
        if (!formData.designation.trim()) {
          errs.designation = 'Academic Designation is required.';
        }
        if (!formData.department.trim()) {
          errs.department = 'Academic Department is required.';
        }
        if (!formData.expertise.trim()) {
          errs.expertise = 'Research Expertise / Specialization is required.';
        }
      }

      // ── Role: Public / Industry User (models/user.js) ──
      if (selectedRole === 'public') {
        if (!formData.institution.trim()) {
          errs.institution = 'Institution / Organization is required.';
        }
        if (!formData.designation.trim()) {
          errs.designation = 'Designation / Job Title is required.';
        }
        if (!formData.phone.trim()) {
          errs.phone = 'Phone Number is required.';
        }
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (authMode === 'register') {
        const result = await registerUser(selectedRole, formData);

        if (result.success) {
          setSuccessPopupMode('register');
          setShowSuccessPopup(true);
          setFormData((prev) => ({
            ...prev,
            password: '',
            confirmPassword: ''
          }));
        } else {
          setServerError(result.error);
        }
      } else {
        const result = await loginUser(selectedRole, formData.email, formData.password);

        if (result.success) {
          setSuccessPopupMode('login');
          setShowSuccessPopup(true);
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

    if (successPopupMode === 'login') {
      const redirectPath = searchParams.get('redirect');
      navigate(redirectPath || '/showcase');
      return;
    }
    setAuthMode('login');
    setAuthMode('login');
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'student':
        return 'Student';
      case 'supervisor':
        return 'Supervisor';
      case 'public':
        return 'Public User';
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
          {/* Header */}
          <div className="auth-header">
            <h1 className="auth-title">ResearchHub</h1>
            <p className="auth-subtitle">
              University of Vavuniya Research Management System
            </p>
          </div>

          {/* Mode Switcher: Sign In / Register */}
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

          {/* Role Switcher: Student | Supervisor | Public User */}
          <div className="auth-role-tabs-wrap">
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
                id="role-supervisor-btn"
                className={`auth-role-btn ${selectedRole === 'supervisor' ? 'active' : ''}`}
                onClick={() => setSelectedRole('supervisor')}
              >
                <span className="role-icon">👨‍🏫</span>
                <span className="role-title">Supervisor</span>
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
            </div>
          </div>

          {/* Dynamic Title for Current Selection */}
          <div className="auth-form-heading">
            <h2 className="auth-form-title">
              {authMode === 'login' ? 'Sign In as' : 'Register as'}{' '}
              <span className="highlight-role">{getRoleDisplayName(selectedRole)}</span>
            </h2>
            <p className="auth-form-desc">
              {authMode === 'login'
                ? `Enter your registered credentials to access the ${getRoleDisplayName(selectedRole)} workspace.`
                : `Create your verified ${getRoleDisplayName(selectedRole)} account matching University academic records.`}
            </p>
          </div>

          {/* Message Prompt when redirected from showcase */}
          {searchParams.get('message') === 'login_required' && (
            <div className="auth-alert" style={{ background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '10px' }} role="status">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>Please sign in or register to view full research abstracts and details.</span>
            </div>
          )}

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

          {registrationOptionsError && authMode === 'register' && (
            <div className="auth-alert auth-alert-error" role="alert">
              {registrationOptionsError}
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {/* ========================================================
                REGISTRATION FIELDS (Tailored strictly to DB Models)
               ======================================================== */}
            {authMode === 'register' && (
              <>
                {/* Full Name (All Roles -> user.js: name) */}
                <div className="form-group">
                  <label className="input-label" htmlFor="auth-name">
                    Full Name <span className="field-required">*</span>
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    className={`form-input-styled ${errors.name ? 'input-error' : ''}`}
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    autoComplete="name"
                  />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

                {/* ── STUDENT SPECIFIC FIELDS (models/Student.js) ── */}
                {selectedRole === 'student' && (
                  <>
                    <div className="form-row-dual">
                      {/* regNo (unique in Student.js) */}
                      <div className="form-group">
                        <label className="input-label" htmlFor="auth-regno">
                          Registration / Index No <span className="field-required">*</span>
                        </label>
                        <input
                          id="auth-regno"
                          type="text"
                          className={`form-input-styled ${errors.regNo ? 'input-error' : ''}`}
                          placeholder="e.g. 2020/ICT/042"
                          value={formData.regNo}
                          onChange={(e) => handleInputChange('regNo', e.target.value.toUpperCase())}
                        />
                        {errors.regNo && <span className="error-text">{errors.regNo}</span>}
                        <span className="input-helper">University Index / Registration Number</span>
                      </div>

                      {/* batchId / batch (ref: batch in Student.js) */}
                      <div className="form-group">
                        <label className="input-label" htmlFor="auth-batch">
                          Academic Batch / Year <span className="field-required">*</span>
                        </label>
                        <select
                          id="auth-batch"
                          className={`form-input-styled ${errors.batch ? 'input-error' : ''}`}
                          value={formData.batch}
                          onChange={(e) => handleInputChange('batch', e.target.value)}
                          disabled={isLoadingRegistrationOptions || Boolean(registrationOptionsError)}
                        >
                          <option value="">
                            {isLoadingRegistrationOptions
                              ? 'Loading batches...'
                              : batches.length
                                ? 'Select Academic Batch...'
                                : 'No batches available'}
                          </option>
                          {batches.map((batch) => (
                            <option key={batch._id} value={batch._id}>
                              Batch {batch.batchName}
                            </option>
                          ))}
                        </select>
                        {errors.batch && <span className="error-text">{errors.batch}</span>}
                      </div>
                    </div>

                    {/* departmentId / department (ref: departments in Student.js) */}
                    <div className="form-group">
                      <label className="input-label" htmlFor="auth-department">
                        Academic Department <span className="field-required">*</span>
                      </label>
                      <select
                        id="auth-department"
                        className={`form-input-styled ${errors.department ? 'input-error' : ''}`}
                        value={formData.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        disabled={isLoadingRegistrationOptions || Boolean(registrationOptionsError)}
                      >
                        <option value="">
                          {isLoadingRegistrationOptions
                            ? 'Loading departments...'
                            : departments.length
                              ? 'Select Department...'
                              : 'No departments available'}
                        </option>
                        {departments.map((department) => (
                          <option key={department._id} value={department._id}>
                            {department.name}
                          </option>
                        ))}
                      </select>
                      {errors.department && <span className="error-text">{errors.department}</span>}
                    </div>

                    {/* program (required string in Student.js) */}
                    <div className="form-group">
                      <label className="input-label" htmlFor="auth-program">
                        Degree Program <span className="field-required">*</span>
                      </label>
                      <select
                        id="auth-program"
                        className={`form-input-styled ${errors.program ? 'input-error' : ''}`}
                        value={formData.program}
                        onChange={(e) => handleInputChange('program', e.target.value)}
                      >
                        <option value="">Select Degree Program...</option>
                        {DEGREE_PROGRAMS.map((prog) => (
                          <option key={prog} value={prog}>
                            {prog}
                          </option>
                        ))}
                      </select>
                      {errors.program && <span className="error-text">{errors.program}</span>}
                    </div>
                  </>
                )}

                {/* ── SUPERVISOR SPECIFIC FIELDS (models/supervisor.js) ── */}
                {selectedRole === 'supervisor' && (
                  <>
                    <div className="form-row-dual">
                      {/* designation (supervisor.js: designation) */}
                      <div className="form-group">
                        <label className="input-label" htmlFor="auth-sup-designation">
                          Academic Designation <span className="field-required">*</span>
                        </label>
                        <select
                          id="auth-sup-designation"
                          className={`form-input-styled ${errors.designation ? 'input-error' : ''}`}
                          value={formData.designation}
                          onChange={(e) => handleInputChange('designation', e.target.value)}
                        >
                          <option value="">Select Designation...</option>
                          {SUPERVISOR_DESIGNATIONS.map((desig) => (
                            <option key={desig} value={desig}>
                              {desig}
                            </option>
                          ))}
                        </select>
                        {errors.designation && (
                          <span className="error-text">{errors.designation}</span>
                        )}
                      </div>

                      {/* departmentId / department (ref: departments in supervisor.js) */}
                      <div className="form-group">
                        <label className="input-label" htmlFor="auth-sup-dept">
                          Department <span className="field-required">*</span>
                        </label>
                        <select
                          id="auth-sup-dept"
                          className={`form-input-styled ${errors.department ? 'input-error' : ''}`}
                          value={formData.department}
                          onChange={(e) => handleInputChange('department', e.target.value)}
                          disabled={isLoadingRegistrationOptions || Boolean(registrationOptionsError)}
                        >
                          <option value="">
                            {isLoadingRegistrationOptions
                              ? 'Loading departments...'
                              : departments.length
                                ? 'Select Department...'
                                : 'No departments available'}
                          </option>
                          {departments.map((department) => (
                            <option key={department._id} value={department._id}>
                              {department.name}
                            </option>
                          ))}
                        </select>
                        {errors.department && (
                          <span className="error-text">{errors.department}</span>
                        )}
                      </div>
                    </div>

                    {/* expertise (supervisor.js: expertise array) */}
                    <div className="form-group">
                      <label className="input-label" htmlFor="auth-expertise">
                        Research Expertise &amp; Specialization <span className="field-required">*</span>
                      </label>
                      <input
                        id="auth-expertise"
                        type="text"
                        className={`form-input-styled ${errors.expertise ? 'input-error' : ''}`}
                        placeholder="e.g. Artificial Intelligence, Computer Vision, Edge Computing"
                        value={formData.expertise}
                        onChange={(e) => handleInputChange('expertise', e.target.value)}
                      />
                      {errors.expertise && <span className="error-text">{errors.expertise}</span>}
                      <span className="input-helper">Comma-separated research domains &amp; specializations</span>
                    </div>
                  </>
                )}

                {/* ── PUBLIC USER SPECIFIC FIELDS (models/user.js extended) ── */}
                {selectedRole === 'public' && (
                  <>
                    <div className="form-row-dual">
                      <div className="form-group">
                        <label className="input-label" htmlFor="auth-institution">
                          Organization / Company <span className="field-required">*</span>
                        </label>
                        <input
                          id="auth-institution"
                          type="text"
                          className={`form-input-styled ${errors.institution ? 'input-error' : ''}`}
                          placeholder="e.g. AgriTech Lanka PLC"
                          value={formData.institution}
                          onChange={(e) => handleInputChange('institution', e.target.value)}
                        />
                        {errors.institution && (
                          <span className="error-text">{errors.institution}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="input-label" htmlFor="auth-designation">
                          Designation / Title <span className="field-required">*</span>
                        </label>
                        <input
                          id="auth-designation"
                          type="text"
                          className={`form-input-styled ${errors.designation ? 'input-error' : ''}`}
                          placeholder="e.g. Lead Research Scientist"
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
                        Contact Phone Number <span className="field-required">*</span>
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
              </>
            )}

            {/* ========================================================
                COMMON CREDENTIALS (Email & Password)
               ======================================================== */}
            {/* User Email (user.js: email) */}
            <div className="form-group">
              <label className="input-label" htmlFor="auth-email">
                Email Address <span className="field-required">*</span>
              </label>
              <input
                id="auth-email"
                type="email"
                className={`form-input-styled ${errors.email ? 'input-error' : ''}`}
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                autoComplete="email"
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
              <span className="input-helper">
                {selectedRole === 'student'
                  ? 'University student email address'
                  : selectedRole === 'supervisor'
                    ? 'Faculty or academic staff email address'
                    : 'Valid email address'}
              </span>
            </div>

            {/* Password (user.js: password) */}
            <div className="form-group">
              <label className="input-label" htmlFor="auth-password">
                Password <span className="field-required">*</span>
              </label>
              <input
                id="auth-password"
                type="password"
                className={`form-input-styled ${errors.password ? 'input-error' : ''}`}
                placeholder="Enter password (minimum 6 characters)"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            {/* Confirm Password (Registration Only) */}
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
        </div>
      </div>

      {/* ============================================================
          POPUP MODAL: "Successfully Registered"
          Displays complete DB schema-aligned attributes
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
              {successPopupMode === 'login' ? 'Login Successful' : 'Registration Successful'}
            </h3>

            <div className="popup-actions">
              <button
                type="button"
                id="popup-proceed-login-btn"
                className="btn btn-primary btn-block"
                onClick={handleCloseSuccessPopup}
              >
                <span>
                  {successPopupMode === 'login' ? 'Continue to Showcase' : 'Proceed to Login'}
                </span>
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
