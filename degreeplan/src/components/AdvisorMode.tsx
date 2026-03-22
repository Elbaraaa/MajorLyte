'use client';
import { useState, useRef } from 'react';
import { Course } from '@/types';
import CourseForm from './CourseForm';
import { PlusIcon } from './Icons';

interface AdvisorModeProps {
  courses: Course[];
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  showToast: (title: string, desc: string, type: string) => void;
}

export default function AdvisorMode({ courses, setCourses, showToast }: AdvisorModeProps) {
  const [section, setSection]     = useState('db');
  const [search, setSearch]       = useState('');
  const [fMajor, setFMajor]       = useState('All');
  const [fCat, setFCat]           = useState('All');
  const [editC, setEditC]         = useState<Course | null>(null);
  const [modal, setModal]         = useState(false);
  const [pdfState, setPdfState]   = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [pdfMsg, setPdfMsg]       = useState('');
  const fileRef                   = useRef<HTMLInputElement>(null);

  const majors   = ['All', ...new Set(courses.map(c => c.major))];
  const cats     = ['All', ...new Set(courses.map(c => c.category))];
  const q        = search.toLowerCase();
  const filtered = courses.filter(c =>
    (!q || c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)) &&
    (fMajor === 'All' || c.major === fMajor) &&
    (fCat   === 'All' || c.category === fCat)
  );

  const tagCls = (cat: string) =>
    cat.includes('Core') ? 'tag-core' : cat.includes('Capstone') ? 'tag-capstone' :
    cat.includes('Elective') ? 'tag-elective' : cat.includes('Lab') ? 'tag-lab' : 'tag-other';

  const refreshCourses = async () => {
    const r = await fetch('/api/courses');
    const d = await r.json();
    setCourses(d.courses || []);
  };

  const handleSave = async (c: Course) => {
    try {
      const method = editC ? 'PUT' : 'POST';
      const url    = editC ? `/api/courses?id=${editC.id}` : '/api/courses';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(c) });
      const data   = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      await refreshCourses();
      showToast(editC ? 'Course updated!' : 'Course added!', `${c.code} saved to the database.`, 'success');
      setModal(false);
    } catch (e: any) { showToast('Error', e.message, 'error'); }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/courses?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setCourses(cs => cs.filter(c => c.id !== id));
      showToast('Course removed', '', 'info');
    } catch (e: any) { showToast('Error', e.message, 'error'); }
  };

  const handleFile = async (file: File) => {
    setPdfState('processing'); setPdfMsg('');
    try {
      const fd = new FormData(); fd.append('file', file);
      const res  = await fetch('/api/catalog', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Parse failed');
      await refreshCourses();
      setPdfState('done');
      showToast('Catalog parsed!', `${data.inserted} new courses added (${data.total} found in document).`, 'success');
    } catch (e: any) { setPdfState('error'); setPdfMsg(e.message); showToast('Parse error', e.message, 'error'); }
  };

  const nav = [
    { id: 'db',     icon: '📚', label: 'Course Database' },
    { id: 'upload', icon: '📄', label: 'Upload PDF Catalog' },
    { id: 'add',    icon: '➕', label: 'Add Course Manually' },
    { id: 'majors', icon: '🎓', label: 'Manage Majors' },
  ];

  return (
    <div className="adv-layout">
      {/* Sidebar */}
      <div className="adv-sidebar">
        <div className="card">
          <div className="card-header"><span style={{ fontSize: 16 }}>🛡️</span><span className="card-title">Advisor Tools</span></div>
          <div className="card-body" style={{ padding: '8px' }}>
            {nav.map(n => (
              <div key={n.id} className={`adv-nav-item ${section === n.id ? 'active' : ''}`} onClick={() => setSection(n.id)}>
                <div className="adv-nav-icon" style={{ background: section === n.id ? 'rgba(12,35,75,.1)' : '#f8fafc' }}>{n.icon}</div>
                <span>{n.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card"><div className="card-body">
          <div className="stat-grid">
            <div className="stat-card"><div className="stat-num">{courses.length}</div><div className="stat-label">Courses</div></div>
            <div className="stat-card"><div className="stat-num">{new Set(courses.map(c => c.major)).size}</div><div className="stat-label">Majors</div></div>
            <div className="stat-card"><div className="stat-num">{new Set(courses.map(c => c.category)).size}</div><div className="stat-label">Categories</div></div>
            <div className="stat-card"><div className="stat-num">{courses.filter(c => c.prereqs.length === 0).length}</div><div className="stat-label">No prereqs</div></div>
          </div>
        </div></div>
      </div>

      {/* Main panel */}
      <div className="adv-main">

        {/* DATABASE */}
        {section === 'db' && (
          <div className="adv-panel">
            <div className="adv-panel-hdr">
              <div><div className="adv-panel-title">Course Database</div><div className="adv-panel-desc">All courses used for degree planning. Edit or remove any entry.</div></div>
              <button className="btn-primary" style={{ width: 'auto', height: 34, padding: '0 14px', fontSize: 12 }} onClick={() => { setEditC(null); setModal(true); }}>
                <PlusIcon /> Add Course
              </button>
            </div>
            <div className="adv-panel-body">
              <div className="db-filters">
                <input className="db-search" placeholder="Search courses…" value={search} onChange={e => setSearch(e.target.value)} />
                <select className="db-filter-sel" value={fMajor} onChange={e => setFMajor(e.target.value)}>{majors.map(m => <option key={m}>{m}</option>)}</select>
                <select className="db-filter-sel" value={fCat}   onChange={e => setFCat(e.target.value)}>{cats.map(c => <option key={c}>{c}</option>)}</select>
                <span className="db-count">{filtered.length} course{filtered.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="table-wrap" style={{ maxHeight: 460, overflowY: 'auto' }}>
                <table>
                  <thead><tr>
                    <th>Code</th><th>Title</th><th>Major</th><th>Category</th>
                    <th style={{ textAlign: 'center' }}>Cr</th><th>Prereqs</th><th>Offered</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr></thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr><td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: 24 }}>
                        No courses yet. Upload a catalog PDF or add courses manually.
                      </td></tr>
                    )}
                    {filtered.map(c => (
                      <tr key={c.id}>
                        <td><span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 11, color: 'var(--ua-blue)' }}>{c.code}</span></td>
                        <td>
                          <div style={{ fontWeight: 500, fontSize: 12 }}>{c.title}</div>
                          {c.description && <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</div>}
                        </td>
                        <td style={{ fontSize: 11, color: '#6b7280', maxWidth: 110, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.major}</td>
                        <td><span className={`course-tag ${tagCls(c.category)}`}>{c.category}</span></td>
                        <td style={{ textAlign: 'center' }}><span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 12 }}>{c.units}</span></td>
                        <td>{c.prereqs.length === 0 ? <span style={{ color: '#9ca3af', fontSize: 11 }}>—</span> : c.prereqs.map(p => <span key={p} className="prereq-chip">{p}</span>)}</td>
                        <td>{c.offered.map(o => <span key={o} className="offered-chip">{o}</span>)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            <button className="btn-sm" onClick={() => { setEditC(c); setModal(true); }}>✏️</button>
                            <button className="btn-sm danger" onClick={() => handleDelete(c.id!)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* UPLOAD */}
        {section === 'upload' && (
          <div className="adv-panel">
            <div className="adv-panel-hdr">
              <div><div className="adv-panel-title">Upload Course Catalog</div><div className="adv-panel-desc">Upload your university's PDF catalog — Gemini extracts every course automatically.</div></div>
            </div>
            <div className="adv-panel-body">
              <div
                className="upload-zone"
                onClick={() => pdfState === 'idle' && fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                onDragLeave={e => e.currentTarget.classList.remove('drag-over')}
                onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); const f = e.dataTransfer.files[0]; if (f && pdfState === 'idle') handleFile(f); }}
              >
                <div className="upload-zone-icon">{pdfState === 'processing' ? '⚙️' : pdfState === 'done' ? '✅' : pdfState === 'error' ? '❌' : '📄'}</div>
                <div className="upload-zone-title">
                  {pdfState === 'processing' ? 'Gemini is parsing your document…' : pdfState === 'done' ? 'Catalog parsed successfully!' : pdfState === 'error' ? 'Parse error — try again' : 'Drop catalog PDF here, or click to browse'}
                </div>
                <div className="upload-zone-sub">
                  {pdfState === 'processing' ? 'Extracting course codes, titles, prerequisites, descriptions…' :
                   pdfState === 'done' ? 'New courses have been added to the database. Check the Course Database tab.' :
                   pdfState === 'error' ? pdfMsg : 'Gemini will extract course codes, titles, descriptions, prerequisites, and scheduling info'}
                </div>
                {pdfState === 'idle' && <div className="upload-zone-fmts"><span className="fmt-pill">.pdf</span><span className="fmt-pill">.txt</span></div>}
                {pdfState === 'processing' && <div className="processing-bar"><div className="processing-fill" /></div>}
              </div>
              <input ref={fileRef} type="file" accept=".pdf,.txt" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
              {(pdfState === 'done' || pdfState === 'error') && (
                <button className="btn-sample" style={{ marginTop: 12 }} onClick={() => setPdfState('idle')}>Upload another file</button>
              )}
              <div style={{ marginTop: 22 }}>
                <div className="form-sec-title" style={{ marginBottom: 12 }}>What Gemini extracts from your catalog</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {['Course code & number', 'Full course title', 'Credit / unit count', 'Course description', 'Prerequisites list', 'Offered semesters', 'Degree requirement type', 'Syllabus URL (if present)'].map(x => (
                    <div key={x} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#374151' }}><span style={{ color: 'var(--ua-sage)', fontWeight: 700 }}>✓</span>{x}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ADD MANUALLY */}
        {section === 'add' && (
          <div className="adv-panel">
            <div className="adv-panel-hdr">
              <div><div className="adv-panel-title">Add Course Manually</div><div className="adv-panel-desc">Course descriptions power the AI interest advisor chatbot.</div></div>
            </div>
            <div className="adv-panel-body">
              <CourseForm initial={null} onSave={c => { handleSave(c); }} onCancel={() => {}} />
            </div>
          </div>
        )}

        {/* MAJORS */}
        {section === 'majors' && (
          <div className="adv-panel">
            <div className="adv-panel-hdr">
              <div><div className="adv-panel-title">Degree Programs</div><div className="adv-panel-desc">All programs in the system, auto-grouped from course entries.</div></div>
            </div>
            <div className="adv-panel-body">
              {[...new Set(courses.map(c => c.major))].length === 0 && (
                <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '32px 0' }}>No courses in the database. Upload a catalog or add courses manually to see majors.</div>
              )}
              {[...new Set(courses.map(c => c.major))].map(major => {
                const mc = courses.filter(c => c.major === major);
                return (
                  <div key={major} className="card" style={{ marginBottom: 12 }}>
                    <div className="card-header" style={{ justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 18 }}>🎓</span><span className="card-title" style={{ fontSize: 14 }}>{major}</span></div>
                      <span style={{ fontSize: 11, color: '#6b7280', background: '#f1f5f9', padding: '2px 8px', borderRadius: 5, fontWeight: 700 }}>{mc.length} courses</span>
                    </div>
                    <div className="card-body" style={{ paddingTop: 8 }}>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                        {[...new Set(mc.map(c => c.category))].map(cat => <span key={cat} className={`course-tag ${tagCls(cat)}`}>{cat} ({mc.filter(c => c.category === cat).length})</span>)}
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {mc.map(c => <span key={c.id} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700, color: 'var(--ua-blue)', background: 'rgba(12,35,75,.07)', padding: '2px 6px', borderRadius: 4 }}>{c.code}</span>)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">{editC ? `Edit ${editC.code}` : 'Add New Course'}</div>
                <div className="modal-subtitle">{editC ? 'Update course details' : 'Descriptions power the AI advisor'}</div>
              </div>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <CourseForm initial={editC} onSave={handleSave} onCancel={() => setModal(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
