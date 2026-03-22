'use client';
import { useState, useRef, useEffect } from 'react';
import { ChatMsg } from '@/types';
import { SendIcon } from './Icons';

const INIT: ChatMsg[] = [{
  role: 'assistant',
  content: "Hi! I'm your AI course advisor ✦\n\nI'll learn about your interests through conversation, then match you with the best courses from the live catalog.\n\nLet's start: **What topics genuinely excite you?** (e.g. AI, pure math, biology, game dev, finance, social sciences…)",
}];

interface InterestChatbotProps {
  courseCount: number;
}

export default function InterestChatbot({ courseCount }: InterestChatbotProps) {
  const [msgs, setMsgs]         = useState<ChatMsg[]>(INIT);
  const [input, setInput]       = useState('');
  const [thinking, setThinking] = useState(false);
  const [picks, setPicks]       = useState<any[]>([]);
  const [history, setHistory]   = useState<{ role: 'user' | 'model'; parts: string }[]>([]);
  const endRef                  = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, thinking]);

  const parsePicks = (text: string) => {
    const m = text.match(/PICKS:(\[[\s\S]*?\])/);
    if (!m) return [];
    try { return JSON.parse(m[1]).filter((p: any) => p.code && p.reason); }
    catch { return []; }
  };

  const cleanText = (t: string) => t.replace(/PICKS:\[[\s\S]*?\]/, '').trim();

  const send = async () => {
    const msg = input.trim();
    if (!msg || thinking) return;
    setInput('');
    setMsgs(m => [...m, { role: 'user', content: msg }]);
    setThinking(true);
    try {
      const res  = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ history, message: msg }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'API error');
      const reply    = data.reply as string;
      const newPicks = parsePicks(reply);
      if (newPicks.length) setPicks(newPicks);
      setHistory(h => [...h, { role: 'user', parts: msg }, { role: 'model', parts: cleanText(reply) }]);
      setMsgs(m => [...m, { role: 'assistant', content: cleanText(reply) }]);
    } catch (e: any) {
      setMsgs(m => [...m, { role: 'assistant', content: `Sorry, I hit an error: ${e.message}. Make sure GEMINI_API_KEY is set in .env.local.` }]);
    }
    setThinking(false);
  };

  const renderText = (txt: string) =>
    txt.split('\n').map((line, i) => {
      const html = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
      return <div key={i} dangerouslySetInnerHTML={{ __html: html || '&nbsp;' }} />;
    });

  return (
    <div className="chat-wrap">
      <div className="chatbox">
        <div className="chat-hdr">
          <div className="chat-hdr-avatar">✦</div>
          <div>
            <div className="chat-hdr-name">Course Advisor AI</div>
            <div className="chat-hdr-status"><div className="chat-hdr-dot" />Powered by Gemini · {courseCount} courses loaded</div>
          </div>
        </div>
        <div className="chat-msgs">
          {msgs.map((m, i) => (
            <div key={i} className={`msg-row ${m.role}`}>
              <div className={`msg-avatar ${m.role === 'assistant' ? 'ai' : 'hu'}`}>{m.role === 'assistant' ? 'AI' : '👤'}</div>
              <div className={`msg-bubble ${m.role}`}>{renderText(m.content)}</div>
            </div>
          ))}
          {thinking && (
            <div className="msg-row assistant">
              <div className="msg-avatar ai">AI</div>
              <div className="msg-bubble typing"><div className="typing-dots"><span /><span /><span /></div></div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div className="chat-input-row">
          <textarea
            className="chat-textarea"
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Tell me about your interests…"
          />
          <button className="chat-send" onClick={send} disabled={!input.trim() || thinking}><SendIcon /></button>
        </div>
      </div>

      <div className="picks-panel">
        <div className="card" style={{ height: '100%' }}>
          <div className="card-header"><span style={{ fontSize: 16 }}>💡</span><span className="card-title">Personalized Picks</span></div>
          <div className="card-body" style={{ overflowY: 'auto', maxHeight: 500 }}>
            {picks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: '#9ca3af' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>
                <div style={{ fontSize: 12, lineHeight: 1.5 }}>Chat with the advisor and it will recommend courses matched to your interests from the live database</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 10 }}>Matched to your interests</div>
                {picks.map((p, i) => (
                  <div key={i} className="pick-card">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, color: 'var(--ua-blue)' }}>{p.code}</span>
                      <span className={`match-badge ${p.match >= 80 ? 'match-high' : p.match >= 60 ? 'match-med' : 'match-low'}`}>{p.match}%</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#1e293b', lineHeight: 1.4, marginBottom: 3 }}>{p.reason}</div>
                    {p.syllabus && <a href={p.syllabus} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: 'var(--ua-sky)', textDecoration: 'none', display: 'block', marginTop: 3 }}>📎 Syllabus ↗</a>}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
