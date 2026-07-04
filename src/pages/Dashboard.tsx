import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase, type Shipment, type User } from '../services/supabase';
import { Navigate } from 'react-router-dom';
import { 
  LogOut, RefreshCw, Truck, Map as MapIcon, List, Box, Sun, Moon, Users, TrendingUp, 
  CheckCircle2, AlertTriangle, XCircle, Clock, UserPlus, Edit2, Trash2, UserCheck, UserX, Shield, Lock, Mail, Phone as PhoneIcon,
  Bell
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ShipmentCard } from '../components/ShipmentCard';
import { StatsSection, type StatsData } from '../components/StatsSection';
import { FilterSection } from '../components/FilterSection';
import { ShipmentsMap } from '../components/ShipmentsMap';

const isArchived = (s: Shipment): boolean => {
  const val = s['ارشيف'];
  return !!(val && String(val).trim());
};

const isValidRepStatus = (status: string | null | undefined): boolean => {
  if (!status) return false;
  return ['قيد التوصيل', 'تم', 'مؤجل', 'الغاء', 'تعديل سعر', 'شحن'].includes(status.trim());
};

const isEligibleStatus = (status: string | null | undefined): boolean => {
  if (!status) return false;
  return ['تم', 'تعديل سعر', 'شحن'].includes(status.trim());
};

const isDeliveredStatus = (status: string | null | undefined): boolean => {
  if (!status) return false;
  return status.trim() === 'تم';
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [actionsHidden, setActionsHidden] = useState(() => {
    return localStorage.getItem('rep-actions-hidden') === 'true';
  });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });
  
  // Notifications (like R)
  const [notifications, setNotifications] = useState<{ title: string; desc: string }[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  // Load snapshot and check notifications when shipments change
  useEffect(() => {
    if (!shipments.length) return;
    const saved = localStorage.getItem('repNotifSnapshot');
    const snapshot: Record<string, string> = saved ? JSON.parse(saved) : {};
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const newNotifs: { title: string; desc: string }[] = [];

    shipments.forEach(s => {
      const id = String(s.id || s.m);
      const oldStatus = snapshot[id] || '';
      const newStatus = s["الحالة"] || '';
      const customer = s["اسم العميل"] || s["كود الشحنة"] || id;
      if (oldStatus && oldStatus !== newStatus) {
        newNotifs.unshift({ title: `تحديث حالة: ${customer}`, desc: `${oldStatus} ← ${newStatus} • ${timeStr}` });
      }
    });

    if (newNotifs.length) {
      setNotifications(prev => [...newNotifs, ...prev].slice(0, 50));
    }

    // Save new snapshot
    const newSnapshot: Record<string, string> = {};
    shipments.forEach(s => { newSnapshot[String(s.id || s.m)] = s["الحالة"] || ''; });
    localStorage.setItem('repNotifSnapshot', JSON.stringify(newSnapshot));
  }, [shipments]);

  // Close panel on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifOpen && !(e.target as HTMLElement).closest('.notif-container')) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [notifOpen]);

  // Rep search filter in Admin Mode
  const [adminRepSearch, setAdminRepSearch] = useState('');
  const [selectedDaily, setSelectedDaily] = useState<string>('الكل');

  // Admin tabs & user management states
  const [adminTab, setAdminTab] = useState<'stats' | 'users'>('stats');
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);

  // Form State
  const [formUsername, setFormUsername] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'rep' | 'admin'>('rep');
  const [formApproved, setFormApproved] = useState(true);

  // User list search
  const [usersSearchQuery, setUsersSearchQuery] = useState('');

  const resetUserForm = () => {
    setFormUsername('');
    setFormPhone('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('rep');
    setFormApproved(true);
    setEditingUser(null);
    setShowUserForm(false);
  };

  const fetchUsers = async () => {
    if (!user || user.role !== 'admin') return;
    setIsUsersLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        toast.error('حدث خطأ أثناء جلب حسابات المناديب');
        console.error(error);
      } else {
        setUsersList(data || []);
      }
    } catch (err) {
      toast.error('أخفق الاتصال بالخادم لجلب المناديب');
    } finally {
      setIsUsersLoading(false);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formUsername.trim() || !formPhone.trim() || !formEmail.trim()) {
      toast.error('يرجى ملء جميع الخانات الأساسية (الاسم، الهاتف، البريد)');
      return;
    }

    if (!formEmail.includes('@')) {
      toast.error('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }

    if (!editingUser && !formPassword) {
      toast.error('يرجى تعيين كلمة مرور للحساب الجديد');
      return;
    }

    try {
      setIsUsersLoading(true);
      
      if (editingUser) {
        const updateData: any = {
          username: formUsername.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim(),
          role: formRole,
          approved: formApproved,
        };

        if (formPassword.trim()) {
          updateData.password = formPassword.trim();
        }

        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', editingUser.id);

        if (error) throw error;
        toast.success('تم تعديل حساب المندوب بنجاح');
      } else {
        const newUser = {
          username: formUsername.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim(),
          password: formPassword.trim(),
          role: formRole,
          approved: formApproved,
        };

        const { error } = await supabase
          .from('users')
          .insert([newUser]);

        if (error) throw error;
        toast.success('تم إنشاء حساب المندوب الجديد بنجاح');
      }
      
      resetUserForm();
      await fetchUsers();
    } catch (err: any) {
      console.error(err);
      toast.error('فشلت العملية: ' + (err.message || 'خطأ غير معروف'));
    } finally {
      setIsUsersLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`هل أنت متأكد من حذف حساب المندوب "${username}" نهائياً؟`)) {
      return;
    }

    try {
      setIsUsersLoading(true);
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast.success('تم حذف حساب المندوب بنجاح');
      await fetchUsers();
    } catch (err: any) {
      console.error(err);
      toast.error('حدث خطأ أثناء الحذف: ' + (err.message || 'خطأ غير معروف'));
    } finally {
      setIsUsersLoading(false);
    }
  };

  const handleToggleApproved = async (userItem: User) => {
    const newStatus = !userItem.approved;
    try {
      // Optimistic update
      setUsersList(prev => prev.map(u => u.id === userItem.id ? { ...u, approved: newStatus } : u));
      
      const { error } = await supabase
        .from('users')
        .update({ approved: newStatus })
        .eq('id', userItem.id);

      if (error) throw error;

      toast.success(newStatus ? 'تم تفعيل الحساب بنجاح' : 'تم إيقاف الحساب بنجاح');
    } catch (err: any) {
      console.error(err);
      toast.error('فشل تغيير حالة الحساب: ' + (err.message || 'خطأ غير معروف'));
      // Revert
      setUsersList(prev => prev.map(u => u.id === userItem.id ? { ...u, approved: !newStatus } : u));
    }
  };

  const startEditUser = (userItem: User) => {
    setEditingUser(userItem);
    setFormUsername(userItem.username || '');
    setFormPhone(userItem.phone || '');
    setFormEmail(userItem.email || '');
    setFormPassword('');
    setFormRole(userItem.role || 'rep');
    setFormApproved(userItem.approved ?? true);
    setShowUserForm(true);
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);
  
  // Filters state (restored from localStorage like R)
  const [filters, setFilters] = useState(() => {
    const saved = localStorage.getItem('repFilters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          status: parsed.status || 'الكل',
          search: parsed.search || '',
          daily: parsed.daily || '',
          zone: parsed.zone || '',
          sender: parsed.sender || '',
        };
      } catch (e) {}
    }
    return { status: 'الكل', search: '', daily: '', zone: '', sender: '' };
  });

  // Save filters to localStorage on change (like R saveFilters)
  useEffect(() => {
    localStorage.setItem('repFilters', JSON.stringify(filters));
  }, [filters]);

  // Restore scroll position after loading (like R restoreScroll)
  useEffect(() => {
    if (!isLoading) {
      const saved = localStorage.getItem('repScrollPos');
      if (saved) {
        setTimeout(() => window.scrollTo(0, parseInt(saved)), 100);
        localStorage.removeItem('repScrollPos');
      }
    }
  }, [isLoading]);

  // Save scroll position before page unload (like R beforeunload)
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem('repScrollPos', String(window.scrollY));
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Display limit for performance
  const [displayLimit, setDisplayLimit] = useState(20);

  const fetchShipments = async (hideLoading = false) => {
    if (!user) return;
    
    if (!hideLoading) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      if (user.id === 'demo-rep') {
        // Fetch from local storage demo database
        const stored = localStorage.getItem('demo_shipments');
        const list = stored ? JSON.parse(stored) : [];
        setShipments(list);
        return;
      }

      // Fetch from the invoices table. For admin role fetch all, for rep role fetch only their shipments.
      let query = supabase.from('invoices').select('*');
      
      if (user.role !== 'admin') {
        // Filter invoices where the representative column "المندوب" matches user's username OR their phone number OR their email
        const orConditions: string[] = [];
        if (user.username) {
          orConditions.push(`المندوب.eq."${user.username.trim()}"`);
        }
        if (user.phone) {
          orConditions.push(`المندوب.eq."${user.phone.trim()}"`);
        }
        if (user.email) {
          orConditions.push(`المندوب.eq."${user.email.trim()}"`);
        }

        if (orConditions.length > 0) {
          query = query.or(orConditions.join(','));
        } else {
          query = query.eq('المندوب', 'NOT_FOUND_SECURE_FALLBACK');
        }
      }

      const { data, error } = await query.order('id', { ascending: false });

      if (error) {
        toast.error('حدث خطأ أثناء جلب الشحنات');
        console.error(error);
      } else {
        setShipments(data || []);
      }
    } catch (err) {
      toast.error('أخفق الاتصال بالخادم');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchShipments();
    if (user && user.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  // Get all unique "اليومية" values from the loaded shipments
  const dailyList = useMemo(() => {
    const list = new Set<string>();
    shipments.forEach(s => {
      if (s["اليومية"] && s["اليومية"].trim()) {
        list.add(s["اليومية"].trim());
      }
    });
    return Array.from(list).sort((a, b) => b.localeCompare(a));
  }, [shipments]);

  // Filter shipments for Admin view based on "اليومية"
  const adminFilteredShipments = useMemo(() => {
    if (selectedDaily === 'الكل') return shipments;
    return shipments.filter(s => s["اليومية"]?.trim() === selectedDaily);
  }, [shipments, selectedDaily]);

  // Derived state (Stats)
  const stats: StatsData = useMemo(() => {
    return adminFilteredShipments.reduce((acc, curr) => {
      acc.total += 1;
      
      const status = curr["الحالة"];
      if (isEligibleStatus(status)) {
        const paidVal = Number(curr["المدفوع"] || 0);
        const commVal = Number(curr["عمولة المندوب"] || 0);
        acc.paid += paidVal;
        acc.commission += commVal;
      }
      
      return acc;
    }, { paid: 0, commission: 0, remittance: 0, total: 0 });
  }, [adminFilteredShipments]);

  // Calculate remittance dynamically
  stats.remittance = stats.paid - stats.commission;

  // Status distributions (for Admin screen)
  const statusCounts = useMemo(() => {
    const counts = {
      'تم': 0,
      'قيد التوصيل': 0,
      'مؤجل': 0,
      'الغاء': 0,
      'شحن': 0,
      'تعديل سعر': 0,
    };
    let other = 0;
    adminFilteredShipments.forEach(s => {
      let status = s["الحالة"]?.trim() || 'قيد التوصيل';
      if (status === 'إلغاء') {
        status = 'الغاء';
      }
      if (status in counts) {
        counts[status as keyof typeof counts] += 1;
      } else {
        other += 1;
      }
    });
    return { ...counts, 'أخرى': other };
  }, [adminFilteredShipments]);

  // Detailed breakdown by Representative (for Admin screen)
  const courierBreakdown = useMemo(() => {
    const map: Record<string, { total: number; delivered: number; paid: number; commission: number; remittance: number }> = {};
    
    adminFilteredShipments.forEach(s => {
      const courier = s["المندوب"] || 'غير محدد';
      if (!map[courier]) {
        map[courier] = { total: 0, delivered: 0, paid: 0, commission: 0, remittance: 0 };
      }
      map[courier].total += 1;
      
      const status = s["الحالة"];
      if (isDeliveredStatus(status)) {
        map[courier].delivered += 1;
      }
      
      if (isEligibleStatus(status)) {
        map[courier].paid += Number(s["المدفوع"] || 0);
        map[courier].commission += Number(s["عمولة المندوب"] || 0);
      }
    });

    return Object.entries(map).map(([name, data]) => {
      const remittance = data.paid - data.commission;
      const rate = data.total > 0 ? Math.round((data.delivered / data.total) * 100) : 0;
      return {
        name,
        ...data,
        remittance,
        rate
      };
    }).sort((a, b) => b.total - a.total);
  }, [adminFilteredShipments]);

  // Filtered courier breakdown based on search input
  const filteredCouriers = useMemo(() => {
    if (!adminRepSearch.trim()) return courierBreakdown;
    const query = adminRepSearch.toLowerCase();
    return courierBreakdown.filter(c => c.name.toLowerCase().includes(query));
  }, [courierBreakdown, adminRepSearch]);

  // Base shipments for the selected daily (primary filter), excluding archived
  const dailyBase = useMemo(() => {
    if (!filters.daily) return [];
    return shipments.filter(s => s["اليومية"]?.trim() === filters.daily && !isArchived(s));
  }, [shipments, filters.daily]);

  // Filter options: base = dailyBase when daily selected, else all shipments (like R)
  const filterOptions = useMemo(() => {
    const base = filters.daily ? dailyBase : shipments;
    const zones = [...new Set(base.map(s => s["الزون"]?.trim()).filter(Boolean))] as string[];
    const senders = [...new Set(base.map(s => s["الراسل"]?.trim()).filter(Boolean))] as string[];
    const archivedDailies = new Set(shipments.filter(s => (s['ارشيف'] || '').toString().trim()).map(s => s["اليومية"]?.trim()).filter(Boolean));
    const dailies = [...new Set(shipments.map(s => s["اليومية"]?.trim()).filter(Boolean))].filter(d => !archivedDailies.has(d)) as string[];
    return {
      daily: dailies.sort((a, b) => b.localeCompare(a)),
      zone: zones.sort(),
      sender: senders.sort(),
    };
  }, [dailyBase, shipments, filters.daily]);

  // Filter counts (like R: shows count per option in dropdowns)
  const filterCounts = useMemo(() => {
    const base = filters.daily ? dailyBase : shipments;
    const followupStatuses = ['الغاء', 'مؤجل', 'تعديل سعر', 'شحن'];

    // Status counts
    const statusCounts: Record<string, number> = { 'الكل': base.length };
    base.forEach(s => {
      const st = s["الحالة"]?.trim();
      if (st) statusCounts[st] = (statusCounts[st] || 0) + 1;
    });
    // المفضلة count
    const raw = localStorage.getItem('repFavorites');
    const favs = raw ? JSON.parse(raw) : {};
    statusCounts['المفضلة'] = base.filter(s => favs[String(s.id || s.m)]).length;
    // بحاجة لمتابعة count
    const dismissed = JSON.parse(localStorage.getItem('repFollowupsDismissed') || '{}');
    statusCounts['بحاجة لمتابعة'] = base.filter(s => followupStatuses.includes(s["الحالة"]?.trim() || '') && !dismissed[String(s.id || s.m)]).length;

    // Zone counts
    const zoneCounts: Record<string, number> = {};
    base.forEach(s => {
      const z = s["الزون"]?.trim();
      if (z) zoneCounts[z] = (zoneCounts[z] || 0) + 1;
    });

    // Sender counts
    const senderCounts: Record<string, number> = {};
    base.forEach(s => {
      const r = s["الراسل"]?.trim();
      if (r) senderCounts[r] = (senderCounts[r] || 0) + 1;
    });

    // Daily counts (from all shipments, excluding archived dailies)
    const archivedDailies = new Set(shipments.filter(s => (s['ارشيف'] || '').toString().trim()).map(s => s["اليومية"]?.trim()).filter(Boolean));
    const dailyCounts: Record<string, number> = {};
    shipments.forEach(s => {
      const d = s["اليومية"]?.trim();
      if (d && !archivedDailies.has(d)) dailyCounts[d] = (dailyCounts[d] || 0) + 1;
    });

    return { daily: dailyCounts, status: statusCounts, zone: zoneCounts, sender: senderCounts };
  }, [dailyBase, shipments, filters.daily]);

  // Derived state (Filtered Shipments - for Rep screen) from dailyBase
  const filteredShipments = useMemo(() => {
    return dailyBase.filter(s => {
      // Hide archived and invalid statuses (like R)
      if (isArchived(s)) return false;
      if (!isValidRepStatus(s["الحالة"])) return false;

      // Status filter
      if (filters.status !== 'الكل') {
        if (filters.status === 'المفضلة') {
          const raw = localStorage.getItem('repFavorites');
          const favs = raw ? JSON.parse(raw) : {};
          if (!favs[String(s.id || s.m)]) return false;
        } else if (filters.status === 'بحاجة لمتابعة') {
          const followupStatuses = ['الغاء', 'مؤجل', 'تعديل سعر', 'شحن'];
          if (!followupStatuses.includes(s["الحالة"]?.trim() || '')) return false;
        } else {
          let statusNormalized = s["الحالة"]?.trim() || '';
          if (statusNormalized === 'إلغاء') {
            statusNormalized = 'الغاء';
          }
          if (statusNormalized !== filters.status) return false;
        }
      }
      
      // Zone filter
      if (filters.zone && s["الزون"]?.trim() !== filters.zone) return false;

      // Sender filter
      if (filters.sender && s["الراسل"]?.trim() !== filters.sender) return false;

      // Search filter
      if (filters.search.trim() !== '') {
        const query = filters.search.toLowerCase();
        const matchesName = s["اسم العميل"]?.toLowerCase().includes(query);
        const matchesPhone = s["الهاتف"]?.includes(query);
        const matchesAltPhone = s["هاتف بديل"]?.includes(query);
        const matchesCode = s["كود الشحنة"]?.toLowerCase().includes(query);
        const matchesCourier = s["المندوب"]?.toLowerCase().includes(query);
        
        if (!matchesName && !matchesPhone && !matchesAltPhone && !matchesCode && !matchesCourier) {
          return false;
        }
      }
      
      return true;
    });
  }, [dailyBase, filters]);

  // Stats based on dailyBase (like R: only from selected daily)
  const repStats: StatsData = useMemo(() => {
    const breakdown: Record<string, number> = { 'تعديل سعر': 0, 'شحن': 0, 'مؤجل': 0, 'الغاء': 0, 'قيد التوصيل': 0 };
    const result = dailyBase.reduce((acc, curr) => {
      acc.total += 1;
      const st = curr["الحالة"]?.trim();
      if (st && st in breakdown) breakdown[st]++;
      if (isEligibleStatus(st)) {
        acc.paid += Number(curr["المدفوع"] || 0);
        acc.commission += Number(curr["عمولة المندوب"] || 0);
        acc.doneCount = (acc.doneCount || 0) + 1;
      }
      return acc;
    }, { paid: 0, commission: 0, remittance: 0, total: 0, doneCount: 0, statusBreakdown: '' });
    result.remittance = result.paid - result.commission;
    result.statusBreakdown = Object.entries(breakdown).filter(([, c]) => c > 0).map(([k, c]) => `${k}:${c}`).join(' | ');
    return result;
  }, [dailyBase]);

  const progressData = useMemo(() => {
    const total = dailyBase.length;
    const done = dailyBase.filter(s => isEligibleStatus(s["الحالة"])).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { total, done, remaining: total - done, pct };
  }, [dailyBase]);

  const displayedShipments = filteredShipments.slice(0, displayLimit);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="min-h-screen bg-bg-main flex flex-col pb-20 transition-colors duration-200">
      {/* Header */}
      <header className="bg-bg-surface border-b border-border-subtle sticky top-0 z-40 px-4 py-3 flex justify-between items-center shadow-md transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-lg">
            <Truck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-text-main text-md">APK LITE</h1>
            <p className="text-xs text-text-muted">مرحباً، {user.username} {isAdmin ? '(المدير)' : '(المندوب)'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-text-main transition-colors"
            title={isDarkMode ? "الوضع العادي" : "الوضع الليلي"}
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
          </button>
          <div className="relative notif-container">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-text-main transition-colors relative"
              title="الإشعارات"
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-1">
                  {notifications.length > 99 ? '99+' : notifications.length}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 max-h-80 overflow-y-auto bg-bg-surface border border-border-subtle rounded-2xl shadow-xl z-50">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-text-muted text-sm">لا توجد إشعارات</div>
                ) : (
                  notifications.map((n, i) => (
                    <div key={i} className="px-4 py-3 border-b border-border-subtle last:border-b-0">
                      <div className="text-sm font-bold text-text-main">{n.title}</div>
                      <div className="text-xs text-text-muted mt-0.5">{n.desc}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <button 
            onClick={() => fetchShipments(true)}
            className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-text-main transition-colors ${isRefreshing ? 'animate-spin text-primary' : ''}`}
            title="تحديث البيانات"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button 
            onClick={logout}
            className="p-2 rounded-full hover:bg-red-500/20 text-red-500 transition-colors"
            title="تسجيل الخروج"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 max-w-3xl mx-auto w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            <p className="text-text-muted text-sm">جاري تحميل البيانات...</p>
          </div>
        ) : isAdmin ? (
          /* ========================================== */
          /*            ADMIN / MANAGER VIEW            */
          /* ========================================== */
          <div className="space-y-6 animate-fadeIn">
            {/* Admin Tabs */}
            <div className="flex border border-border-subtle p-1 bg-bg-surface rounded-2xl shadow-sm">
              <button
                onClick={() => setAdminTab('stats')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  adminTab === 'stats' 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                لوحة الإحصائيات العامة
              </button>
              <button
                onClick={() => setAdminTab('users')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  adminTab === 'users' 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                <Users className="w-4 h-4" />
                إدارة حسابات المناديب
              </button>
            </div>

            {adminTab === 'stats' ? (
              /* Statics Tab */
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-subtle pb-3 gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      إحصائيات النظام العامة
                    </h2>
                    <p className="text-xs text-text-muted">متابعة إجماليات الشحنات ومستحقات الشركة والمناديب</p>
                  </div>

                  {/* Daily Record Filter */}
                  <div className="flex items-center gap-2 self-start sm:self-auto bg-bg-surface border border-border-subtle rounded-xl px-3 py-1.5 shadow-sm">
                    <span className="text-xs font-bold text-text-muted">اليومية:</span>
                    <select
                      value={selectedDaily}
                      onChange={(e) => setSelectedDaily(e.target.value)}
                      className="bg-transparent text-xs sm:text-sm text-text-main font-bold focus:outline-none cursor-pointer min-w-[120px]"
                      dir="rtl"
                    >
                      <option value="الكل" className="bg-bg-surface text-text-main">كل اليوميات (الكل)</option>
                      {dailyList.map((day) => (
                        <option key={day} value={day} className="bg-bg-surface text-text-main">
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Total System Stats */}
                <StatsSection stats={stats} />

                {/* Status counts layout */}
                <div className="bg-bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-text-main mb-4 flex items-center gap-2">
                    <Box className="w-4 h-4 text-primary" />
                    توزيع حالات الشحنات
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'تم', count: statusCounts['تم'], color: 'text-emerald-500 bg-emerald-500/10' },
                      { label: 'قيد التوصيل', count: statusCounts['قيد التوصيل'], color: 'text-amber-500 bg-amber-500/10' },
                      { label: 'مؤجل', count: statusCounts['مؤجل'], color: 'text-orange-500 bg-orange-500/10' },
                      { label: 'الغاء', count: statusCounts['الغاء'], color: 'text-red-500 bg-red-500/10' },
                      { label: 'شحن', count: statusCounts['شحن'], color: 'text-blue-500 bg-blue-500/10' },
                      { label: 'تعديل سعر', count: statusCounts['تعديل سعر'], color: 'text-gray-400 bg-gray-500/10' },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-xl border border-border-subtle bg-bg-main/30">
                        <span className="text-xs text-text-muted font-medium">{item.label}</span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${item.color}`}>
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Courier Breakdown section */}
                <div className="bg-bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                    <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      إحصائيات المناديب بالتفصيل ({filteredCouriers.length})
                    </h3>
                    <input 
                      type="text"
                      value={adminRepSearch}
                      onChange={(e) => setAdminRepSearch(e.target.value)}
                      placeholder="البحث باسم المندوب..."
                      className="w-full sm:w-48 bg-bg-main text-sm text-white border border-gray-700 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="space-y-4">
                    {filteredCouriers.length > 0 ? (
                      filteredCouriers.map((courier, idx) => (
                        <div key={idx} className="border border-border-subtle rounded-xl p-4 bg-bg-main/20 hover:border-border-strong transition-all">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-bold text-text-main text-sm">{courier.name}</h4>
                              <span className="text-xs text-text-muted">معدل التسليم: {courier.rate}%</span>
                            </div>
                            <div className="text-left">
                              <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-lg">
                                {courier.total} شحنة إجمالياً
                              </span>
                            </div>
                          </div>

                          {/* Custom indicator bar */}
                          <div className="w-full bg-black/10 dark:bg-white/5 rounded-full h-1.5 mb-4 overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300" 
                              style={{ width: `${courier.rate}%` }}
                            ></div>
                          </div>

                          {/* Financial statistics for this courier */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                            <div className="bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                              <span className="text-[10px] text-emerald-500 block mb-0.5 font-bold">تم</span>
                              <span className="text-xs font-extrabold text-emerald-500">{courier.delivered}</span>
                            </div>
                            <div className="bg-blue-500/5 p-2 rounded-lg border border-blue-500/10">
                              <span className="text-[10px] text-blue-500 block mb-0.5 font-bold">المدفوع</span>
                              <span className="text-xs font-extrabold text-blue-500">{courier.paid}</span>
                            </div>
                            <div className="bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                              <span className="text-[10px] text-amber-500 block mb-0.5 font-bold">العمولة</span>
                              <span className="text-xs font-extrabold text-amber-500">{courier.commission}</span>
                            </div>
                            <div className="bg-sky-500/5 p-2 rounded-lg border border-sky-500/10">
                              <span className="text-[10px] text-sky-500 block mb-0.5 font-bold">صافي التوريد</span>
                              <span className="text-xs font-extrabold text-sky-500">{courier.remittance}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-text-muted text-sm">
                        لا يوجد مناديب مطابقين للبحث
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* User/Courier Management Tab */
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border-subtle pb-3 gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      إدارة حسابات المناديب
                    </h2>
                    <p className="text-xs text-text-muted">إضافة، تعديل، حذف، وتفعيل أو إيقاف حسابات مناديب التوصيل</p>
                  </div>
                  <button
                    onClick={() => {
                      resetUserForm();
                      setShowUserForm(true);
                    }}
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    إضافة مندوب جديد
                  </button>
                </div>

                {/* User Create/Edit Form Card */}
                {showUserForm && (
                  <div className="bg-bg-surface border-2 border-primary/30 rounded-2xl p-5 shadow-lg space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                      <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                        {editingUser ? <Edit2 className="w-4 h-4 text-primary" /> : <UserPlus className="w-4 h-4 text-primary" />}
                        {editingUser ? `تعديل حساب: ${editingUser.username}` : 'إنشاء حساب مندوب جديد'}
                      </h3>
                      <button 
                        onClick={resetUserForm}
                        className="text-text-muted hover:text-text-main text-xs p-1"
                      >
                        الغاء
                      </button>
                    </div>

                    <form onSubmit={handleSaveUser} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-text-muted mb-1">اسم المندوب (الكامل)</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted pointer-events-none">
                              <Users className="w-4 h-4" />
                            </span>
                            <input
                              type="text"
                              value={formUsername}
                              onChange={(e) => setFormUsername(e.target.value)}
                              className="w-full bg-bg-main text-sm text-white border border-gray-700 rounded-xl pr-10 pl-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
                              placeholder="أحمد علي محمد"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-text-muted mb-1">رقم الموبايل</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted pointer-events-none">
                              <PhoneIcon className="w-4 h-4" />
                            </span>
                            <input
                              type="tel"
                              value={formPhone}
                              onChange={(e) => setFormPhone(e.target.value)}
                              className="w-full bg-bg-main text-sm text-white border border-gray-700 rounded-xl pr-10 pl-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
                              placeholder="01xxxxxxxxx"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-text-muted mb-1">البريد الإلكتروني</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted pointer-events-none">
                              <Mail className="w-4 h-4" />
                            </span>
                            <input
                              type="email"
                              value={formEmail}
                              onChange={(e) => setFormEmail(e.target.value)}
                              className="w-full bg-bg-main text-sm text-white border border-gray-700 rounded-xl pr-10 pl-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
                              placeholder="rep@apklite.com"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-text-muted mb-1">
                            {editingUser ? 'كلمة المرور الجديدة (اتركه فارغاً بعدم التعديل)' : 'كلمة المرور'}
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted pointer-events-none">
                              <Lock className="w-4 h-4" />
                            </span>
                            <input
                              type="password"
                              value={formPassword}
                              onChange={(e) => setFormPassword(e.target.value)}
                              className="w-full bg-bg-main text-sm text-white border border-gray-700 rounded-xl pr-10 pl-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
                              placeholder={editingUser ? "بلا تغيير" : "••••••••"}
                              required={!editingUser}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-text-muted mb-1">صلاحية الحساب</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted pointer-events-none">
                              <Shield className="w-4 h-4" />
                            </span>
                            <select
                              value={formRole}
                              onChange={(e) => setFormRole(e.target.value as 'rep' | 'admin')}
                              className="w-full bg-bg-main text-sm text-white border border-gray-700 rounded-xl pr-10 pl-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all appearance-none"
                            >
                              <option value="rep">مندوب توصيل (rep)</option>
                              <option value="admin">مدير النظام (admin)</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center justify-start gap-3 h-full pt-5">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={formApproved}
                              onChange={(e) => setFormApproved(e.target.checked)}
                              className="w-4 h-4 rounded border-gray-600 text-primary bg-bg-main focus:ring-primary"
                            />
                            <span className="text-xs font-bold text-text-main">تفعيل الحساب مباشرة</span>
                          </label>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={resetUserForm}
                          className="bg-bg-main border border-gray-700 hover:bg-black/20 text-text-main font-bold py-2 px-4 rounded-xl text-xs transition-all cursor-pointer"
                        >
                          الغاء
                        </button>
                        <button
                          type="submit"
                          className="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-5 rounded-xl text-xs transition-all shadow-md cursor-pointer"
                        >
                          {editingUser ? 'تحديث البيانات' : 'إنشاء الحساب'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Users List Card */}
                <div className="bg-bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      قائمة حسابات المناديب والمدراء ({usersList.length})
                    </h3>
                    <input 
                      type="text"
                      value={usersSearchQuery}
                      onChange={(e) => setUsersSearchQuery(e.target.value)}
                      placeholder="البحث باسم أو هاتف أو بريد..."
                      className="w-full sm:w-64 bg-bg-main text-sm text-white border border-gray-700 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>

                  {isUsersLoading && usersList.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-xs text-text-muted">جاري تحميل الحسابات...</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {usersList
                        .filter(u => {
                          if (!usersSearchQuery.trim()) return true;
                          const q = usersSearchQuery.toLowerCase();
                          return (
                            u.username?.toLowerCase().includes(q) ||
                            u.phone?.includes(q) ||
                            u.email?.toLowerCase().includes(q)
                          );
                        })
                        .map((userItem) => {
                          const isSelf = userItem.id === user.id;
                          return (
                            <div 
                              key={userItem.id} 
                              className={`border rounded-xl p-4 bg-bg-main/10 flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all hover:border-border-strong ${
                                !userItem.approved ? 'opacity-70 border-dashed border-red-500/30 bg-red-500/5' : 'border-border-subtle'
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-text-main text-sm">
                                    {userItem.username}
                                  </h4>
                                  {isSelf && (
                                    <span className="text-[10px] bg-primary/20 text-primary font-bold px-1.5 py-0.5 rounded">
                                      أنت
                                    </span>
                                  )}
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    userItem.role === 'admin' 
                                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                                      : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                  }`}>
                                    {userItem.role === 'admin' ? 'مدير' : 'مندوب'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-text-muted">
                                  <div className="flex items-center gap-1.5">
                                    <PhoneIcon className="w-3.5 h-3.5 text-text-muted" />
                                    <span>{userItem.phone}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5 text-text-muted" />
                                    <span className="truncate max-w-[180px]">{userItem.email}</span>
                                  </div>
                                </div>
                                <div className="text-[10px] text-text-muted pt-1">
                                  تاريخ الإنشاء: {new Date(userItem.created_at).toLocaleDateString('ar-EG')}
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-border-subtle">
                                {/* Toggle Active/Suspend */}
                                <button
                                  onClick={() => handleToggleApproved(userItem)}
                                  disabled={isSelf}
                                  className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                                    userItem.approved 
                                      ? 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20' 
                                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/20'
                                  }`}
                                  title={userItem.approved ? "إيقاف الحساب" : "تفعيل الحساب"}
                                >
                                  {userItem.approved ? (
                                    <>
                                      <UserX className="w-3.5 h-3.5" />
                                      إيقاف الحساب
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="w-3.5 h-3.5" />
                                      تفعيل الحساب
                                    </>
                                  )}
                                </button>

                                {/* Edit Button */}
                                <button
                                  onClick={() => startEditUser(userItem)}
                                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-border-subtle bg-bg-surface hover:bg-black/5 dark:hover:bg-white/5 text-text-main font-bold transition-all cursor-pointer"
                                  title="تعديل الحساب"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  تعديل
                                </button>

                                {/* Delete Button */}
                                <button
                                  onClick={() => handleDeleteUser(userItem.id, userItem.username)}
                                  disabled={isSelf}
                                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 text-red-500 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                  title="حذف الحساب نهائياً"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ========================================== */
          /*            REPRESENTATIVE VIEW             */
          /* ========================================== */
          <>
            <StatsSection stats={repStats} />

            <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 mb-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-text-main">نسبة الإنجاز</span>
                <span className="text-sm font-extrabold text-primary">{progressData.pct}%</span>
              </div>
              <div className="w-full bg-black/10 dark:bg-white/5 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${progressData.pct}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs font-semibold text-text-muted">
                <span>تم <span className="text-text-main font-bold">{progressData.done}</span></span>
                <span>متبقي <span className="text-text-main font-bold">{progressData.remaining}</span></span>
              </div>
            </div>

            <FilterSection filters={filters} setFilters={setFilters} filterOptions={filterOptions} filterCounts={filterCounts} actionsHidden={actionsHidden} onToggleActions={() => { const val = !actionsHidden; setActionsHidden(val); localStorage.setItem('rep-actions-hidden', val ? 'true' : 'false'); }} />

            <div className="mb-4 flex items-center justify-between bg-bg-surface p-1.5 rounded-xl border border-border-subtle mx-auto max-w-sm">
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text-main'
                }`}
              >
                <List className="w-4 h-4" /> القائمة
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  viewMode === 'map' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text-main'
                }`}
              >
                <MapIcon className="w-4 h-4" /> الخريطة
              </button>
            </div>

            <div className="mb-4">
              <span className="text-text-muted text-sm font-medium">
                النتائج: <span className="text-text-main font-bold">{filteredShipments.length}</span> شحنة
              </span>
            </div>

            {viewMode === 'map' ? (
              <div className="mb-6">
                <ShipmentsMap shipments={filteredShipments} />
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-4">
                  {displayedShipments.length > 0 ? (
                    displayedShipments.map(shipment => (
                      <ShipmentCard 
                        key={shipment.m} 
                        shipment={shipment} 
                        onUpdate={() => fetchShipments(true)} 
                        actionsHidden={actionsHidden}
                      />
                    ))
                  ) : (
                    <div className="bg-bg-surface rounded-2xl p-8 border border-border-subtle text-center flex flex-col items-center">
                      <Box className="w-12 h-12 text-text-muted mb-3" />
                      <p className="text-text-main font-medium text-lg">{!filters.daily ? 'اختر اليومية لعرض الشحنات' : 'لا توجد شحنات مطابقة'}</p>
                      <p className="text-text-muted text-sm mt-1">{!filters.daily ? '' : 'حاول تغيير معايير البحث أو تحديث الصفحة'}</p>
                    </div>
                  )}
                </div>
                
                {filteredShipments.length > displayLimit && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => setDisplayLimit(p => p + 20)}
                      className="bg-bg-surface hover:bg-black/5 dark:hover:bg-white/5 border border-border-strong text-text-main px-6 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                    >
                      عرض المزيد...
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}