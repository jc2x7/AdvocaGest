import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { auth, db } from '../services/firebase/config';
import { USER_PROFILES, OFFICE_DATA } from '../services/firebase/collections';
import {
  AuthContextType,
  UserProfile,
  OfficeData,
  SignInData,
  SignUpData,
} from '../types/auth';

const BIOMETRIC_ENABLED_KEY = '@advocagest:biometric_enabled';
const LAST_UID_KEY = '@advocagest:last_uid';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [officeData, setOfficeData] = useState<OfficeData | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = useMemo(() => user !== null, [user]);

  const fetchUserProfile = useCallback(async (uid: string): Promise<UserProfile | null> => {
    const docRef = doc(db, USER_PROFILES, uid);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    return {
      uid,
      name: data.name as string,
      email: data.email as string,
      phone: data.phone as string,
      oabNumber: data.oabNumber as string,
      oabState: data.oabState as string,
      profilePhoto: data.profilePhoto as string | undefined,
      signatureImage: data.signatureImage as string | undefined,
      areasOfPractice: data.areasOfPractice as string[],
      bio: data.bio as string | undefined,
      createdAt: data.createdAt instanceof Date ? data.createdAt : (data.createdAt as { toDate: () => Date })?.toDate?.() ?? new Date(),
      updatedAt: data.updatedAt instanceof Date ? data.updatedAt : (data.updatedAt as { toDate: () => Date })?.toDate?.() ?? new Date(),
    };
  }, []);

  const fetchOfficeData = useCallback(async (uid: string): Promise<OfficeData | null> => {
    const docRef = doc(db, OFFICE_DATA, uid);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    return {
      name: data.name as string,
      cnpj: data.cnpj as string | undefined,
      address: data.address as OfficeData['address'],
      phone: data.phone as string | undefined,
      email: data.email as string | undefined,
      website: data.website as string | undefined,
      logo: data.logo as string | undefined,
      bankName: data.bankName as string | undefined,
      bankAgency: data.bankAgency as string | undefined,
      bankAccount: data.bankAccount as string | undefined,
      pixKey: data.pixKey as string | undefined,
    };
  }, []);

  const attemptBiometricAuth = useCallback(async (): Promise<boolean> => {
    try {
      const biometricEnabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      if (biometricEnabled !== 'true') {
        return false;
      }

      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        return false;
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autentique-se para acessar o AdvogaPlan',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      try {
        if (firebaseUser) {
          const [profile, office] = await Promise.all([
            fetchUserProfile(firebaseUser.uid),
            fetchOfficeData(firebaseUser.uid),
          ]);

          if (profile) {
            setUser(profile);
            setOfficeData(office);
            await AsyncStorage.setItem(LAST_UID_KEY, firebaseUser.uid);
          } else {
            setUser(null);
            setOfficeData(null);
          }
        } else {
          setUser(null);
          setOfficeData(null);
        }
      } catch {
        setUser(null);
        setOfficeData(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [fetchUserProfile, fetchOfficeData]);

  const signIn = useCallback(async (data: SignInData): Promise<void> => {
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const [profile, office] = await Promise.all([
        fetchUserProfile(credential.user.uid),
        fetchOfficeData(credential.user.uid),
      ]);

      if (!profile) {
        throw new Error('Perfil de usuario nao encontrado.');
      }

      setUser(profile);
      setOfficeData(office);
      await AsyncStorage.setItem(LAST_UID_KEY, credential.user.uid);
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile, fetchOfficeData]);

  const signUp = useCallback(async (data: SignUpData): Promise<void> => {
    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const uid = credential.user.uid;

      const newProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'> & {
        createdAt: ReturnType<typeof serverTimestamp>;
        updatedAt: ReturnType<typeof serverTimestamp>;
      } = {
        uid,
        name: data.name,
        email: data.email,
        phone: data.phone,
        oabNumber: data.oabNumber,
        oabState: data.oabState,
        areasOfPractice: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, USER_PROFILES, uid), newProfile);

      const defaultOffice: OfficeData = {
        name: `Escritorio ${data.name}`,
      };
      await setDoc(doc(db, OFFICE_DATA, uid), defaultOffice);

      const profile = await fetchUserProfile(uid);
      setUser(profile);
      setOfficeData(defaultOffice);
      await AsyncStorage.setItem(LAST_UID_KEY, uid);
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile]);

  const handleSignOut = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setOfficeData(null);
      await AsyncStorage.removeItem(LAST_UID_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  const updateProfile = useCallback(async (data: Partial<UserProfile>): Promise<void> => {
    if (!user) {
      throw new Error('Usuario nao autenticado.');
    }

    const updateData = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    // Remove uid from update payload to avoid overwriting
    const { uid: _uid, ...safeData } = updateData;
    void _uid;

    await updateDoc(doc(db, USER_PROFILES, user.uid), safeData);

    const refreshedProfile = await fetchUserProfile(user.uid);
    if (refreshedProfile) {
      setUser(refreshedProfile);
    }
  }, [user, fetchUserProfile]);

  const updateOfficeData = useCallback(async (data: Partial<OfficeData>): Promise<void> => {
    if (!user) {
      throw new Error('Usuario nao autenticado.');
    }

    const docRef = doc(db, OFFICE_DATA, user.uid);
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      await updateDoc(docRef, data);
    } else {
      await setDoc(docRef, data);
    }

    const refreshed = await fetchOfficeData(user.uid);
    setOfficeData(refreshed);
  }, [user, fetchOfficeData]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      isAuthenticated,
      signIn,
      signUp,
      signOut: handleSignOut,
      resetPassword,
      updateProfile,
      officeData,
      updateOfficeData,
    }),
    [
      user,
      loading,
      isAuthenticated,
      signIn,
      signUp,
      handleSignOut,
      resetPassword,
      updateProfile,
      officeData,
      updateOfficeData,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider.');
  }
  return context;
}

export { attemptBiometricAuth };

function attemptBiometricAuth(): Promise<boolean> {
  return (async () => {
    try {
      const biometricEnabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      if (biometricEnabled !== 'true') {
        return false;
      }

      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        return false;
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autentique-se para acessar o AdvogaPlan',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch {
      return false;
    }
  })();
}
