import { useCallback, useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '../store/useAuthStore';
import { profileSchema } from '../validation/profileValidation';
import { validate } from '../validation/authValidation';
import type { UpdateProfileInput } from '../types/auth';

interface EditForm {
  fullName: string;
  nakshatram: string;
  gothram: string;
}

type Feedback = { type: 'success' | 'error'; message: string } | null;

const emptyForm: EditForm = { fullName: '', nakshatram: '', gothram: '' };

/**
 * Encapsulates all Profile screen logic: fetching the latest profile, view vs
 * edit mode, field editing, validation, saving, and success/error feedback.
 * The screen stays purely presentational.
 */
export function useProfile() {
  const { user, refreshProfile, updateProfile, logout } = useAuthStore(
    useShallow(s => ({
      user: s.user,
      refreshProfile: s.refreshProfile,
      updateProfile: s.updateProfile,
      logout: s.logout,
    })),
  );

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<EditForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  // Refresh state (fetch from backend).
  const [loading, setLoading] = useState(!user);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      await refreshProfile();
    } catch {
      setLoadError('Could not load your profile. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [refreshProfile]);

  // Pull the freshest data when the screen mounts.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const startEdit = useCallback(() => {
    if (!user) return;
    setForm({
      fullName: user.fullName,
      nakshatram: user.nakshatram,
      gothram: user.gothram,
    });
    setErrors({});
    setFeedback(null);
    setIsEditing(true);
  }, [user]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setErrors({});
    setFeedback(null);
  }, []);

  const setField = useCallback(
    (key: keyof EditForm) => (value: string) =>
      setForm(prev => ({ ...prev, [key]: value })),
    [],
  );

  const save = useCallback(async () => {
    setFeedback(null);
    const result = validate(profileSchema, form);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await updateProfile(result.data as UpdateProfileInput);
      setIsEditing(false);
      setFeedback({ type: 'success', message: 'Profile updated successfully.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Could not update your profile. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  }, [form, updateProfile]);

  return {
    user,
    loading,
    loadError,
    refresh,
    isEditing,
    form,
    errors,
    saving,
    feedback,
    startEdit,
    cancelEdit,
    setField,
    save,
    dismissFeedback: () => setFeedback(null),
    logout,
  };
}
