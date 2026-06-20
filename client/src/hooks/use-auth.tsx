// @refresh reset
import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
    useQuery,
    useMutation,
    UseMutationResult,
} from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { InsertUser, User as SelectUser } from "@shared/schema";
import { toast } from "@/hooks/use-toast";
import { supabase } from "../lib/supabase";

type AuthContextType = {
    user: SelectUser | null;
    isLoading: boolean;
    error: Error | null;
    loginMutation: UseMutationResult<any, Error, LoginData>;
    logoutMutation: UseMutationResult<void, Error, void>;
    registerMutation: UseMutationResult<any, Error, any>;
    verifyOtpMutation: UseMutationResult<any, Error, any>;
    loginWithGoogleMutation: UseMutationResult<any, Error, void>;
    completeProfileMutation: UseMutationResult<any, Error, { username: string; phone: string; avatarUrl?: string }>;
    updateProfileMutation: UseMutationResult<any, Error, Partial<SelectUser>>;
};

type LoginData = { email: string; password: string };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<any>(null);
    const [sessionLoading, setSessionLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setSessionLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setSessionLoading(false);
            queryClient.invalidateQueries({ queryKey: ["auth_user"] });
        });

        return () => subscription.unsubscribe();
    }, [queryClient]);

    const {
        data: user,
        error,
        isLoading: isQueryLoading,
    } = useQuery<SelectUser | null, Error>({
        queryKey: ["auth_user", session?.user?.id],
        staleTime: 0,
        refetchOnWindowFocus: true,
        refetchInterval: 60_000,
        queryFn: async () => {
            if (!session?.user) return null;

            const validRoles = ["admin", "butcher", "delivery", "manager", "accountant", "support", "designer", "customer"];

            // Always fetch via server to bypass RLS and get accurate admin/role data
            try {
                // Use the token from current session — avoid refreshSession() to prevent onAuthStateChange loop
                let token = session.access_token;

                const fetchMe = (t: string) => fetch('/api/auth/me', {
                    headers: { Authorization: `Bearer ${t}` },
                });

                let resp = await fetchMe(token);

                // If 401 (token expired), force refresh the session once
                if (resp.status === 401) {
                    // First try getSession (no side-effects, fast)
                    const { data: freshSession } = await supabase.auth.getSession();
                    if (freshSession.session?.access_token && freshSession.session.access_token !== token) {
                        token = freshSession.session.access_token;
                        resp = await fetchMe(token);
                    } else {
                        // Force a real token refresh from Supabase server
                        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
                        if (!refreshError && refreshData.session?.access_token) {
                            token = refreshData.session.access_token;
                            resp = await fetchMe(token);
                        }
                    }
                }

                if (resp.ok) {
                    const result = await resp.json();
                    if (result.user) {
                        const data = result.user;
                        const rawRole = data.role || "customer";
                        const safeRole = validRoles.includes(rawRole) ? rawRole : "customer";
                        const isAdminUser = data.is_admin === true || rawRole === 'admin';
                        return {
                            ...data,
                            isAdmin: isAdminUser,
                            isBanned: data.is_banned === true,
                            role: safeRole,
                            permissions: data.permissions || [],
                            avatarUrl: data.avatar_url || session.user.user_metadata?.avatar_url || null,
                        } as unknown as SelectUser;
                    }
                }

                // Profile not found — auto-create it via sync-profile
                if (resp.status === 404) {
                    const syncResp = await fetch('/api/auth/sync-profile', {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (syncResp.ok) {
                        const result = await syncResp.json();
                        if (result.user) {
                            const data = result.user;
                            return {
                                ...data,
                                isAdmin: data.is_admin === true,
                                isBanned: data.is_banned === true,
                                role: data.role || "customer",
                                permissions: data.permissions || [],
                                avatarUrl: data.avatar_url || session.user.user_metadata?.avatar_url || null,
                            } as unknown as SelectUser;
                        }
                    }
                }
            } catch (err: any) {
                console.error('❌ auth/me request error:', err.message);
            }

            // Last resort fallback from session metadata only
            return {
                id: session.user.id,
                email: session.user.email || "",
                username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || "user",
                password: "",
                phone: session.user.user_metadata?.phone || session.user.phone || "",
                is_admin: false,
                isAdmin: false,
                is_banned: false,
                isBanned: false,
                role: "customer",
                permissions: [],
                avatarUrl: session.user.user_metadata?.avatar_url || null,
            } as unknown as SelectUser;
        },
        enabled: !!session?.user,
    });

    const loginMutation = useMutation({
        mutationFn: async (credentials: LoginData) => {
            let emailToUse = credentials.email;
            
            // If it's a username (no '@' sign), lookup the email first
            if (!emailToUse.includes('@')) {
                const res = await fetch('/api/auth/lookup-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: emailToUse })
                });
                
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.message || "اسم المستخدم غير صحيح أو غير موجود");
                }
                const data = await res.json();
                if (data.email) {
                    emailToUse = data.email;
                } else {
                    throw new Error("تعذر جلب البريد الإلكتروني المرتبط");
                }
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email: emailToUse,
                password: credentials.password,
            });
            if (error) throw error;
            return data.user;
        },
        onSuccess: () => {
            // Toast handled in component or here
        },
        onError: (error: Error) => {
            toast({
                title: "فشل تسجيل الدخول",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const registerMutation = useMutation({
        mutationFn: async (userData: InsertUser & { email: string; skipEmailConfirm?: boolean }) => {
            console.log('📝 Starting registration with data:', userData);

            // 1. SignUp with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: userData.email,
                password: userData.password,
                options: {
                    data: {
                        username: userData.username,
                        phone: userData.phone,
                    },
                    emailRedirectTo: `${window.location.origin}/auth`,
                }
            });

            if (authError) {
                console.error('❌ Auth signup error:', authError);
                throw authError;
            }
            if (!authData.user) throw new Error("No user data returned");

            console.log('✅ Auth user created:', authData.user.id);

            // 2. Create user profile in database
            const { error: dbError } = await supabase
                .from('users')
                .upsert({
                    id: authData.user.id,
                    username: userData.username,
                    email: userData.email,
                    phone: userData.phone || "",
                    password: "", // Auth handled by Supabase
                    is_admin: false,
                    role: "customer",
                    is_banned: false,
                    permissions: [],
                }, {
                    onConflict: 'id'
                });

            if (dbError && dbError.code !== '23505') {
                console.error('❌ Database profile error:', dbError.message, dbError.code);
            } else {
                console.log('✅ User profile saved:', userData.username);
            }

            // Explicitly sync profile to ensure custom username is used instead of fallback
            if (authData.session) {
                try {
                    await fetch('/api/auth/sync-profile', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${authData.session.access_token}` 
                        },
                        body: JSON.stringify({ 
                            customUsername: userData.username, 
                            customPhone: userData.phone 
                        })
                    });

                    // Force update to guarantee the username overwrites any race-condition fallback
                    await fetch('/api/auth/update-profile', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${authData.session.access_token}` 
                        },
                        body: JSON.stringify({ 
                            username: userData.username, 
                            phone: userData.phone || "00000000"
                        })
                    });
                } catch (e) {
                    console.error("Explicit sync-profile failed", e);
                }
            }

            return authData.user;
        },
        onSuccess: () => {
            console.log('✅ Registration completed successfully');
        },
        onError: (error: Error) => {
            console.error('🔴 Registration error:', error);
            console.error('Error message:', error.message);

            // Handle 'already registered' case specifically
            if (error.message.toLowerCase().includes("already") || error.message.toLowerCase().includes("registered") || error.message.toLowerCase().includes("exists")) {
                toast({
                    title: "تنبيه: لديك حساب بالفعل",
                    description: "البريد الإلكتروني أو رقم الهاتف مسجل مسبقاً، يرجى تسجيل الدخول.",
                    variant: "default",
                });
                return;
            }

            toast({
                title: "فشل إنشاء الحساب",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const verifyOtpMutation = useMutation({
        mutationFn: async ({ email, token, type }: { email: string, token: string, type: 'signup' | 'recovery' | 'magiclink' }) => {
            const { data, error } = await supabase.auth.verifyOtp({
                email,
                token,
                type,
            });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            toast({
                title: "تم التحقق بنجاح",
                description: "تم تفعيل حسابك، جاري تسجيل الدخول...",
            });
            queryClient.invalidateQueries({ queryKey: ["auth_user"] });
        },
        onError: (error: Error) => {
            toast({
                title: "فشل التحقق",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const loginWithGoogleMutation = useMutation({
        mutationFn: async () => {
            const redirectTo = `${window.location.origin}/auth`;
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                }
            });
            if (error) throw error;
            return data;
        },
        onError: (error: Error) => {
            toast({
                title: "فشل تسجيل الدخول بجوجل",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const completeProfileMutation = useMutation({
        mutationFn: async (data: { username: string; phone: string; avatarUrl?: string }) => {
            if (!session?.user) throw new Error("No session found");

            // Use current token directly — avoid refreshSession() to prevent onAuthStateChange race
            const token = session.access_token;

            // Call server endpoint which uses supabaseAdmin (bypasses RLS)
            const resp = await fetch('/api/auth/update-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    username: data.username,
                    phone: data.phone,
                    avatarUrl: data.avatarUrl || session.user.user_metadata?.avatar_url || null,
                }),
            });

            if (!resp.ok) {
                const err = await resp.json().catch(() => ({ message: 'خطأ في تحديث البيانات' }));
                throw new Error(err.message || 'فشل تحديث الملف الشخصي');
            }

            const result = await resp.json();
            return result.user;
        },
        onSuccess: (updatedUser) => {
            if (updatedUser && session?.user?.id) {
                const validRoles = ["admin", "butcher", "delivery", "manager", "accountant", "support", "designer", "customer"];
                const rawRole = updatedUser.role || "customer";
                const safeRole = validRoles.includes(rawRole) ? rawRole : "customer";
                const isAdminUser = updatedUser.is_admin === true || rawRole === "admin";
                const normalizedUser = {
                    ...updatedUser,
                    isAdmin: isAdminUser,
                    isBanned: updatedUser.is_banned === true,
                    role: safeRole,
                    permissions: updatedUser.permissions || [],
                    avatarUrl: updatedUser.avatar_url || session.user.user_metadata?.avatar_url || null,
                };
                queryClient.setQueryData(["auth_user", session.user.id], normalizedUser);
            }
            queryClient.invalidateQueries({ queryKey: ["auth_user"] });
        },
        onError: (error: Error) => {
            toast({
                title: "فشل تحديث البيانات",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const updateProfileMutation = useMutation({
        mutationFn: async (data: Partial<SelectUser>) => {
            if (!session?.user) throw new Error("No session found");

            const { error } = await supabase
                .from('users')
                .update(data)
                .eq('id', session.user.id);

            if (error) throw error;
            return true;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["auth_user"] });
        },
    });

    const logoutMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.setQueryData(["auth_user"], null);
            toast({
                title: "تم تسجيل الخروج",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "فشل تسجيل الخروج",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    return (
        <AuthContext.Provider
            value={{
                user: user ?? null,
                isLoading: sessionLoading || (!!session?.user && isQueryLoading),
                error,
                loginMutation,
                logoutMutation,
                registerMutation,
                verifyOtpMutation,
                loginWithGoogleMutation,
                completeProfileMutation,
                updateProfileMutation,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
