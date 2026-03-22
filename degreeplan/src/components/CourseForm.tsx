import { useState } from 'react';
import { Course } from '@/types';
import TagInput from './TagInput';
import { PlusIcon } from './Icons';

interface CourseFormProps {
  initial: Course | null;
  onSave: (c: Course) => void;
  onCancel: () => void;
}

export default function CourseForm({ initial, onSave, onCancel }: CourseFormProps) {
  const blank: Course = {
    code: '', title: '', units: 3, category: '', major: '',
    description: '', syllabus: '', prereqs: [], offered: [],
  };
  const [f, setF] = useState<Course>(initial || blank);
  const set = (k: keyof Course, v: any) => setF(p => ({ ...p, [k]: v }));
  const valid = f.code.trim() && f.title.trim() && f.major.trim() && f.category.trim();

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div className="form-sec-title">Basic Info</div>
        <div className="field-row" style={{ marginBottom: 10 }}>
          <div>
            <label>Course Code *</label>
            <input type="text" value={f.code} onChange={e => set('code', e.target.value)} placeholder="e.g. MATH 355" />
          </div>
          <div>
            <label>Units *</label>
            <input type="number" value={f.units} min={1} max={6} onChange={e => set('units', parseInt(e.target.value) || 3)} />
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Course Title *</label>
          <input type="text" value={f.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Linear Algebra" />
        </div>
        <div className="field-row">
          <div>
            <label>Category *</label>
            <input type="text" value={f.category} onChange={e => set('category', e.target.value)} placeholder="Core, Elective…" />
          </div>
          <div>
            <label>Degree / Major *</label>
            <input type="text" value={f.major} onChange={e => set('major', e.target.value)} placeholder="Mathematics (BA)" />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div className="form-sec-title">Description & Syllabus</div>
        <div style={{ marginBottom: 10 }}>
          <label>Description (used by AI chatbot)</label>
          <textarea className="short" value={f.description} onChange={e => set('description', e.target.value)} placeholder="Brief summary of topics covered…" />
        </div>
        <div>
          <label>Syllabus URL (optional)</label>
          <input type="text" value={f.syllabus} onChange={e => set('syllabus', e.target.value)} placeholder="https://…" />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div className="form-sec-title">Prerequisites</div>
        <label>Prereq Courses (press Enter after each code)</label>
        <TagInput values={f.prereqs} onChange={v => set('prereqs', v)} placeholder="e.g. MATH 129" />
      </div>

      <div style={{ marginBottom: 20 }}>
        <div className="form-sec-title">Scheduling</div>
        <label>Offered Semesters</label>
        <div className="chk-group">
          {['Fall', 'Spring', 'Summer'].map(s => (
            <label key={s} className="chk-item">
              <input
                type="checkbox"
                checked={f.offered.includes(s)}
                onChange={e => set('offered', e.target.checked ? [...f.offered, s] : f.offered.filter(o => o !== s))}
              />
              {s}
            </label>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn-primary" style={{ flex: 1, height: 40, fontSize: 13 }} disabled={!valid} onClick={() => onSave(f)}>
          <PlusIcon /> {initial ? 'Save Changes' : 'Add Course'}
        </button>
        <button className="btn-secondary" style={{ flex: '0 0 90px' }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
