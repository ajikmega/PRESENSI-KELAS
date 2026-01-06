
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  ClipboardCheck, 
  FileBarChart, 
  Menu,
  X,
  Bell,
  UserCircle
} from 'lucide-react';
import { ViewState, ClassRoom, Student, Subject, AttendanceRecord, AttendanceStatus } from './types';
import Dashboard from './components/Dashboard';
import ClassManagement from './components/ClassManagement';
import SubjectManagement from './components/SubjectManagement';
import AttendanceEntry from './components/AttendanceEntry';
import RecapModule from './components/RecapModule';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // App State (In real world this would be from an API)
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  // Load initial data from localStorage
  useEffect(() => {
    const savedClasses = localStorage.getItem('abs_classes');
    const savedStudents = localStorage.getItem('abs_students');
    const savedSubjects = localStorage.getItem('abs_subjects');
    const savedAttendance = localStorage.getItem('abs_attendance');

    if (savedClasses) setClasses(JSON.parse(savedClasses));
    if (savedStudents) setStudents(JSON.parse(savedStudents));
    if (savedSubjects) setSubjects(JSON.parse(savedSubjects));
    if (savedAttendance) setAttendance(JSON.parse(savedAttendance));
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('abs_classes', JSON.stringify(classes));
    localStorage.setItem('abs_students', JSON.stringify(students));
    localStorage.setItem('abs_subjects', JSON.stringify(subjects));
    localStorage.setItem('abs_attendance', JSON.stringify(attendance));
  }, [classes, students, subjects, attendance]);

  const navItems = [
    { id: 'DASHBOARD' as ViewState, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'MANAGEMENT_CLASS' as ViewState, label: 'Manajemen Kelas', icon: Users },
    { id: 'MANAGEMENT_SUBJECT' as ViewState, label: 'Mata Pelajaran', icon: BookOpen },
    { id: 'ATTENDANCE' as ViewState, label: 'Presensi Siswa', icon: ClipboardCheck },
    { id: 'RECAP' as ViewState, label: 'Rekap Semester', icon: FileBarChart },
  ];

  const renderView = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return (
          <Dashboard 
            students={students} 
            classes={classes} 
            subjects={subjects} 
            attendance={attendance} 
            setAttendance={setAttendance}
          />
        );
      case 'MANAGEMENT_CLASS':
        return (
          <ClassManagement 
            classes={classes} 
            setClasses={setClasses} 
            students={students} 
            setStudents={setStudents} 
          />
        );
      case 'MANAGEMENT_SUBJECT':
        return <SubjectManagement subjects={subjects} setSubjects={setSubjects} />;
      case 'ATTENDANCE':
        return (
          <AttendanceEntry 
            classes={classes} 
            students={students} 
            subjects={subjects} 
            attendance={attendance} 
            setAttendance={setAttendance}
          />
        );
      case 'RECAP':
        return <RecapModule classes={classes} students={students} subjects={subjects} attendance={attendance} />;
      default:
        return (
          <Dashboard 
            students={students} 
            classes={classes} 
            subjects={subjects} 
            attendance={attendance} 
            setAttendance={setAttendance}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside 
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } transition-all duration-300 ease-in-out bg-indigo-900 text-white flex flex-col fixed inset-y-0 left-0 z-50`}
      >
        <div className="h-16 flex items-center justify-between px-6 bg-indigo-950">
          {sidebarOpen && <span className="text-xl font-bold tracking-tight">AbsensiPintar</span>}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg bg-indigo-800 hover:bg-indigo-700 transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 mt-6 px-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 ${
                currentView === item.id 
                  ? 'bg-indigo-700 text-white shadow-lg' 
                  : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
              }`}
            >
              <item.icon size={22} className={sidebarOpen ? 'mr-3' : 'mx-auto'} />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-indigo-800">
          <div className={`flex items-center ${sidebarOpen ? 'space-x-3' : 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
              <UserCircle size={24} />
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate">Administrator</p>
                <p className="text-xs text-indigo-300 truncate">admin@sekolah.id</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
          <h2 className="text-xl font-semibold text-slate-800">
            {navItems.find(i => i.id === currentView)?.label}
          </h2>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-slate-500 hover:text-indigo-600 relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
            <span className="text-sm font-medium text-slate-600">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </header>

        {/* View Container */}
        <div className="p-8 max-w-7xl mx-auto">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
