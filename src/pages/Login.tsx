import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Truck, LogIn, Loader2, Eye, EyeOff, UserPlus, User, Mail, Phone as PhoneIcon, Lock, CheckCircle, Sun, Moon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../services/supabase';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const { login, loginAsDemo, isLoading } = useAuth();
  const navigate = useNavigate();

  // Register form
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !password.trim()) {
      toast.error('الرجاء إدخال رقم الهاتف وكلمة المرور');
      return;
    }

    const res = await login(phone, password, remember);
    if (res.success) {
      toast.success('تم تسجيل الدخول بنجاح');
      navigate('/');
    } else {
      toast.error(res.error || 'فشل تسجيل الدخول');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim() || !regEmail.trim() || !regPassword.trim() || !regConfirmPassword.trim()) {
      toast.error('الرجاء ملء جميع الحقول');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      toast.error('كلمة المرور وتأكيدها غير متطابقين');
      return;
    }
    if (regPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setIsRegistering(true);
    try {
      const { error } = await supabase.from('users').insert([
        {
          username: regName.trim(),
          phone: regPhone.trim(),
          email: regEmail.trim(),
          password: regPassword.trim(),
          role: 'rep',
          approved: false,
        },
      ]);

      if (error) {
        if (error.message.includes('duplicate')) {
          toast.error('رقم الموبايل أو البريد الإلكتروني مسجل بالفعل');
        } else {
          toast.error('حدث خطأ أثناء إنشاء الحساب: ' + error.message);
        }
        return;
      }

      toast.success('تم إنشاء الحساب بنجاح، يرجى انتظار موافقة المدير');
      setShowRegister(false);
      setPhone(regPhone.trim());
      setRegName('');
      setRegPhone('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
    } catch (err: any) {
      toast.error('فشل الاتصال بالخادم');
    } finally {
      setIsRegistering(false);
    }
  };

  const toggleMode = () => {
    setShowRegister(!showRegister);
    setPhone('');
    setPassword('');
    setRegName('');
    setRegPhone('');
    setRegEmail('');
    setRegPassword('');
    setRegConfirmPassword('');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 relative overflow-hidden bg-bg-main transition-colors duration-200">
      <button
        onClick={() => setIsDark(!isDark)}
        className="absolute top-4 left-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-text-muted hover:text-text-main transition-colors z-20 cursor-pointer"
        title={isDark ? 'الوضع العادي' : 'الوضع الليلي'}
      >
        {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
      </button>
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-bg-surface p-8 rounded-2xl shadow-xl shadow-black/50 border border-border-subtle relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/20 p-4 rounded-full mb-4">
            <Truck className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-main mb-1">إدارة الشحنات</h1>
          <p className="text-text-muted text-sm">{showRegister ? 'إنشاء حساب جديد لمتابعة شحناتك' : 'سجل دخولك لمتابعة شحناتك'}</p>
        </div>

        {showRegister ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5" htmlFor="regName">
                اسم صاحب الحساب
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted pointer-events-none">
                  <User className="w-5 h-5" />
                </span>
                <input
                  id="regName"
                  type="text"
                  dir="auto"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-bg-main text-text-main border border-border-strong rounded-xl pr-10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder=""
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5" htmlFor="regPhone">
                رقم الموبايل
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted pointer-events-none">
                  <PhoneIcon className="w-5 h-5" />
                </span>
                <input
                  id="regPhone"
                  type="tel"
                  dir="ltr"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full bg-bg-main text-text-main border border-border-strong rounded-xl pr-10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder=""
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5" htmlFor="regEmail">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted pointer-events-none">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  id="regEmail"
                  type="email"
                  dir="ltr"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-bg-main text-text-main border border-border-strong rounded-xl pr-10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder=""
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5" htmlFor="regPassword">
                كلمة المرور
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted pointer-events-none">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  id="regPassword"
                  type={showRegPassword ? 'text' : 'password'}
                  value={regPassword}
                  dir="ltr"
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full bg-bg-main text-text-main border border-border-strong rounded-xl pr-10 px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder=""
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors cursor-pointer"
                >
                  {showRegPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5" htmlFor="regConfirmPassword">
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted pointer-events-none">
                  <CheckCircle className="w-5 h-5" />
                </span>
                <input
                  id="regConfirmPassword"
                  type={showRegConfirm ? 'text' : 'password'}
                  value={regConfirmPassword}
                  dir="ltr"
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="w-full bg-bg-main text-text-main border border-border-strong rounded-xl pr-10 px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder=""
                />
                <button
                  type="button"
                  onClick={() => setShowRegConfirm(!showRegConfirm)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors cursor-pointer"
                >
                  {showRegConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={isRegistering}
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isRegistering ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    <span>إنشاء حساب جديد</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5" htmlFor="phone">
                رقم الموبايل
              </label>
              <input
                id="phone"
                type="text"
                dir="auto"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-bg-main text-text-main border border-border-strong rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder=""
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5" htmlFor="password">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  dir="ltr"
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-bg-main text-text-main border border-border-strong rounded-xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder=""
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-border-strong bg-bg-main text-primary focus:ring-primary focus:ring-offset-bg-main"
              />
              <label htmlFor="remember" className="mr-2 text-sm text-text-muted select-none">
                تذكر تسجيل الدخول
              </label>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>تسجيل الدخول</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={toggleMode}
            className="text-sm text-primary hover:text-primary-hover transition-colors cursor-pointer"
          >
            {showRegister ? 'لديك حساب بالفعل؟ تسجيل الدخول' : 'ليس لديك حساب؟ إنشاء حساب جديد'}
          </button>
        </div>
      </div>
    </div>
  );
}
