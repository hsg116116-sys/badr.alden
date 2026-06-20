import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, InsertUser } from "@shared/schema";
import {
  Loader2, ShieldCheck, Mail, Send, ArrowRight, MessageSquare,
  Star, UserCircle, Phone, Eye, EyeOff, Truck, Award, Coffee
} from "lucide-react";
import { useEffect, useState, useMemo, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/layout/Navbar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { getRoleRedirect } from "@/lib/role-redirect";

type AuthStep = "form" | "selection" | "otp" | "onboarding";

export default function Auth() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation, verifyOtpMutation, loginWithGoogleMutation, completeProfileMutation } = useAuth();
  const [step, setStep] = useState<AuthStep>("form");
  const [otpMethod, setOtpMethod] = useState<"gmail" | "telegram" | null>(null);
  const [otpValue, setOtpValue] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [showRegPw, setShowRegPw] = useState(false);
  const [showRegConfPw, setShowRegConfPw] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const { toast } = useToast();

  const [isDesktopLayout, setIsDesktopLayout] = useState(typeof window !== "undefined" ? window.innerWidth >= 1024 : false);

  useEffect(() => {
    const checkLayout = () => setIsDesktopLayout(window.innerWidth >= 1024);
    window.addEventListener("resize", checkLayout);
    return () => window.removeEventListener("resize", checkLayout);
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResendCode = async () => {
    if (resendCooldown > 0 || isSendingCode) return;
    setIsSendingCode(true);
    const email = registerForm.getValues("email");
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "حدث خطأ أثناء الإرسال");
      const newCount = resendCount + 1;
      setResendCount(newCount);
      setResendCooldown(60 * newCount);
      setOtpValue("");
      otpRefs.current[0]?.focus();
      toast({ title: "✅ تم إعادة إرسال الرمز", description: "تفقد بريدك الإلكتروني للكود الجديد" });
    } catch (err: any) {
      toast({ title: "فشل إعادة الإرسال", description: err.message, variant: "destructive" });
    } finally {
      setIsSendingCode(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
    const error = params.get('error') || hashParams.get('error');
    const errorDesc = params.get('error_description') || hashParams.get('error_description');
    if (error) {
      const isDatabaseError = errorDesc?.toLowerCase().includes('database');
      toast({
        title: isDatabaseError ? "خطأ في قاعدة البيانات" : "فشل تسجيل الدخول",
        description: isDatabaseError
          ? "حدث خطأ عند إنشاء حسابك. يرجى المحاولة مجدداً أو التواصل مع الدعم."
          : (errorDesc?.replace(/\+/g, ' ') || "حدث خطأ غير متوقع"),
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/auth');
    }
  }, []);

  useEffect(() => {
    if (user) {
      if (!user.phone) { setStep("onboarding"); registerForm.setValue("username", user.username || ""); return; }
      setLocation(getRoleRedirect(user.role, !!user.isAdmin));
    }
  }, [user, setLocation, step]);

  const loginForm = useForm<{ email: string; password: string }>({ defaultValues: { email: "", password: "" } });

  const registerForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: { username: "", password: "", confirmPassword: "", email: "", phone: "" },
  });

  const passwordValue = registerForm.watch("password");
  const phoneValue = registerForm.watch("phone");
  const usernameValue = registerForm.watch("username");

  const passwordStrength = useMemo(() => {
    if (!passwordValue) return 0;
    let s = 0;
    if (passwordValue.length >= 6) s += 25;
    if (/[A-Z]/.test(passwordValue)) s += 25;
    if (/[0-9]/.test(passwordValue)) s += 25;
    if (/[^A-Za-z0-9]/.test(passwordValue)) s += 25;
    return s;
  }, [passwordValue]);

  const [countryCode] = useState("+20");
  const [telegramToken, setTelegramToken] = useState<string | null>(null);
  const [telegramLink, setTelegramLink] = useState<string | null>(null);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const arr = otpValue.split("");
    arr[index] = val.slice(-1);
    setOtpValue(arr.join(""));
    if (val && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpValue[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
        const arr = otpValue.split("");
        arr[index - 1] = "";
        setOtpValue(arr.join(""));
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData) {
      setOtpValue(pastedData);
      const nextFocus = Math.min(pastedData.length, 5);
      if (nextFocus < 6) {
        otpRefs.current[nextFocus]?.focus();
      } else {
        otpRefs.current[5]?.focus();
      }
    }
  };

  const handleRegisterSubmit = () => setStep("selection");

  const handleMethodSelect = async (method: "gmail" | "telegram") => {
    if (isSendingCode) return;
    
    if (method === "gmail") {
      setIsSendingCode(true);
      setOtpMethod("gmail");
      const data = registerForm.getValues();
      try {
        const res = await fetch("/api/auth/send-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email }),
        });
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.message || "حدث خطأ أثناء الإرسال");
        }
        setStep("otp");
        setResendCount(1);
        setResendCooldown(60);
        toast({ title: "تم إرسال الرمز", description: "تفقد بريدك الإلكتروني للحصول على كود التحقق من 6 أرقام" });
      } catch (err: any) {
        toast({ title: "فشل الإرسال", description: err.message, variant: "destructive" });
      } finally {
        setIsSendingCode(false);
      }
    } else {
      setOtpMethod("telegram");
      const rawPhone = registerForm.getValues().phone;
      if (!rawPhone) { toast({ title: "الرجاء إدخال رقم الهاتف", variant: "destructive" }); return; }
      let fullPhone = rawPhone.startsWith('0') ? rawPhone.substring(1) : rawPhone;
      fullPhone = countryCode.replace('+', '') + fullPhone;

      const initTelegram = async () => {
        try {
          const res = await fetch('/api/auth/telegram/init', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: fullPhone })
          });
          const text = await res.text();
          if (!text) throw new Error('السيرفر رد برد فارغ');
          const data = JSON.parse(text);
          if (res.ok) {
            setTelegramToken(data.token); setTelegramLink(data.link); setStep("otp");
            toast({ title: "✅ جاهز للتحقق", description: "اضغط على الزر للانتقال لتيليجرام" });
          } else {
            toast({ title: "فشل إنشاء رابط التحقق", description: data.message, variant: "destructive" });
          }
        } catch (e) {
          toast({ title: "خطأ في الاتصال", description: String(e), variant: "destructive" });
        }
      };

      // Only init Telegram link - do NOT create account yet
      await initTelegram();
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp' && otpMethod === 'telegram' && telegramToken) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/auth/telegram/status?token=${telegramToken}`);
          const data = await res.json();
          if (data.status === 'VERIFIED') {
            clearInterval(interval);
            toast({ title: "✅ تم التحقق بنجاح!", description: "جاري إنشاء الحساب..." });
            
            const formData = registerForm.getValues();
            const rawPhone = formData.phone;
            let fullPhone = rawPhone.startsWith('0') ? rawPhone.substring(1) : rawPhone;
            fullPhone = countryCode.replace('+', '') + fullPhone;
            
            // Now create account AFTER verification
            try {
              await registerMutation.mutateAsync({ ...formData, phone: fullPhone });
            } catch (regErr: any) {
              const msg = regErr.message?.toLowerCase() || "";
              if (!(msg.includes("already") || msg.includes("registered") || msg.includes("exists") || msg.includes("user"))) {
                toast({ title: "خطأ في التسجيل", description: regErr.message, variant: "destructive" });
                return;
              }
            }
            
            // Sign in after account is created
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
              email: formData.email,
              password: formData.password
            });
            if (!loginError && loginData.session) {
              toast({ title: "✅ تم تسجيل الدخول بنجاح!" });
            } else if (loginError?.message.includes('Email not confirmed')) {
              toast({ title: "تنبيه", description: "الرجاء تأكيد بريدك الإلكتروني.", variant: "destructive" });
              const { data: { session } } = await supabase.auth.getSession();
            } else {
              toast({ title: "خطأ في تسجيل الدخول", description: loginError?.message || 'خطأ غير معروف', variant: "destructive" });
            }
          }
        } catch (e) { }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [step, otpMethod, telegramToken]);

  const verifyOtp = async () => {
    if (isVerifying || registerMutation.isPending) return;
    
    if (otpValue.length === 6 && otpMethod === 'gmail') {
      setIsVerifying(true);
      const data = registerForm.getValues();
      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email, code: otpValue }),
        });
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.message || "الكود غير صحيح");
        }
        toast({ title: "✅ تم التحقق بنجاح!", description: "جاري إنشاء الحساب..." });
        
        // After successful custom verification, run original registration
        try {
          await registerMutation.mutateAsync({ ...data, email: data.email });
        } catch (regErr: any) {
          const msg = regErr.message?.toLowerCase() || "";
          if (msg.includes("already") || msg.includes("registered") || msg.includes("exists") || msg.includes("user")) {
            toast({ title: "مرحباً بعودتك!", description: "تم تسجيل الدخول بنجاح." });
          }
        }
      } catch (err: any) {
        toast({ title: "رمز غير صحيح", description: err.message, variant: "destructive" });
      } finally {
        setIsVerifying(false);
      }
    }
  };

  const features = [
    { icon: Truck, label: "توصيل سريع", color: "text-emerald-600 bg-emerald-50" },
    { icon: Coffee, label: "تحميص يومي طازج", color: "text-amber-600 bg-amber-50" },
    { icon: Award, label: "جودة مضمونة", color: "text-rose-600 bg-rose-50" },
  ];

  return (
    <div className="min-h-screen w-full bg-[#fdf8f4] font-sans" dir="rtl">
      <Navbar />
      <MobileHeader />

      {/* ─── MOBILE LAYOUT ─────────────────────────────────────────── */}
      {!isDesktopLayout && (
        <div className="lg:hidden flex flex-col min-h-[calc(100vh-68px)] pb-20">

        {/* Mobile Hero Section */}
        <div
          className="relative flex flex-col items-center justify-end pb-10 pt-16 px-6 overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #3d1408 0%, #7c2d12 40%, #ea8640 100%)",
            minHeight: "42vh",
          }}
        >
          {/* Decorative circles */}
          <div className="absolute top-[-80px] right-[-80px] w-64 h-64 rounded-full opacity-10 bg-white" />
          <div className="absolute bottom-[-40px] left-[-60px] w-48 h-48 rounded-full opacity-10 bg-white" />
          <div className="absolute top-8 left-8 w-20 h-20 rounded-full opacity-5 bg-white" />

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4 relative z-10"
          >
            <img src="https://raw.githubusercontent.com/HSG116/url/refs/heads/main/A_logo_with_the_store's_name_below_it_1779558557783.png" alt="محمصة بدر الدين" className="w-40 h-40 object-contain drop-shadow-2xl" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-center relative z-10"
          >
            <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-lg">محمصة بدر الدين</h1>
            <p className="text-white/70 font-semibold text-sm mt-1 tracking-widest uppercase">Badr Alden Roastery</p>
            <p className="text-white/60 text-xs mt-2 font-medium max-w-[260px] mx-auto leading-relaxed">
              أفضل المكسرات والبن المحمص بجودة تليق بك وبأحبابك
            </p>
          </motion.div>

          {/* Mobile Feature Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex gap-2 mt-5 relative z-10 flex-wrap justify-center"
          >
            {features.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5">
                <Icon className="w-3.5 h-3.5 text-white" />
                <span className="text-white text-xs font-bold">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Mobile Form Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-1 bg-white/95 backdrop-blur-md -mt-5 rounded-t-[2rem] z-10 relative px-5 pt-7 pb-10 border-t border-white/40"
          style={{ boxShadow: "0 -20px 40px rgba(0,0,0,0.15)" }}
        >
          <Tabs defaultValue="login" className="w-full">
            <TabsList className={`grid w-full grid-cols-2 mb-6 bg-white p-1.5 rounded-2xl h-14 border border-orange-100 shadow-sm ${step !== "form" ? "hidden" : ""}`}>
              <TabsTrigger
                value="login"
                onClick={() => setStep("form")}
                className="rounded-xl h-full font-black text-gray-400 text-base data-[state=active]:bg-[#7c2d12] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
              >
                تسجيل دخول
              </TabsTrigger>
              <TabsTrigger
                value="register"
                onClick={() => setStep("form")}
                className="rounded-xl h-full font-black text-gray-400 text-base data-[state=active]:bg-[#7c2d12] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
              >
                حساب جديد
              </TabsTrigger>
            </TabsList>

          <AnimatePresence mode="wait">
            {step === "form" && (
              <motion.div key="form-mobile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                  {/* LOGIN TAB */}
                  <TabsContent value="login" className="mt-0">
                    <form onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-gray-600 font-bold text-sm">البريد الإلكتروني أو اسم المستخدم</Label>
                        <Input
                          {...loginForm.register("email")}
                          dir="ltr"
                          type="text"
                          autoComplete="username"
                          className="h-14 bg-white border-gray-200 focus:border-[#ea8640]/60 focus:ring-4 focus:ring-[#ea8640]/10 rounded-xl text-base px-4 shadow-sm placeholder:text-gray-300 font-medium"
                          placeholder="name@example.com أو username"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-gray-600 font-bold text-sm">كلمة المرور</Label>
                        <div className="relative">
                          <Input
                            type={showLoginPw ? "text" : "password"}
                            {...loginForm.register("password")}
                            autoComplete="current-password"
                            className="h-14 bg-white border-gray-200 focus:border-[#ea8640]/60 focus:ring-4 focus:ring-[#ea8640]/10 rounded-xl text-base px-4 shadow-sm placeholder:text-gray-300 tracking-widest pl-12"
                            placeholder="••••••••"
                          />
                          <button type="button" onClick={() => setShowLoginPw(!showLoginPw)} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showLoginPw ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        disabled={loginMutation.isPending}
                        className="w-full h-14 rounded-xl bg-[#7c2d12] hover:bg-[#6b2208] text-white font-black text-lg shadow-lg shadow-[#7c2d12]/30 active:scale-[0.98] transition-all mt-2"
                      >
                        {loginMutation.isPending ? <Loader2 className="animate-spin w-6 h-6" /> : "دخول"}
                      </Button>

                      <div className="relative flex items-center py-1">
                        <div className="flex-grow border-t border-gray-100" />
                        <span className="mx-3 text-gray-300 font-bold text-xs">أو</span>
                        <div className="flex-grow border-t border-gray-100" />
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        disabled={loginWithGoogleMutation.isPending}
                        onClick={() => loginWithGoogleMutation.mutate()}
                        className="w-full h-14 rounded-xl bg-white border-gray-200 hover:bg-gray-50 text-zinc-700 font-bold text-base shadow-sm flex items-center justify-center gap-3"
                      >
                        {loginWithGoogleMutation.isPending ? <Loader2 className="animate-spin w-5 h-5" /> : (
                          <>
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            متابعة باستخدام جوجل
                          </>
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  {/* REGISTER TAB */}
                  <TabsContent value="register" className="mt-0">
                    <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)} className="space-y-3.5">
                      <div className="space-y-1.5">
                        <Label className="text-gray-600 font-bold text-sm">اسم المستخدم</Label>
                        <Input {...registerForm.register("username")} dir="ltr" maxLength={15} autoComplete="username" placeholder="username" className="h-13 bg-white border-gray-200 rounded-xl focus:border-[#ea8640]/60 focus:ring-[#ea8640]/10 font-medium text-base h-12" />
                        {registerForm.formState.errors.username && <p className="text-red-500 text-xs font-bold">{registerForm.formState.errors.username.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-gray-600 font-bold text-sm">البريد الإلكتروني</Label>
                        <Input {...registerForm.register("email")} type="email" autoComplete="email" dir="ltr" placeholder="email@example.com" className="h-12 bg-white border-gray-200 rounded-xl focus:border-[#ea8640]/60 focus:ring-[#ea8640]/10 font-medium text-base" />
                        {registerForm.formState.errors.email && <p className="text-red-500 text-xs font-bold">{registerForm.formState.errors.email.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-gray-600 font-bold text-sm">رقم الجوال</Label>
                        <div className="flex gap-2" dir="ltr">
                          <div className="flex items-center gap-1.5 px-3 h-12 bg-white border border-gray-200 rounded-xl min-w-[80px]">
                            <img src="https://flagcdn.com/w40/eg.png" srcSet="https://flagcdn.com/w80/eg.png 2x" width="20" alt="Egypt" className="rounded-sm object-cover h-3.5 w-5 shrink-0" />
                            <span className="text-sm font-bold text-gray-700">+20</span>
                          </div>
                          <Input
                            {...registerForm.register("phone")}
                            onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 13); registerForm.setValue("phone", v); }}
                            type="tel" maxLength={13} placeholder="1xxxxxxxxx"
                            className="h-12 bg-white border-gray-200 rounded-xl focus:border-[#ea8640]/60 flex-1 font-bold text-base"
                          />
                        </div>
                        {registerForm.formState.errors.phone && <p className="text-red-500 text-xs font-bold">{registerForm.formState.errors.phone.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-gray-600 font-bold text-sm">كلمة المرور</Label>
                        <div className="relative">
                          <Input type={showRegPw ? "text" : "password"} {...registerForm.register("password")} placeholder="••••••••" autoComplete="new-password"
                            className="h-12 bg-white border-gray-200 rounded-xl focus:border-[#ea8640]/60 font-medium text-base pl-12" />
                          <button type="button" onClick={() => setShowRegPw(!showRegPw)} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                            {showRegPw ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                        </div>
                        {passwordValue && (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full transition-all duration-500 rounded-full ${passwordStrength <= 25 ? 'bg-red-400' : passwordStrength <= 50 ? 'bg-orange-400' : passwordStrength <= 75 ? 'bg-yellow-400' : 'bg-green-500'}`} style={{ width: `${passwordStrength}%` }} />
                            </div>
                            <span className={`text-xs font-bold ${passwordStrength <= 25 ? 'text-red-400' : passwordStrength <= 50 ? 'text-orange-400' : passwordStrength <= 75 ? 'text-yellow-500' : 'text-green-600'}`}>
                              {passwordStrength <= 25 ? 'ضعيفة' : passwordStrength <= 50 ? 'متوسطة' : passwordStrength <= 75 ? 'جيدة' : 'قوية ✓'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-gray-600 font-bold text-sm">تأكيد كلمة المرور</Label>
                        <div className="relative">
                          <Input type={showRegConfPw ? "text" : "password"} {...registerForm.register("confirmPassword")} placeholder="••••••••" autoComplete="new-password"
                            className="h-12 bg-white border-gray-200 rounded-xl focus:border-[#ea8640]/60 font-medium text-base pl-12" />
                          <button type="button" onClick={() => setShowRegConfPw(!showRegConfPw)} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                            {showRegConfPw ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                        </div>
                        {registerForm.formState.errors.confirmPassword && <p className="text-red-500 text-xs font-bold">{registerForm.formState.errors.confirmPassword.message}</p>}
                      </div>

                      <Button type="submit" disabled={registerMutation.isPending} className="w-full h-13 py-3.5 rounded-xl bg-[#7c2d12] hover:bg-[#6b2208] text-white font-black text-base shadow-lg shadow-[#7c2d12]/30 transition-all mt-1">
                        {registerMutation.isPending ? <Loader2 className="animate-spin w-5 h-5" /> : "إنشاء حساب"}
                      </Button>
                    </form>
                  </TabsContent>
              </motion.div>
            )}

            {step === "selection" && (
              <motion.div key="sel-mobile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 py-2">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black text-zinc-900">تفعيل الحساب</h2>
                  <p className="text-gray-400 text-sm mt-1 font-medium">اختر طريقة التحقق</p>
                </div>
                <button disabled={isSendingCode} onClick={() => handleMethodSelect("gmail")} className={`w-full group bg-white border border-gray-100 hover:border-orange-200 p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all flex items-center gap-4 ${isSendingCode ? "opacity-50 cursor-not-allowed" : ""}`}>
                  <div className="w-14 h-14 bg-orange-50 text-[#ea8640] rounded-2xl flex items-center justify-center group-hover:bg-[#ea8640] group-hover:text-white transition-colors">
                    {isSendingCode ? <Loader2 className="w-7 h-7 animate-spin" /> : <Mail className="w-7 h-7" />}
                  </div>
                  <div className="text-right flex-1">
                    <h3 className="font-black text-gray-900 text-lg">عبر البريد</h3>
                    <p className="text-gray-400 text-xs mt-0.5">Gmail Verification</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#ea8640] rotate-180 transition-colors" />
                </button>
                <button onClick={() => handleMethodSelect("telegram")} className="w-full group bg-white border border-gray-100 hover:border-blue-200 p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <MessageSquare className="w-7 h-7" />
                  </div>
                  <div className="text-right flex-1">
                    <h3 className="font-black text-gray-900 text-lg">عبر تيليجرام</h3>
                    <p className="text-gray-400 text-xs mt-0.5">Telegram Bot</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 rotate-180 transition-colors" />
                </button>
                <Button variant="ghost" className="w-full mt-2 text-gray-400 hover:text-gray-700 font-bold" onClick={() => setStep("form")}>رجوع</Button>
              </motion.div>
            )}

            {step === "otp" && (
              <motion.div key="otp-mobile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-4 text-center">
                {otpMethod === "telegram" ? (
                  <div className="space-y-6">
                    <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                      <Send className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-900">افتح تيليجرام</h3>
                      <p className="text-gray-500 text-sm mt-2">التفعيل يتم تلقائياً عند بدء المحادثة</p>
                    </div>
                    {telegramLink && (
                      <a href={telegramLink} target="_blank" rel="noreferrer" className="block w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02]">
                        فتح التطبيق
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-2xl font-black text-gray-900">أدخل رمز التحقق</h3>
                      <p className="text-gray-400 text-sm mt-1">تم إرساله على بريدك الإلكتروني</p>
                    </div>
                    <div className="flex justify-center gap-2" dir="ltr">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <Input key={i}
                          ref={(el) => (otpRefs.current[i] = el)}
                          className="w-12 h-14 text-center text-3xl font-black bg-white border-2 border-orange-100 focus:bg-orange-50 focus:border-[#ea8640] focus:ring-4 focus:ring-[#ea8640]/20 focus:scale-110 rounded-2xl transition-all duration-300 shadow-sm p-0 text-[#7c2d12]"
                          maxLength={1} value={otpValue[i] || ""}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          onPaste={handleOtpPaste}
                        />
                      ))}
                    </div>
                    <Button onClick={verifyOtp} disabled={otpValue.length !== 6 || isVerifying || registerMutation.isPending}
                      className="w-full h-14 bg-[#7c2d12] hover:bg-[#6b2208] text-white font-black text-lg rounded-xl shadow-xl">
                      {(isVerifying || registerMutation.isPending) ? <Loader2 className="animate-spin w-6 h-6" /> : "تأكيد الرمز"}
                    </Button>

                    <button
                      onClick={handleResendCode}
                      disabled={resendCooldown > 0 || isSendingCode}
                      className={`w-full mt-4 py-3.5 rounded-2xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2 ${
                        resendCooldown > 0
                          ? "bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed"
                          : "bg-orange-50 text-[#ea8640] border border-orange-200 hover:bg-orange-100 hover:shadow-md active:scale-[0.97]"
                      }`}
                    >
                      {isSendingCode ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : resendCooldown > 0 ? (
                        <>
                          <span>إعادة الإرسال خلال</span>
                          <span className="bg-gray-200 text-gray-600 px-2.5 py-0.5 rounded-lg text-sm font-black tabular-nums min-w-[45px]">
                            {Math.floor(resendCooldown / 60)}:{(resendCooldown % 60).toString().padStart(2, '0')}
                          </span>
                        </>
                      ) : (
                        <>إعادة إرسال الرمز 🔄</>
                      )}
                    </button>

                    <div className="mt-8 space-y-3 text-right">
                      <div className="flex items-start gap-3 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
                        <div className="bg-orange-50 w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[#ea8640]"><Mail className="w-4 h-4"/></div>
                        <p className="text-sm font-bold text-gray-600 mt-1.5">تأكد من كتابة البريد الإلكتروني بشكل صحيح</p>
                      </div>
                      <div className="flex items-start gap-3 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
                        <div className="bg-orange-50 w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[#ea8640]"><Eye className="w-4 h-4"/></div>
                        <p className="text-sm font-bold text-gray-600 mt-1.5">إذا لم تجد الرسالة، يرجى تفقد مجلد (الرسائل المزعجة / Spam)</p>
                      </div>
                      <div className="flex items-start gap-3 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
                        <div className="bg-orange-50 w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[#ea8640]"><ShieldCheck className="w-4 h-4"/></div>
                        <p className="text-sm font-bold text-gray-600 mt-1.5">الرمز صالح لمدة 10 دقائق فقط للحفاظ على أمان حسابك</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {step === "onboarding" && (
              <motion.div key="onboard-mobile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-4 space-y-6">
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-3xl bg-white p-2 shadow-xl border border-orange-100 overflow-hidden">
                      <img
                        src={user?.avatarUrl || "/logo.png"}
                        alt="Profile"
                        referrerPolicy="no-referrer"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/logo.png"; }}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-[#7c2d12] text-white p-2 rounded-xl shadow-lg border-2 border-white">
                      <Star className="w-4 h-4 fill-current" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-zinc-900 mt-5">أهلاً بك في عائلة بدر الدين!</h3>
                  <p className="text-gray-400 text-sm mt-1 font-medium">بقي خطوة واحدة فقط</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-gray-600 font-bold text-sm flex items-center gap-1.5"><UserCircle className="w-4 h-4 text-primary" />الاسم</Label>
                    <Input value={usernameValue} onChange={(e) => registerForm.setValue("username", e.target.value)}
                      className="h-12 bg-white border-gray-200 rounded-xl px-4 font-bold text-base" placeholder="مثال: صالح العتيبي" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-gray-600 font-bold text-sm flex items-center gap-1.5"><Phone className="w-4 h-4 text-primary" />رقم الجوال</Label>
                    <div className="flex gap-2" dir="ltr">
                      <div className="flex items-center gap-1.5 px-3 h-12 bg-white border border-gray-200 rounded-xl min-w-[80px]">
                        <img src="https://flagcdn.com/w40/eg.png" width="20" alt="Egypt" className="rounded-sm h-3.5 w-5 object-cover" />
                        <span className="text-sm font-black text-gray-700">+20</span>
                      </div>
                      <Input value={phoneValue || ""} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 13); registerForm.setValue("phone", v); }}
                        type="tel" maxLength={13} placeholder="1xxxxxxxxx" className="h-12 bg-white border-gray-200 rounded-xl flex-1 font-bold text-base" />
                    </div>
                    <div className="flex justify-end">
                      <span className={`text-[10px] font-black tabular-nums ${(phoneValue?.length || 0) >= 13 ? 'text-green-500' : 'text-gray-400'}`}>
                        {phoneValue?.length || 0}/13
                      </span>
                    </div>
                    <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-700 font-bold leading-relaxed">رقم الجوال ضروري لمتابعة طلبك وتأكيد العنوان وقت التوصيل.</p>
                    </div>
                  </div>
                  <Button onClick={() => {
                    const username = registerForm.getValues("username") || user?.username || "عضو بدر الدين";
                    const rawPhone = registerForm.getValues("phone");
                    if (!rawPhone || rawPhone.length < 9) { toast({ title: "عذراً.. نحتاج لرقم جوالك لخدمتك", variant: "destructive", description: "يرجى إدخال 9 أرقام على الأقل" }); return; }
                    const fullPhone = countryCode.replace('+', '') + (rawPhone.startsWith('0') ? rawPhone.substring(1) : rawPhone);
                    completeProfileMutation.mutate({ username, phone: fullPhone, avatarUrl: user?.avatarUrl || undefined }, {
                      onSuccess: () => { toast({ title: "تم تفعيل الحساب بنجاح", description: `مرحباً بك ${username}` }); setLocation(getRoleRedirect(user?.role, !!user?.isAdmin)); }
                    });
                  }} disabled={completeProfileMutation.isPending}
                    className="w-full h-14 rounded-xl bg-[#7c2d12] hover:bg-[#6b2208] text-white font-black text-lg shadow-lg shadow-[#7c2d12]/30 transition-all flex items-center justify-center gap-2">
                    {completeProfileMutation.isPending ? <Loader2 className="animate-spin w-6 h-6" /> : (<>ابدأ الآن <ArrowRight className="w-5 h-5 rotate-180" /></>)}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </Tabs>
        </motion.div>
      </div>
      )}

      {/* ─── DESKTOP LAYOUT ─────────────────────────────────────────── */}
      {isDesktopLayout && (
      <div className="hidden lg:flex min-h-[calc(100vh-80px)]">
        {/* Left: Brand Panel */}
        <div
          className="w-[45%] flex flex-col items-center justify-center py-8 px-16 relative overflow-y-auto"
          style={{ background: "linear-gradient(160deg, #3d1408 0%, #7c2d12 50%, #c2410c 100%)" }}
        >
          <div className="absolute top-[-100px] right-[-100px] w-96 h-96 rounded-full opacity-10 bg-white" />
          <div className="absolute bottom-[-80px] left-[-80px] w-80 h-80 rounded-full opacity-10 bg-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-5 bg-white" />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 text-center"
          >
            <img src="https://raw.githubusercontent.com/HSG116/url/refs/heads/main/A_logo_with_the_store's_name_below_it_1779558557783.png" alt="محمصة بدر الدين" className="w-48 h-48 object-contain mx-auto drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] mb-5" />
            <h1 className="text-5xl font-black text-white tracking-tight mb-3 mt-4">محمصة بدر الدين</h1>
            <p className="text-white/60 font-bold tracking-[0.3em] uppercase text-sm mb-4">Badr Alden Roastery</p>
            <p className="text-white/70 font-medium text-lg leading-relaxed max-w-sm mx-auto mb-6">
              نقدم لك أفضل تجربة شرائية للمكسرات والبن المحمص.<br />جودة تليق بك وبأحبابك.
            </p>
            <div className="flex flex-col gap-3 items-center">
              {features.map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex items-center gap-4 bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-6 py-3.5 w-64">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/20`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white font-bold text-base">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right: Form Panel */}
        <div className="flex-1 flex items-center justify-center bg-white p-12 relative overflow-hidden">
          <div className="absolute top-[-100px] right-[-50px] w-80 h-80 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" />
          <div className="absolute bottom-[-100px] left-[-50px] w-80 h-80 bg-rose-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" style={{ animationDelay: "2s" }} />
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-[480px] relative z-10 bg-white/60 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-white/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)]"
          >
            <div className={`mb-8 text-right ${step !== "form" ? "hidden" : ""}`}>
              <h2 className="text-4xl font-black text-zinc-900 mb-2">تفضل بالدخول</h2>
              <p className="text-gray-400 font-medium">سجل دخولك أو أنشئ حساباً جديداً</p>
            </div>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className={`grid w-full grid-cols-2 mb-8 bg-gray-50 p-1.5 rounded-2xl h-14 border border-gray-100 ${step !== "form" ? "hidden" : ""}`}>
                <TabsTrigger value="login" onClick={() => setStep("form")} className="rounded-xl h-full font-black text-gray-400 text-base data-[state=active]:bg-[#7c2d12] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">تسجيل دخول</TabsTrigger>
                <TabsTrigger value="register" onClick={() => setStep("form")} className="rounded-xl h-full font-black text-gray-400 text-base data-[state=active]:bg-[#7c2d12] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">حساب جديد</TabsTrigger>
              </TabsList>

            <AnimatePresence mode="wait">
              {step === "form" && (
                <motion.div key="form-desktop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                    <TabsContent value="login" className="mt-0">
                      <form onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-5">
                        <div className="space-y-2">
                          <Label className="text-gray-600 font-bold text-sm">البريد الإلكتروني أو اسم المستخدم</Label>
                          <Input {...loginForm.register("email")} dir="ltr" type="text" autoComplete="username"
                            className="h-14 bg-white border-gray-200 focus:border-[#ea8640]/60 focus:ring-4 focus:ring-[#ea8640]/10 rounded-2xl text-lg px-5 shadow-sm placeholder:text-gray-300"
                            placeholder="name@example.com أو username" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-600 font-bold text-sm">كلمة المرور</Label>
                          <div className="relative">
                            <Input type={showLoginPw ? "text" : "password"} {...loginForm.register("password")} autoComplete="current-password"
                              className="h-14 bg-white border-gray-200 focus:border-[#ea8640]/60 focus:ring-4 focus:ring-[#ea8640]/10 rounded-2xl text-lg px-5 shadow-sm tracking-widest pl-14"
                              placeholder="••••••••" />
                            <button type="button" onClick={() => setShowLoginPw(!showLoginPw)} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                              {showLoginPw ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                        <Button type="submit" disabled={loginMutation.isPending}
                          className="w-full h-14 rounded-2xl bg-[#7c2d12] hover:bg-[#6b2208] text-white font-black text-xl shadow-xl shadow-[#7c2d12]/25 hover:shadow-[#7c2d12]/35 active:scale-[0.98] transition-all mt-2">
                          {loginMutation.isPending ? <Loader2 className="animate-spin w-7 h-7" /> : "دخول"}
                        </Button>
                        <div className="relative flex items-center py-2">
                          <div className="flex-grow border-t border-gray-100" />
                          <span className="mx-4 text-gray-300 font-bold text-xs">أو</span>
                          <div className="flex-grow border-t border-gray-100" />
                        </div>
                        <Button type="button" variant="outline" disabled={loginWithGoogleMutation.isPending} onClick={() => loginWithGoogleMutation.mutate()}
                          className="w-full h-14 rounded-2xl bg-white border-gray-200 hover:bg-gray-50 text-zinc-700 font-bold text-base shadow-sm flex items-center justify-center gap-4">
                          {loginWithGoogleMutation.isPending ? <Loader2 className="animate-spin w-6 h-6" /> : (<>
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            متابعة باستخدام جوجل
                          </>)}
                        </Button>
                      </form>
                    </TabsContent>

                    <TabsContent value="register" className="mt-0">
                      <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-gray-600 font-bold text-sm">اسم المستخدم</Label>
                            <Input {...registerForm.register("username")} dir="ltr" maxLength={15} autoComplete="username" placeholder="username"
                              className="h-13 bg-white border-gray-200 rounded-2xl focus:border-[#ea8640]/60 font-medium text-base h-12" />
                            {registerForm.formState.errors.username && <p className="text-red-500 text-xs">{registerForm.formState.errors.username.message}</p>}
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-gray-600 font-bold text-sm">البريد الإلكتروني</Label>
                            <Input {...registerForm.register("email")} type="email" autoComplete="email" dir="ltr" placeholder="email@example.com"
                              className="h-12 bg-white border-gray-200 rounded-2xl focus:border-[#ea8640]/60 font-medium text-base" />
                            {registerForm.formState.errors.email && <p className="text-red-500 text-xs">{registerForm.formState.errors.email.message}</p>}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-gray-600 font-bold text-sm">رقم الجوال</Label>
                          <div className="flex gap-2" dir="ltr">
                            <div className="flex items-center gap-2 px-3 h-12 bg-white border border-gray-200 rounded-2xl min-w-[85px]">
                              <img src="https://flagcdn.com/w40/eg.png" srcSet="https://flagcdn.com/w80/eg.png 2x" width="22" alt="Egypt" className="rounded-sm object-cover h-4 w-5.5 shrink-0" />
                              <span className="text-sm font-bold text-gray-700">+20</span>
                            </div>
                            <Input {...registerForm.register("phone")} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 13); registerForm.setValue("phone", v); }}
                              type="tel" maxLength={13} placeholder="1xxxxxxxxx"
                              className="h-12 bg-white border-gray-200 rounded-2xl focus:border-[#ea8640]/60 flex-1 font-bold text-base" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-gray-600 font-bold text-sm">كلمة المرور</Label>
                            <div className="relative">
                              <Input type={showRegPw ? "text" : "password"} {...registerForm.register("password")} placeholder="••••••••" autoComplete="new-password"
                                className="h-12 bg-white border-gray-200 rounded-2xl focus:border-[#ea8640]/60 font-medium text-base pl-11" />
                              <button type="button" onClick={() => setShowRegPw(!showRegPw)} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                {showRegPw ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-gray-600 font-bold text-sm">تأكيد المرور</Label>
                            <div className="relative">
                              <Input type={showRegConfPw ? "text" : "password"} {...registerForm.register("confirmPassword")} placeholder="••••••••" autoComplete="new-password"
                                className="h-12 bg-white border-gray-200 rounded-2xl focus:border-[#ea8640]/60 font-medium text-base pl-11" />
                              <button type="button" onClick={() => setShowRegConfPw(!showRegConfPw)} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                {showRegConfPw ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {passwordValue && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full transition-all duration-500 rounded-full ${passwordStrength <= 25 ? 'bg-red-400' : passwordStrength <= 50 ? 'bg-orange-400' : passwordStrength <= 75 ? 'bg-yellow-400' : 'bg-green-500'}`} style={{ width: `${passwordStrength}%` }} />
                            </div>
                            <span className={`text-xs font-bold whitespace-nowrap ${passwordStrength <= 25 ? 'text-red-400' : passwordStrength <= 50 ? 'text-orange-400' : passwordStrength <= 75 ? 'text-yellow-500' : 'text-green-600'}`}>
                              {passwordStrength <= 25 ? 'ضعيفة' : passwordStrength <= 50 ? 'متوسطة' : passwordStrength <= 75 ? 'جيدة' : 'قوية ✓'}
                            </span>
                          </div>
                        )}

                        <Button type="submit" disabled={registerMutation.isPending}
                          className="w-full h-13 py-3.5 rounded-2xl bg-zinc-900 hover:bg-black text-white font-black text-lg shadow-lg transition-all">
                          {registerMutation.isPending ? <Loader2 className="animate-spin" /> : "إنشاء حساب"}
                        </Button>
                      </form>
                    </TabsContent>
                </motion.div>
              )}

              {step === "selection" && (
                <motion.div key="sel-desktop" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div className="text-right mb-8">
                    <h2 className="text-4xl font-black text-zinc-900 mb-2">تفعيل الحساب</h2>
                    <p className="text-gray-400 font-medium">اختر طريقة التحقق</p>
                  </div>
                  <button disabled={isSendingCode} onClick={() => handleMethodSelect("gmail")} className={`w-full group bg-white border border-gray-100 hover:border-orange-200 p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all flex items-center gap-5 ${isSendingCode ? "opacity-50 cursor-not-allowed" : ""}`}>
                    <div className="w-16 h-16 bg-orange-50 text-[#ea8640] rounded-2xl flex items-center justify-center group-hover:bg-[#ea8640] group-hover:text-white transition-colors">
                      {isSendingCode ? <Loader2 className="w-8 h-8 animate-spin" /> : <Mail className="w-8 h-8" />}
                    </div>
                    <div className="text-right flex-1">
                      <h3 className="font-black text-gray-900 text-xl">عبر البريد</h3>
                      <p className="text-gray-400 text-sm mt-1">Gmail Verification</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-gray-300 group-hover:text-[#ea8640] rotate-180 transition-colors" />
                  </button>
                  <button onClick={() => handleMethodSelect("telegram")} className="w-full group bg-white border border-gray-100 hover:border-blue-200 p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all flex items-center gap-5">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      <MessageSquare className="w-8 h-8" />
                    </div>
                    <div className="text-right flex-1">
                      <h3 className="font-black text-gray-900 text-xl">عبر تيليجرام</h3>
                      <p className="text-gray-400 text-sm mt-1">Telegram Bot</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-gray-300 group-hover:text-blue-500 rotate-180 transition-colors" />
                  </button>
                  <Button variant="ghost" className="w-full mt-4 text-gray-400 hover:text-gray-900 font-bold" onClick={() => setStep("form")}>رجوع</Button>
                </motion.div>
              )}

              {step === "otp" && (
                <motion.div key="otp-desktop" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-8 text-center">
                  {otpMethod === "telegram" ? (
                    <div className="space-y-8">
                      <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                        <Send className="w-12 h-12" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-black text-gray-900">افتح تيليجرام</h3>
                        <p className="text-gray-500 text-base mt-2">التفعيل يتم تلقائياً عند بدء المحادثة</p>
                      </div>
                      {telegramLink && (
                        <a href={telegramLink} target="_blank" rel="noreferrer" className="block w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xl shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02]">
                          فتح التطبيق
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-10">
                      <div>
                        <h3 className="text-3xl font-black text-gray-900">أدخل رمز التحقق</h3>
                        <p className="text-gray-400 mt-2">تم إرساله على بريدك الإلكتروني</p>
                      </div>
                      <div className="flex justify-center gap-4" dir="ltr">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <Input key={i}
                            ref={(el) => (otpRefs.current[i] = el)}
                            className="w-16 h-20 text-center text-4xl font-black bg-white border-2 border-orange-100 focus:bg-orange-50 focus:border-[#ea8640] focus:ring-4 focus:ring-[#ea8640]/20 focus:scale-110 focus:-translate-y-2 hover:border-orange-300 rounded-[1.2rem] transition-all duration-300 shadow-lg p-0 text-[#7c2d12]"
                            maxLength={1} value={otpValue[i] || ""}
                            onChange={(e) => handleOtpChange(i, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                            onPaste={handleOtpPaste}
                          />
                        ))}
                      </div>
                      <Button onClick={verifyOtp} disabled={otpValue.length !== 6 || isVerifying || registerMutation.isPending}
                        className="w-full h-16 bg-[#7c2d12] hover:bg-[#6b2208] text-white font-black text-2xl rounded-2xl shadow-xl">
                        {(isVerifying || registerMutation.isPending) ? <Loader2 className="animate-spin w-7 h-7" /> : "تأكيد الرمز"}
                      </Button>

                      <button
                        onClick={handleResendCode}
                        disabled={resendCooldown > 0 || isSendingCode}
                        className={`w-full mt-5 py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 ${
                          resendCooldown > 0
                            ? "bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed"
                            : "bg-orange-50 text-[#ea8640] border border-orange-200 hover:bg-orange-100 hover:shadow-lg active:scale-[0.97]"
                        }`}
                      >
                        {isSendingCode ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : resendCooldown > 0 ? (
                          <>
                            <span>إعادة الإرسال خلال</span>
                            <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-xl text-base font-black tabular-nums min-w-[55px]">
                              {Math.floor(resendCooldown / 60)}:{(resendCooldown % 60).toString().padStart(2, '0')}
                            </span>
                          </>
                        ) : (
                          <>إعادة إرسال الرمز 🔄</>
                        )}
                      </button>

                      <div className="mt-10 space-y-4 text-right">
                        <div className="flex items-start gap-4 bg-white border border-gray-100 p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                          <div className="bg-orange-50 w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-[#ea8640]"><Mail className="w-5 h-5"/></div>
                          <p className="text-base font-bold text-gray-600 mt-2">تأكد من كتابة البريد الإلكتروني بشكل صحيح لتصلك رسالتنا.</p>
                        </div>
                        <div className="flex items-start gap-4 bg-white border border-gray-100 p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                          <div className="bg-orange-50 w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-[#ea8640]"><Eye className="w-5 h-5"/></div>
                          <p className="text-base font-bold text-gray-600 mt-2">إذا لم تجد الرسالة في البريد الوارد، يرجى تفقد مجلد (الرسائل المزعجة / Spam).</p>
                        </div>
                        <div className="flex items-start gap-4 bg-white border border-gray-100 p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                          <div className="bg-orange-50 w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-[#ea8640]"><ShieldCheck className="w-5 h-5"/></div>
                          <p className="text-base font-bold text-gray-600 mt-2">الرمز صالح لمدة 10 دقائق فقط للحفاظ على أمان وسرية بيانات حسابك.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {step === "onboarding" && (
                <motion.div key="onboard-desktop" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-4 space-y-8">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-3xl bg-white p-2 shadow-2xl border border-orange-100 overflow-hidden">
                        <img
                          src={user?.avatarUrl || "https://raw.githubusercontent.com/HSG116/url/refs/heads/main/logo_1779558557784.png"}
                          alt="Profile"
                          referrerPolicy="no-referrer"
                          onError={(e) => { (e.target as HTMLImageElement).src = "https://raw.githubusercontent.com/HSG116/url/refs/heads/main/logo_1779558557784.png"; }}
                          className="w-full h-full object-cover rounded-2xl"
                        />
                      </div>
                      <div className="absolute -bottom-3 -right-3 bg-[#7c2d12] text-white p-2.5 rounded-2xl shadow-lg border-4 border-white">
                        <Star className="w-5 h-5 fill-current" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-black text-zinc-900 mt-8">أهلاً بك في عائلة بدر الدين!</h3>
                    <p className="text-gray-400 font-bold mt-2">بقي خطوة واحدة لنبدأ رحلتنا معاً</p>
                  </div>
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-zinc-600 font-black text-sm flex items-center gap-2"><UserCircle className="w-4 h-4 text-primary" />الاسم</Label>
                      <Input value={usernameValue} onChange={(e) => registerForm.setValue("username", e.target.value)}
                        className="h-16 bg-gray-50 border-gray-100 rounded-2xl font-black text-xl px-6" placeholder="مثال: صالح العتيبي" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-600 font-black text-sm flex items-center gap-2"><Phone className="w-4 h-4 text-primary" />رقم جوالك</Label>
                      <div className="flex gap-3" dir="ltr">
                        <div className="flex items-center gap-2 px-4 h-16 bg-gray-50 border border-gray-100 rounded-2xl min-w-[90px]">
                          <img src="https://flagcdn.com/w40/eg.png" srcSet="https://flagcdn.com/w80/eg.png 2x" width="24" alt="Egypt" className="rounded-sm h-4 w-6 object-cover" />
                          <span className="text-base font-black text-gray-700">+20</span>
                        </div>
                        <Input value={phoneValue || ""} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 13); registerForm.setValue("phone", v); }}
                          type="tel" maxLength={13} placeholder="1xxxxxxxxx"
                          className="h-16 bg-gray-50 border-gray-100 rounded-2xl flex-1 font-black text-xl px-6" />
                      </div>
                      <div className="flex justify-end">
                        <span className={`text-xs font-black tabular-nums ${(phoneValue?.length || 0) >= 13 ? 'text-green-500' : 'text-gray-400'}`}>
                          {phoneValue?.length || 0}/13
                        </span>
                      </div>
                      <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100 flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-800 font-bold leading-relaxed">رقم الجوال ضروري لمتابعة طلبك وتأكيد العنوان وقت التوصيل.</p>
                      </div>
                    </div>
                    <Button onClick={() => {
                      const username = registerForm.getValues("username") || user?.username || "عضو بدر الدين";
                      const rawPhone = registerForm.getValues("phone");
                      if (!rawPhone || rawPhone.length < 9) { toast({ title: "عذراً.. نحتاج لرقم جوالك لخدمتك", variant: "destructive", description: "يرجى إدخال 9 أرقام على الأقل" }); return; }
                      const fullPhone = countryCode.replace('+', '') + (rawPhone.startsWith('0') ? rawPhone.substring(1) : rawPhone);
                      completeProfileMutation.mutate({ username, phone: fullPhone, avatarUrl: user?.avatarUrl || undefined }, {
                        onSuccess: () => { toast({ title: "تم تفعيل الحساب بنجاح", description: `مرحباً بك ${username}` }); setLocation(getRoleRedirect(user?.role, !!user?.isAdmin)); }
                      });
                    }} disabled={completeProfileMutation.isPending}
                      className="w-full h-18 py-8 rounded-[2rem] bg-[#7c2d12] hover:bg-[#6b2208] text-white font-black text-2xl shadow-[0_15px_40px_-10px_rgba(124,45,18,0.4)] active:scale-[0.97] transition-all flex items-center justify-center gap-3">
                      {completeProfileMutation.isPending ? <Loader2 className="animate-spin w-8 h-8" /> : (<>ابـدأ الآن <ArrowRight className="w-6 h-6 rotate-180" /></>)}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            </Tabs>
          </motion.div>
        </div>
      </div>
      )}

      <BottomNav />
    </div>
  );
}
