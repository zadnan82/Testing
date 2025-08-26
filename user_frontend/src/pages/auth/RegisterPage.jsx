import React, { useState } from 'react';
import { Code, User, Mail, Lock, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

const RegisterPage = ({ onSwitchToLogin }) => {
  const { register, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const validateForm = () => {
    const errors = {};

    // First name validation
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (formData.password.length > 64) {
      errors.password = 'Password must be less than 64 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    clearError();
    setRegistrationSuccess(false);

    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        userTypeId: 1 // Default user type
      });
      
      setRegistrationSuccess(true);
      // Clear form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
    } catch (err) {
      // Error is handled by context and displayed in UI
      console.error('Registration failed:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    clearError();
    setRegistrationSuccess(false);
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <UserPlus className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h1>
            <p className="text-gray-600 mb-6">
              Your account has been created successfully. You can now sign in with your credentials.
            </p>
            <Button
              onClick={onSwitchToLogin}
              className="w-full"
            >
              Go to Sign In
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Code className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">Sign up for a new account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              name="firstName"
              icon={User}
              value={formData.firstName}
              onChange={handleChange}
              error={formErrors.firstName}
              required
              disabled={loading}
              placeholder="First name"
              autoComplete="given-name"
            />

            <Input
              label="Last Name"
              name="lastName"
              icon={User}
              value={formData.lastName}
              onChange={handleChange}
              error={formErrors.lastName}
              required
              disabled={loading}
              placeholder="Last name"
              autoComplete="family-name"
            />
          </div>

          <Input
            label="Email Address"
            name="email"
            type="email"
            icon={Mail}
            value={formData.email}
            onChange={handleChange}
            error={formErrors.email}
            required
            disabled={loading}
            placeholder="Enter your email address"
            autoComplete="email"
          />

          <Input
            label="Password"
            name="password"
            type="password"
            icon={Lock}
            value={formData.password}
            onChange={handleChange}
            error={formErrors.password}
            required
            disabled={loading}
            placeholder="Enter your password"
            autoComplete="new-password"
          />

          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            icon={Lock}
            value={formData.confirmPassword}
            onChange={handleChange}
            error={formErrors.confirmPassword}
            required
            disabled={loading}
            placeholder="Confirm your password"
            autoComplete="new-password"
          />

          <Button
            type="submit"
            className="w-full"
            loading={loading}
            disabled={loading}
          >
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center">
          <div className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              disabled={loading}
            >
              Sign in
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RegisterPage;