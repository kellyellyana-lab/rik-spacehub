import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, FacultyMeta, FacultyCode, UserRole } from '../types';
import { SEED_PERSONAS, FACULTIES_DATA } from '../data/seedData';
import { supabase, isSupabaseConfigured, connectionMode } from '../services/supabaseClient';

interface SignUpData {
  email: string;
  password?: string;
  fullName: string;
  faculty: FacultyCode;
  role: UserRole;
  identityNumber: string;
  phone: string;
  organization: string;
}

interface AuthContextType {
  currentUser: UserProfile;
  isTUAdmin: boolean;
  facultyMeta: FacultyMeta;
  availablePersonas: UserProfile[];
  connectionMode: 'supabase_live' | 'demo_local';
  isDemoMode: boolean;
  isLoading: boolean;
  switchUser: (userId: string) => void;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithProfile: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  resetAllDemoData: () => void;
}

const STORAGE_ACTIVE_USER = 'rik_spacehub_active_user_id';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const savedId = localStorage.getItem(STORAGE_ACTIVE_USER);
    const found = SEED_PERSONAS.find((p) => p.id === savedId);
    return found || SEED_PERSONAS[0];
  });

  // Listen to Supabase Auth state if configured
  useEffect(() => {
    const client = supabase;
    if (isSupabaseConfigured && client) {
      const initSession = async () => {
        try {
          const { data: { session } } = await client.auth.getSession();
          if (session?.user) {
            await fetchProfile(session.user.id, session.user.email || '');
          }
        } catch (err) {
          console.error('Session retrieval error:', err);
        } finally {
          setIsLoading(false);
        }
      };

      initSession();

      const { data: { subscription } } = client.auth.onAuthStateChange(
        async (event, session) => {
          if (session?.user) {
            await fetchProfile(session.user.id, session.user.email || '');
          } else if (event === 'SIGNED_OUT') {
            setCurrentUser(SEED_PERSONAS[0]);
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchProfile = async (userId: string, email: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setCurrentUser({
          id: data.id,
          name: data.full_name,
          email: data.email || email,
          role: data.role,
          faculty: data.faculty,
          identityNumber: data.identity_number,
          phone: data.phone_number,
          organization: data.organization || '',
          avatarUrl: data.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        });
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const switchUser = (userId: string) => {
    const target = SEED_PERSONAS.find((p) => p.id === userId);
    if (target) {
      setCurrentUser(target);
      localStorage.setItem(STORAGE_ACTIVE_USER, target.id);
    }
  };

  const signInWithPassword = async (email: string, password: string) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw new Error(error.message);
      if (data.user) {
        await fetchProfile(data.user.id, data.user.email || '');
      }
    } else {
      // Demo mode fallback
      const found = SEED_PERSONAS.find((p) => p.email.toLowerCase() === email.toLowerCase());
      if (found) {
        switchUser(found.id);
      } else {
        throw new Error('Email demo tidak ditemukan. Gunakan salah satu email dari dropdown persona.');
      }
    }
  };

  const signUpWithProfile = async (data: SignUpData) => {
    if (isSupabaseConfigured && supabase) {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password || 'TemporaryPassword123!',
        options: {
          data: {
            full_name: data.fullName,
            role: data.role,
            faculty: data.faculty,
            identity_number: data.identityNumber,
            phone_number: data.phone,
            organization: data.organization,
          },
        },
      });

      if (error) throw new Error(error.message);
      if (authData.user) {
        await fetchProfile(authData.user.id, data.email);
      }
    } else {
      // Demo mode registration
      const newPersona: UserProfile = {
        id: `usr_demo_${Date.now()}`,
        name: data.fullName,
        email: data.email,
        role: data.role,
        faculty: data.faculty,
        identityNumber: data.identityNumber,
        phone: data.phone,
        organization: data.organization,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      };
      setCurrentUser(newPersona);
      localStorage.setItem(STORAGE_ACTIVE_USER, newPersona.id);
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(SEED_PERSONAS[0]);
    localStorage.removeItem(STORAGE_ACTIVE_USER);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const updatedUser: UserProfile = {
      ...currentUser,
      ...updates,
      // Security rule: Non-admin users cannot self-escalate role
      role: currentUser.role === 'tu_admin' ? (updates.role || currentUser.role) : currentUser.role,
    };
    setCurrentUser(updatedUser);

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('profiles')
        .update({
          full_name: updatedUser.name,
          phone_number: updatedUser.phone,
          identity_number: updatedUser.identityNumber,
          organization: updatedUser.organization,
          avatar_url: updatedUser.avatarUrl,
        })
        .eq('id', currentUser.id);
    }
  };

  const resetAllDemoData = () => {
    localStorage.clear();
    window.location.reload();
  };

  const isTUAdmin = currentUser.role === 'tu_admin';
  const facultyMeta = FACULTIES_DATA[currentUser.faculty] || FACULTIES_DATA.PUSAT_RIK;
  const isDemoMode = !isSupabaseConfigured;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isTUAdmin,
        facultyMeta,
        availablePersonas: SEED_PERSONAS,
        connectionMode,
        isDemoMode,
        isLoading,
        switchUser,
        signInWithPassword,
        signUpWithProfile,
        signOut,
        updateProfile,
        resetAllDemoData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
