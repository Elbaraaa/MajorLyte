'use client';
import { useState, useEffect, useRef } from 'react';

import { Course, PlanResult, ToastMsg } from '@/types';
import { SAMPLE_TX, LOAD_MSGS } from '@/constants';
import { exportCSV } from '@/utils/export';
import Toast from '@/components/Toast';
import AdvisorMode from '@/components/AdvisorMode';
import InterestChatbot from '@/components/InterestChatbot';
import {
  SparkIcon, GradIcon, FileIcon, WarnIcon,
  DlIcon, ResetIcon, BookIcon, ClockIcon, HeartIcon,
} from '@/components/Icons';

export default function App() {
  const [appMode, setAppMode]   = useState<'student' | 'advisor'>('student');
  const [advTab, setAdvTab]     = useState<'tools' | 'chatbot'>('tools');
  const [courses, setCourses]   = useState<Course[]>([]);
  const [profile, setProfile]   = useState({ standing: 'Junior', major: '', secondMajor: '', gradTerm: 'Spring 2027', maxUnits: 16, summer: false });
  const [transcript, setTx]     = useState('');
  const [txTab, setTxTab]       = useState('paste');
  const [result, setResult]     = useState<PlanResult | null>(null);
  const [loading, setLoading]   = useState(false);
  const [loadIdx, setLoadIdx]   = useState(0);
  const [error, setError]       = useState('');
  const [toast, setToast]       = useState<ToastMsg | null>(null);
  const [modalCourse, setModalCourse] = useState<any>(null);
  const sliderRef               = useRef<HTMLInputElement>(null);

  const sp = (k: string, v: any) => setProfile(p => ({ ...p, [k]: v }));
  const showToast = (title: string, desc: string, type: string) => setToast({ title, desc, type: type as any });

  // Load courses from DB on mount
  useEffect(() => {
    fetch('/api/courses').then(r => r.json()).then(d => {
      const cs: Course[] = d.courses || [];
      setCourses(cs);
      if (cs.length > 0) sp('major', cs[0].major);
    });
  }, []);

  // Cycle loading messages
  useEffect(() => {
    if (!loading) return;
    const iv = setInterval(() => setLoadIdx(i => (i + 1) % LOAD_MSGS.length), 900);
    return () => clearInterval(iv);
  }, [loading]);

  // Sync slider CSS custom property
  useEffect(() => {
    if (sliderRef.current) sliderRef.current.style.setProperty('--v', String(profile.maxUnits));
  }, [profile.maxUnits]);

  const gradTerms: string[] = [];
  for (let y = 2026; y <= 2031; y++) { gradTerms.push(`Spring ${y}`, `Fall ${y}`); }
  const availMajors = [...new Set(courses.map(c => c.major))];

  const generate = async () => {
    if (!transcript.trim()) return;
    setLoading(true); setResult(null); setError('');
    try {
      const res  = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcriptText: transcript, major: profile.major, secondMajor: profile.secondMajor || undefined, standing: profile.standing, gradTerm: profile.gradTerm, maxUnits: profile.maxUnits, includeSummer: profile.summer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setResult(data);
      showToast('Plan generated!', 'Your AI-powered roadmap is ready.', 'success');
    } catch (e: any) { setError(e.message); showToast('Error', e.message, 'error'); }
    finally { setLoading(false); }
  };

  const reset = () => { setResult(null); setTx(''); setError(''); showToast('Reset', '', 'info'); };

  const satCount = result?.requirements.filter(r => r.status === 'Satisfied').length || 0;
  const totReqs  = result?.requirements.length || 0;

  return (
    <>
      <div className="app">

        {/* ─── HEADER ─── */}
        <header className="header">
          <div className="header-left">
            <div className="ua-mark">UA</div>
            <div>
              <div className="header-title">DegreePlan Copilot</div>
              <div className="header-sub">Powered by Google Gemini</div>
            </div>
            <div className="header-badges">
              <span className="badge badge-live">🟢 LIVE</span>
              <span className="badge badge-gem">✦ Gemini</span>
              {appMode === 'advisor' && <span className="badge badge-adv">🛡️ ADVISOR</span>}
            </div>
          </div>
          <div className="header-right">
            <div className="mode-tabs">
              <button className={`mode-tab ${appMode === 'student' ? 'active' : ''}`} onClick={() => setAppMode('student')}><GradIcon /> Student</button>
              <button className={`mode-tab ${appMode === 'advisor' ? 'active' : ''}`} onClick={() => setAppMode('advisor')}>🛡️ Advisor</button>
            </div>
            <button className="btn-ghost-white" onClick={reset}><ResetIcon /> Reset</button>
          </div>
        </header>

        <div className="main">

          {/* ═══ ADVISOR MODE ═══ */}
          {appMode === 'advisor' && (
            <div>
              <div className="adv-subtabs">
                <button className={`adv-subtab ${advTab === 'tools' ? 'active' : ''}`} onClick={() => setAdvTab('tools')}>📚 Course Management</button>
                <button className={`adv-subtab ${advTab === 'chatbot' ? 'active' : ''}`} onClick={() => setAdvTab('chatbot')}>✦ Interest Advisor Chatbot</button>
              </div>
              {advTab === 'tools' && <AdvisorMode courses={courses} setCourses={setCourses} showToast={showToast} />}
              {advTab === 'chatbot' && (
                <div>
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: 'var(--ua-blue)', marginBottom: 5 }}>Interest-Based Course Advisor</div>
                    <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, maxWidth: 680 }}>Gemini analyses each student's interests and matches them against course descriptions and syllabi from the live database to suggest the best-fit electives.</p>
                  </div>
                  <InterestChatbot courseCount={courses.length} />
                </div>
              )}
            </div>
          )}

          {/* ═══ STUDENT MODE ═══ */}
          {appMode === 'student' && (
            <div className="layout">

              {/* LEFT COLUMN */}
              <div className="left-col">

                {/* Profile card */}
                <div className="card">
                  <div className="card-header"><GradIcon /><span className="card-title">Student Profile</span></div>
                  <div className="card-body">
                    <div className="field field-row">
                      <div>
                        <label>Standing</label>
                        <select value={profile.standing} onChange={e => sp('standing', e.target.value)}>
                          {['Freshman', 'Sophomore', 'Junior', 'Senior'].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label>Primary Major</label>
                        <select value={profile.major} onChange={e => sp('major', e.target.value)}>
                          {availMajors.length === 0 && <option value="">— Add courses first —</option>}
                          {availMajors.map(m => <option key={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="field">
                      <label>Second Major / Minor</label>
                      <select value={profile.secondMajor} onChange={e => sp('secondMajor', e.target.value)}>
                        <option value="">— None —</option>
                        {availMajors.filter(m => m !== profile.major).map(m => <option key={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <label>Expected Graduation</label>
                      <select value={profile.gradTerm} onChange={e => sp('gradTerm', e.target.value)}>
                        {gradTerms.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <label style={{ margin: 0 }}>Max Units / Semester</label>
                        <span className="slider-value">{profile.maxUnits} units</span>
                      </div>
                      <div className="slider-wrap">
                        <input ref={sliderRef} type="range" min={12} max={19} step={1} value={profile.maxUnits} onChange={e => sp('maxUnits', parseInt(e.target.value))} />
                        <div className="slider-labels"><span>12</span><span>19</span></div>
                      </div>
                    </div>
                    <div className="toggle-row">
                      <div>
                        <div className="toggle-label">Summer Sessions</div>
                        <div className="toggle-sub">Include summer in plan</div>
                      </div>
                      <label className="toggle">
                        <input type="checkbox" checked={profile.summer} onChange={e => sp('summer', e.target.checked)} />
                        <div className="toggle-track" /><div className="toggle-thumb" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Transcript card */}
                <div className="card">
                  <div className="card-header"><FileIcon /><span className="card-title">Transcript</span></div>
                  <div className="card-body">
                    <div className="tabs-list">
                      <button className={`tab-btn ${txTab === 'paste' ? 'active' : ''}`} onClick={() => setTxTab('paste')}>Paste Text</button>
                      <button className={`tab-btn ${txTab === 'upload' ? 'active' : ''}`} onClick={() => setTxTab('upload')}>Upload PDF</button>
                    </div>
                    {txTab === 'paste' ? (
                      <>
                        <textarea value={transcript} onChange={e => setTx(e.target.value)} placeholder="Paste your unofficial transcript text here…" />
                        <button className="btn-sample" onClick={() => setTx(SAMPLE_TX)}><SparkIcon /> Load sample transcript</button>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '30px 0' }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                        <p style={{ fontSize: 12, color: '#6b7280' }}>PDF transcript upload coming soon.</p>
                        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Use "Paste Text" tab for now.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Generate button */}
                <button className="btn-primary" onClick={generate} disabled={!transcript.trim() || loading || availMajors.length === 0}>
                  {loading ? (
                    <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin .8s linear infinite' }} /> Generating…</>
                  ) : (
                    <><SparkIcon /> Generate Plan</>
                  )}
                </button>

                {availMajors.length === 0 && (
                  <p style={{ fontSize: 11, color: '#b45309', textAlign: 'center', marginTop: -4 }}>
                    ⚠ No courses in database. Switch to Advisor mode → Upload PDF or Add Course Manually.
                  </p>
                )}
                {!transcript.trim() && availMajors.length > 0 && (
                  <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: -4 }}>Paste a transcript or load the sample to begin</p>
                )}

                {/* Context hint */}
                <div className="context-hint">
                  {profile.major ? (
                    <><strong style={{ color: 'var(--ua-blue)' }}>{profile.major}</strong>
                    {profile.secondMajor && <> + <strong style={{ color: 'var(--ua-copper)' }}>{profile.secondMajor}</strong></>}<br /></>
                  ) : (
                    <span style={{ color: '#b45309' }}>Select your major above<br /></span>
                  )}
                  <span className="link" onClick={() => { setAppMode('advisor'); setAdvTab('chatbot'); }}>✦ Interest Advisor</span>
                  {' · '}
                  <a href="https://catalog.arizona.edu" target="_blank" rel="noopener noreferrer">UA Catalog ↗</a>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="right-col">
                {loading ? (
                  <div className="panel-empty">
                    <div className="spinner-wrap">
                      <div className="spinner">
                        <div className="spinner-ring spinner-ring-outer" />
                        <div className="spinner-ring spinner-ring-inner" />
                      </div>
                      <div className="spinner-msg">{LOAD_MSGS[loadIdx]}</div>
                      <div className="spinner-sub">Powered by Gemini 1.5 Pro</div>
                    </div>
                  </div>

                ) : result ? (
                  <div className="results">

                    {/* Summary */}
                    <div>
                      <div className="summary-grid">
                        <div className="summary-card" style={{ borderTop: '3px solid var(--ua-blue)' }}>
                          <div className="summary-card-label"><span style={{ color: result.feasibility === 'High' ? '#10b981' : result.feasibility === 'Medium' ? '#f59e0b' : '#ef4444' }}>●</span> Feasibility</div>
                          <span className={`pill pill-${result.feasibility.toLowerCase()}`}><span className="pill-dot" />{result.feasibility}</span>
                        </div>
                        <div className="summary-card" style={{ borderTop: '3px solid var(--ua-copper)' }}>
                          <div className="summary-card-label"><ClockIcon /> Graduation</div>
                          <div className="summary-card-value" style={{ fontSize: 15 }}>{result.estimatedGraduationTerm}</div>
                        </div>
                        <div className="summary-card" style={{ borderTop: '3px solid var(--ua-sage)' }}>
                          <div className="summary-card-label"><BookIcon /> Remaining</div>
                          <div className="summary-card-value">{result.remainingUnits} <span style={{ fontSize: 12, fontFamily: "'DM Sans',sans-serif", fontWeight: 400, color: '#9ca3af' }}>units</span></div>
                        </div>
                      </div>
                      {result.riskFlags?.length > 0 && (
                        <div className="risk-box">
                          <div className="risk-title"><WarnIcon /> Risk Flags</div>
                          {result.riskFlags.map((f, i) => <div key={i} className="risk-item"><div className="risk-dot" />{f}</div>)}
                        </div>
                      )}
                    </div>

                    <div className="divider" />

                    {/* Export */}
                    <div className="export-row">
                      <button className="btn-secondary" onClick={() => { exportCSV(result); showToast('CSV exported!', '', 'success'); }}><DlIcon /> Export CSV</button>
                      <button className="btn-secondary btn-copper" onClick={() => showToast('PDF export coming soon', '', 'info')}><FileIcon /> Export PDF</button>
                      <button className="btn-secondary btn-sage" onClick={() => { setAppMode('advisor'); setAdvTab('chatbot'); }}><HeartIcon /> Interest Advisor</button>
                    </div>

                    <div className="divider" />

                    {/* Semester Plan */}
                    <div>
                      <div className="section-header">Semester Plan</div>
                      <div className="sem-grid">
                        {result.semesters?.map((sem, i) => {
                          const season = sem.term.includes('Fall') ? 'fall' : sem.term.includes('Spring') ? 'spring' : 'summer';
                          return (
                            <div key={i} className={`sem-card sem-${season}`}>
                              <div className="sem-header">
                                <div className="sem-header-left">
                                  <span className={`sem-season-badge badge-${season}`}>{season}</span>
                                  <span className="sem-term">{sem.term}</span>
                                </div>
                                <span className="sem-units">{sem.totalUnits} units</span>
                              </div>
                              <div className="sem-courses">
                                {sem.courses.map((c, j) => (
                                  <div key={j} className="course-row">
                                    <div className="course-left">
                                      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                                        <span className="course-code">{c.code}</span>
                                        <span className="course-title-sm">{c.title}</span>
                                      </div>
                                      {c.warnings?.map((w, k) => <div key={k} className="course-warn">⚠ {w}</div>)}
                                    </div>
                                    <span className="course-units">{c.units}u</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="divider" />

                    {/* Next Term Recommendations */}
                    {result.recommendations?.length > 0 && (
                      <div>
                        <div className="section-header">Next Term Recommendations</div>
                        <div className="table-wrap">
                          <table>
                            <thead><tr><th>Course</th><th style={{ textAlign: 'center' }}>Sections</th><th>Modality</th><th style={{ textAlign: 'right' }}></th></tr></thead>
                            <tbody>
                              {result.recommendations.map((r, i) => {
                                const mc = r.modality?.includes('Online') ? 'modality-online' : r.modality?.includes('Hybrid') ? 'modality-hybrid' : 'modality-ip';
                                return (
                                  <tr key={i}>
                                    <td>
                                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, color: 'var(--ua-blue)' }}>{r.code}</div>
                                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>{r.title}</div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}><span style={{ background: '#f1f5f9', padding: '2px 7px', borderRadius: 5, fontSize: 11, fontWeight: 700 }}>{r.sections}</span></td>
                                    <td><span className={mc} style={{ fontSize: 11 }}>{r.modality}</span></td>
                                    <td style={{ textAlign: 'right' }}><button className="btn-faculty" onClick={() => setModalCourse(r)}>👤 Faculty</button></td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="divider" />

                    {/* Requirements */}
                    <div>
                      <div className="section-header">
                        Requirements Checklist
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af' }}>{satCount} / {totReqs}</span>
                      </div>
                      <div className="req-progress-wrap">
                        <div className="req-progress-bar">
                          <div className="req-progress-fill" style={{ width: `${totReqs > 0 ? (satCount / totReqs) * 100 : 0}%` }} />
                        </div>
                        <div className="req-progress-label"><span>{satCount} satisfied</span><span>{totReqs - satCount} remaining</span></div>
                      </div>
                      <div className="table-wrap">
                        <table>
                          <thead><tr><th>Requirement</th><th style={{ textAlign: 'center' }}>Status</th><th style={{ textAlign: 'right' }}>Catalog</th></tr></thead>
                          <tbody>
                            {result.requirements?.map((req, i) => (
                              <tr key={i}>
                                <td style={{ fontSize: 12 }}>{req.name}</td>
                                <td style={{ textAlign: 'center' }}>{req.status === 'Satisfied' ? <span className="status-ok">✓ Done</span> : <span className="status-pending">○ Pending</span>}</td>
                                <td style={{ textAlign: 'right' }}><a href={req.url} target="_blank" rel="noopener noreferrer" className="req-link">Link ↗</a></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', paddingBottom: 8 }}>
                      For advising reference only. Confirm with your{' '}
                      <a href="https://advising.arizona.edu" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ua-sky)' }}>UA academic advisor</a>.
                    </p>

                  </div>

                ) : error ? (
                  <div className="panel-empty">
                    <div className="empty-inner">
                      <div className="empty-icon" style={{ background: '#fee2e2', fontSize: 28 }}>⚠️</div>
                      <div className="empty-title" style={{ color: 'var(--ua-red)' }}>Something went wrong</div>
                      <div className="err-box">{error}</div>
                      <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 16 }}>Check that GEMINI_API_KEY is set in .env.local</p>
                    </div>
                  </div>

                ) : (
                  <div className="panel-empty">
                    <div className="empty-inner">
                      <div className="empty-icon">🎓<div className="empty-icon-badge">AI</div></div>
                      <div className="empty-title">Ready to plan?</div>
                      <p className="empty-desc">
                        {availMajors.length === 0
                          ? 'Start in Advisor mode — upload a course catalog PDF or add courses manually. Then return here to generate a plan.'
                          : 'Fill in your profile, paste your transcript, and hit Generate Plan for your AI-powered roadmap.'}
                      </p>
                      <p className="empty-arrow">{availMajors.length === 0 ? '↑ Switch to Advisor mode above' : '← Configure your profile on the left'}</p>
                      <div style={{ marginTop: 16 }}>
                        <button onClick={() => { setAppMode('advisor'); setAdvTab('chatbot'); }} style={{ background: 'rgba(12,35,75,.07)', border: '1px solid rgba(12,35,75,.12)', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600, color: 'var(--ua-blue)', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          ✦ Try the Interest Advisor
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Faculty Modal */}
        {modalCourse && (
          <div className="modal-overlay" onClick={() => setModalCourse(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <div className="modal-title">{modalCourse.code} Instructors</div>
                  <div className="modal-subtitle">{modalCourse.title}</div>
                </div>
                <button className="modal-close" onClick={() => setModalCourse(null)}>✕</button>
              </div>
              <div className="modal-body">
                {modalCourse.instructors?.map((inst: string, i: number) => {
                  const last = inst.split(' ').pop();
                  return (
                    <div key={i} className="instructor-row">
                      <div className="instructor-avatar">{last?.[0] || '?'}</div>
                      <div>
                        <div className="instructor-name">{inst}</div>
                        <div className="instructor-rmp">
                          <a href={`https://www.ratemyprofessors.com/search/professors/1003?q=${encodeURIComponent(last || '')}`} target="_blank" rel="noopener noreferrer">
                            View on RateMyProfessors →
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="modal-footer">
                Register at <a href="https://uaccess.arizona.edu" target="_blank" rel="noopener noreferrer">UAccess ↗</a>
              </div>
            </div>
          </div>
        )}

        {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
      </div>
    </>
  );
}
