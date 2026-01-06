
import React, { useState } from 'react';
import { Plus, Trash2, FileUp, Info, ChevronRight, Search, Users, UserPlus, X, Check, RefreshCw, Download } from 'lucide-react';
import { ClassRoom, Student } from '../types';
import { supabase } from '../lib/supabase';

interface ClassManagementProps {
  classes: ClassRoom[];
  setClasses: React.Dispatch<React.SetStateAction<ClassRoom[]>>;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
}

const ClassManagement: React.FC<ClassManagementProps> = ({ classes, setClasses, students, setStudents }) => {
  const [newClassName, setNewClassName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [showAddManual, setShowAddManual] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualNisn, setManualNisn] = useState('');

  const addClass = async () => {
    if (!newClassName.trim()) return;
    setIsProcessing(true);
    
    const newClass = { id: Date.now().toString(), name: newClassName };
    
    const { error } = await supabase.from('classes').insert([newClass]);
    
    if (!error) {
      setClasses([...classes, newClass]);
      setNewClassName('');
    } else {
      alert('Gagal menambah kelas ke database: ' + error.message);
    }
    setIsProcessing(false);
  };

  const deleteClass = async (id: string) => {
    if (confirm('Hapus kelas ini? Semua data siswa di dalamnya juga akan terhapus di database.')) {
      setIsProcessing(true);
      const { error } = await supabase.from('classes').delete().eq('id', id);
      
      if (!error) {
        setClasses(classes.filter(c => c.id !== id));
        setStudents(students.filter(s => s.classId !== id));
        if (selectedClassId === id) setSelectedClassId(null);
      } else {
        alert('Gagal menghapus kelas: ' + error.message);
      }
      setIsProcessing(false);
    }
  };

  const addStudentManual = async () => {
    if (!manualName.trim() || !manualNisn.trim() || !selectedClassId) return;
    setIsProcessing(true);
    
    const newStudent = {
      id: `man-${Date.now()}`,
      nisn: manualNisn,
      name: manualName,
      classId: selectedClassId,
    };
    
    const { error } = await supabase.from('students').insert([newStudent]);
    
    if (!error) {
      setStudents(prev => [...prev, newStudent]);
      setManualName('');
      setManualNisn('');
      setShowAddManual(false);
    } else {
      alert('Gagal menyimpan siswa: ' + error.message);
    }
    setIsProcessing(false);
  };

  const deleteStudent = async (studentId: string) => {
    setIsProcessing(true);
    const { error } = await supabase.from('students').delete().eq('id', studentId);
    if (!error) {
      setStudents(students.filter(s => s.id !== studentId));
    }
    setIsProcessing(false);
  };

  const downloadTemplate = () => {
    const templateData = [
      { NISN: '1234567890', Nama: 'Budi Santoso' },
      { NISN: '0987654321', Nama: 'Ani Wijaya' }
    ];
    
    // @ts-ignore
    const ws = XLSX.utils.json_to_sheet(templateData);
    // @ts-ignore
    const wb = XLSX.utils.book_new();
    // @ts-ignore
    XLSX.utils.book_append_sheet(wb, ws, "Daftar Siswa");
    // @ts-ignore
    XLSX.writeFile(wb, "Template_Import_Siswa.xlsx");
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>, classId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        // @ts-ignore
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        // @ts-ignore
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          alert('File Excel kosong atau tidak sesuai format.');
          setIsProcessing(false);
          return;
        }

        const importedStudents: Student[] = data.map((item: any, index: number) => ({
          id: `imp-${Date.now()}-${index}`,
          nisn: String(item.NISN || item.nisn || item['Nomor Induk'] || ''),
          name: item.Nama || item.nama || item.Name || 'Siswa Baru',
          classId: classId,
        })).filter(s => s.name && s.nisn);

        const { error } = await supabase.from('students').insert(importedStudents);
        
        if (!error) {
          setStudents(prev => [...prev, ...importedStudents]);
          alert(`Berhasil mengimpor ${importedStudents.length} siswa.`);
        } else {
          alert('Gagal impor ke database: ' + error.message);
        }
      } catch (error) {
        console.error(error);
        alert('Gagal membaca file Excel.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; 
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const filteredStudents = students.filter(s => 
    s.classId === selectedClassId && 
    (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.nisn.includes(searchTerm))
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
      {isProcessing && (
        <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center backdrop-blur-[1px] rounded-xl">
          <RefreshCw className="animate-spin text-indigo-600" size={32} />
        </div>
      )}
      
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Tambah Kelas</h3>
          <div className="flex space-x-2">
            <input 
              type="text" 
              placeholder="Contoh: XII RPL 1" 
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addClass()}
            />
            <button onClick={addClass} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <Plus size={20} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-semibold text-slate-700">Daftar Kelas ({classes.length})</h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {classes.length === 0 ? (
              <div className="p-8 text-center text-slate-400">Belum ada kelas</div>
            ) : (
              classes.map(cls => (
                <div 
                  key={cls.id} 
                  className={`group p-4 flex items-center justify-between cursor-pointer transition-colors ${selectedClassId === cls.id ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                  onClick={() => setSelectedClassId(cls.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-8 rounded-full ${selectedClassId === cls.id ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
                    <div>
                      <h4 className={`font-medium ${selectedClassId === cls.id ? 'text-indigo-700' : 'text-slate-700'}`}>{cls.name}</h4>
                      <p className="text-xs text-slate-500">{students.filter(s => s.classId === cls.id).length} Siswa</p>
                    </div>
                  </div>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); deleteClass(cls.id); }} className="p-1.5 text-slate-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                    <ChevronRight size={18} className="text-slate-300 ml-2" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-8">
        {!selectedClassId ? (
          <div className="h-[70vh] flex flex-col items-center justify-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
            <Users size={48} className="mb-4 opacity-20" />
            <p className="text-lg">Pilih kelas untuk melihat daftar siswa</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[70vh]">
            <div className="p-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{selectedClass?.name}</h3>
                <p className="text-sm text-slate-500">{filteredStudents.length} Siswa ditemukan</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={downloadTemplate}
                  className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm"
                  title="Unduh Format Excel"
                >
                  <Download size={18} />
                  <span className="hidden sm:inline">Template</span>
                </button>
                <button 
                  onClick={() => setShowAddManual(!showAddManual)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${showAddManual ? 'bg-slate-200 text-slate-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                >
                  {showAddManual ? <X size={18} /> : <UserPlus size={18} />}
                  <span>{showAddManual ? 'Batal' : 'Tambah'}</span>
                </button>
                <label className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer text-sm font-medium shadow-sm">
                  <FileUp size={18} />
                  <span>Impor Excel</span>
                  <input type="file" accept=".xlsx, .xls" className="hidden" onChange={(e) => handleExcelUpload(e, selectedClassId)} />
                </label>
              </div>
            </div>

            {showAddManual && (
              <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex flex-wrap items-end gap-4 animate-in slide-in-from-top-2">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-bold text-indigo-700 uppercase mb-1">Nama Siswa</label>
                  <input type="text" className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm" placeholder="Nama Lengkap" value={manualName} onChange={(e) => setManualName(e.target.value)} />
                </div>
                <div className="w-48">
                  <label className="block text-xs font-bold text-indigo-700 uppercase mb-1">NISN</label>
                  <input type="text" className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm" placeholder="Nomor Induk" value={manualNisn} onChange={(e) => setManualNisn(e.target.value)} />
                </div>
                <button onClick={addStudentManual} disabled={!manualName.trim() || !manualNisn.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-bold flex items-center space-x-2 disabled:bg-indigo-300">
                  <Check size={18} />
                  <span>Simpan</span>
                </button>
              </div>
            )}

            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Cari Nama atau NISN..." className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="ml-4 flex items-center text-slate-400 text-xs">
                <Info size={14} className="mr-1" />
                Kolom Excel: NISN, Nama
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase w-20">No</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">NISN</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Nama Lengkap</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">Belum ada siswa di kelas ini.</td></tr>
                  ) : (
                    filteredStudents.map((student, idx) => (
                      <tr key={student.id} className="hover:bg-slate-50 group">
                        <td className="px-6 py-4 text-sm text-slate-600">{idx + 1}</td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-600">{student.nisn}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-800">{student.name}</td>
                        <td className="px-6 py-4 text-sm text-right">
                          <button onClick={() => deleteStudent(student.id)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassManagement;
