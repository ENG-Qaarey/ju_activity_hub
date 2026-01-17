import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { authApi, setTokenProvider, usersApi } from "@/lib/api";

export type UserRole = "student" | "coordinator" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  studentId?: string;
  avatar?: string;
  department?: string;
  joinedAt?: string; // ISO date string
  status?: "active" | "inactive";
}

export type AuthState =
  | "anonymous"
  | "authenticated";

interface AuthContextType {
  user: User | null;
  users: User[]; // For admin listing, optional/legacy
  // Legacy methods that we might keep for compatibility or administrative actions
  deleteUser: (userId: string) => Promise<void>;
  createCoordinator: (data: {
    fullName: string;
    email: string;
    password: string;
    department?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  updateProfile: (updates: {
    name: string;
    email: string;
    department?: string;
    studentId?: string;
    avatar?: string | File;
  }) => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
  
  isAuthenticated: boolean;
  isHydrated: boolean; // if false, still loading
  authState: AuthState;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]); // simplified for now
  const [isHydrated, setIsHydrated] = useState(false);
  const [authState, setAuthState] = useState<AuthState>("anonymous");

  // Load user from localStorage on mount
  useEffect(() => {
    setTokenProvider(async () => {
      return localStorage.getItem('token');
    });

    const loadUserFromStorage = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser) as User;
          
          // Prefer server-verified session when token exists
          if (storedToken) {
            try {
              const me = await authApi.me();
              if (me?.success && me.user) {
                setUser(me.user);
                localStorage.setItem('user', JSON.stringify(me.user));
                setAuthState("authenticated");
              } else {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                setUser(null);
                setAuthState("anonymous");
              }
            } catch (e) {
              console.warn("Failed to verify token with backend:", e);
              setUser(parsedUser);
              setAuthState("authenticated");
            }
          } else {
            // No token yet (legacy). Keep the stored user, but treat as authenticated.
            setUser(parsedUser);
            setAuthState("authenticated");
          }
        } else {
          setUser(null);
          setAuthState("anonymous");
        }
      } catch (e) {
        console.error("Failed to load user from storage:", e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        setAuthState("anonymous");
      } finally {
        setIsHydrated(true);
      }
    };

    loadUserFromStorage();
  }, []);

  // Compatibility: load all users for admin usage
  // This arguably belongs in a separate context or hook, but simplifying for migration
  const refreshUsers = async () => {
     // Only attempt fetch when we actually have an auth token to send
     const token = localStorage.getItem('token');
     if (!token) {
       console.warn("Skipping admin user sync: missing auth token");
       return;
     }

     try {
       const all = await usersApi.getAll(undefined, token);
       setUsers(all);
     } catch (e) {
       console.warn("Could not fetch users from backend", e);
     }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
        refreshUsers();
    }
  }, [user]);


  const logout = async () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setAuthState("anonymous");
    // Redirect to home page
    window.location.href = '/';
  };

  // Administrative functions - keep relying on backend APIs for now 
  // or implement them via Clerk API calls if we had a backend proxy.
  // Assuming the existing backend `usersApi` still works for basic DB operations if they exist.
  const deleteUser = async (userId: string) => {
      await usersApi.delete(userId);
      await refreshUsers();
  };

  const createCoordinator = async (data: {
    fullName: string;
    email: string;
    password: string;
    department?: string;
  }) => {
    await usersApi.create({
      name: data.fullName,
      email: data.email,
      password: data.password,
      role: 'coordinator',
      department: data.department,
    });
    await refreshUsers();
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
     if (!user) {
       throw new Error("You must be logged in to change your password.");
     }
      await usersApi.updateMyPassword(oldPassword, newPassword);
     // Optionally refresh user data
  };

  const updateProfile = async (updates: {
    name: string;
    email: string;
    department?: string;
    studentId?: string;
    avatar?: string | File;
  }) => {
      if (!user) {
        throw new Error("You must be logged in to update your profile.");
      }

      try {
         const { avatar, ...backendUpdates } = updates;

         const updatedUser = await usersApi.updateMe(backendUpdates);

         let updatedAfterAvatar = updatedUser;
         if (avatar instanceof File) {
           updatedAfterAvatar = await usersApi.uploadMyAvatar(avatar);
         }

         // Update local state
         const newUser: User = {
           ...user,
           ...updatedAfterAvatar,
         };
         setUser(newUser);
         localStorage.setItem('user', JSON.stringify(newUser));
      } catch(e) {
          console.error("Failed to update profile:", e);
          throw e;
      }
  };
  
  const toggleUserStatus = async (userId: string) => {
      await usersApi.toggleStatus(userId);
      await refreshUsers();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        isAuthenticated: authState === "authenticated",
        isHydrated,
        authState,
        logout,
        deleteUser,
        createCoordinator,
        changePassword, // likely broken/deprecated in favor of Clerk UI
        updateProfile,
        toggleUserStatus,
        refreshUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
