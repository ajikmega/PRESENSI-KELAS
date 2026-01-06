
import React, { useState } from 'react';
import { Plus, Trash2, BookOpen } from 'lucide-react';
import { Subject } from '../types';

interface SubjectManagementProps {
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
}

const SubjectManagement: React.FC<SubjectManagementProps> = ({ subjects, setSubjects }) => {
  const [newSubjectName, setNewSubjectName] = useState('');

  const addSubject = () => {
    if (!newSubjectName.trim()) return;
    const newSub: Subject = {
      id: Date.now().toString(),
      name: newSubjectName,
    };
    setSubjects([...subjects, newSub]);
    setNewSubjectName('');
  };

  const deleteSubject = (id: string) => {
    if (confirm('Hapus mata pelajaran ini?')) {
      setSubjects(subjects.filter(s => s.id !== id));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-slate-800">Tambah Mata Pelajaran</h3>
        <div className="flex space-x-2">
          <input 
            type="text" 
            placeholder="Contoh: Matematika, Bahasa Indonesia" 
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSubject()}
          />
          <button 
            onClick={addSubject}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center space-x-2"
          >
            <Plus size={18} />
            <span>Simpan</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-semibold text-slate-700">Daftar Mata Pelajaran ({subjects.length})</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {subjects.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
              <BookOpen size={48} className="mb-4 opacity-10" />
              <p>Belum ada mata pelajaran</p>
            </div>
          ) : (
            subjects.map(sub => (
              <div key={sub.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-indigo-100 transition-colors text-slate-500 group-hover:text-indigo-600">
                    <BookOpen size={18} />
                  </div>
                  <span className="font-medium text-slate-700">{sub.name}</span>
                </div>
                <button 
                  onClick={() => deleteSubject(sub.id)}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SubjectManagement;
