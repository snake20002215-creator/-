import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, onSnapshot, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';
import { 
  Palette, 
  Search, 
  FileText, 
  Image as ImageIcon, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  Settings,
  Plus,
  Trash2,
  ExternalLink,
  X,
  Info,
  ListOrdered,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

import { Commission, CommissionStatus } from './types';
import { STATUS_NODES, COMMISSION_TYPES, DEFAULT_ADMIN_PASSWORD } from './constants';

// --- Main App Component ---
export default function App() {
  const generalImages = [
    "https://images.plurk.com/7ActJmuxDdOaXERJOsUXLC.png",
    "https://images.plurk.com/5Rsx00rSG2rKQADDBr5VhK.png",
    "https://images.plurk.com/3TDwe27ioAtCptQEdOdoik.png",
    "https://images.plurk.com/1GsccnL4oeKUzKQxJukgFr.png",
    "https://images.plurk.com/5q7xnMiZ7TwcgE3Pwwwvex.png",
    "https://images.plurk.com/G9bJBPf2tYQnMPLc5Dpa9.png",
    "https://images.plurk.com/2AKMA2RSKCs4sg6y5fA7Ri.png",
    "https://images.plurk.com/2PIKk5uizCqIWmwlVwwe3o.png",
    "https://images.plurk.com/66P4DOsPndcOJxvLBu8zJL.png",
    "https://images.plurk.com/5whn6xEqllbj7HNWFLwVhS.png"
  ];

  const r18gImages = [
    "https://images.plurk.com/3kWeCYcgGCRlSpIyhfa2ud.png",
    "https://images.plurk.com/3I06VNFzBfvtYb0lYXV9if.png",
    "https://images.plurk.com/7tgO29H6fL8LhzI20dvoBO.png"
  ];

  const [view, setView] = useState<'home' | 'form' | 'track' | 'portfolio' | 'admin' | 'info'>('home');
  
  // --- Firebase Data State ---
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [isCommissionOpen, setIsCommissionOpen] = useState(true);

  // --- Form State ---
  const [formStep, setFormStep] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [formData, setFormData] = useState({
    nickname: '',
    contact: '',
    title: '',
    types: [] as string[],
    description: '',
    referenceUrl: ''
  });
  const [tempId, setTempId] = useState('');

  // Reset form when leaving form view after completion
  useEffect(() => {
    if (view !== 'form' && formStep === 3) {
      setFormStep(1);
      setAgreed(false);
      setFormData({
        nickname: '',
        contact: '',
        title: '',
        types: [],
        description: '',
        referenceUrl: ''
      });
    }
  }, [view, formStep]);

  // --- Tracking State ---
  const [searchId, setSearchId] = useState('');
  const [trackedCommission, setTrackedCommission] = useState<Commission | null>(null);

  // --- Portfolio State ---
  const [portfolioView, setPortfolioView] = useState<'albums' | 'general' | 'r18g'>('albums');
  const [showR18GWarning, setShowR18GWarning] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // --- Admin State ---
  const [editingCommission, setEditingCommission] = useState<Commission | null>(null);

  // --- Auth & Data Fetching ---
  const [user, setUser] = useState<User | null>(null);
  const isAdmin = user?.email === 'snake20002215@gmail.com';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Fetch global settings
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setIsCommissionOpen(docSnap.data().isCommissionOpen);
      }
    }, (error) => {
      console.error("Error fetching settings:", error);
    });
    return () => unsub();
  }, []);

  // Fetch commissions (Admin only)
  useEffect(() => {
    if (isAdmin) {
      const unsub = onSnapshot(collection(db, 'commissions'), (snapshot) => {
        const comms: Commission[] = [];
        snapshot.forEach(doc => {
          comms.push({ id: doc.id, ...doc.data() } as Commission);
        });
        comms.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setCommissions(comms);
      }, (error) => {
        console.error("Error fetching commissions:", error);
      });
      return () => unsub();
    } else {
      setCommissions([]);
    }
  }, [isAdmin]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('登入成功');
    } catch (error: any) {
      console.error(error);
      toast.error('登入失敗: ' + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('已登出');
      setView('home');
    } catch (error: any) {
      console.error(error);
      toast.error('登出失敗: ' + error.message);
    }
  };

  // --- Actions ---
  const handleFormSubmit = async () => {
    const newId = `TEMP${Math.floor(10000 + Math.random() * 90000)}`;
    const newCommission: Commission = {
      id: newId,
      ...formData,
      status: 'submitted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    try {
      await setDoc(doc(db, 'commissions', newId), newCommission);
      setTempId(newId);
      setFormStep(3);
      toast.success('訂單已送出！');
    } catch (error: any) {
      console.error(error);
      toast.error('送出失敗: ' + error.message);
    }
  };

  const handleSearch = async () => {
    if (!searchId) return;
    try {
      // 1. Try searching by document ID (TEMP...)
      const docRef = doc(db, 'commissions', searchId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setTrackedCommission({ id: docSnap.id, ...docSnap.data() } as Commission);
        return;
      } 
      
      // 2. Try searching by officialId
      const q = query(collection(db, 'commissions'), where('officialId', '==', searchId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        setTrackedCommission({ id: docSnap.id, ...docSnap.data() } as Commission);
        return;
      }

      toast.error('找不到該訂單編號');
      setTrackedCommission(null);
      
    } catch (error: any) {
      console.error(error);
      toast.error('查詢失敗: ' + error.message);
      setTrackedCommission(null);
    }
  };

  const updateCommissionStatus = async (id: string, status: CommissionStatus) => {
    try {
      await updateDoc(doc(db, 'commissions', id), {
        status,
        updatedAt: new Date().toISOString()
      });
      toast.success('狀態已更新');
    } catch (error: any) {
      console.error(error);
      toast.error('更新失敗: ' + error.message);
    }
  };

  const updateCommissionOfficialId = async (id: string, officialId: string) => {
    try {
      await updateDoc(doc(db, 'commissions', id), {
        officialId,
        updatedAt: new Date().toISOString()
      });
      toast.success('正式編號已更新');
    } catch (error: any) {
      console.error(error);
      toast.error('更新失敗: ' + error.message);
    }
  };

  const deleteCommission = async (id: string) => {
    if (window.confirm('確定要刪除此訂單嗎？此操作無法復原。')) {
      try {
        await deleteDoc(doc(db, 'commissions', id));
        toast.success('訂單已刪除');
      } catch (error: any) {
        console.error(error);
        toast.error('刪除失敗: ' + error.message);
      }
    }
  };

  const toggleCommissionOpen = async (open: boolean) => {
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        isCommissionOpen: open
      }, { merge: true });
      toast.success(`委託已${open ? '開啟' : '關閉'}`);
    } catch (error: any) {
      console.error(error);
      toast.error('設定更新失敗: ' + error.message);
    }
  };

  // --- Render Helpers ---
  const renderProgress = (status: CommissionStatus) => {
    const currentIndex = STATUS_NODES.findIndex(n => n.value === status);
    const progressValue = ((currentIndex + 1) / STATUS_NODES.length) * 100;

    return (
      <div className="space-y-8 py-6">
        <Progress value={progressValue} className="h-2" />
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
          {STATUS_NODES.map((node, index) => {
            const isActive = index <= currentIndex;
            const isCurrent = index === currentIndex;
            return (
              <div key={node.value} className="flex flex-col items-center text-center space-y-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                  isActive ? 'bg-primary border-primary text-primary-foreground' : 'border-muted text-muted-foreground'
                } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}>
                  {isActive ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-xs">{index + 1}</span>}
                </div>
                <div className="space-y-1">
                  <p className={`text-xs font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {node.label}
                  </p>
                  {isCurrent && (
                    <motion.p 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] text-primary font-bold uppercase tracking-wider"
                    >
                      Current
                    </motion.p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <Toaster position="top-center" />
      
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center space-x-2 cursor-pointer group"
            onClick={() => setView('home')}
          >
            <Palette className="w-6 h-6 text-primary group-hover:rotate-12 transition-transform" />
            <h1 className="text-xl font-serif italic tracking-widest text-primary">雞的委託網站</h1>
          </div>
          
          <nav className="hidden md:flex items-center space-x-4">
            <button 
              className={`nav-btn ${view === 'info' ? 'nav-btn-active' : ''}`}
              onClick={() => setView('info')}
            >
              委託相關資訊
            </button>
            <button 
              className={`nav-btn ${view === 'portfolio' ? 'nav-btn-active' : ''}`}
              onClick={() => setView('portfolio')}
            >
              作品集串
            </button>
            <button 
              className={`nav-btn ${view === 'track' ? 'nav-btn-active' : ''}`}
              onClick={() => setView('track')}
            >
              委託進度追蹤
            </button>
            <button 
              className={`nav-btn ${view === 'form' ? 'nav-btn-active' : ''}`}
              onClick={() => setView('form')}
            >
              訂單填寫
            </button>
          </nav>

          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setView('admin')}>
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <AnimatePresence mode="wait">
          
          {/* --- HOME VIEW --- */}
          {view === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-16 text-center"
            >
              <div className="flex flex-col items-center space-y-6">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20">
                  <img src="https://images.plurk.com/6n9CHvFzZvfEtdFFJHFRVq.png" alt="Artist Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold tracking-tighter text-primary">雞</h2>
                  <p className="text-muted-foreground">歡迎來到我的委託頁面，可透過下方連結與我聯繫。</p>
                </div>
                <div className="flex space-x-4">
                  <Button variant="outline" className="rounded-full border-primary/20 hover:border-primary/50" onClick={() => window.open('https://www.facebook.com/ferrian.hanst.5/', '_blank')}>
                    Facebook
                  </Button>
                  <Button variant="outline" className="rounded-full border-primary/20 hover:border-primary/50" onClick={() => window.open('https://www.plurk.com/cigg233', '_blank')}>
                    Plurk
                  </Button>
                  <Button variant="outline" className="rounded-full border-primary/20 hover:border-primary/50" onClick={() => window.open('https://www.pixiv.net/users/17445356', '_blank')}>
                    Pixiv
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card 
                  className={`group cursor-pointer hover:shadow-2xl transition-all border border-border bg-card/50 ${!isCommissionOpen ? 'opacity-70 grayscale' : 'hover:border-primary/50'}`}
                  onClick={() => isCommissionOpen && setView('form')}
                >
                  <CardHeader className="space-y-4">
                    <div className="w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                      <FileText className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-2xl text-primary">訂單填寫</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {isCommissionOpen ? '開始您的委託申請流程' : '目前暫停接單中'}
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card 
                  className="group cursor-pointer hover:shadow-2xl transition-all border border-border bg-card/50 hover:border-primary/50"
                  onClick={() => setView('track')}
                >
                  <CardHeader className="space-y-4">
                    <div className="w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                      <Search className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-2xl text-primary">委託進度追蹤</CardTitle>
                    <CardDescription className="text-muted-foreground">輸入編號隨時查看畫作狀態</CardDescription>
                  </CardHeader>
                </Card>

                <Card 
                  className="group cursor-pointer hover:shadow-2xl transition-all border border-border bg-card/50 hover:border-primary/50"
                  onClick={() => setView('portfolio')}
                >
                  <CardHeader className="space-y-4">
                    <div className="w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-2xl text-primary">作品集串</CardTitle>
                    <CardDescription className="text-muted-foreground">瀏覽過往的精彩創作與風格</CardDescription>
                  </CardHeader>
                </Card>

                <Card 
                  className="group cursor-pointer hover:shadow-2xl transition-all border border-border bg-card/50 hover:border-primary/50"
                  onClick={() => setView('info')}
                >
                  <CardHeader className="space-y-4">
                    <div className="w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                      <Info className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-2xl text-primary">委託相關資訊</CardTitle>
                    <CardDescription className="text-muted-foreground">閱讀注意事項、流程與價目表</CardDescription>
                  </CardHeader>
                </Card>
              </div>

              {!isCommissionOpen && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl inline-flex items-center space-x-2 text-destructive">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">目前暫停接單中，歡迎追蹤進度或瀏覽作品。</span>
                </div>
              )}
            </motion.div>
          )}

          {/* --- FORM VIEW --- */}
          {view === 'form' && (
            <motion.div 
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              {!isCommissionOpen ? (
                <Card className="text-center py-12">
                  <CardContent className="space-y-4">
                    <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold">目前暫停接單中</h2>
                    <p className="text-muted-foreground">
                      很抱歉，目前委託已經關閉，無法填寫新訂單。請留意後續開放公告。
                    </p>
                    <Button onClick={() => setView('home')} className="mt-4">返回首頁</Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => setView('home')}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> 返回
                </Button>
                <div className="flex space-x-2">
                  {[1, 2, 3].map(s => (
                    <div key={s} className={`w-8 h-1 rounded-full ${formStep >= s ? 'bg-primary' : 'bg-muted'}`} />
                  ))}
                </div>
              </div>

              {formStep === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-3xl">第一步：注意事項</CardTitle>
                    <CardDescription>
                      在開始填單前，請先閱讀<span onClick={() => setView('info')} className="text-primary hover:underline cursor-pointer font-bold">委託資訊</span>。
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="flex flex-col items-start space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="terms" checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} />
                      <label htmlFor="terms" className="text-sm font-medium leading-none cursor-pointer">
                        我已閱讀並同意委託規範。
                      </label>
                    </div>
                    <Button 
                      className="w-full" 
                      disabled={!agreed}
                      onClick={() => setFormStep(2)}
                    >
                      開始填單 <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {formStep === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-3xl">第二步：填單介面</CardTitle>
                    <CardDescription>請填寫詳細的委託需求。</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>暱稱</Label>
                        <Input 
                          placeholder="如何稱呼您？" 
                          value={formData.nickname}
                          onChange={e => setFormData({...formData, nickname: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>聯絡方式 (Email/Social Media)</Label>
                        <Input 
                          placeholder="方便聯絡您的管道" 
                          value={formData.contact}
                          onChange={e => setFormData({...formData, contact: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>委託標題</Label>
                      <Input 
                        placeholder="例如：我的原創角色委託" 
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label>委託內容</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-xl border border-border">
                        {COMMISSION_TYPES.map(t => (
                          <div key={t.value} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`type-${t.value}`} 
                              checked={formData.types.includes(t.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData({...formData, types: [...formData.types, t.value]});
                                } else {
                                  setFormData({...formData, types: formData.types.filter(type => type !== t.value)});
                                }
                              }}
                            />
                            <label htmlFor={`type-${t.value}`} className="text-sm font-medium leading-none cursor-pointer">
                              {t.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>參考圖連結 (Google Drive/Imgur 等)</Label>
                      <Input 
                        placeholder="請提供參考圖網址" 
                        value={formData.referenceUrl}
                        onChange={e => setFormData({...formData, referenceUrl: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>詳細需求描述 (選填)</Label>
                      <Textarea 
                        placeholder="角色個性、動作、背景需求等..." 
                        className="min-h-[120px]"
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex space-x-4">
                    <Button variant="outline" className="flex-1" onClick={() => setFormStep(1)}>上一步</Button>
                    <Button 
                      className="flex-1" 
                      disabled={!formData.nickname || !formData.contact || !formData.title || formData.types.length === 0}
                      onClick={handleFormSubmit}
                    >
                      提交訂單
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {formStep === 3 && (
                <Card className="text-center py-12">
                  <CardContent className="space-y-6">
                    <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                      <CardTitle className="text-3xl">提交成功！</CardTitle>
                      <p className="text-muted-foreground">已收到您的訂單，確認訂單後會給您一組正式的訂單編號。</p>
                    </div>
                    <div className="p-6 bg-muted rounded-2xl inline-block">
                      <p className="text-sm text-muted-foreground mb-1">您的暫時編號</p>
                      <p className="text-4xl font-mono font-bold tracking-widest text-primary">{tempId}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">請妥善保存此編號，您可以使用它來追蹤初步進度。</p>
                  </CardContent>
                  <CardFooter className="justify-center">
                    <Button onClick={() => setView('home')}>返回主頁</Button>
                  </CardFooter>
                </Card>
              )}
            </>
            )}
            </motion.div>
          )}

          {/* --- TRACK VIEW --- */}
          {view === 'track' && (
            <motion.div 
              key="track"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold">進度追蹤</h2>
                <p className="text-muted-foreground">輸入您的訂單編號（暫時或正式）來查看當前製作狀態。</p>
              </div>

              <div className="flex space-x-2 max-w-md mx-auto">
                <Input 
                  placeholder="輸入編號 (例如: TEMP12345)" 
                  value={searchId}
                  onChange={e => setSearchId(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch}>搜尋</Button>
              </div>

              {trackedCommission ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                <Card className="overflow-hidden border-primary/20 bg-card/80">
                    <CardHeader className="bg-primary/5 border-b border-primary/10">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-2xl text-primary italic">{trackedCommission.title}</CardTitle>
                          <CardDescription className="text-muted-foreground">委託人：{trackedCommission.nickname}</CardDescription>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-mono text-primary/60">編號: {trackedCommission.officialId || trackedCommission.id}</p>
                          <p className="text-xs text-muted-foreground">更新於: {new Date(trackedCommission.updatedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8">
                      {renderProgress(trackedCommission.status)}
                      
                      <Separator className="my-8 opacity-10" />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h4 className="font-serif italic text-primary flex items-center"><FileText className="w-4 h-4 mr-2" /> 委託詳情</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">類型</span>
                              <span className="font-medium text-foreground flex flex-wrap gap-1">
                                {(trackedCommission.types || []).map(typeVal => (
                                  <span key={typeVal} className="badge-pill">
                                    {COMMISSION_TYPES.find(t => t.value === typeVal)?.label}
                                  </span>
                                ))}
                                {/* Fallback for old data */}
                                {!trackedCommission.types && (trackedCommission as any).type && (
                                  <span className="badge-pill">
                                    {COMMISSION_TYPES.find(t => t.value === (trackedCommission as any).type)?.label || (trackedCommission as any).type}
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">當前階段</span>
                              <span className="font-bold text-success">{STATUS_NODES.find(n => n.value === trackedCommission.status)?.label}</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h4 className="font-serif italic text-primary flex items-center"><AlertCircle className="w-4 h-4 mr-2" /> 備註</h4>
                          <p className="text-sm text-muted-foreground italic leading-relaxed">
                            {trackedCommission.description || "無特別描述"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <div className="py-20 text-center text-muted-foreground border-2 border-dashed rounded-3xl">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>請輸入編號進行查詢</p>
                </div>
              )}
            </motion.div>
          )}

          {/* --- INFO VIEW --- */}
          {view === 'info' && (
            <motion.div 
              key="info"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col md:flex-row gap-8"
            >
              {/* Sidebar Navigation */}
              <div className="w-full md:w-64 shrink-0">
                <div className="sticky top-24 space-y-2 bg-card/50 p-4 rounded-2xl border border-border">
                  <h3 className="font-bold text-lg mb-4 px-2 text-primary">導覽</h3>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start hover:bg-primary/10 hover:text-primary"
                    onClick={() => document.getElementById('info-notes')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <Info className="w-4 h-4 mr-2" /> 注意事項
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start hover:bg-primary/10 hover:text-primary"
                    onClick={() => document.getElementById('info-process')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <ListOrdered className="w-4 h-4 mr-2" /> 流程說明
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start hover:bg-primary/10 hover:text-primary"
                    onClick={() => document.getElementById('info-pricing')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <DollarSign className="w-4 h-4 mr-2" /> 價目表
                  </Button>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 space-y-16 pb-16">
                
                {/* Notes Section */}
                <section id="info-notes" className="space-y-6 scroll-mt-24">
                  <div className="flex items-center space-x-3 border-b border-border pb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Info className="w-5 h-5" />
                    </div>
                    <h2 className="text-3xl font-bold">注意事項</h2>
                  </div>
                  <Card className="bg-card/50 border-border">
                    <CardContent className="p-6 space-y-6">
                      <div className="space-y-2">
                        <h4 className="font-bold text-primary flex items-center"><ChevronRight className="w-4 h-4 mr-1" /> 承接範圍</h4>
                        <p className="text-muted-foreground pl-5">R18G、原創、二創、夢向。</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-bold text-primary flex items-center"><ChevronRight className="w-4 h-4 mr-1" /> 婉拒內容</h4>
                        <p className="text-muted-foreground pl-5">古風設定、急件、禁止營利之二創作品。</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-bold text-primary flex items-center"><ChevronRight className="w-4 h-4 mr-1" /> 授權範圍</h4>
                        <p className="text-muted-foreground pl-5">僅供個人收藏、社群頭像、個人社交平台展示使用。嚴禁轉作商業用途（如：印製販售、作為產品商標、集資贈品等）。</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-bold text-primary flex items-center"><ChevronRight className="w-4 h-4 mr-1" /> 作品版權</h4>
                        <p className="text-muted-foreground pl-5">著作權歸創作者（乙方）所有。作品完稿後將收錄於個人作品集或公開展示，若需保密或不公開，請務必提前告知。</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-bold text-primary flex items-center"><ChevronRight className="w-4 h-4 mr-1" /> 商業委託</h4>
                        <p className="text-muted-foreground pl-5">費用以「非商委定價 × 2」起算，授權範圍將另行議定。</p>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                {/* Process Section */}
                <section id="info-process" className="space-y-6 scroll-mt-24">
                  <div className="flex items-center space-x-3 border-b border-border pb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <ListOrdered className="w-5 h-5" />
                    </div>
                    <h2 className="text-3xl font-bold">委託流程</h2>
                  </div>
                  
                  <div className="relative pl-8 space-y-8 before:absolute before:inset-y-0 before:left-[15px] before:w-0.5 before:bg-border">
                    <div className="relative">
                      <div className="absolute -left-10 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold ring-4 ring-background">1</div>
                      <h4 className="font-bold text-lg mb-2">填寫訂單</h4>
                      <p className="text-muted-foreground">請填寫資料與聯絡方式。確認訂單後將主動聯繫；若私訊後 7 日內未收到回覆，將自動取消訂單。</p>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-10 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold ring-4 ring-background">2</div>
                      <h4 className="font-bold text-lg mb-2">估價與匯款</h4>
                      <p className="text-muted-foreground">內容確認無誤後提供報價。請於 <strong className="text-foreground">全額支付</strong> 後完成排單，正式工期展開。</p>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-10 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold ring-4 ring-background">3</div>
                      <h4 className="font-bold text-lg mb-2">進度追蹤</h4>
                      <p className="text-muted-foreground">工期約為 30 個工作天（自匯款完成日起算）。甲方可憑「訂單編號」隨時追蹤進度。</p>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-10 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold ring-4 ring-background">4</div>
                      <h4 className="font-bold text-lg mb-2">草稿確認</h4>
                      <p className="text-muted-foreground">提供 2 次 修改。超過次數或涉及大幅度結構修改，將依情況額外酌收費用並事先告知。</p>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-10 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold ring-4 ring-background">5</div>
                      <h4 className="font-bold text-lg mb-2">完稿交案</h4>
                      <p className="text-muted-foreground">完稿後提供預覽圖查閱，確認無誤後交付 雲端硬碟下載連結。</p>
                    </div>
                  </div>

                  <div className="mt-8 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive space-y-2">
                    <div className="flex items-center font-bold">
                      <AlertCircle className="w-5 h-5 mr-2" /> 終止交易與退款說明
                    </div>
                    <p className="text-sm leading-relaxed">
                      若於草稿階段雙方溝通無法達成一致（如多次修改仍未達要求），將收取 50% 完稿費用，並退還剩餘款項。事後委託方（甲方）可保留並使用該草稿，或交由其他繪師接續完成。
                    </p>
                  </div>
                </section>

                {/* Pricing Section */}
                <section id="info-pricing" className="space-y-6 scroll-mt-24">
                  <div className="flex items-center space-x-3 border-b border-border pb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <h2 className="text-3xl font-bold">價目表</h2>
                  </div>
                  <p className="text-muted-foreground">非商業用途參考。實際費用將依據角色複雜度、背景精細度進行最終報價。</p>
                  
                  <div className="rounded-xl border border-border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="w-[30%]">項目類型</TableHead>
                          <TableHead>單人</TableHead>
                          <TableHead>雙人</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">半身 (腰部/大腿)</TableCell>
                          <TableCell>$3,000+ / 含背景$4,000+</TableCell>
                          <TableCell>$6,000+ / 含背景$7,000+</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">全身 (足部/小腿)</TableCell>
                          <TableCell>$5,500+ / 含背景$6,500+</TableCell>
                          <TableCell>$10,000+ / 含背景$11,000+</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="flex items-center p-4 bg-muted rounded-xl text-sm">
                    <Plus className="w-4 h-4 mr-2 text-primary" />
                    <span className="font-bold mr-2">加購:</span> 角色追加：$3,000 起 / 位
                  </div>
                </section>

              </div>
            </motion.div>
          )}

          {/* --- PORTFOLIO VIEW --- */}
          {view === 'portfolio' && (
            <motion.div 
              key="portfolio"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              {portfolioView === 'albums' ? (
                <>
                  <div className="text-center space-y-4">
                    <h2 className="text-4xl font-bold">作品集串</h2>
                    <p className="text-muted-foreground">請選擇您想瀏覽的相簿分類。</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* General Album */}
                    <Card 
                      className="group cursor-pointer overflow-hidden border-border hover:border-primary/50 transition-all"
                      onClick={() => setPortfolioView('general')}
                    >
                      <div className="aspect-video relative overflow-hidden bg-muted">
                        <img src={generalImages[0]} alt="一般委託展示" className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                      </div>
                      <CardHeader>
                        <CardTitle className="text-2xl text-center">一般委託展示</CardTitle>
                      </CardHeader>
                    </Card>

                    {/* R18G Album */}
                    <Card 
                      className="group cursor-pointer overflow-hidden border-border hover:border-destructive/50 transition-all"
                      onClick={() => setShowR18GWarning(true)}
                    >
                      <div className="aspect-video relative overflow-hidden bg-muted">
                        <img src={r18gImages[0]} alt="R18G委託展示" className="object-cover w-full h-full blur-xl group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <AlertCircle className="w-12 h-12 text-destructive opacity-80" />
                        </div>
                      </div>
                      <CardHeader>
                        <CardTitle className="text-2xl text-center text-destructive">R18G委託展示</CardTitle>
                      </CardHeader>
                    </Card>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={() => setPortfolioView('albums')}>
                      <ArrowLeft className="w-4 h-4 mr-2" /> 返回相簿列表
                    </Button>
                    <h2 className="text-2xl font-bold">
                      {portfolioView === 'general' ? '一般委託展示' : 'R18G委託展示'}
                    </h2>
                    <div className="w-32" /> {/* Spacer for centering */}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(portfolioView === 'general' ? generalImages : r18gImages).map((src, i) => (
                      <motion.div 
                        key={i}
                        whileHover={{ y: -10 }}
                        className="group relative aspect-[3/4] rounded-3xl overflow-hidden bg-muted cursor-pointer"
                        onClick={() => setSelectedImage(src)}
                      >
                        <img 
                          src={src} 
                          alt={`Artwork ${i + 1}`}
                          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                      </motion.div>
                    ))}
                  </div>
                </>
              )}

              {/* R18G Warning Dialog */}
              <Dialog open={showR18GWarning} onOpenChange={setShowR18GWarning}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-destructive flex items-center text-2xl">
                      <AlertCircle className="w-6 h-6 mr-2" /> 內容警告
                    </DialogTitle>
                    <DialogDescription className="text-base pt-4">
                      本相簿包含血腥、暴力等 R18G 內容。<br/><br/>
                      未滿 18 歲，或對此類內容感到不適者，請勿點擊確認。您確定要繼續瀏覽嗎？
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex space-x-4 mt-6">
                    <Button variant="outline" className="flex-1" onClick={() => setShowR18GWarning(false)}>
                      取消返回
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => {
                      setShowR18GWarning(false);
                      setPortfolioView('r18g');
                    }}>
                      確認進入
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Fullscreen Image Lightbox */}
              <AnimatePresence>
                {selectedImage && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 cursor-zoom-out"
                    onClick={() => setSelectedImage(null)}
                  >
                    <motion.img
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.9 }}
                      src={selectedImage}
                      alt="Full size artwork"
                      className="max-w-full max-h-full object-contain cursor-default rounded-md shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                      referrerPolicy="no-referrer"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full"
                      onClick={() => setSelectedImage(null)}
                    >
                      <X className="w-6 h-6" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          )}

          {/* --- ADMIN VIEW --- */}
          {view === 'admin' && (
            <motion.div 
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto space-y-8"
            >
              {!isAdmin ? (
                <Card className="max-w-md mx-auto mt-20">
                  <CardHeader>
                    <CardTitle className="text-center">管理員登入</CardTitle>
                    <CardDescription className="text-center">請使用授權的 Google 帳號登入以存取後台</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center space-y-4">
                    {user && !isAdmin && (
                      <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md text-center">
                        目前登入的帳號 ({user.email}) 沒有管理員權限。
                      </div>
                    )}
                    <Button onClick={handleGoogleLogin} className="w-full">
                      使用 Google 登入
                    </Button>
                    {user && (
                      <Button variant="outline" onClick={handleLogout} className="w-full">
                        登出當前帳號
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h2 className="text-3xl font-bold">後台管理系統</h2>
                      <p className="text-muted-foreground">管理所有委託訂單與全域設定。</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 bg-muted p-2 rounded-lg px-4">
                        <Label htmlFor="open-toggle" className="text-sm font-medium">委託狀態</Label>
                        <Switch 
                          id="open-toggle" 
                          checked={isCommissionOpen}
                          onCheckedChange={toggleCommissionOpen}
                        />
                        <span className="text-xs font-bold uppercase">
                          {isCommissionOpen ? 'Open' : 'Closed'}
                        </span>
                      </div>
                      <Button variant="outline" onClick={handleLogout}>登出</Button>
                    </div>
                  </div>

                  <Tabs defaultValue="orders" className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                      <TabsTrigger value="orders">訂單列表</TabsTrigger>
                      <TabsTrigger value="settings">全域設定</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="orders" className="space-y-4 mt-6">
                      <Card>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>編號</TableHead>
                              <TableHead>委託人</TableHead>
                              <TableHead>標題</TableHead>
                              <TableHead>類型</TableHead>
                              <TableHead>當前狀態</TableHead>
                              <TableHead className="text-right">操作</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {commissions.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                  目前尚無訂單
                                </TableCell>
                              </TableRow>
                            ) : (
                              commissions.map((c) => (
                                <TableRow key={c.id}>
                                  <TableCell className="font-mono text-xs">
                                    {c.officialId ? (
                                      <span className="text-primary font-bold">{c.officialId}</span>
                                    ) : (
                                      <span className="text-muted-foreground">{c.id}</span>
                                    )}
                                  </TableCell>
                                  <TableCell>{c.nickname}</TableCell>
                                  <TableCell className="font-medium">{c.title}</TableCell>
                                  <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                      {(c.types || []).map(typeVal => (
                                        <span key={typeVal} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                          {COMMISSION_TYPES.find(t => t.value === typeVal)?.label}
                                        </span>
                                      ))}
                                      {/* Fallback for old data */}
                                      {!c.types && (c as any).type && (
                                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                          {COMMISSION_TYPES.find(t => t.value === (c as any).type)?.label || (c as any).type}
                                        </span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Select 
                                      value={c.status} 
                                      onValueChange={(v) => updateCommissionStatus(c.id, v as CommissionStatus)}
                                    >
                                      <SelectTrigger className="h-8 w-[120px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {STATUS_NODES.map(n => (
                                          <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end space-x-2">
                                      <Dialog>
                                        <DialogTrigger render={<Button variant="ghost" size="icon" onClick={() => setEditingCommission(c)} />}>
                                          <FileText className="w-4 h-4" />
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl">
                                          <DialogHeader>
                                            <DialogTitle>訂單詳情: {c.title}</DialogTitle>
                                            <DialogDescription>查看並編輯訂單細節</DialogDescription>
                                          </DialogHeader>
                                          <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-2 gap-4">
                                              <div className="space-y-2">
                                                <Label>正式編號</Label>
                                                <Input 
                                                  defaultValue={c.officialId || ''} 
                                                  placeholder="例如: COM-001"
                                                  onBlur={(e) => updateCommissionOfficialId(c.id, e.target.value)}
                                                />
                                              </div>
                                              <div className="space-y-2">
                                                <Label>聯絡方式</Label>
                                                <Input value={c.contact} readOnly className="bg-muted" />
                                              </div>
                                            </div>
                                            <div className="space-y-2">
                                              <Label>參考圖連結</Label>
                                              <div className="flex space-x-2">
                                                <Input value={c.referenceUrl || ''} readOnly className="bg-muted" />
                                                {c.referenceUrl && (
                                                  <Button variant="outline" size="icon" asChild>
                                                    <a href={c.referenceUrl} target="_blank" rel="noreferrer">
                                                      <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                  </Button>
                                                )}
                                              </div>
                                            </div>
                                            <div className="space-y-2">
                                              <Label>需求描述</Label>
                                              <Textarea value={c.description || ''} readOnly className="bg-muted min-h-[100px]" />
                                            </div>
                                          </div>
                                        </DialogContent>
                                      </Dialog>
                                      
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => deleteCommission(c.id)}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </Card>
                    </TabsContent>

                    <TabsContent value="settings" className="mt-6">
                      <Card className="max-w-md">
                        <CardHeader>
                          <CardTitle>系統設定</CardTitle>
                          <CardDescription>管理全域系統參數</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>開啟委託單</Label>
                              <p className="text-xs text-muted-foreground">控制前台是否可以填寫新訂單</p>
                            </div>
                            <Switch 
                              checked={isCommissionOpen}
                              onCheckedChange={toggleCommissionOpen}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <footer className="border-t border-border py-8 bg-card/30 text-muted-foreground">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <div>&copy; 2024 Luna Arcanum Artworks. All Rights Reserved.</div>
          <div className="flex gap-6 items-center">
            <span className="cursor-pointer hover:text-primary transition-colors">Privacy Policy</span>
            <span className="cursor-pointer hover:text-primary transition-colors">Terms of Service</span>
            <span 
              className="text-primary cursor-pointer hover:underline font-bold"
              onClick={() => setView('admin')}
            >
              Admin Login
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
