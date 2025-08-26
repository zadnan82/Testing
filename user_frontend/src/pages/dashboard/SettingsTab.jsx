import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

const SettingsTab = () => {
  const { user, updateProfile, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    username: user?.username || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [success, setSuccess] = useState('');

  const validateForm = () => {
    const errors = {};

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    }

    if (formData.newPassword) {
      if (formData.newPassword.length < 6) {
        errors.newPassword = 'Password must be at least 6 characters';
      }
      if (formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setSuccess('');
    clearError();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const passwordToUse = formData.newPassword || formData.currentPassword;
      if (!passwordToUse) {
        setFormErrors({ currentPassword: 'Password is required' });
        return;
      }

      await updateProfile(formData.username.trim(), passwordToUse);
      setSuccess('Profile updated successfully');
      
      // Clear password fields
      setFormData(prev => ({ 
        ...prev, 
        currentPassword: '', 
        newPassword: '', 
        confirmPassword: '' 
      }));
    } catch (err) {
      // Error is handled by context
      console.error('Profile update failed:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (success) setSuccess('');
    clearError();
  };

  return (
    <div className="space-y-6">
      <div className="text-center sm:text-left">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600">Manage your account settings</p>
      </div>

      <div className="max-w-2xl">
        <Card className="!p-4 sm:!p-6">
          <Card.Header>
            <Card.Title className="text-lg sm:text-xl">Profile Information</Card.Title>
          </Card.Header>
          
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                {success}
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Input
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              error={formErrors.username}
              required
              disabled={loading}
            />

            <div className="border-t pt-4 sm:pt-6">
              <h4 className="font-medium text-gray-900 mb-3 sm:mb-4">Change Password</h4>
              
              <div className="space-y-4 sm:space-y-6">
                <Input
                  label="Current Password"
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  error={formErrors.currentPassword}
                  placeholder="Enter current password"
                  disabled={loading}
                  helperText="Required to update profile"
                />

                <Input
                  label="New Password"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  error={formErrors.newPassword}
                  placeholder="Leave blank to keep current password"
                  disabled={loading}
                  helperText="At least 6 characters"
                />

                {formData.newPassword && (
                  <Input
                    label="Confirm New Password"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={formErrors.confirmPassword}
                    placeholder="Confirm new password"
                    disabled={loading}
                  />
                )}
              </div>
            </div>

            <div className="flex justify-center sm:justify-end pt-4 sm:pt-6 border-t">
              <Button 
                type="submit"
                loading={loading}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Update Profile
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default SettingsTab;