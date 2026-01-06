
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  ClipboardCheck, 
  FileBarChart, 
  Menu,
  X,
  UserCircle,
  RefreshCw,
  AlertTriangle,
  Database
} from 'lucide-react';
import { ViewState, ClassRoom, Student, Subject, AttendanceRecord } from './types';
import { supabase } from './lib/supabase';
import Dashboard from './components/Dashboard';
import ClassManagement from './components/ClassManagement';
import SubjectManagement from './components/SubjectManagement';
import AttendanceEntry from './components/AttendanceEntry';
import RecapModule from './components/RecapModule';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  const fetchData = async () => {
    setIsLoading(true);
    setDbError(null);
    try {
      // Menjalankan semua request secara paralel untuk kecepatan maksimal
      const [
        { data: cls, error: clsErr },
        { data: std, error: stdErr },
        { data: sub, error: subErr },
        { data: att, error: attErr }
      ] = await Promise.all([
        supabase.from('classes').select('*'),
        supabase.from('students').select('*'),
        supabase.from('subjects').select('*'),
        supabase.from('attendance').select('*')
      ]);

      // Tangani error dari Supabase
      if (clsErr || stdErr || subErr || attErr) {
        const anyError = clsErr || stdErr || subErr || attErr;
        console.error('Database Error:', anyError);
        
        if (anyError?.code === '42P01') {
          setDbError("Tabel database belum ditemukan. Pastikan Anda sudah menjalankan script SQL di Dashboard Supabase.");
        } else {
          setDbError(`Gagal mengambil data: ${anyError?.message || 'Unknown Error'}`);
        }
        setIsLoading(false);
        return;
      }

      if (cls) setClasses(cls);
      if (std) setStudents(std);
      if (sub) setSubjects(sub);
      if (att) setAttendance(att);
      
    } catch (error: any) {
      console.error('Network/App Error:', error);
      setDbError("Gagal terhubung ke server. Periksa koneksi internet atau konfigurasi API Key.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const navItems = [
    { id: 'DASHBOARD' as ViewState, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'MANAGEMENT_CLASS' as ViewState, label: 'Manajemen Kelas', icon: Users },
    { id: 'MANAGEMENT_SUBJECT' as ViewState, label: 'Mata Pelajaran', icon: BookOpen },
    { id: 'ATTENDANCE' as ViewState, label: 'Presensi Siswa', icon: ClipboardCheck },
    { id: 'RECAP' as ViewState, label: 'Rekap Semester', icon: FileBarChart },
  ];

  const renderView = () => {
    if (dbError) {
      return (
        <div className="h-[60vh] flex flex-col items-center justify-center p-8 bg-white rounded-2xl border-2 border-dashed border-red-100 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Masalah Aplikasi</h3>
          <p className="text-slate-500 max-w-md mb-6">{dbError}</p>
          <button 
            onClick={fetchData}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold flex items-center space-x-2 hover:bg-indigo-700 transition-all shadow-lg"
          >
            <RefreshCw size={18} />
            <span>Coba Lagi</span>
          </button>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
          <div className="relative">
             <RefreshCw className="animate-spin text-indigo-600" size={48} />
             <Database className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-300" size={16} />
          </div>
          <p className="text-slate-500 font-medium animate-pulse">Menghubungkan ke Supabase Cloud...</p>
        </div>
      );
    }

    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard students={students} classes={classes} subjects={subjects} attendance={attendance} setAttendance={setAttendance} />;
      case 'MANAGEMENT_CLASS':
        return <ClassManagement classes={classes} setClasses={setClasses} students={students} setStudents={setStudents} />;
      case 'MANAGEMENT_SUBJECT':
        return <SubjectManagement subjects={subjects} setSubjects={setSubjects} />;
      case 'ATTENDANCE':
        return <AttendanceEntry classes={classes} students={students} subjects={subjects} attendance={attendance} setAttendance={setAttendance} />;
      case 'RECAP':
        return <RecapModule classes={classes} students={students} subjects={subjects} attendance={attendance} />;
      default:
        return <Dashboard students={students} classes={classes} subjects={subjects} attendance={attendance} setAttendance={setAttendance} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 ease-in-out bg-indigo-900 text-white flex flex-col fixed inset-y-0 left-0 z-50 shadow-xl`}>
        <div className="h-16 flex items-center justify-between px-6 bg-indigo-950">
          {sidebarOpen && <span className="text-xl font-bold tracking-tight">AbsensiPintar</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg bg-indigo-800 hover:bg-indigo-700 transition-colors">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 mt-6 px-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 ${
                currentView === item.id ? 'bg-indigo-700 text-white shadow-lg' : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
              }`}
            >
              <item.icon size={22} className={sidebarOpen ? 'mr-3' : 'mx-auto'} />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-indigo-800">
          <div className={`flex items-center ${sidebarOpen ? 'space-x-3' : 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center border border-indigo-400">
              <UserCircle size={24} />
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate">Administrator</p>
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                  <p className="text-[10px] text-indigo-300 uppercase font-bold tracking-widest">Online</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800">
            {navItems.find(i => i.id === currentView)?.label}
          </h2>
          <div className="flex items-center space-x-4">
            <button onClick={fetchData} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="Sinkronisasi Ulang">
              <RefreshCw size={20} className={isLoading ? 'animate-spin text-indigo-500' : ''} />
            </button>
            <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
            <span className="text-sm font-medium text-slate-600 hidden sm:block">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
