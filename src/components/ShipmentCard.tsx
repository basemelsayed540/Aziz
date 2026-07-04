import React, { useState, useRef, useEffect } from 'react';
import { supabase, type Shipment } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { MapPin, Phone, MessageCircle, Map, Box, CreditCard, FileText, Heart, Copy, X as XIcon } from 'lucide-react';
import { cn } from '../utils/cn';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  'تم': 'border-green-500',
  'تعديل سعر': 'border-green-500',
  'شحن': 'border-green-500',
  'قيد التوصيل': 'border-amber-500',
  'مؤجل': 'border-orange-500',
  'الغاء': 'border-red-500',
};

const statusTextColors: Record<string, string> = {
  'تم': 'text-emerald-500',
  'قيد التوصيل': 'text-amber-500',
  'مؤجل': 'text-orange-500',
  'الغاء': 'text-red-500',
  'تعديل سعر': 'text-blue-500',
  'شحن': 'text-blue-500',
};

const hideActionStatuses = ['تم', 'تعديل سعر', 'شحن', 'الغاء'];
const followupStatuses = ['الغاء', 'مؤجل', 'تعديل سعر', 'شحن'];

function formatPhoneForCall(phone: string) {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('20')) return '+' + digits;
  if (digits.startsWith('0')) return '+20' + digits.slice(1);
  return '+20' + digits;
}

function formatPhoneForWA(phone: string) {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('20')) return digits;
  if (digits.startsWith('0')) return '20' + digits.slice(1);
  return '20' + digits;
}

function isFavorite(id: string) {
  const raw = localStorage.getItem('repFavorites');
  const favs: Record<string, boolean> = raw ? JSON.parse(raw) : {};
  return !!favs[id];
}

function toggleFavoriteLocal(id: string) {
  const raw = localStorage.getItem('repFavorites');
  const favs: Record<string, boolean> = raw ? JSON.parse(raw) : {};
  if (favs[id]) delete favs[id];
  else favs[id] = true;
  localStorage.setItem('repFavorites', JSON.stringify(favs));
}

function getFollowupsSent(): Record<string, boolean> {
  const raw = localStorage.getItem('repFollowupsSent');
  return raw ? JSON.parse(raw) : {};
}

function getFollowupsDismissed(): Record<string, boolean> {
  const raw = localStorage.getItem('repFollowupsDismissed');
  return raw ? JSON.parse(raw) : {};
}

export function ShipmentCard({ shipment, onUpdate, actionsHidden }: { key?: React.Key; shipment: Shipment; onUpdate: () => void; actionsHidden?: boolean }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPhonesDialog, setShowPhonesDialog] = useState(false);
  const [showWADialog, setShowWADialog] = useState(false);
  const [showPostponeDialog, setShowPostponeDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showPriceEditDialog, setShowPriceEditDialog] = useState(false);
  const [priceEditMode, setPriceEditMode] = useState<'تعديل سعر' | 'شحن'>('تعديل سعر');
  const [newPrice, setNewPrice] = useState('');
  const [fav, setFav] = useState(() => isFavorite(String(shipment.id || shipment.m)));
  const { user } = useAuth();

  // Followup state
  const [isFollowupFilter, setIsFollowupFilter] = useState(false);
  const [followupSent, setFollowupSent] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('repFilters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setIsFollowupFilter(parsed.status === 'بحاجة لمتابعة');
      } catch (e) {}
    }
    const sid = String(shipment.id || shipment.m);
    const sent = getFollowupsSent();
    const dismissed = getFollowupsDismissed();
    if (sent[sid] && !dismissed[sid]) {
      setFollowupSent(true);
    }
  }, []);

  let statusNormalized = shipment["الحالة"] || '';
  if (statusNormalized === 'إلغاء') {
    statusNormalized = 'الغاء';
  }

  const hideActions = hideActionStatuses.includes(statusNormalized);
  const isArchived = !!(shipment['ارشيف'] || '').toString().trim();
  const finalHideActions = hideActions || isArchived;
  const sid = String(shipment.id || shipment.m);
  const canFav = !isArchived && ['قيد التوصيل', 'مؤجل'].includes(statusNormalized);
  const needsFollowup = isFollowupFilter && followupStatuses.includes(statusNormalized);

  const phones = [shipment["الهاتف"] || '', shipment["هاتف بديل"] || ''].filter(Boolean);
  const hasMultiplePhones = phones.length > 1;

  function buildWAMessage() {
    return encodeURIComponent(
      `🧾 كود الشحنة: ${shipment['كود الشحنة'] || '-'}\n` +
      `👤 العميل: ${shipment['اسم العميل'] || '-'}\n` +
      `📞 الهاتف: ${shipment['الهاتف'] || ''}${shipment['هاتف بديل'] ? ' / ' + shipment['هاتف بديل'] : ''}\n` +
      `📍 العنوان: ${shipment['العنوان'] || '-'}\n` +
      `📦 الزون: ${shipment['الزون'] || '-'}\n` +
      `💰 المبلغ: ${shipment['المبلغ'] || '0'} ج\n` +
      `📋 الحالة: ${shipment['الحالة'] || '-'}\n` +
      `🏢 الراسل: ${shipment['الراسل'] || '-'}`
    );
  }

  const copyDetails = () => {
    const details =
      `🧾 كود الشحنة: ${shipment['كود الشحنة'] || '-'}\n` +
      `👤 العميل: ${shipment['اسم العميل'] || '-'}\n` +
      `📞 الهاتف: ${shipment['الهاتف'] || ''}${shipment['هاتف بديل'] ? ' / ' + shipment['هاتف بديل'] : ''}\n` +
      `📍 العنوان: ${shipment['العنوان'] || '-'}\n` +
      `📦 الزون: ${shipment['الزون'] || '-'}\n` +
      `💰 المبلغ: ${shipment['المبلغ'] || '0'} ج\n` +
      `💵 المدفوع: ${shipment['المدفوع'] || '-'}\n` +
      `📋 الحالة: ${shipment['الحالة'] || '-'}\n` +
      `🏢 الراسل: ${shipment['الراسل'] || '-'}\n` +
      `👤 المندوب: ${shipment['المندوب'] || '-'}`;
    navigator.clipboard.writeText(details).then(() => {
      toast.success('تم نسخ تفاصيل الشحنة');
    }).catch(() => {
      toast.error('فشل النسخ');
    });
  };

  const doFollowup = () => {
    const details =
      `🧾 كود الشحنة: ${shipment['كود الشحنة'] || '-'}\n` +
      `👤 العميل: ${shipment['اسم العميل'] || '-'}\n` +
      `📞 الهاتف: ${shipment['الهاتف'] || ''}${shipment['هاتف بديل'] ? ' / ' + shipment['هاتف بديل'] : ''}\n` +
      `📍 العنوان: ${shipment['العنوان'] || '-'}\n` +
      `📦 الزون: ${shipment['الزون'] || '-'}\n` +
      `💰 المبلغ: ${shipment['المبلغ'] || '0'} ج\n` +
      `📋 الحالة: ${shipment['الحالة'] || '-'}\n` +
      `🏢 الراسل: ${shipment['الراسل'] || '-'}`;
    navigator.clipboard.writeText(details).then(() => {
      const sid = String(shipment.id || shipment.m);
      const sent = getFollowupsSent();
      sent[sid] = true;
      localStorage.setItem('repFollowupsSent', JSON.stringify(sent));
      const dismissed = getFollowupsDismissed();
      dismissed[sid] = true;
      localStorage.setItem('repFollowupsDismissed', JSON.stringify(dismissed));
      setFollowupSent(true);
      window.open('https://api.whatsapp.com/send', '_blank');
      onUpdate();
      toast.success('تم نسخ التفاصيل، اختر الرقم في واتساب');
    }).catch(() => {
      toast.error('فشل النسخ');
    });
  };

  const dismissFollowup = () => {
    const sid = String(shipment.id || shipment.m);
    const dismissed = getFollowupsDismissed();
    dismissed[sid] = true;
    localStorage.setItem('repFollowupsDismissed', JSON.stringify(dismissed));
    setFollowupSent(true);
    onUpdate();
  };

  const updateStatus = async (status: string, extraPayload?: Record<string, any>) => {
    if (isArchived) {
      toast.error('لا يمكن تعديل شحنة مؤرشفة');
      return;
    }
    setIsUpdating(true);
    try {
      const payload: Record<string, any> = { 'الحالة': status };
      if (extraPayload) {
        Object.assign(payload, extraPayload);
      }
      if (status === 'تم' && !payload['المدفوع']) {
        payload['المدفوع'] = shipment['المبلغ'] || '0';
      }

      if (user?.id === 'demo-rep') {
        const stored = localStorage.getItem('demo_shipments');
        const list = stored ? JSON.parse(stored) : [];
        const index = list.findIndex((s: any) => s.m === shipment.m);
        if (index !== -1) {
          Object.assign(list[index], payload);
          list[index]["تاريخ التحديث"] = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
          list[index]["اسم الموظف"] = user.username;
          localStorage.setItem('demo_shipments', JSON.stringify(list));
        }
        toast.success('تم تحديث الحالة');
        removeFavoriteLocal(sid);
        onUpdate();
        return;
      }

      const { error } = await (shipment.id
        ? supabase.from('invoices').update(payload).eq('id', shipment.id)
        : supabase.from('invoices').update(payload).eq('m', shipment.m));

      if (error) throw error;
      toast.success('تم تحديث الحالة');
      removeFavoriteLocal(sid);
      onUpdate();
    } catch (err: any) {
      toast.error('حدث خطأ أثناء التحديث');
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const removeFavoriteLocal = (id: string) => {
    const raw = localStorage.getItem('repFavorites');
    if (!raw) return;
    const favs: Record<string, boolean> = JSON.parse(raw);
    if (favs[id]) {
      delete favs[id];
      localStorage.setItem('repFavorites', JSON.stringify(favs));
      setFav(false);
    }
  };

  const handleFavToggle = () => {
    toggleFavoriteLocal(sid);
    setFav(!fav);
  };

  const handleCall = () => {
    const phones = [shipment["الهاتف"] || '', shipment["هاتف بديل"] || ''].filter(Boolean);
    if (!phones.length) return;
    if (phones.length === 1) {
      window.location.href = 'tel:' + formatPhoneForCall(phones[0]);
      return;
    }
    setShowPhonesDialog(true);
  };

  const handleWhatsApp = () => {
    const phones = [shipment["الهاتف"] || '', shipment["هاتف بديل"] || ''].filter(Boolean);
    if (!phones.length) return;
    if (phones.length === 1) {
      const num = formatPhoneForWA(phones[0]);
      window.open(`https://api.whatsapp.com/send?phone=${num}&text=${buildWAMessage()}`, '_blank');
      return;
    }
    setShowWADialog(true);
  };

  const handleMap = () => {
    const address = encodeURIComponent(`${shipment["المحافظة"] || ''} ${shipment["الزون"]} ${shipment["العنوان"]}`);
    window.open(`https://maps.google.com/?q=${address}`, '_blank');
  };

  const handlePostpone = () => {
    if (isArchived) {
      toast.error('لا يمكن تعديل شحنة مؤرشفة');
      return;
    }
    setShowPostponeDialog(true);
  };

  const handleReject = () => {
    if (isArchived) {
      toast.error('لا يمكن تعديل شحنة مؤرشفة');
      return;
    }
    setShowRejectDialog(true);
  };

  const handlePriceEdit = () => {
    if (isArchived) {
      toast.error('لا يمكن تعديل شحنة مؤرشفة');
      return;
    }
    setShowPriceEditDialog(true);
    setPriceEditMode('تعديل سعر');
    setNewPrice('');
  };

  const confirmPriceEdit = () => {
    if (!newPrice || newPrice === '0' || isNaN(parseFloat(newPrice))) {
      toast.error('يرجى إدخال سعر صحيح');
      return;
    }
    setShowPriceEditDialog(false);
    updateStatus(priceEditMode, { 'المدفوع': newPrice });
  };

  const borderColor = statusColors[statusNormalized] || '';
  const textColor = statusTextColors[statusNormalized] || 'text-text-muted';
  const showAmount = ['تم', 'تعديل سعر', 'شحن'].includes(statusNormalized) && shipment['المدفوع'] != null && shipment['المدفوع'] !== '';
  const displayAmount = showAmount ? shipment['المدفوع'] : shipment['المبلغ'] || '0';

  return (
    <div className={cn("bg-bg-surface rounded-2xl p-5 border border-border-subtle shadow-md flex flex-col gap-4 relative overflow-hidden transition-all hover:border-border-strong duration-200", borderColor && `border-t-4 ${borderColor}`)}>
      {/* Top row: Copy + Fav + Code + Status */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <span className="shipment-actions-bar flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); copyDetails(); }} className="text-text-muted hover:text-text-main transition-colors p-1 cursor-pointer" title="نسخ التفاصيل">
              <Copy className="w-4 h-4" />
            </button>
            {canFav && (
              <button onClick={(e) => { e.stopPropagation(); handleFavToggle(); }} className={cn("transition-colors p-1 cursor-pointer", fav ? 'text-red-500' : 'text-text-muted hover:text-red-400')} title={fav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}>
                <Heart className="w-4 h-4" fill={fav ? 'currentColor' : 'none'} />
              </button>
            )}
          </span>
          {needsFollowup && !followupSent && (
            <button onClick={(e) => { e.stopPropagation(); doFollowup(); }} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold px-2 py-1 rounded-lg border border-red-500/20 cursor-pointer transition-colors">
              متابعة
            </button>
          )}
          {needsFollowup && followupSent && (
            <button onClick={(e) => { e.stopPropagation(); dismissFollowup(); }} className="bg-emerald-500/10 text-emerald-500 text-xs font-bold px-2 py-1 rounded-lg border border-emerald-500/20 cursor-pointer transition-colors flex items-center gap-1">
              <CheckIcon className="w-3 h-3" /> تم
            </button>
          )}
        </div>
        <div className="text-left">
          <div className="font-mono text-lg font-bold text-text-main">
            {shipment["كود الشحنة"] || 'N/A'}
            {isArchived && <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full mr-2">📦 مؤرشفة</span>}
          </div>
          <div className={cn("text-sm font-bold", textColor)} style={statusNormalized === 'تم' ? { color: '#22c55e' } : statusNormalized === 'قيد التوصيل' ? { color: '#f59e0b' } : statusNormalized === 'مؤجل' ? { color: '#f97316' } : statusNormalized === 'الغاء' ? { color: '#ef4444' } : (statusNormalized === 'تعديل سعر' || statusNormalized === 'شحن') ? { color: '#3b82f6' } : undefined}>
            {shipment["الحالة"] || '-'}
          </div>
        </div>
      </div>

      {/* Main Details */}
      <div className="space-y-3 mt-2">
        <div className="flex items-start gap-3">
          <div className="bg-black/5 dark:bg-white/5 p-2 rounded-lg text-text-muted mt-1">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-text-muted block">العميل</span>
            <span className="font-bold text-md text-text-main">{shipment["اسم العميل"] || '-'}</span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="bg-black/5 dark:bg-white/5 p-2 rounded-lg text-text-muted mt-1">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <span className="text-xs text-text-muted block">العنوان</span>
            <span className="text-sm font-medium text-text-main block">
              <span className="text-primary font-bold">{shipment["الزون"]}</span>{' '}
              {shipment["العنوان"] && `- ${shipment["العنوان"]}`}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="bg-black/5 dark:bg-white/5 p-2 rounded-lg text-text-muted mt-1">
            <Box className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-text-muted block">الراسل</span>
            <span className="font-bold text-md text-text-main">{shipment["الراسل"] || '-'}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2 pt-3 border-t border-border-subtle">
           <div>
            <span className="text-xs text-text-muted flex items-center gap-1 mb-1">
              <CreditCard className="w-3 h-3" /> المبلغ المطلوب
            </span>
            <span className="font-bold text-primary text-lg">
              {displayAmount}
            </span>
          </div>
           <div>
            <span className="text-xs text-text-muted flex items-center gap-1 mb-1">
              <FileText className="w-3 h-3" /> المنتج
            </span>
            <span className="text-sm font-medium text-text-main line-clamp-1">
              {shipment["المنتج"] || 'غير محدد'}
            </span>
          </div>
        </div>
      </div>

      {/* Note if exists */}
      {shipment["ملاحظات"] && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <p className="text-xs text-amber-500 dark:text-amber-400 font-medium">ملاحظة: {shipment["ملاحظات"]}</p>
        </div>
      )}

      {/* Action buttons (like R) */}
      {!finalHideActions && (
        <div className={cn("action-btns space-y-2", actionsHidden && 'hidden-actions')}>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={(e) => { e.stopPropagation(); updateStatus('تم'); }} className="action-btn done bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-95 cursor-pointer">
              <CheckIcon className="w-4 h-4" /> تم
            </button>
            <button onClick={(e) => { e.stopPropagation(); handlePriceEdit(); }} className="action-btn price bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-95 cursor-pointer">
              💰 تعديل سعر
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={(e) => { e.stopPropagation(); handlePostpone(); }} className="action-btn postpone bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-600 dark:text-orange-400 rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-95 cursor-pointer">
              ⏰ مؤجل
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleReject(); }} className="action-btn reject bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-95 cursor-pointer">
              ❌ الغاء
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={(e) => { e.stopPropagation(); handleCall(); }} className="action-btn call bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-95 cursor-pointer relative">
              <Phone className="w-4 h-4" /> اتصال{hasMultiplePhones && <span className="badge-num absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{phones.length}</span>}
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleWhatsApp(); }} className="action-btn whatsapp bg-green-600/10 hover:bg-green-600/20 border border-green-500/20 text-green-600 dark:text-green-400 rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-95 cursor-pointer relative">
              <MessageCircle className="w-4 h-4" /> واتساب{hasMultiplePhones && <span className="badge-num absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{phones.length}</span>}
            </button>
          </div>
        </div>
      )}

      {/* Extra: Map button (always shown if not hidden) */}
      {!finalHideActions && !actionsHidden && (
        <div className="mt-1">
          <button onClick={(e) => { e.stopPropagation(); handleMap(); }} className="w-full bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-600 dark:text-sky-400 rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-95 cursor-pointer">
            <Map className="w-4 h-4" /> خريطة
          </button>
        </div>
      )}

      {isUpdating && (
        <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-30">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Phones Dialog */}
      {showPhonesDialog && (
        <DialogOverlay onClose={() => setShowPhonesDialog(false)} title="اختر رقم للاتصال">
          <div className="grid grid-cols-1 gap-2">
            {phones.map((p, i) => (
              <a key={i} href={`tel:${formatPhoneForCall(p)}`} className={cn("block p-4 rounded-xl border-2 text-center font-bold text-lg no-underline cursor-pointer transition-colors", i === 0 ? 'border-emerald-400 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20' : 'border-sky-400 bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20')}>
                <Phone className="w-4 h-4 inline ml-2" />{p}
              </a>
            ))}
          </div>
        </DialogOverlay>
      )}

      {/* WhatsApp Dialog */}
      {showWADialog && (
        <DialogOverlay onClose={() => setShowWADialog(false)} title="اختر رقم لإرسال الواتساب">
          <div className="grid grid-cols-1 gap-2">
            {phones.map((p, i) => {
              const num = formatPhoneForWA(p);
              return (
                <a key={i} href={`https://api.whatsapp.com/send?phone=${num}&text=${buildWAMessage()}`} target="_blank" rel="noopener" className={cn("block p-4 rounded-xl border-2 text-center font-bold text-lg no-underline cursor-pointer transition-colors", i === 0 ? 'border-emerald-400 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20' : 'border-purple-400 bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20')}>
                  <MessageCircle className="w-4 h-4 inline ml-2" />{p}
                </a>
              );
            })}
          </div>
        </DialogOverlay>
      )}

      {/* Postpone Dialog */}
      {showPostponeDialog && (
        <DialogOverlay onClose={() => setShowPostponeDialog(false)} title="اختر سبب التأجيل">
          <div className="grid grid-cols-1 gap-2">
            {['مؤجل غداً', 'مؤجل الأحد أو الاثنين', 'مؤجل الاربع أو الخميس أو الجمعه'].map((o, i) => {
              const colors = ['border-amber-400 bg-amber-500/10 text-amber-600 dark:text-amber-400', 'border-orange-400 bg-orange-500/10 text-orange-600 dark:text-orange-400', 'border-yellow-400 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'];
              return (
                <button key={i} onClick={() => { setShowPostponeDialog(false); updateStatus('مؤجل', { 'سبب الحالة': o }); }} className={cn("p-3 rounded-xl border-2 cursor-pointer text-center font-bold text-sm transition-colors hover:bg-opacity-20", colors[i])}>
                  ⏰ {o}
                </button>
              );
            })}
          </div>
        </DialogOverlay>
      )}

      {/* Reject Dialog */}
      {showRejectDialog && (
        <DialogOverlay onClose={() => setShowRejectDialog(false)} title="اختر سبب الرفض">
          <div className="grid grid-cols-1 gap-1.5">
            {[
              'العميل طلب الالغاء','العميل مسافر',
              'المنطقه خارج نطاق التوصيل','العنوان غير صحيح',
              'المنتج غير مطابق','المنتج تالف',
              'تهرب بعد التنسيق','رقم الموبيل او الواتساب غير صحيح'
            ].map((o, i) => {
              const colors = ['border-pink-400 bg-pink-500/10 text-pink-600 dark:text-pink-400','border-orange-400 bg-orange-500/10 text-orange-600 dark:text-orange-400','border-amber-400 bg-amber-500/10 text-amber-600 dark:text-amber-400','border-sky-400 bg-sky-500/10 text-sky-600 dark:text-sky-400','border-purple-400 bg-purple-500/10 text-purple-600 dark:text-purple-400','border-rose-400 bg-rose-500/10 text-rose-600 dark:text-rose-400','border-teal-400 bg-teal-500/10 text-teal-600 dark:text-teal-400','border-yellow-400 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'];
              return (
                <button key={i} onClick={() => { setShowRejectDialog(false); updateStatus('الغاء', { 'سبب الحالة': o }); }} className={cn("p-2.5 rounded-xl border-2 cursor-pointer text-center font-bold text-sm transition-colors hover:bg-opacity-20", colors[i])}>
                  ❌ {o}
                </button>
              );
            })}
          </div>
        </DialogOverlay>
      )}

      {/* Price Edit Dialog */}
      {showPriceEditDialog && (
        <DialogOverlay onClose={() => setShowPriceEditDialog(false)} title="تحديث الحالة">
          <div className="flex gap-2 mb-3">
            <button onClick={() => setPriceEditMode('تعديل سعر')} className={cn("flex-1 p-3 rounded-xl border-2 cursor-pointer text-center font-bold text-sm transition-colors", priceEditMode === 'تعديل سعر' ? 'border-purple-400 bg-purple-500/20 text-purple-600 dark:text-purple-400' : 'border-purple-400/30 bg-purple-500/5 text-purple-500/70')}>
              💰 تعديل سعر
            </button>
            <button onClick={() => setPriceEditMode('شحن')} className={cn("flex-1 p-3 rounded-xl border-2 cursor-pointer text-center font-bold text-sm transition-colors", priceEditMode === 'شحن' ? 'border-sky-400 bg-sky-500/20 text-sky-600 dark:text-sky-400' : 'border-sky-400/30 bg-sky-500/5 text-sky-500/70')}>
              🚚 شحن
            </button>
          </div>
          <div className="text-right">
            <label className="text-sm font-bold text-text-muted mb-1 block">السعر الجديد <span className="text-red-500">*</span></label>
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-border-strong bg-bg-main text-text-main text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="أدخل السعر الجديد"
              inputMode="decimal"
              autoFocus
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setShowPriceEditDialog(false)} className="flex-1 bg-bg-main border border-border-strong text-text-muted font-bold py-2.5 rounded-xl text-sm cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              الغاء
            </button>
            <button onClick={confirmPriceEdit} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-sm cursor-pointer transition-colors">
              تحديث
            </button>
          </div>
        </DialogOverlay>
      )}
    </div>
  );
}

function DialogOverlay({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title?: string }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}>
      <div className="bg-bg-surface border border-border-strong rounded-2xl p-5 w-full max-w-sm shadow-2xl animate-fadeIn" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          {title && <h3 className="text-base font-bold text-text-main">{title}</h3>}
          <button onClick={onClose} className="text-text-muted hover:text-text-main p-1 cursor-pointer"><XIcon className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
