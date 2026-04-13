import React, { useEffect, useRef, useState } from 'react';
import {
  collection, onSnapshot, getDocs, deleteDoc,
  doc, updateDoc, query, where, orderBy, Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

interface CommunityPost {
  id: string;
  caption?: string;
  imageUrl?: string;
  userId?: string;
  userName?: string;
  likes?: number;
  likedBy?: string[];
  comments?: number;
  commentsCount?: number;
  createdAt?: Timestamp;
  status?: string;
}

interface Comment {
  id: string;
  text?: string;
  userId?: string;
  userName?: string;
  createdAt?: Timestamp | string;
}

interface Report {
  id: string;
  postId?: string;
  commentId?: string;
  reason?: string;
  reportedBy?: string;
  status?: 'pending' | 'ignored' | 'resolved';
  createdAt?: Timestamp | string;
  relatedContent?: string;
}

interface Notification {
  id: string;
  type: 'new_report' | 'post_flagged';
  message: string;
  time: string;
  read: boolean;
}

const formatDate = (ts?: Timestamp | string) => {
  if (!ts) return '—';
  return ts instanceof Timestamp ? ts.toDate().toLocaleString() : new Date(ts).toLocaleString();
};

const Spinner = ({ color = 'text-blue-500' }: { color?: string }) => (
  <svg className={`animate-spin w-5 h-5 ${color}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

const AdminCommunityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'communityPosts' | 'reports'>('communityPosts');

  // ── Notifications ────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const prevReportIds = useRef<Set<string>>(new Set());
  const prevFlaggedIds = useRef<Set<string>>(new Set());
  const isFirstReportSnap = useRef(true);
  const isFirstPostSnap = useRef(true);

  const addNotification = (type: Notification['type'], message: string) => {
    const notif: Notification = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };
    setNotifications(prev => [notif, ...prev].slice(0, 20));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setShowNotifications(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  // ── Community Posts ──────────────────────────────────────────────
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [confirmPostId, setConfirmPostId] = useState<string | null>(null);

  // ── Comments Modal ───────────────────────────────────────────────
  const [commentsModal, setCommentsModal] = useState<{ postId: string; caption?: string } | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [confirmCommentId, setConfirmCommentId] = useState<string | null>(null);

  // ── Reports ──────────────────────────────────────────────────────
  const [reports, setReports] = useState<Report[]>([]);
  const [actingReportId, setActingReportId] = useState<string | null>(null);

  // ── Fetch comment counts for all posts ──────────────────────────
  useEffect(() => {
    if (communityPosts.length === 0) return;
    communityPosts.forEach(async (post) => {
      try {
        const snap = await getDocs(collection(db, 'communityPosts', post.id, 'comments'));
        setCommentCounts(prev => ({ ...prev, [post.id]: snap.size }));
      } catch { /* ignore */ }
    });
  }, [communityPosts]);

  // ── Real-time communityPosts listener (+ flagged notifications) ──
  useEffect(() => {
    setCommunityLoading(true);
    const unsub = onSnapshot(
      collection(db, 'communityPosts'),
      (snap) => {
        const posts = snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityPost));
        setCommunityPosts(posts);
        setCommunityLoading(false);

        if (isFirstPostSnap.current) {
          // seed known flagged IDs on first load — no notifications
          posts.filter(p => p.status === 'flagged').forEach(p => prevFlaggedIds.current.add(p.id));
          isFirstPostSnap.current = false;
          return;
        }
        // detect newly flagged posts
        posts.filter(p => p.status === 'flagged' && !prevFlaggedIds.current.has(p.id)).forEach(p => {
          addNotification('post_flagged', `Post flagged by ${p.userName ?? 'a user'}: "${(p.caption ?? '').slice(0, 40)}…"`);
          prevFlaggedIds.current.add(p.id);
        });
      },
      (err) => { console.error('communityPosts error:', err); setCommunityLoading(false); }
    );
    return () => unsub();
  }, []);

  // ── Real-time reports listener (+ new report notifications) ──────
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'reports'),
      (snap) => {
        const raw = snap.docs.map(d => ({ id: d.id, ...d.data() } as Report));

        if (isFirstReportSnap.current) {
          raw.forEach(r => prevReportIds.current.add(r.id));
          isFirstReportSnap.current = false;
          setReports(raw.map(r => ({
            ...r,
            relatedContent: r.postId ? communityPosts.find(p => p.id === r.postId)?.caption : undefined,
          })));
          return;
        }
        // detect new reports
        raw.filter(r => !prevReportIds.current.has(r.id)).forEach(r => {
          addNotification('new_report', `New report: "${r.reason ?? 'No reason'}" by ${r.reportedBy ?? 'unknown'}`);
          prevReportIds.current.add(r.id);
        });
        setReports(raw.map(r => ({
          ...r,
          relatedContent: r.postId ? communityPosts.find(p => p.id === r.postId)?.caption : undefined,
        })));
      },
      (err) => console.error('reports error:', err)
    );
    return () => unsub();
  }, [communityPosts]);

  // ── Handlers: communityPosts ─────────────────────────────────────
  const handleDeletePost = async (id: string) => {
    setDeletingPostId(id);
    try {
      await deleteDoc(doc(db, 'communityPosts', id));
      // onSnapshot removes it from state automatically
    } catch (err) { console.error(err); }
    finally { setDeletingPostId(null); setConfirmPostId(null); }
  };

  // ── Handlers: comments ───────────────────────────────────────────
  const openComments = async (post: CommunityPost) => {
    setCommentsModal({ postId: post.id, caption: post.caption });
    setComments([]);
    setCommentsLoading(true);
    try {
      const snap = await getDocs(
        collection(db, 'communityPosts', post.id, 'comments')
      );
      console.log('Comments fetched:', snap.size, snap.docs.map(d => d.data()));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Comment));
      // sort newest first
      data.sort((a, b) => {
        const ta = a.createdAt instanceof Timestamp ? a.createdAt.toDate().getTime() : new Date(a.createdAt ?? 0).getTime();
        const tb = b.createdAt instanceof Timestamp ? b.createdAt.toDate().getTime() : new Date(b.createdAt ?? 0).getTime();
        return tb - ta;
      });
      setComments(data);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setDeletingCommentId(commentId);
    try {
      await deleteDoc(doc(db, 'communityPosts', commentsModal!.postId, 'comments', commentId));
      setComments(prev => prev.filter(c => c.id !== commentId));
      setCommentCounts(prev => ({ ...prev, [commentsModal!.postId]: (prev[commentsModal!.postId] ?? 1) - 1 }));
    } catch (err) { console.error(err); }
    finally { setDeletingCommentId(null); setConfirmCommentId(null); }
  };

  // ── Handlers: reports ────────────────────────────────────────────
  const handleIgnoreReport = async (reportId: string) => {
    setActingReportId(reportId);
    try {
      await updateDoc(doc(db, 'reports', reportId), { status: 'ignored' });
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'ignored' } : r));
    } catch (err) { console.error(err); }
    finally { setActingReportId(null); }
  };

  const handleRemoveReportedContent = async (report: Report) => {
    setActingReportId(report.id);
    try {
      if (report.postId) await deleteDoc(doc(db, 'communityPosts', report.postId));
      else if (report.commentId) await deleteDoc(doc(db, 'comments', report.commentId));
      await updateDoc(doc(db, 'reports', report.id), { status: 'resolved' });
      setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'resolved' } : r));
    } catch (err) { console.error(err); }
    finally { setActingReportId(null); }
  };

  const pendingReports = reports.filter(r => !r.status || r.status === 'pending');

  // ── Stat cards ───────────────────────────────────────────────────
  const stats = [
    { label: 'Community Posts', value: communityLoading ? '…' : communityPosts.length, icon: '🌱', color: 'from-green-500 to-green-600' },
    { label: 'Total Likes',     value: communityLoading ? '…' : communityPosts.reduce((s, p) => s + (p.likes ?? 0), 0), icon: '❤️', color: 'from-pink-500 to-pink-600' },
    { label: 'Pending Reports', value: pendingReports.length, icon: '⚠️', color: 'from-orange-500 to-orange-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Community Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and engage with the community</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-green-600">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Live
          </div>

          {/* Notification bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setShowNotifications(v => !v); if (!showNotifications) markAllRead(); }}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 hover:bg-gray-50 shadow-sm transition-colors"
            >
              <span className="text-lg">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-40 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-800">Notifications</span>
                  {notifications.length > 0 && (
                    <button onClick={markAllRead} className="text-xs text-blue-500 hover:text-blue-700">Mark all read</button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-sm text-gray-400">No notifications yet</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`flex gap-3 px-4 py-3 border-b border-gray-50 last:border-0 ${ n.read ? '' : 'bg-blue-50/50' }`}>
                        <span className="text-lg flex-shrink-0">{n.type === 'new_report' ? '⚠️' : '🚩'}</span>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-700 leading-snug">{n.message}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className={`w-12 h-12 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center text-xl shadow`}>{s.icon}</div>
            <div>
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['communityPosts', 'reports'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              activeTab === tab ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'reports' && pendingReports.length > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 mr-1.5 text-xs bg-orange-500 text-white rounded-full">
                {pendingReports.length}
              </span>
            )}
            {{ communityPosts: 'Community Posts', reports: 'Reports' }[tab]}
          </button>
        ))}
      </div>

      {/* ── Community Posts Tab ── */}
      {activeTab === 'communityPosts' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {communityLoading ? (
            <div className="flex items-center justify-center py-12 gap-3 text-gray-400">
              <Spinner /> <span className="text-sm">Loading community posts…</span>
            </div>
          ) : communityPosts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🌱</div>
              <p className="text-sm text-gray-500">No community posts found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {communityPosts.map(post => (
                <div key={post.id} className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
                  {/* Image */}
                  {post.imageUrl
                    ? <img src={post.imageUrl} alt="post" className="w-full h-44 object-cover" />
                    : <div className="w-full h-44 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-3xl">🖼️</div>
                  }

                  <div className="p-4 flex flex-col gap-3 flex-1">
                    {/* Author row + delete */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-green-400 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {(post.userName ?? post.userId ?? '?')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 truncate">{post.userName ?? 'Unknown'}</p>
                        <p className="text-xs text-gray-400 truncate">{post.userId}</p>
                      </div>
                      {confirmPostId === post.id ? (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            disabled={deletingPostId === post.id}
                            className="text-xs px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                          >
                            {deletingPostId === post.id ? '…' : 'Yes'}
                          </button>
                          <button
                            onClick={() => setConfirmPostId(null)}
                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-medium transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmPostId(post.id)}
                          className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-xs px-2 py-1 text-red-500 hover:bg-red-50 rounded-lg font-medium transition-all duration-150"
                        >
                          🗑 Delete
                        </button>
                      )}
                    </div>

                    {/* Caption */}
                    <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 flex-1">
                      {post.caption ?? <span className="italic text-gray-400">No caption</span>}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-sm text-gray-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <span>❤️</span>
                          <span className="font-medium">{post.likes ?? 0}</span>
                        </span>
                        <button
                          onClick={() => openComments(post)}
                          className="flex items-center gap-1 text-blue-500 hover:text-blue-700 font-medium transition-colors"
                        >
                          <span>💬</span>
                          <span>{commentCounts[post.id] ?? post.comments ?? post.commentsCount ?? 0}</span>
                        </button>
                      </div>
                      <span className="text-xs text-gray-400">
                        {post.createdAt?.toDate().toLocaleDateString() ?? '—'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Reports Tab ── */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-sm text-gray-500">No reports found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map(report => {
                const isPending = !report.status || report.status === 'pending';
                return (
                  <div key={report.id} className={`rounded-2xl border-2 p-5 flex flex-col gap-3 transition-all ${
                    report.status === 'resolved' ? 'border-green-200 bg-green-50'
                    : report.status === 'ignored' ? 'border-gray-200 bg-gray-50 opacity-60'
                    : 'border-orange-200 bg-orange-50'
                  }`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            report.status === 'resolved' ? 'bg-green-100 text-green-700'
                            : report.status === 'ignored' ? 'bg-gray-200 text-gray-500'
                            : 'bg-orange-100 text-orange-700'
                          }`}>
                            {report.status === 'resolved' ? '✅ Resolved' : report.status === 'ignored' ? 'Ignored' : '⚠️ Pending'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {report.postId ? `Post: ${report.postId}` : report.commentId ? `Comment: ${report.commentId}` : 'Unknown'}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-800">Reason: <span className="font-normal text-gray-600">{report.reason ?? '—'}</span></p>
                        <p className="text-xs text-gray-400">Reported by: {report.reportedBy ?? '—'} · {formatDate(report.createdAt)}</p>
                      </div>
                      {isPending && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleRemoveReportedContent(report)}
                            disabled={actingReportId === report.id}
                            className="text-xs px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                          >
                            {actingReportId === report.id ? '…' : '🗑 Remove Content'}
                          </button>
                          <button
                            onClick={() => handleIgnoreReport(report.id)}
                            disabled={actingReportId === report.id}
                            className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-medium transition-colors disabled:opacity-50"
                          >
                            Ignore
                          </button>
                        </div>
                      )}
                    </div>
                    {report.relatedContent && (
                      <div className="bg-white rounded-xl px-4 py-3 border border-orange-100">
                        <p className="text-xs text-gray-400 mb-1">Related post caption</p>
                        <p className="text-sm text-gray-700 line-clamp-3">{report.relatedContent}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Comments Modal ── */}
      {commentsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setCommentsModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900">Comments</h2>
                {commentsModal.caption && (
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{commentsModal.caption}</p>
                )}
              </div>
              <button
                onClick={() => setCommentsModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors text-lg"
              >
                &times;
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
              {commentsLoading ? (
                <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
                  <Spinner /> <span className="text-sm">Loading comments…</span>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-3xl mb-2">💬</div>
                  <p className="text-sm text-gray-400">No comments yet.</p>
                </div>
              ) : (
                comments.map(c => (
                  <div key={c.id} className="group flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {(c.userName ?? c.userId ?? '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-700">{c.userName ?? c.userId ?? 'Unknown'}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-400">{formatDate(c.createdAt)}</span>
                          {confirmCommentId === c.id ? (
                            <>
                              <button
                                onClick={() => handleDeleteComment(c.id)}
                                disabled={deletingCommentId === c.id}
                                className="text-xs px-2 py-0.5 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium transition-colors disabled:opacity-50"
                              >
                                {deletingCommentId === c.id ? '…' : 'Yes'}
                              </button>
                              <button
                                onClick={() => setConfirmCommentId(null)}
                                className="text-xs px-2 py-0.5 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-md font-medium transition-colors"
                              >
                                No
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setConfirmCommentId(c.id)}
                              className="text-xs px-2 py-0.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md font-medium opacity-0 group-hover:opacity-100 transition-all duration-150"
                            >
                              🗑
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {c.text ?? <span className="italic text-gray-400">No text</span>}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-3 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs text-gray-400">{comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
              <button
                onClick={() => setCommentsModal(null)}
                className="text-sm px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCommunityPage;
