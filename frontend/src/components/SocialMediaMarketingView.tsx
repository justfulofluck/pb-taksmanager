import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Plus, 
  Filter, 
  Download, 
  Search, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  TrendingUp, 
  Eye, 
  Heart, 
  MessageCircle, 
  DollarSign, 
  MousePointer, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  LayoutGrid,
  Table,
  User,
  Tag,
  Instagram,
  RefreshCw,
  Key,
  Link2,
  ShieldCheck
} from 'lucide-react';
import { 
  SocialMediaPost, 
  SocialPlatform, 
  ContentPillar, 
  ContentFormat, 
  DesignStatus, 
  CaptionStatus, 
  ApprovalStatus, 
  PublishingStatus 
} from '../types';
import { INITIAL_SOCIAL_POSTS } from '../data/socialMediaData';
import { ApiClient } from '../api';


const PLATFORMS: SocialPlatform[] = [
  'Instagram', 'LinkedIn', 'Twitter / X', 'YouTube', 'TikTok', 'Facebook', 'Pinterest', 'Threads'
];

const CONTENT_PILLARS: ContentPillar[] = [
  'Educational', 'Product', 'Promotional', 'Behind The Scenes', 'User Story', 'Entertainment', 'Thought Leadership'
];

const CONTENT_FORMATS: ContentFormat[] = [
  'Reel / Short', 'Carousel', 'Single Image', 'Video', 'Article', 'Story', 'Thread', 'Infographic'
];

const DESIGN_STATUSES: DesignStatus[] = ['Briefed', 'In Progress', 'Review', 'Approved', 'Done'];
const CAPTION_STATUSES: CaptionStatus[] = ['Draft', 'Review', 'Approved', 'Done'];
const APPROVAL_STATUSES: ApprovalStatus[] = ['Pending', 'Approved', 'Needs Changes'];
const PUBLISHING_STATUSES: PublishingStatus[] = ['Draft', 'Scheduled', 'Published', 'Delayed', 'Cancelled'];

const getPlatformStyle = (platform: SocialPlatform) => {
  switch (platform) {
    case 'Instagram':
      return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
    case 'LinkedIn':
      return 'bg-blue-600 text-white';
    case 'Twitter / X':
      return 'bg-slate-900 dark:bg-slate-700 text-white';
    case 'YouTube':
      return 'bg-red-600 text-white';
    case 'TikTok':
      return 'bg-black dark:bg-slate-800 text-cyan-400 border border-cyan-500/30';
    case 'Facebook':
      return 'bg-blue-700 text-white';
    case 'Pinterest':
      return 'bg-red-700 text-white';
    case 'Threads':
      return 'bg-slate-800 text-white';
    default:
      return 'bg-indigo-600 text-white';
  }
};

const getStatusBadgeStyle = (status: string) => {
  switch (status) {
    case 'Approved':
    case 'Published':
    case 'Done':
      return 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    case 'Scheduled':
    case 'In Progress':
    case 'Review':
      return 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800';
    case 'Draft':
    case 'Briefed':
    case 'Pending':
      return 'bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    case 'Needs Changes':
    case 'Delayed':
    case 'Cancelled':
      return 'bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800';
    default:
      return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  }
};

export default function SocialMediaMarketingView() {
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);

  useEffect(() => {
    const loadPosts = async () => {
      const data = await ApiClient.getSocialPosts();
      setPosts(data);
    };
    loadPosts();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    return window.innerWidth < 768 ? 'cards' : 'table';
  });
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleExpandCard = (id: string) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Instagram Integration State
  const [isIgModalOpen, setIsIgModalOpen] = useState(false);
  const [igTokenInput, setIgTokenInput] = useState('');
  const [isSyncingIg, setIsSyncingIg] = useState(false);
  const [igAccount, setIgAccount] = useState<any>(() => {
    const saved = localStorage.getItem('instagram_account');
    return saved ? JSON.parse(saved) : null;
  });
  const [igSyncError, setIgSyncError] = useState('');
  const [igSyncSuccess, setIgSyncSuccess] = useState('');

  // Instagram Connection Handlers
  const handleVerifyAndConnectIg = async (tokenToUse?: string) => {
    const token = tokenToUse || igTokenInput;
    setIgSyncError('');
    setIgSyncSuccess('');
    setIsSyncingIg(true);

    try {
      const res = await fetch('/api/instagram/verify-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token })
      });
      const data = await res.json();

      if (data.success && data.account) {
        setIgAccount(data.account);
        localStorage.setItem('instagram_account', JSON.stringify(data.account));
        setIgSyncSuccess(`Successfully connected @${data.account.username}! Syncing live insights...`);
        setIsIgModalOpen(false);
        // Automatically fetch live post insights
        await handleSyncIgInsights(data.account.accessToken, data.account.id);
      } else {
        setIgSyncError(data.error || 'Could not verify Instagram token. Check your credentials.');
      }
    } catch (err: any) {
      setIgSyncError(err.message || 'Server error connecting to Instagram Graph API.');
    } finally {
      setIsSyncingIg(false);
    }
  };

  const handleSyncIgInsights = async (customToken?: string, customAccountId?: string) => {
    setIsSyncingIg(true);
    setIgSyncError('');
    setIgSyncSuccess('');

    try {
      const token = customToken || igAccount?.accessToken;
      const accountId = customAccountId || igAccount?.id;

      const res = await fetch('/api/instagram/fetch-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token, igAccountId: accountId })
      });
      const data = await res.json();

      if (data.success && Array.isArray(data.posts) && data.posts.length > 0) {
        for (const post of data.posts) {
          await ApiClient.saveSocialPost(post);
        }
        const updatedList = await ApiClient.getSocialPosts();
        setPosts(updatedList);
        setIgSyncSuccess(`Synced ${data.count} live Instagram posts & insights!`);
      } else if (data.success && data.count === 0) {
        setIgSyncSuccess('Connected to Instagram! No live media posts found yet on this profile.');
      } else {
        setIgSyncError(data.error || 'Failed to sync insights from Instagram Graph API.');
      }
    } catch (err: any) {
      setIgSyncError('Failed to communicate with Instagram server endpoint.');
    } finally {
      setIsSyncingIg(false);
    }
  };

  const handleDisconnectIg = () => {
    setIgAccount(null);
    localStorage.removeItem('instagram_account');
    setIgSyncSuccess('');
    setIgSyncError('');
  };

  // Modal State for adding/editing post
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialMediaPost | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<SocialMediaPost>>({
    date: new Date().toISOString().split('T')[0],
    day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    platform: 'Instagram',
    contentPillar: 'Educational',
    contentFormat: 'Reel / Short',
    campaign: '',
    product: '',
    titleHook: '',
    cta: '',
    owner: '',
    influencer: '',
    designStatus: 'Briefed',
    captionStatus: 'Draft',
    approval: 'Pending',
    postTime: '10:00 AM',
    publishingStatus: 'Draft',
    urlLink: '',
    reach: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    clicks: 0,
    orders: 0,
    revenue: 0,
    remarks: ''
  });

  // Handle open modal for creation or editing
  const handleOpenCreateModal = () => {
    setEditingPost(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      platform: 'Instagram',
      contentPillar: 'Product',
      contentFormat: 'Reel / Short',
      campaign: 'Q3 Campaign',
      product: 'Core Product',
      titleHook: '',
      cta: 'Link in Bio',
      owner: 'Marketing Lead',
      influencer: 'N/A',
      designStatus: 'Briefed',
      captionStatus: 'Draft',
      approval: 'Pending',
      postTime: '10:00 AM',
      publishingStatus: 'Draft',
      urlLink: '',
      reach: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      clicks: 0,
      orders: 0,
      revenue: 0,
      remarks: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (post: SocialMediaPost) => {
    setEditingPost(post);
    setFormData(post);
    setIsModalOpen(true);
  };

  const handleDeletePost = async (id: string) => {
    await ApiClient.deleteSocialPost(id);
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titleHook) return;

    if (editingPost) {
      const updatedPost = { ...editingPost, ...(formData as SocialMediaPost) };
      const saved = await ApiClient.saveSocialPost(updatedPost);
      setPosts(posts.map(p => p.id === saved.id ? saved : p));
    } else {
      const newPost: SocialMediaPost = {
        id: `smp-${Date.now()}`,
        ...(formData as Omit<SocialMediaPost, 'id'>)
      };
      const saved = await ApiClient.saveSocialPost(newPost);
      setPosts([saved, ...posts]);
    }

    setIsModalOpen(false);
  };

  const handleInlineChange = async (id: string, field: keyof SocialMediaPost, value: any) => {
    const target = posts.find(p => p.id === id);
    if (!target) return;
    const updated = { ...target, [field]: value };
    setPosts(posts.map(post => post.id === id ? updated : post));
    await ApiClient.saveSocialPost(updated);
  };


  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Date', 'Day', 'Platform', 'Content Pillar', 'Content Format', 'Campaign', 'Product', 
      'Title / Hook', 'CTA', 'Owner', 'Influencer', 'Design Status', 'Caption Status', 
      'Approval', 'Post Time', 'Publishing Status', 'URL link', 'Reach', 'Likes', 
      'Comments', 'Shares', 'Saves', 'Clicks', 'Orders', 'Revenue', 'Remarks'
    ];

    const rows = filteredPosts.map(p => [
      p.date, p.day, p.platform, p.contentPillar, p.contentFormat, `"${p.campaign}"`, `"${p.product}"`,
      `"${p.titleHook.replace(/"/g, '""')}"`, `"${p.cta}"`, `"${p.owner}"`, `"${p.influencer}"`,
      p.designStatus, p.captionStatus, p.approval, p.postTime, p.publishingStatus, `"${p.urlLink}"`,
      p.reach, p.likes, p.comments, p.shares, p.saves, p.clicks, p.orders, p.revenue, `"${p.remarks}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Social_Media_Marketing_Tracker_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered dataset
  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.titleHook.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.campaign.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.product.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPlatform = filterPlatform === 'ALL' || post.platform === filterPlatform;
    const matchesStatus = filterStatus === 'ALL' || post.publishingStatus === filterStatus;

    return matchesSearch && matchesPlatform && matchesStatus;
  });

  // Calculate Metrics
  const totalPosts = posts.length;
  const totalReach = posts.reduce((acc, p) => acc + (p.reach || 0), 0);
  const totalLikes = posts.reduce((acc, p) => acc + (p.likes || 0), 0);
  const totalComments = posts.reduce((acc, p) => acc + (p.comments || 0), 0);
  const totalClicks = posts.reduce((acc, p) => acc + (p.clicks || 0), 0);
  const totalRevenue = posts.reduce((acc, p) => acc + (p.revenue || 0), 0);

  return (
    <div className="space-y-6 p-4 sm:p-6 text-slate-900 dark:text-slate-100 min-h-full">
      
      {/* SECTION HEADER & METRICS BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <Share2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Social Media Marketing Hub
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete content calendar, design workflow, approval tracker & analytics grid.
          </p>
        </div>

        {/* Create Entry Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-lg shadow-indigo-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Add Marketing Post</span>
          </button>
        </div>
      </div>

      {/* INSTAGRAM REAL INSIGHTS CONNECT BANNER */}
      <div className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 dark:from-pink-950/30 dark:via-purple-950/30 dark:to-indigo-950/30 border border-pink-200/80 dark:border-pink-900/60 rounded-3xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-0.5 shadow-md shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Instagram className="w-5 h-5 text-pink-500" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Instagram Real Insights Integration
                </h2>
                {igAccount ? (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Live Connected</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-400 border border-pink-200 dark:border-pink-800">
                    Not Connected
                  </span>
                )}
              </div>

              {igAccount ? (
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Connected as <span className="font-bold text-pink-600 dark:text-pink-400">@{igAccount.username}</span> • {typeof igAccount.followersCount === 'number' ? `${igAccount.followersCount.toLocaleString()} followers` : igAccount.followersCount} • {igAccount.mediaCount || 0} media posts
                </p>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Connect your Instagram Business or Creator account to track live post reach, likes, comments, and engagement directly in your marketing spreadsheet.
                </p>
              )}

              {igSyncSuccess && (
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 pt-0.5 animate-in fade-in">
                  ✓ {igSyncSuccess}
                </p>
              )}
              {igSyncError && (
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 pt-0.5 animate-in fade-in">
                  ⚠️ {igSyncError}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
            {igAccount ? (
              <>
                <button
                  onClick={() => handleSyncIgInsights()}
                  disabled={isSyncingIg}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white text-xs font-extrabold shadow-md shadow-pink-500/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingIg ? 'animate-spin' : ''}`} />
                  <span>{isSyncingIg ? 'Syncing...' : 'Sync Live Insights'}</span>
                </button>
                <button
                  onClick={handleDisconnectIg}
                  className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsIgModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-700 hover:to-purple-700 text-white text-xs font-black shadow-lg shadow-pink-500/20 transition-all cursor-pointer active:scale-95"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Connect Instagram</span>
                </button>
                <button
                  onClick={() => handleVerifyAndConnectIg('demo_token_meta_3892')}
                  disabled={isSyncingIg}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-slate-700 text-pink-600 dark:text-pink-400 text-xs font-bold border border-pink-200 dark:border-pink-800 transition-all cursor-pointer"
                  title="Test connection using sample Instagram Graph API insights"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Demo Sync</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Posts</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-slate-900 dark:text-white">{totalPosts}</span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Live Grid</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Reach</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-slate-900 dark:text-white">{totalReach.toLocaleString()}</span>
            <Eye className="w-4 h-4 text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Likes</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-slate-900 dark:text-white">{totalLikes.toLocaleString()}</span>
            <Heart className="w-4 h-4 text-rose-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Comments</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-slate-900 dark:text-white">{totalComments.toLocaleString()}</span>
            <MessageCircle className="w-4 h-4 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Link Clicks</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-slate-900 dark:text-white">{totalClicks.toLocaleString()}</span>
            <MousePointer className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Generated Revenue</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">₹{totalRevenue.toLocaleString()}</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERS TOOLBAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        {/* Search Input */}
        <div className="relative w-full lg:w-96 shrink-0">
          <Search className="absolute inset-y-0 left-3.5 my-auto w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search campaigns, hooks, owners, products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold pl-10 pr-9 py-2.5 sm:py-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-900 dark:text-white placeholder-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-3 my-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls & View Toggle Group */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Platform Filter */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex-1 sm:flex-initial min-w-[130px]">
              <span className="font-bold text-slate-400 shrink-0 uppercase tracking-wider text-[10px]">Platform</span>
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="bg-transparent text-slate-900 dark:text-white font-extrabold text-xs outline-none cursor-pointer w-full"
              >
                <option value="ALL" className="bg-white dark:bg-slate-900 font-bold">All Platforms</option>
                {PLATFORMS.map(p => (
                  <option key={p} value={p} className="bg-white dark:bg-slate-900 font-bold">{p}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex-1 sm:flex-initial min-w-[130px]">
              <span className="font-bold text-slate-400 shrink-0 uppercase tracking-wider text-[10px]">Status</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent text-slate-900 dark:text-white font-extrabold text-xs outline-none cursor-pointer w-full"
              >
                <option value="ALL" className="bg-white dark:bg-slate-900 font-bold">All Statuses</option>
                {PUBLISHING_STATUSES.map(s => (
                  <option key={s} value={s} className="bg-white dark:bg-slate-900 font-bold">{s}</option>
                ))}
              </select>
            </div>

            {(filterPlatform !== 'ALL' || filterStatus !== 'ALL' || searchQuery) && (
              <button
                onClick={() => { setFilterPlatform('ALL'); setFilterStatus('ALL'); setSearchQuery(''); }}
                className="text-xs font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 px-3 py-2 sm:py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/80 cursor-pointer transition-all flex items-center gap-1 shrink-0 active:scale-95"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* View Mode Toggle Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs border border-slate-200/60 dark:border-slate-700/60'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Cards View (Best for Mobile)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs border border-slate-200/60 dark:border-slate-700/60'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Table Grid View (Spreadsheet)"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* RENDER EITHER CARDS VIEW OR TABLE SPREADSHEET GRID */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPosts.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400 font-bold space-y-2">
              <p className="text-base font-black text-slate-700 dark:text-slate-300">No marketing posts found</p>
              <p className="text-xs text-slate-400">Try adjusting your filters or search terms, or add a new marketing post.</p>
            </div>
          ) : (
            filteredPosts.map((post, idx) => {
              const isExpanded = !!expandedCards[post.id];
              return (
                <div
                  key={post.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
                >
                  <div className="space-y-3">
                    {/* Card Header Bar */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[11px] font-black flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg ${getPlatformStyle(post.platform)}`}>
                          {post.platform}
                        </span>
                      </div>
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${getStatusBadgeStyle(post.publishingStatus)}`}>
                        {post.publishingStatus}
                      </span>
                    </div>

                    {/* Title / Hook */}
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-2 leading-snug">
                        {post.titleHook || 'Untitled Marketing Post'}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{post.date} ({post.day})</span>
                        {post.postTime && <span>• {post.postTime}</span>}
                      </div>
                    </div>

                    {/* Pillars & Format Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {post.contentPillar && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80">
                          {post.contentPillar}
                        </span>
                      )}
                      {post.contentFormat && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 border border-purple-200/80 dark:border-purple-800/80">
                          {post.contentFormat}
                        </span>
                      )}
                      {post.owner && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <User className="w-2.5 h-2.5" />
                          {post.owner}
                        </span>
                      )}
                    </div>


                    {/* Expandable Details Section */}
                    {isExpanded && (
                      <div className="pt-2 space-y-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 animate-in fade-in duration-150">
                        {post.campaign && (
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-400 text-[11px]">Campaign:</span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-200">{post.campaign}</span>
                          </div>
                        )}
                        {post.product && (
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-400 text-[11px]">Product:</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">{post.product}</span>
                          </div>
                        )}
                        {post.cta && (
                          <div>
                            <span className="font-bold text-slate-400 text-[11px] block">CTA:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{post.cta}</span>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                          <div>
                            <span className="font-bold text-slate-400 block text-[10px]">Design Status</span>
                            <span className={`font-extrabold px-2 py-0.5 rounded border inline-block mt-0.5 text-[10px] ${getStatusBadgeStyle(post.designStatus)}`}>
                              {post.designStatus}
                            </span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-400 block text-[10px]">Approval</span>
                            <span className={`font-extrabold px-2 py-0.5 rounded border inline-block mt-0.5 text-[10px] ${getStatusBadgeStyle(post.approval)}`}>
                              {post.approval}
                            </span>
                          </div>
                        </div>
                        {post.remarks && (
                          <div className="bg-amber-50/60 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200/60 dark:border-amber-800/60 text-[11px] mt-2">
                            <span className="font-bold text-amber-700 dark:text-amber-400">Remarks: </span>
                            <span className="text-amber-900 dark:text-amber-200">{post.remarks}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Actions Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => toggleExpandCard(post.id)}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {isExpanded ? (
                        <>
                          <span>Less details</span>
                          <ChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          <span>Full 26 fields</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      {post.urlLink && (
                        <a
                          href={post.urlLink.startsWith('http') ? post.urlLink : `https://${post.urlLink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                          title="Open Post URL"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => handleOpenEditModal(post)}
                        className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/80 dark:hover:bg-indigo-900 dark:text-indigo-400 rounded-lg border border-indigo-200 dark:border-indigo-800/80 transition-all cursor-pointer"
                        title="Edit Post"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/80 dark:hover:bg-rose-900 dark:text-rose-400 rounded-lg border border-rose-200 dark:border-rose-800/80 transition-all cursor-pointer"
                        title="Delete Post"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* FULL SPREADSHEET TABLE GRID WITH ALL 26 COLUMNS */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-md overflow-hidden">
          {/* Mobile scroll tip */}
          <div className="md:hidden bg-slate-100 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <span>← Swipe table horizontally to view all 26 columns →</span>
            <button
              onClick={() => setViewMode('cards')}
              className="text-indigo-600 dark:text-indigo-400 font-extrabold underline cursor-pointer"
            >
              Switch to Cards
            </button>
          </div>

          <div className="overflow-x-auto max-h-[680px]">
            <table className="w-full text-left border-collapse min-w-[2800px] text-xs">
            {/* Table Header */}
            <thead>
              <tr className="bg-slate-800 dark:bg-slate-950 text-white font-black uppercase text-[11px] tracking-wider sticky top-0 z-10">
                <th className="p-3 border-b border-slate-700 w-12 text-center sticky left-0 bg-slate-800 dark:bg-slate-950 z-20 shadow-[4px_0_12px_rgba(0,0,0,0.2)]">#</th>
                <th className="p-3 border-b border-slate-700 min-w-[110px]">Date</th>
                <th className="p-3 border-b border-slate-700 min-w-[100px]">Day</th>
                <th className="p-3 border-b border-slate-700 min-w-[140px]">Platform</th>
                <th className="p-3 border-b border-slate-700 min-w-[150px]">Content Pillar</th>
                <th className="p-3 border-b border-slate-700 min-w-[140px]">Content Format</th>
                <th className="p-3 border-b border-slate-700 min-w-[160px]">Campaign</th>
                <th className="p-3 border-b border-slate-700 min-w-[140px]">Product</th>
                <th className="p-3 border-b border-slate-700 min-w-[240px]">Title / Hook</th>
                <th className="p-3 border-b border-slate-700 min-w-[180px]">CTA</th>
                <th className="p-3 border-b border-slate-700 min-w-[130px]">Owner</th>
                <th className="p-3 border-b border-slate-700 min-w-[130px]">Influencer</th>
                <th className="p-3 border-b border-slate-700 min-w-[130px]">Design Status</th>
                <th className="p-3 border-b border-slate-700 min-w-[130px]">Caption Status</th>
                <th className="p-3 border-b border-slate-700 min-w-[130px]">Approval</th>
                <th className="p-3 border-b border-slate-700 min-w-[100px]">Post Time</th>
                <th className="p-3 border-b border-slate-700 min-w-[140px]">Publishing Status</th>
                <th className="p-3 border-b border-slate-700 min-w-[160px]">URL Link</th>
                <th className="p-3 border-b border-slate-700 min-w-[90px] text-right">Reach</th>
                <th className="p-3 border-b border-slate-700 min-w-[90px] text-right">Likes</th>
                <th className="p-3 border-b border-slate-700 min-w-[90px] text-right">Comments</th>
                <th className="p-3 border-b border-slate-700 min-w-[90px] text-right">Shares</th>
                <th className="p-3 border-b border-slate-700 min-w-[90px] text-right">Saves</th>
                <th className="p-3 border-b border-slate-700 min-w-[90px] text-right">Clicks</th>
                <th className="p-3 border-b border-slate-700 min-w-[90px] text-right">Orders</th>
                <th className="p-3 border-b border-slate-700 min-w-[110px] text-right">Revenue</th>
                <th className="p-3 border-b border-slate-700 min-w-[200px]">Remarks</th>
                <th className="p-3 border-b border-slate-700 min-w-[100px] text-center sticky right-0 bg-slate-800 dark:bg-slate-950 z-20 shadow-[-4px_0_12px_rgba(0,0,0,0.2)]">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={28} className="text-center py-12 text-slate-400 font-bold">
                    No social media marketing posts found. Click "Add Marketing Post" to add one!
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post, idx) => (
                  <tr key={post.id} className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/40 transition-colors group">
                    
                    {/* # Index */}
                    <td className="p-3 text-center bg-white dark:bg-slate-900 group-hover:bg-indigo-50/50 dark:group-hover:bg-slate-800/90 sticky left-0 z-10 border-r border-slate-200 dark:border-slate-800 shadow-[4px_0_12px_rgba(0,0,0,0.04)] transition-colors">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[11px] font-bold">
                        {idx + 1}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="p-3 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-slate-700/80 inline-block">
                        {post.date}
                      </span>
                    </td>

                    {/* Day */}
                    <td className="p-3 whitespace-nowrap">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60 inline-block">
                        {post.day}
                      </span>
                    </td>

                    {/* Platform Badge */}
                    <td className="p-3">
                      <select
                        value={post.platform}
                        onChange={(e) => handleInlineChange(post.id, 'platform', e.target.value as SocialPlatform)}
                        className={`text-[11px] font-black px-2.5 py-1 rounded-full border outline-none cursor-pointer ${getPlatformStyle(post.platform)}`}
                      >
                        {PLATFORMS.map(p => (
                          <option key={p} value={p} className="bg-slate-900 text-white">{p}</option>
                        ))}
                      </select>
                    </td>

                    {/* Content Pillar */}
                    <td className="p-3">
                      <select
                        value={post.contentPillar}
                        onChange={(e) => handleInlineChange(post.id, 'contentPillar', e.target.value as ContentPillar)}
                        className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[11px] px-2 py-1 rounded-lg outline-none cursor-pointer border border-slate-200 dark:border-slate-700"
                      >
                        {CONTENT_PILLARS.map(cp => (
                          <option key={cp} value={cp}>{cp}</option>
                        ))}
                      </select>
                    </td>

                    {/* Content Format */}
                    <td className="p-3">
                      <select
                        value={post.contentFormat}
                        onChange={(e) => handleInlineChange(post.id, 'contentFormat', e.target.value as ContentFormat)}
                        className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[11px] px-2 py-1 rounded-lg outline-none cursor-pointer border border-slate-200 dark:border-slate-700"
                      >
                        {CONTENT_FORMATS.map(cf => (
                          <option key={cf} value={cf}>{cf}</option>
                        ))}
                      </select>
                    </td>

                    {/* Campaign */}
                    <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">
                      {post.campaign || '-'}
                    </td>

                    {/* Product */}
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                      {post.product || '-'}
                    </td>

                    {/* Title / Hook */}
                    <td className="p-3 font-bold text-slate-900 dark:text-white max-w-[260px] truncate" title={post.titleHook}>
                      {post.titleHook}
                    </td>

                    {/* CTA */}
                    <td className="p-3 text-slate-600 dark:text-slate-400 italic">
                      {post.cta || '-'}
                    </td>

                    {/* Owner */}
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                      {post.owner || '-'}
                    </td>

                    {/* Influencer */}
                    <td className="p-3 text-indigo-500 font-semibold">
                      {post.influencer || '-'}
                    </td>

                    {/* Design Status */}
                    <td className="p-3">
                      <select
                        value={post.designStatus}
                        onChange={(e) => handleInlineChange(post.id, 'designStatus', e.target.value as DesignStatus)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border outline-none cursor-pointer ${getStatusBadgeStyle(post.designStatus)}`}
                      >
                        {DESIGN_STATUSES.map(s => (
                          <option key={s} value={s} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{s}</option>
                        ))}
                      </select>
                    </td>

                    {/* Caption Status */}
                    <td className="p-3">
                      <select
                        value={post.captionStatus}
                        onChange={(e) => handleInlineChange(post.id, 'captionStatus', e.target.value as CaptionStatus)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border outline-none cursor-pointer ${getStatusBadgeStyle(post.captionStatus)}`}
                      >
                        {CAPTION_STATUSES.map(s => (
                          <option key={s} value={s} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{s}</option>
                        ))}
                      </select>
                    </td>

                    {/* Approval */}
                    <td className="p-3">
                      <select
                        value={post.approval}
                        onChange={(e) => handleInlineChange(post.id, 'approval', e.target.value as ApprovalStatus)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border outline-none cursor-pointer ${getStatusBadgeStyle(post.approval)}`}
                      >
                        {APPROVAL_STATUSES.map(s => (
                          <option key={s} value={s} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{s}</option>
                        ))}
                      </select>
                    </td>

                    {/* Post Time */}
                    <td className="p-3 font-semibold text-slate-600 dark:text-slate-400">
                      {post.postTime || '-'}
                    </td>

                    {/* Publishing Status */}
                    <td className="p-3">
                      <select
                        value={post.publishingStatus}
                        onChange={(e) => handleInlineChange(post.id, 'publishingStatus', e.target.value as PublishingStatus)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border outline-none cursor-pointer ${getStatusBadgeStyle(post.publishingStatus)}`}
                      >
                        {PUBLISHING_STATUSES.map(s => (
                          <option key={s} value={s} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{s}</option>
                        ))}
                      </select>
                    </td>

                    {/* URL Link */}
                    <td className="p-3">
                      {post.urlLink ? (
                        <a 
                          href={post.urlLink} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1"
                        >
                          <span>Open Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">No link</span>
                      )}
                    </td>

                    {/* Reach */}
                    <td className="p-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                      {post.reach ? post.reach.toLocaleString() : '-'}
                    </td>

                    {/* Likes */}
                    <td className="p-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                      {post.likes ? post.likes.toLocaleString() : '-'}
                    </td>

                    {/* Comments */}
                    <td className="p-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                      {post.comments ? post.comments.toLocaleString() : '-'}
                    </td>

                    {/* Shares */}
                    <td className="p-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                      {post.shares ? post.shares.toLocaleString() : '-'}
                    </td>

                    {/* Saves */}
                    <td className="p-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                      {post.saves ? post.saves.toLocaleString() : '-'}
                    </td>

                    {/* Clicks */}
                    <td className="p-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                      {post.clicks ? post.clicks.toLocaleString() : '-'}
                    </td>

                    {/* Orders */}
                    <td className="p-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                      {post.orders ? post.orders.toLocaleString() : '-'}
                    </td>

                    {/* Revenue */}
                    <td className="p-3 text-right">
                      <span className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-md border border-emerald-200/80 dark:border-emerald-800/80 inline-block">
                        {post.revenue ? `₹${post.revenue.toLocaleString()}` : '-'}
                      </span>
                    </td>

                    {/* Remarks */}
                    <td className="p-3 text-slate-500 dark:text-slate-400 truncate max-w-[200px]" title={post.remarks}>
                      {post.remarks || '-'}
                    </td>

                    {/* Actions Column */}
                    <td className="p-3 text-center bg-white dark:bg-slate-900 group-hover:bg-indigo-50/50 dark:group-hover:bg-slate-800/90 sticky right-0 z-10 border-l border-slate-200 dark:border-slate-800 shadow-[-4px_0_12px_rgba(0,0,0,0.04)] transition-colors">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(post)}
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/80 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-200 dark:border-indigo-800/80 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs"
                          title="Edit row"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/80 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-200 dark:border-rose-800/80 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs"
                          title="Delete row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* INSTAGRAM CONNECT MODAL */}
      {isIgModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-0.5 shadow-md flex items-center justify-center">
                  <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center">
                    <Instagram className="w-5 h-5 text-pink-500" />
                  </div>
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Connect Instagram Account
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sync real post reach, likes & engagement insights
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsIgModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="space-y-4">
              <div className="bg-pink-50/60 dark:bg-pink-950/30 p-3.5 rounded-2xl border border-pink-200/60 dark:border-pink-800/60 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <p className="font-bold text-pink-700 dark:text-pink-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Meta Instagram Graph API Setup</span>
                </p>
                <p className="text-[11px] leading-relaxed">
                  Enter your Meta Page Access Token or User Access Token below. Works with Instagram Business or Creator accounts linked to a Facebook Page.
                </p>
              </div>

              {/* Token Input Field */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Instagram / Meta Access Token
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="password"
                    placeholder="EAAG... (Paste Meta Graph API Access Token)"
                    value={igTokenInput}
                    onChange={(e) => setIgTokenInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-pink-500 transition-colors"
                  />
                </div>
              </div>

              {igSyncError && (
                <div className="bg-rose-50 dark:bg-rose-950/60 p-3 rounded-xl border border-rose-200 dark:border-rose-900 text-xs font-bold text-rose-600 dark:text-rose-400">
                  ⚠️ {igSyncError}
                </div>
              )}

              {/* Helper Links */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1.5 text-[11px]">
                <p className="font-bold text-slate-700 dark:text-slate-300">How to get your Meta Access Token:</p>
                <ol className="list-decimal list-inside text-slate-500 dark:text-slate-400 space-y-1 pl-1">
                  <li>Open <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-pink-600 dark:text-pink-400 font-bold underline inline-flex items-center gap-0.5">Meta Graph API Explorer <ExternalLink className="w-2.5 h-2.5" /></a></li>
                  <li>Select your Meta App & request <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[10px]">instagram_basic, instagram_manage_insights</code></li>
                  <li>Click <b>Generate Access Token</b> & paste it above</li>
                </ol>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleVerifyAndConnectIg('demo_token_meta_3892')}
                disabled={isSyncingIg}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Try Demo Token
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsIgModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleVerifyAndConnectIg()}
                  disabled={isSyncingIg || !igTokenInput.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-700 hover:to-purple-700 text-white text-xs font-extrabold shadow-md shadow-pink-500/20 cursor-pointer transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingIg ? 'animate-spin' : ''}`} />
                  <span>{isSyncingIg ? 'Verifying...' : 'Verify & Connect'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CREATE / EDIT MARKETING POST MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-popup-in text-slate-900 dark:text-slate-100 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Share2 className="w-5 h-5" />
                </span>
                <h2 className="text-lg font-black">
                  {editingPost ? 'Edit Social Media Post' : 'Add New Marketing Post'}
                </h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePost} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Date */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      const dayName = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });
                      setFormData({ ...formData, date: selectedDate, day: dayName });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold outline-none"
                    required
                  />
                </div>

                {/* Day */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Day</label>
                  <input
                    type="text"
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold outline-none"
                    required
                  />
                </div>

                {/* Platform */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Platform</label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value as SocialPlatform })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer"
                  >
                    {PLATFORMS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Content Pillar */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Content Pillar</label>
                  <select
                    value={formData.contentPillar}
                    onChange={(e) => setFormData({ ...formData, contentPillar: e.target.value as ContentPillar })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer"
                  >
                    {CONTENT_PILLARS.map(cp => (
                      <option key={cp} value={cp}>{cp}</option>
                    ))}
                  </select>
                </div>

                {/* Content Format */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Content Format</label>
                  <select
                    value={formData.contentFormat}
                    onChange={(e) => setFormData({ ...formData, contentFormat: e.target.value as ContentFormat })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer"
                  >
                    {CONTENT_FORMATS.map(cf => (
                      <option key={cf} value={cf}>{cf}</option>
                    ))}
                  </select>
                </div>

                {/* Campaign */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Campaign</label>
                  <input
                    type="text"
                    placeholder="e.g. Summer Launch Q3"
                    value={formData.campaign}
                    onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold outline-none"
                  />
                </div>

                {/* Product */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Product</label>
                  <input
                    type="text"
                    placeholder="e.g. Enterprise Tier"
                    value={formData.product}
                    onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold outline-none"
                  />
                </div>

                {/* Owner */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Owner</label>
                  <input
                    type="text"
                    placeholder="e.g. Priya Sharma"
                    value={formData.owner}
                    onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold outline-none"
                  />
                </div>

                {/* Influencer */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Influencer Handle</label>
                  <input
                    type="text"
                    placeholder="e.g. @tech_guru"
                    value={formData.influencer}
                    onChange={(e) => setFormData({ ...formData, influencer: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold outline-none"
                  />
                </div>

              </div>

              {/* Title / Hook */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Title / Hook *</label>
                <textarea
                  rows={2}
                  placeholder="Catchy headline or video hook statement..."
                  value={formData.titleHook}
                  onChange={(e) => setFormData({ ...formData, titleHook: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold outline-none"
                  required
                />
              </div>

              {/* CTA & URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">CTA (Call to Action)</label>
                  <input
                    type="text"
                    placeholder="e.g. Comment 'GROW' or Link in Bio"
                    value={formData.cta}
                    onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">URL Link</label>
                  <input
                    type="url"
                    placeholder="https://instagram.com/p/..."
                    value={formData.urlLink}
                    onChange={(e) => setFormData({ ...formData, urlLink: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              {/* Workflow Status Selectors */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Design Status</label>
                  <select
                    value={formData.designStatus}
                    onChange={(e) => setFormData({ ...formData, designStatus: e.target.value as DesignStatus })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold outline-none"
                  >
                    {DESIGN_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Caption Status</label>
                  <select
                    value={formData.captionStatus}
                    onChange={(e) => setFormData({ ...formData, captionStatus: e.target.value as CaptionStatus })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold outline-none"
                  >
                    {CAPTION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Approval</label>
                  <select
                    value={formData.approval}
                    onChange={(e) => setFormData({ ...formData, approval: e.target.value as ApprovalStatus })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold outline-none"
                  >
                    {APPROVAL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Publishing Status</label>
                  <select
                    value={formData.publishingStatus}
                    onChange={(e) => setFormData({ ...formData, publishingStatus: e.target.value as PublishingStatus })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold outline-none"
                  >
                    {PUBLISHING_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Performance Metrics Input (Optional) */}
              <div className="space-y-2">
                <span className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 block">Performance & Metrics (Post-Publish)</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Reach</label>
                    <input
                      type="number"
                      value={formData.reach}
                      onChange={(e) => setFormData({ ...formData, reach: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Likes</label>
                    <input
                      type="number"
                      value={formData.likes}
                      onChange={(e) => setFormData({ ...formData, likes: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Comments</label>
                    <input
                      type="number"
                      value={formData.comments}
                      onChange={(e) => setFormData({ ...formData, comments: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Shares</label>
                    <input
                      type="number"
                      value={formData.shares}
                      onChange={(e) => setFormData({ ...formData, shares: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Saves</label>
                    <input
                      type="number"
                      value={formData.saves}
                      onChange={(e) => setFormData({ ...formData, saves: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Clicks</label>
                    <input
                      type="number"
                      value={formData.clicks}
                      onChange={(e) => setFormData({ ...formData, clicks: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Orders</label>
                    <input
                      type="number"
                      value={formData.orders}
                      onChange={(e) => setFormData({ ...formData, orders: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Revenue (₹)</label>
                    <input
                      type="number"
                      value={formData.revenue}
                      onChange={(e) => setFormData({ ...formData, revenue: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Remarks / Internal Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Carousel slides 1-7 ready in Figma..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-lg cursor-pointer transition-all"
                >
                  {editingPost ? 'Update Entry' : 'Save Marketing Post'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
