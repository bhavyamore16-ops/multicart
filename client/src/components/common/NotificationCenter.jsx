import React, { useCallback, useEffect, useState } from 'react';
import { Bell, Check, CheckCheck, LoaderCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const timeLabel = value => {
  if (!value) return '';
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export default function NotificationCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async (quiet = false) => {
    if (!user?._id) return;
    if (!quiet) setLoading(true);
    try {
      const result = await notificationAPI.getAll();
      setNotifications(result.notifications || []);
      setError('');
    } catch (loadError) {
      setError(loadError.message || 'Notifications could not be loaded.');
    } finally { if (!quiet) setLoading(false); }
  }, [user?._id]);

  useEffect(() => {
    setNotifications([]);
    if (!user?._id) return undefined;
    refresh();
    const timer = setInterval(() => refresh(true), 30000);
    return () => clearInterval(timer);
  }, [refresh, user?._id]);

  if (!user) return null;
  const unreadCount = notifications.filter(item => !item.readAt).length;

  const openNotification = async item => {
    if (!item.readAt) {
      try {
        await notificationAPI.markRead(item._id);
        setNotifications(current => current.map(notification => notification._id === item._id ? { ...notification, readAt: new Date().toISOString() } : notification));
      } catch (markError) { setError(markError.message || 'Notification could not be marked as read.'); }
    }
    setOpen(false);
    if (item.href) navigate(item.href);
  };

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      const readAt = new Date().toISOString();
      setNotifications(current => current.map(item => ({ ...item, readAt: item.readAt || readAt })));
    } catch (markError) { setError(markError.message || 'Notifications could not be updated.'); }
  };

  return <div className="relative">
    <button type="button" onClick={() => { setOpen(value => !value); if (!open) refresh(true); }} aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-expanded={open} className="relative rounded-xl p-2.5 text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700">
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-black text-white ring-2 ring-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
    </button>
    {open && <div className="absolute right-0 top-full z-[60] mt-2 w-80 max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:w-96">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div><h2 className="text-sm font-black text-slate-900">Notifications</h2><p className="text-[10px] text-slate-500">{unreadCount ? `${unreadCount} unread` : 'You are all caught up'}</p></div><button type="button" onClick={markAllRead} disabled={!unreadCount} className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 hover:text-blue-900 disabled:text-slate-300"><CheckCheck size={14} />Mark all read</button></div>
      {error && <p role="alert" className="px-4 py-2 text-xs text-rose-700">{error}</p>}
      <div className="max-h-[65vh] overflow-y-auto sm:max-h-[440px]">
        {loading ? <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={16} />Loading…</div> : notifications.length ? notifications.map(item => <button type="button" key={item._id} onClick={() => openNotification(item)} className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${!item.readAt ? 'bg-blue-50/50' : ''}`}><div className="flex items-start gap-2.5"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.readAt ? 'bg-slate-200' : 'bg-blue-600'}`} /><span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-2"><strong className="text-xs text-slate-900">{item.title}</strong><time className="shrink-0 text-[10px] text-slate-400">{timeLabel(item.createdAt)}</time></span><span className="mt-1 block text-xs leading-5 text-slate-600">{item.message}</span></span><Check className={`mt-1 h-3.5 w-3.5 shrink-0 ${item.readAt ? 'text-transparent' : 'text-blue-600'}`} /></div></button>) : <div className="px-5 py-10 text-center"><Bell className="mx-auto mb-2 h-7 w-7 text-slate-300" /><p className="text-sm font-bold text-slate-700">No notifications yet</p><p className="mt-1 text-xs text-slate-500">Order and account updates will appear here.</p></div>}
      </div>
      <div className="border-t border-slate-100 px-4 py-2 text-center"><span className="text-[10px] text-slate-400">Updates refresh automatically</span></div>
    </div>}
  </div>;
}
