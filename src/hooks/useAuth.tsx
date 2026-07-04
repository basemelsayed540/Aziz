import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase, type User } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  login: (phone: string, password: string, remember: boolean) => Promise<{ success: boolean; error?: string }>;
  loginAsDemo: () => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to seed initial demo shipments into localStorage
const seedDemoShipments = (courierName: string) => {
  const existing = localStorage.getItem('demo_shipments');
  if (existing) return;

  const mockShipments = [
    {
      m: "1",
      "اسم العميل": "أحمد محمود الشناوي",
      "العنوان": "شارع جامعة الدول العربية خلف قدورة",
      "الزون": "المهندسين",
      "المنتج": "ساعة ذكية Smart Watch T900",
      "الهاتف": "01012345678",
      "هاتف بديل": "01198765432",
      "المبلغ": 1250,
      "الراسل": "متجر الأناقة للملابس",
      "كود الشحنة": "EL-9081",
      "المندوب": courierName,
      "الحالة": "قيد التوصيل",
      "سبب الحالة": null,
      "السعر بعد التعديل": null,
      "ملاحظات": "الرجاء الاتصال قبل الوصول بنصف ساعة",
      "تاريخ التحديث": "2026-05-19 14:30:22",
      "الصافي": 1150,
      "الشحن": 100,
      "عدد": 1,
      "تقفيل": "لا",
      "عمولة المندوب": 50,
      "اسم الموظف": "مدير النظام",
      "حدث": null,
      "اليومية": "2026-05-19",
      "نوع المندوب": "اساسي",
      "ارشيف": false,
      "المندوب الفرعي": null,
      "عمولة المندوب الفرعي": null
    },
    {
      m: "2",
      "اسم العميل": "مريم عمر الفاروق",
      "العنوان": "شارع 9 أمام محطة مترو المعادي",
      "الزون": "المعادي",
      "المنتج": "فستان سواريه تركي أحمر",
      "الهاتف": "01234567890",
      "هاتف بديل": "01511223344",
      "المبلغ": 2200,
      "الراسل": "بوتيك فاشن وبس",
      "كود الشحنة": "EL-4432",
      "المندوب": courierName,
      "الحالة": "تم",
      "سبب الحالة": null,
      "السعر بعد التعديل": null,
      "ملاحظات": "التسليم في مكتب الدور الثالث شركة التقنية",
      "تاريخ التحديث": "2026-05-19 12:15:00",
      "الصافي": 2100,
      "الشحن": 100,
      "عدد": 1,
      "تقفيل": "نعم",
      "عمولة المندوب": 50,
      "اسم الموظف": "أحمد علي",
      "حدث": null,
      "اليومية": "2026-05-19",
      "نوع المندوب": "اساسي",
      "ارشيف": false,
      "المندوب الفرعي": null,
      "عمولة المندوب الفرعي": null
    },
    {
      m: "3",
      "اسم العميل": "كريم عبد العزيز",
      "العنوان": "شارع التسعين الشمالي بجوار داون تاون",
      "الزون": "التجمع الخامس",
      "المنتج": "حذاء رياضي نايكي مقاس 43",
      "الهاتف": "01006543210",
      "هاتف بديل": "",
      "المبلغ": 1850,
      "الراسل": "سبورتس وير زون",
      "كود الشحنة": "EL-2210",
      "المندوب": courierName,
      "الحالة": "مؤجل",
      "سبب الحالة": "العميل خارج المنزل حتى الغد",
      "السعر بعد التعديل": null,
      "ملاحظات": "طلب تأجيل ليوم الخميس القادم",
      "تاريخ التحديث": "2026-05-19 11:00:00",
      "الصافي": 1750,
      "الشحن": 100,
      "عدد": 1,
      "تقفيل": "لا",
      "عمولة المندوب": 50,
      "اسم الموظف": "كريم محسن",
      "حدث": null,
      "اليومية": "2026-05-19",
      "نوع المندوب": "اساسي",
      "ارشيف": false,
      "المندوب الفرعي": null,
      "عمولة المندوب الفرعي": null
    },
    {
      m: "4",
      "اسم العميل": "شيماء عبد الرحمن",
      "العنوان": "شارع عباس العقاد بجوار حديقة الطفل",
      "الزون": "مدينة نصر",
      "المنتج": "مجموعة مستحضرات تجميل ومكياج",
      "الهاتف": "01123450987",
      "هاتف بديل": "01077665544",
      "المبلغ": 950,
      "الراسل": "بيوتي هير بلانت",
      "كود الشحنة": "EL-6112",
      "المندوب": courierName,
      "الحالة": "الغاء",
      "سبب الحالة": "العميل ألغى الأوردر لارتفاع السعر",
      "السعر بعد التعديل": null,
      "ملاحظات": "مرفوض الاستلام لوجود عيوب بالعلبة الخارجية",
      "تاريخ التحديث": "2026-05-18 16:20:10",
      "الصافي": 850,
      "الشحن": 100,
      "عدد": 1,
      "تقفيل": "لا",
      "عمولة المندوب": 15,
      "اسم الموظف": "منى جمال",
      "حدث": null,
      "اليومية": "2026-05-18",
      "نوع المندوب": "اساسي",
      "ارشيف": false,
      "المندوب الفرعي": null,
      "عمولة المندوب الفرعي": null
    },
    {
      m: "5",
      "اسم العميل": "محمد حسن الجيار",
      "العنوان": "الحي الأول بالقرب من هايبر وان",
      "الzون": "الشيخزايد",
      "الزون": "الشيخ زايد",
      "المنتج": "ماكينة حلاقة كيمي ريبون",
      "الهاتف": "01543210987",
      "هاتف بديل": "",
      "المبلغ": 450,
      "الراسل": "سوق دوت أولاد رجب",
      "كود الشحنة": "EL-8004",
      "المندوب": courierName,
      "الحالة": "قيد التوصيل",
      "سبب الحالة": null,
      "السعر بعد التعديل": null,
      "ملاحظات": "تأكيد السعر 450 والشحن مجاني",
      "تاريخ التحديث": "2026-05-19 09:30:00",
      "الصافي": 450,
      "الشحن": 0,
      "عدد": 1,
      "تقفيل": "لا",
      "عمولة المندوب": 40,
      "اسم الموظف": "مدير النظام",
      "حدث": null,
      "اليومية": "2026-05-19",
      "نوع المندوب": "اساسي",
      "ارشيف": false,
      "المندوب الفرعي": null,
      "عمولة المندوب الفرعي": null
    },
    {
      m: "6",
      "اسم العميل": "منى زكي الشافعي",
      "العنوان": "شارع شبرا الرئيسي أمام مكتب بريد شبرا",
      "الزون": "شبرا",
      "المنتج": "شنطة لابتوب 15.6 بوصة ضد الماء",
      "الهاتف": "01033445566",
      "هاتف بديل": "01200998877",
      "المبلغ": 680,
      "الراسل": "لابتوب ماركت",
      "كود الشحنة": "EL-7751",
      "المندوب": courierName,
      "الحالة": "تعديل سعر",
      "سبب الحالة": "تم الاتصال 3 مرات مغلق ولا يرد",
      "السعر بعد التعديل": null,
      "ملاحظات": "المحاولة القادمة غداً صباحاً",
      "تاريخ التحديث": "2026-05-19 16:45:00",
      "الصافي": 630,
      "الشحن": 50,
      "عدد": 1,
      "تقفيل": "لا",
      "عمولة المندوب": 50,
      "اسم الموظف": "مدير النظام",
      "حدث": null,
      "اليومية": "2026-05-19",
      "نوع المندوب": "اساسي",
      "ارشيف": false,
      "المندوب الفرعي": null,
      "عمولة المندوب الفرعي": null
    },
    {
      m: "7",
      "اسم العميل": "هشام سليم المصري",
      "العنوان": "شارع النزهة بجوار سيتي ستارز",
      "الزون": "مصر الجديدة",
      "المنتج": "طقم كاسات زجاجي فاخر",
      "الهاتف": "01144556677",
      "هاتف بديل": "",
      "المبلغ": 800,
      "الراسل": "بيت العائلة للهدايا",
      "كود الشحنة": "EL-1033",
      "المندوب": courierName,
      "الحالة": "شحن",
      "سبب الحالة": null,
      "السعر بعد التعديل": null,
      "ملاحظات": "قابل للكسر، يرجى التعامل برفق للغاية",
      "تاريخ التحديث": "2026-05-19 10:10:00",
      "الصافي": 720,
      "الشحن": 80,
      "عدد": 1,
      "تقفيل": "لا",
      "عمولة المندوب": 50,
      "اسم الموظف": "سيد الصاوي",
      "حدث": null,
      "اليومية": "2026-05-19",
      "نوع المندوب": "اساسي",
      "ارشيف": false,
      "المندوب الفرعي": null,
      "عمولة المندوب الفرعي": null
    },
    {
      m: "8",
      "اسم العميل": "طارق علام",
      "العنوان": "شارع التحرير بالقرب من سينما التحرير",
      "الزون": "الدقي",
      "المنتج": "غلاية مياه كهربائية ستانلس",
      "الهاتف": "01599887766",
      "هاتف بديل": "01233442211",
      "المبلغ": 550,
      "الراسل": "الأجهزة العصرية والمنزلية",
      "كود الشحنة": "EL-3001",
      "المندوب": courierName,
      "الحالة": "تم",
      "سبب الحالة": null,
      "السعر بعد التعديل": null,
      "ملاحظات": "تم التأكيد مع العميل قبل الشحن",
      "تاريخ التحديث": "2026-05-19 13:00:00",
      "الصافي": 500,
      "الشحن": 50,
      "عدد": 1,
      "تقفيل": "نعم",
      "عمولة المندوب": 40,
      "اسم الموظف": "سمير غانم",
      "حدث": null,
      "اليومية": "2026-05-19",
      "نوع المندوب": "اساسي",
      "ارشيف": false,
      "المندوب الفرعي": null,
      "عمولة المندوب الفرعي": null
    }
  ];
  
  localStorage.setItem('demo_shipments', JSON.stringify(mockShipments));
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage for session
    const storedUser = localStorage.getItem('courier_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        if (parsed.id === 'demo-rep') {
          seedDemoShipments(parsed.username);
        }
      } catch (e) {
        localStorage.removeItem('courier_user');
      }
    }
    setIsLoading(false);
  }, []);

  const loginAsDemo = () => {
    setIsLoading(true);
    const mockUser: User = {
      id: 'demo-rep',
      username: 'أحمد رجب (مندوب تجريبي)',
      email: 'demo@elsayed-delivery.com',
      phone: '01000000000',
      role: 'rep',
      approved: true,
      parent_id: null,
      created_at: new Date().toISOString()
    };
    
    seedDemoShipments(mockUser.username);
    setUser(mockUser);
    localStorage.setItem('courier_user', JSON.stringify(mockUser));
    setIsLoading(false);
  };

  const login = async (phone: string, password: string, remember: boolean) => {
    setIsLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseUrl === 'https://placeholder-url.supabase.co') {
        return { success: false, error: 'الرجاء إضافة بيانات Supabase (URL و ANON KEY) في قائمة Secrets بالإعدادات (الترس أعلى يمين الشاشة) لتفعيل النظام.' };
      }

      const cleanInput = phone.trim();
      const cleanPassword = password.trim();

      // Try to fetch user matching either phone, username, or email AND matching the password
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`phone.eq."${cleanInput}",username.eq."${cleanInput}",email.eq."${cleanInput}"`)
        .eq('password', cleanPassword)
        .maybeSingle();

      if (error) {
        // If the table 'users' doesn't exist or columns are different, Supabase will return a database error
        console.error('Supabase login error:', error);
        let errorMsg = 'حدث خطأ أثناء الاتصال بالخادم: ' + error.message;
        if (error.message.includes('relation "public.users" does not exist') || error.code === '42P01') {
          errorMsg = 'جدول المستخدمين "users" غير موجود في قاعدة بيانات Supabase الخاصة بك. يرجى إنشاء جدول "users" بالخانات المطلوبة (phone, password, username, approved, role).';
        } else if (error.message.includes('column') && error.message.includes('does not exist')) {
          errorMsg = 'مرحباً، أحد الأعمدة المطلوبة غير موجود في جدول "users". تأكد من وجود الأعمدة (phone, password, username, approved, role). تفاصيل الخطأ: ' + error.message;
        }
        return { success: false, error: errorMsg };
      }

      if (!data) {
        return { success: false, error: 'بيانات الدخول غير صحيحة (رقم الهاتف أو كلمة المرور خاطئة).' };
      }

      // If user is found, check approval status
      if (data.approved !== undefined && data.approved !== true) {
        return { success: false, error: 'حسابك موجود ولكنه غير مفعل بعد من قبل الإدارة.' };
      }

      const userData = data as User;
      setUser(userData);
      
      if (remember) {
        localStorage.setItem('courier_user', JSON.stringify(userData));
      } else {
        sessionStorage.setItem('courier_user', JSON.stringify(userData));
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'حدث خطأ أثناء الاتصال بالخادم.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('courier_user');
    sessionStorage.removeItem('courier_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, loginAsDemo, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
