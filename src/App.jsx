import React, { useMemo, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Upload, Play, Pause, RotateCcw, FileText, Settings2, TimerReset, Lock, Shield, User, Users, Edit, BookOpenCheck, FlagTriangleRight, Languages, Database, LogOut, Maximize2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import * as XLSX from "xlsx";

// ========= BRAND =========
const BRAND = {
  name: "Caspian Drilling Company Ltd",
  short: "CDC",
  primary: "#0f172a",  // slate-900 background
  accent: "#e11d48",   // CDC red (rose-600) – trendy & professional
  logoUrl: "/cdc_logo.jpg",
};

const STORAGE_KEY = "cdc-assessment-suite-v1";

// ========= i18n =========
const i18n = {
  en: {
    appTitle: "Assessment Suite",
    roleAdmin: "Admin",
    roleCandidate: "Candidate",
    name: "Name",
    position: "Position (optional)",
    language: "Language",
    settings: "Settings",
    startTest: "Start Test",
    timeLimit: "Time limit (minutes)",
    totalQuestions: "Total questions",
    randomize: "Randomize order",
    quotas: "Per-category quotas (Logic)",
    diffMix: "Difficulty mix (Logic: E/M/H per category)",
    weights: "Category weights (Logic, 0–100%)",
    mode: "Test Mode",
    logic: "Logic",
    english: "English",
    englishLevel: "English Level (1–10)",
    loadSample: "Load Banks",
    uploadJson: "Upload JSON",
    importCSV: "Import CSV/XLSX",
    exportCSV: "Export CSV",
    exportXLSX: "Export XLSX",
    answerKey: "Download Answer Key",
    bankEditor: "Bank Editor (Logic)",
    candidate: "Candidate",
    question: "Question",
    choices: "Choices",
    correct: "Correct",
    category: "Category",
    difficulty: "Difficulty",
    type: "Type",
    mcq: "MCQ",
    open: "Open",
    previous: "Previous",
    next: "Next",
    submit: "Submit",
    review: "Flag for review",
    feedback: "Feedback (optional)",
    remaining: "Remaining time",
    resultsSummary: "Results Summary",
    scoreWeighted: "Score (Weighted)",
    scoreRaw: "Score",
    attempts: "Attempts",
  },
  az: {
    appTitle: "Qiymətləndirmə Paketi",
    roleAdmin: "Admin",
    roleCandidate: "Namizəd",
    name: "Ad, Soyad",
    position: "Vəzifə (istəyə görə)",
    language: "Dil",
    settings: "Ayarlar",
    startTest: "Testə başla",
    timeLimit: "Vaxt limiti (dəqiqə)",
    totalQuestions: "Ümumi sual sayı",
    randomize: "Sıranın qarışdırılması",
    quotas: "Kateqoriya kvotaları (Məntiq)",
    diffMix: "Çətinlik qarışığı (Məntiq: A/O/Ç kateqoriya üzrə)",
    weights: "Kateqoriya çəkiləri (Məntiq, 0–100%)",
    mode: "Test rejimi",
    logic: "Məntiq",
    english: "İngilis dili",
    englishLevel: "İngilis səviyyəsi (1–10)",
    loadSample: "Bankları yüklə",
    uploadJson: "JSON yüklə",
    importCSV: "CSV/XLSX idxal et",
    exportCSV: "CSV ixrac et",
    exportXLSX: "XLSX ixrac et",
    answerKey: "Cavab açarı",
    bankEditor: "Sual Bankı (Məntiq)",
    candidate: "Namizəd",
    question: "Sual",
    choices: "Variantlar",
    correct: "Düzgün",
    category: "Kateqoriya",
    difficulty: "Çətinlik",
    type: "Növ",
    mcq: "MCQ",
    open: "Açıq",
    previous: "Əvvəlki",
    next: "Növbəti",
    submit: "Təslim et",
    review: "Baxış üçün işarələ",
    feedback: "Rəy (istəyə görə)",
    remaining: "Qalan vaxt",
    resultsSummary: "Nəticələrin xülasəsi",
    scoreWeighted: "Bal (Çəkili)",
    scoreRaw: "Bal",
    attempts: "Cəhdlər",
  },
};

// ========= utilities =========
function useAutosave(key, value) {
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }, [key, value]);
}
function loadSaved(key) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function shuffle(array) { const a = array.slice(); for (let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
function groupBy(arr, key){ return arr.reduce((m,x)=>((m[x[key]]=m[x[key]]||[]).push(x),m),{}); }
function prettyTime(s){ const m=Math.floor(s/60), sec=s%60; return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`; }
function useTimer(active, seconds, onExpire){
  const [remaining, setRemaining] = useState(seconds);
  const saved = useRef({ active, onExpire });
  saved.current = { active, onExpire };
  useEffect(()=> setRemaining(seconds), [seconds]);
  useEffect(()=>{ if(!saved.current.active) return; const id=setInterval(()=>{ setRemaining(r=>{ if(r<=1){ clearInterval(id); saved.current.onExpire?.(); return 0;} return r-1;}); },1000); return ()=>clearInterval(id); },[saved.current.active]);
  return [remaining, setRemaining];
}
function exportCSV(rows, filename){
  const csv = rows.map(r => r.map(c => `"${String(c??"").replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
}
function exportXLSX(sheets, filename){
  const wb = XLSX.utils.book_new();
  for(const [name, rows] of Object.entries(sheets)){
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0,31));
  }
  XLSX.writeFile(wb, filename);
}

// ========= App =========
export default function App(){
  const saved = loadSaved(STORAGE_KEY);
  const [lang, setLang] = useState(saved?.lang || 'en');
  const t = (k)=> (i18n[lang]?.[k] || i18n.en[k] || k);

  const [role, setRole] = useState(saved?.role || 'admin'); // default admin for set-up
  const [user, setUser] = useState(saved?.user || { name: '', position: '' });

  // Mode & banks
  const [mode, setMode] = useState(saved?.mode || 'logic'); // 'logic' | 'english'
  const [logicBank, setLogicBank] = useState(saved?.logicBank || []);
  const [englishBank, setEnglishBank] = useState(saved?.englishBank || {}); // level -> array
  const [autoLoaded, setAutoLoaded] = useState(saved?.autoLoaded || false);

  // Logic settings
  const [weights, setWeights] = useState(saved?.weights || {});
  const [quotas, setQuotas] = useState(saved?.quotas || {});
  const [diffMix, setDiffMix] = useState(saved?.diffMix || {1:0,2:0,3:0});

  // Shared test settings
  const [numTotal, setNumTotal] = useState(saved?.numTotal || 30);
  const [minutes, setMinutes] = useState(saved?.minutes || 45);
  const [randomize, setRandomize] = useState(saved?.randomize ?? true);
  const [secure, setSecure] = useState(saved?.secure ?? false);

  // English level
  const [engLevel, setEngLevel] = useState(saved?.engLevel || 5);

  // Session
  const [inProgress, setInProgress] = useState(saved?.inProgress || false);
  const [paused, setPaused] = useState(saved?.paused || false);
  const [currentIdx, setCurrentIdx] = useState(saved?.currentIdx || 0);
  const [attempt, setAttempt] = useState(saved?.attempt || null);
  const [attempts, setAttempts] = useState(saved?.attempts || []);

  useAutosave(STORAGE_KEY, { lang, role, user, mode, logicBank, englishBank, autoLoaded, weights, quotas, diffMix, numTotal, minutes, randomize, secure, engLevel, inProgress, paused, currentIdx, attempt, attempts });

  // Auto-load banks from public/ if not already done
  useEffect(()=>{
    async function loadBanks(){
      try {
        const lb = await fetch('/logic_bank.json').then(r=>r.json());
        let ebRaw = await fetch('/english_bank_by_level.json').then(r=>r.json());
        // normalize english bank into { [level]: array }
        let eb = {};
        if (Array.isArray(ebRaw)) {
          // If array, group by 'level' field
          ebRaw.forEach(q=>{
            const lvl = String(q.level||1);
            eb[lvl] = eb[lvl] || [];
            eb[lvl].push(q);
          });
        } else {
          eb = ebRaw;
        }
        setLogicBank(lb);
        setEnglishBank(eb);
        setAutoLoaded(true);
      } catch (e) {
        console.warn('Bank auto-load failed', e);
      }
    }
    if (!autoLoaded) loadBanks();
  }, [autoLoaded]);

  // Category list for logic
  const logicCategories = useMemo(()=> Array.from(new Set((logicBank||[]).map(q=>q.category))), [logicBank]);

  // Prepare pool
  const prepared = useMemo(()=>{
    if (mode==='logic') {
      let pool = logicBank.slice();
      const quotaSum = Object.values(quotas||{}).reduce((a,b)=>a + (Number(b)||0), 0);
      if (quotaSum>0) {
        const byCat = groupBy(pool, 'category');
        const out = [];
        for (const [cat, count] of Object.entries(quotas)) {
          const p = (byCat[cat]||[]).slice();
          const byDiff = p.reduce((m,q)=>{ (m[q.difficulty||1]=m[q.difficulty||1]||[]).push(q); return m; },{});
          const pick = (d,n)=> shuffle(byDiff[d]||[]).slice(0, n);
          const chosen = [
            ...pick(1, diffMix[1]||0),
            ...pick(2, diffMix[2]||0),
            ...pick(3, diffMix[3]||0),
          ];
          const rest = Math.max(0, (Number(count)||0) - chosen.length);
          const remaining = p.filter(q=>!chosen.includes(q));
          out.push(...chosen, ...shuffle(remaining).slice(0, rest));
        }
        pool = out;
      }
      if (randomize) pool = shuffle(pool);
      if (numTotal>0) pool = pool.slice(0, numTotal);
      return pool;
    } else {
      const list = englishBank?.[String(engLevel)] || [];
      let pool = list.slice();
      if (randomize) pool = shuffle(pool);
      if (numTotal>0) pool = pool.slice(0, numTotal);
      return pool;
    }
  }, [mode, logicBank, englishBank, engLevel, quotas, diffMix, randomize, numTotal]);

  // Timer
  const [remaining, setRemaining] = useTimer(inProgress && !paused, minutes*60, ()=> submitAttempt());

  function enterFullscreen(){ const el=document.documentElement; if(el.requestFullscreen) el.requestFullscreen(); }

  function startTest(){
    if(!user.name){ alert('Enter your name.'); return; }
    if(prepared.length===0){ alert('No questions available.'); return; }
    const items = prepared.map(q=>({ question:q, answerIndex:null, openText:"", flagged:false, feedback:"" }));
    const id = `${mode.toUpperCase()}-${Date.now()}`;
    setAttempt({ id, user, mode, level: mode==='english'? engLevel: null, started: Date.now(), submitted: null, items });
    setInProgress(true); setPaused(false); setCurrentIdx(0); setRemaining(minutes*60);
    if(secure) enterFullscreen();
  }

  function recordAnswer(idx, payload){
    if(!attempt) return;
    const next = { ...attempt, items: attempt.items.slice() };
    next.items[idx] = { ...next.items[idx], ...payload };
    setAttempt(next);
  }

  function scoreAttempt(att){
    if (mode==='logic') {
      const byCat = {};
      att.items.forEach(it=>{
        if(it.question.type!=="mcq") return;
        const cat = it.question.category;
        byCat[cat] = byCat[cat] || { correct:0, total:0 };
        byCat[cat].total += 1;
        if(it.answerIndex===it.question.answer) byCat[cat].correct += 1;
      });
      let weighted=0, weightSum=0;
      for(const [cat, s] of Object.entries(byCat)){
        const w = Number(weights[cat]||0);
        const pct = s.total? (s.correct/s.total):0;
        weighted += pct * w; weightSum += w;
      }
      const finalPct = weightSum? Math.round((weighted/weightSum)*100) : Math.round((Object.values(byCat).reduce((a,s)=>a+s.correct,0) / Math.max(1,Object.values(byCat).reduce((a,s)=>a+s.total,0))) * 100);
      return { finalPct, raw: null };
    } else {
      // english raw score
      let correct=0, total=0;
      att.items.forEach(it=>{
        if(it.question.type!=="mcq") return;
        total+=1; if(it.answerIndex===it.question.answer) correct+=1;
      });
      return { finalPct: Math.round((correct/Math.max(1,total))*100), raw: {correct,total} };
    }
  }

  function submitAttempt(){
    if(!attempt) return;
    const submitted = { ...attempt, submitted: Date.now(), score: scoreAttempt(attempt) };
    setAttempt(submitted); setInProgress(false); setPaused(false);
    setAttempts(prev=> [submitted, ...prev]);
  }

  function downloadAnswerKey(){
    const rows = [["ID","Category/Level","Type","Correct (index)","Correct (text)"]];
    const src = mode==='logic' ? logicBank : (englishBank?.[String(engLevel)]||[]);
    src.forEach(q=>{
      const key = mode==='logic' ? q.category : `Level ${engLevel}`;
      const correctText = q.type==='mcq' ? (q.choices?.[q.answer] ?? '') : '';
      rows.push([q.id, key, q.type, q.type==='mcq' ? q.answer : '', correctText]);
    });
    exportCSV(rows, 'answer_key.csv');
  }

  function exportBankCSV(){
    if (mode==='logic') {
      const rows = [["id","category","type","text","choices","answer","difficulty"]];
      logicBank.forEach(q=> rows.push([q.id,q.category,q.type,q.text,(q.choices||[]).join("||"), q.type==='mcq'?q.answer:'', q.difficulty||1]));
      exportCSV(rows, 'logic_bank.csv');
    } else {
      const rows = [["level","id","type","text","choices","answer"]];
      Object.entries(englishBank).forEach(([lvl, arr])=>{
        arr.forEach(q=> rows.push([lvl, q.id, q.type, q.text, (q.choices||[]).join("||"), q.type==='mcq'?q.answer:'']));
      });
      exportCSV(rows, 'english_bank.csv');
    }
  }
  function exportBankXLSX(){
    if (mode==='logic') {
      const rows = [["id","category","type","text","choices","answer","difficulty"]];
      logicBank.forEach(q=> rows.push([q.id,q.category,q.type,q.text,(q.choices||[]).join("||"), q.type==='mcq'?q.answer:'', q.difficulty||1]));
      exportXLSX({ LogicBank: rows }, 'logic_bank.xlsx');
    } else {
      const rows = [["level","id","type","text","choices","answer"]];
      Object.entries(englishBank).forEach(([lvl, arr])=>{
        arr.forEach(q=> rows.push([lvl, q.id, q.type, q.text, (q.choices||[]).join("||"), q.type==='mcq'?q.answer:'']));
      });
      exportXLSX({ EnglishBank: rows }, 'english_bank.xlsx');
    }
  }

  function importFromFile(e){
    const file = e.target.files?.[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try{
        if(file.name.endsWith('.json')){
          const data = JSON.parse(String(reader.result));
          if (mode==='logic') {
            if(!Array.isArray(data)) throw new Error('Logic JSON must be an array');
            setLogicBank(data);
          } else {
            if (Array.isArray(data)) {
              const eb = {};
              data.forEach(q=>{ const lvl = String(q.level||engLevel||1); (eb[lvl]=eb[lvl]||[]).push(q); });
              setEnglishBank(eb);
            } else {
              setEnglishBank(data);
            }
          }
        } else {
          const wb = XLSX.read(reader.result, { type:'binary' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(ws, { header:1 });
          const [header, ...rows] = data;
          const hdr = header.map(h=>String(h||'').toLowerCase());
          const idx = (k)=> hdr.indexOf(k);
          if (mode==='logic') {
            const out = rows.filter(r=>r && r.length).map(r=>({
              id: r[idx('id')], category: r[idx('category')], type: r[idx('type')],
              text: r[idx('text')], choices: String(r[idx('choices')]||'').split('||').filter(Boolean),
              answer: r[idx('answer')]!==''? Number(r[idx('answer')]): undefined, difficulty: Number(r[idx('difficulty')]||1)
            }));
            setLogicBank(out);
          } else {
            const outByLvl = {};
            rows.filter(r=>r && r.length).forEach(r=>{
              const lvl = String(r[idx('level')]);
              const q = { id:r[idx('id')], type:r[idx('type')], text:r[idx('text')], choices:String(r[idx('choices')]||'').split('||').filter(Boolean), answer:r[idx('answer')]!==''?Number(r[idx('answer')]):undefined };
              (outByLvl[lvl]=outByLvl[lvl]||[]).push(q);
            });
            setEnglishBank(outByLvl);
          }
        }
      }catch(err){ alert('Import error: '+err.message); }
    };
    if(file.name.endsWith('.json')) reader.readAsText(file); else reader.readAsBinaryString(file);
  }

  const hasSubmitted = !!attempt?.submitted;

  // UI
  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${BRAND.primary} 0%, #f8fafc 38%)` }}>
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <header className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={BRAND.logoUrl} className="w-10 h-10 rounded bg-white p-1 shadow" alt="CDC"/>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-white">{BRAND.short} • {t('appTitle')}</h1>
              <div className="text-xs text-white/80">{BRAND.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={()=> setLang(l=> l==='en'?'az':'en')} title={t('language')}><Languages className="h-4 w-4 mr-1"/>{lang.toUpperCase()}</Button>
            {role==='admin' ? (
              <Button variant="ghost" onClick={()=> setRole('candidate')} title="Switch to Candidate"><User className="h-4 w-4 mr-2"/>{i18n[lang].roleCandidate}</Button>
            ) : (
              <Button variant="ghost" onClick={()=> setRole('admin')} title="Switch to Admin"><Users className="h-4 w-4 mr-2"/>{i18n[lang].roleAdmin}</Button>
            )}
          </div>
        </header>

        {/* Profile */}
        <Card className="mb-4">
          <CardContent className="p-4 flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[220px]">
              <label className="text-xs text-slate-600">{i18n[lang].name}</label>
              <Input value={user.name} onChange={(e)=> setUser(u=>({...u, name:e.target.value}))} placeholder="Name & Surname"/>
            </div>
            <div className="flex-1 min-w-[220px]">
              <label className="text-xs text-slate-600">{i18n[lang].position}</label>
              <Input value={user.position||''} onChange={(e)=> setUser(u=>({...u, position:e.target.value}))} placeholder="Position"/>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Button variant={secure?"default":"secondary"} onClick={()=> setSecure(s=>!s)} title="Secure mode">
                <Lock className="h-4 w-4 mr-2"/>{secure? 'Secure ✓':'Secure'}
              </Button>
              <Button variant="ghost" onClick={()=> { setUser({name:'', position:''}); }}><LogOut className="h-4 w-4 mr-2"/>Sign out</Button>
            </div>
          </CardContent>
        </Card>

        {/* Admin panel */}
        {role==='admin' && (
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5"/>{i18n[lang].settings}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium">{i18n[lang].mode}</label>
                    <select className="border rounded-xl px-3 py-2 w-full" value={mode} onChange={(e)=> setMode(e.target.value)}>
                      <option value="logic">{i18n[lang].logic}</option>
                      <option value="english">{i18n[lang].english}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">{i18n[lang].timeLimit}</label>
                    <Input type="number" min={1} value={minutes} onChange={(e)=> setMinutes(Math.max(1, Number(e.target.value)||0))}/>
                  </div>
                  <div>
                    <label className="text-sm font-medium">{i18n[lang].totalQuestions}</label>
                    <Input type="number" min={1} value={numTotal} onChange={(e)=> setNumTotal(Math.max(1, Number(e.target.value)||0))}/>
                  </div>
                </div>

                {mode==='english' && (
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm font-medium">{i18n[lang].englishLevel}</label>
                      <Input type="number" min={1} max={10} value={engLevel} onChange={(e)=> setEngLevel(Math.max(1, Math.min(10, Number(e.target.value)||1)))} />
                    </div>
                  </div>
                )}

                {mode==='logic' && (
                  <>
                    <div>
                      <div className="text-sm font-medium mb-1">{i18n[lang].quotas}</div>
                      {logicCategories.map(cat=> (
                        <div key={cat} className="flex items-center gap-2 mb-2">
                          <span className="text-xs px-2 py-1 bg-white rounded-full shadow">{cat}</span>
                          <Input type="number" min={0} className="w-24" value={quotas[cat]??''} onChange={(e)=> setQuotas({...quotas, [cat]: e.target.value})}/>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">{i18n[lang].diffMix}</div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs">E</div>
                        <Input type="number" min={0} className="w-20" value={diffMix[1]||0} onChange={(e)=> setDiffMix({...diffMix, 1:Number(e.target.value)||0})}/>
                        <div className="text-xs">M</div>
                        <Input type="number" min={0} className="w-20" value={diffMix[2]||0} onChange={(e)=> setDiffMix({...diffMix, 2:Number(e.target.value)||0})}/>
                        <div className="text-xs">H</div>
                        <Input type="number" min={0} className="w-20" value={diffMix[3]||0} onChange={(e)=> setDiffMix({...diffMix, 3:Number(e.target.value)||0})}/>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">{i18n[lang].weights}</div>
                      {logicCategories.map(cat=> (
                        <div key={cat} className="flex items-center gap-2 mb-2">
                          <span className="text-xs px-2 py-1 bg-white rounded-full shadow">{cat}</span>
                          <Input type="number" min={0} max={100} className="w-24" value={weights[cat]??''} onChange={(e)=> setWeights({...weights, [cat]: e.target.value})}/>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Checkbox id="rnd" checked={randomize} onCheckedChange={(v)=> setRandomize(!!v)}/>
                    <label htmlFor="rnd" className="text-sm">{i18n[lang].randomize}</label>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  <Button variant="secondary" onClick={()=> setAutoLoaded(false)}><Shield className="h-4 w-4 mr-2"/>{i18n[lang].loadSample}</Button>
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow cursor-pointer">
                    <Upload className="h-4 w-4"/><span>{i18n[lang].uploadJson} / {i18n[lang].importCSV}</span>
                    <input type="file" accept=".json,.csv,.xlsx" className="hidden" onChange={importFromFile}/>
                  </label>
                  <Button onClick={exportBankCSV}><Download className="h-4 w-4 mr-2"/>{i18n[lang].exportCSV}</Button>
                  <Button onClick={exportBankXLSX}><Download className="h-4 w-4 mr-2"/>{i18n[lang].exportXLSX}</Button>
                  <Button variant="ghost" onClick={downloadAnswerKey}><BookOpenCheck className="h-4 w-4 mr-2"/>{i18n[lang].answerKey}</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-5 w-5"/>{i18n[lang].attempts}</CardTitle></CardHeader>
              <CardContent>
                <div className="max-h-72 overflow-auto text-sm bg-white rounded-xl p-2 shadow">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left">
                        <th className="p-1">ID</th>
                        <th className="p-1">Mode</th>
                        <th className="p-1">{i18n[lang].candidate}</th>
                        <th className="p-1">Started</th>
                        <th className="p-1">Submitted</th>
                        <th className="p-1">{i18n[lang].scoreRaw}/{i18n[lang].scoreWeighted}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attempts.map(a=> (
                        <tr key={a.id} className="border-t">
                          <td className="p-1 font-mono text-xs">{a.id}</td>
                          <td className="p-1">{a.mode}{a.level?` L${a.level}`:''}</td>
                          <td className="p-1">{a.user?.name}</td>
                          <td className="p-1">{new Date(a.started).toLocaleString()}</td>
                          <td className="p-1">{a.submitted? new Date(a.submitted).toLocaleString():''}</td>
                          <td className="p-1">
                            {a.mode==='english' ? (a.score?.raw? `${a.score.raw.correct}/${a.score.raw.total}`:'-') : '-'}
                            {" / "}{a.score?.finalPct ?? '-' }%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {mode==='logic' && (
              <Card className="lg:col-span-3">
                <CardHeader><CardTitle className="flex items-center gap-2"><Edit className="h-5 w-5"/>{i18n[lang].bankEditor}</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-auto max-h-[420px] bg-white rounded-xl shadow">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-slate-50">
                        <tr>
                          <th className="p-2">ID</th>
                          <th className="p-2">{i18n[lang].category}</th>
                          <th className="p-2">{i18n[lang].type}</th>
                          <th className="p-2 w-[40%]">{i18n[lang].question}</th>
                          <th className="p-2">{i18n[lang].choices}</th>
                          <th className="p-2">{i18n[lang].correct}</th>
                          <th className="p-2">{i18n[lang].difficulty}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logicBank.map((q,i)=> (
                          <tr key={i} className="border-t align-top">
                            <td className="p-2"><Input value={q.id} onChange={(e)=> setLogicBank(prev=> prev.map((qq,idx)=> idx===i? {...qq, id:e.target.value}: qq))}/></td>
                            <td className="p-2"><Input value={q.category} onChange={(e)=> setLogicBank(prev=> prev.map((qq,idx)=> idx===i? {...qq, category:e.target.value}: qq))}/></td>
                            <td className="p-2">
                              <select className="border rounded-md px-2 py-1" value={q.type} onChange={(e)=> setLogicBank(prev=> prev.map((qq,idx)=> idx===i? {...qq, type:e.target.value}: qq))}>
                                <option value="mcq">{i18n[lang].mcq}</option>
                                <option value="open">{i18n[lang].open}</option>
                              </select>
                            </td>
                            <td className="p-2"><Textarea value={q.text} onChange={(e)=> setLogicBank(prev=> prev.map((qq,idx)=> idx===i? {...qq, text:e.target.value}: qq))}/></td>
                            <td className="p-2">
                              {q.type==='mcq' ? (
                                <Textarea value={(q.choices||[]).join('\\n')} onChange={(e)=> setLogicBank(prev=> prev.map((qq,idx)=> idx===i? {...qq, choices:e.target.value.split('\\n')}: qq))}/>
                              ) : (<div className="text-xs text-slate-400">—</div>)}
                            </td>
                            <td className="p-2">
                              {q.type==='mcq' ? (
                                <Input type="number" min={0} value={q.answer??0} onChange={(e)=> setLogicBank(prev=> prev.map((qq,idx)=> idx===i? {...qq, answer:Number(e.target.value)||0}: qq))}/>
                              ) : (<div className="text-xs text-slate-400">—</div>)}
                            </td>
                            <td className="p-2"><Input type="number" min={1} max={3} value={q.difficulty||1} onChange={(e)=> setLogicBank(prev=> prev.map((qq,idx)=> idx===i? {...qq, difficulty:Number(e.target.value)||1}: qq))}/></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Candidate view */}
        {role==='candidate' && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5"/>{i18n[lang].settings}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium">{i18n[lang].mode}</label>
                  <select className="border rounded-xl px-3 py-2 w-full" value={mode} onChange={(e)=> setMode(e.target.value)}>
                    <option value="logic">{i18n[lang].logic}</option>
                    <option value="english">{i18n[lang].english}</option>
                  </select>
                </div>
                {mode==='english' && (
                  <div>
                    <label className="text-sm font-medium">{i18n[lang].englishLevel}</label>
                    <Input type="number" min={1} max={10} value={engLevel} onChange={(e)=> setEngLevel(Math.max(1, Math.min(10, Number(e.target.value)||1)))} />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">{i18n[lang].timeLimit}</label>
                  <Input type="number" min={1} value={minutes} onChange={(e)=> setMinutes(Math.max(1, Number(e.target.value)||0))}/>
                </div>
                <div>
                  <label className="text-sm font-medium">{i18n[lang].totalQuestions}</label>
                  <Input type="number" min={1} value={numTotal} onChange={(e)=> setNumTotal(Math.max(1, Number(e.target.value)||0))}/>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="rnd2" checked={randomize} onCheckedChange={(v)=> setRandomize(!!v)}/>
                <label htmlFor="rnd2" className="text-sm">{i18n[lang].randomize}</label>
              </div>
              <div className="flex gap-2">
                <Button onClick={startTest}><Play className="h-4 w-4 mr-2"/>{i18n[lang].startTest}</Button>
                <Button variant="secondary" onClick={()=> document.documentElement.requestFullscreen?.()}><Maximize2 className="h-4 w-4 mr-2"/>Full-screen</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test runner */}
        {inProgress && attempt && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-white">
                <div className="font-medium">{i18n[lang].candidate}: <span className="font-semibold">{user.name||'Anonymous'}</span></div>
                <div className="text-white/80">{i18n[lang].question} {currentIdx+1} / {attempt.items.length} • {mode==='english'? `L${engLevel}` : 'Logic'}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1 rounded-full text-sm font-mono bg-white text-slate-900`} title={i18n[lang].remaining}><TimerReset className="h-4 w-4 inline mr-1"/>{prettyTime(remaining)}</div>
                <Button variant="secondary" onClick={()=> setPaused(p=>!p)}>{paused? <>Resume</> : <><Pause className="h-4 w-4 mr-2"/>Pause</>}</Button>
                <Button variant="ghost" onClick={submitAttempt}>{i18n[lang].submit}</Button>
              </div>
            </div>

            <Card className="mb-3">
              <CardHeader><CardTitle className="text-lg">{attempt.items[currentIdx].question.category || `Level ${engLevel}`}</CardTitle></CardHeader>
              <CardContent>
                <div className="text-base leading-relaxed whitespace-pre-wrap">{attempt.items[currentIdx].question.text}</div>
                {attempt.items[currentIdx].question.type==='mcq' ? (
                  <div className="mt-4 space-y-2">
                    {attempt.items[currentIdx].question.choices.map((c,i)=> (
                      <label key={i} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${attempt.items[currentIdx].answerIndex===i?'border-slate-900':'border-slate-200 hover:border-slate-300'}`}>
                        <input type="radio" name={`q-${currentIdx}`} className="accent-black" checked={attempt.items[currentIdx].answerIndex===i} onChange={()=> recordAnswer(currentIdx, { answerIndex:i })} />
                        <span>{c}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4">
                    <Textarea rows={6} placeholder="Type your response" value={attempt.items[currentIdx].openText} onChange={(e)=> recordAnswer(currentIdx, { openText:e.target.value })}/>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-3">
                  <Button variant={attempt.items[currentIdx].flagged? 'default':'secondary'} onClick={()=> recordAnswer(currentIdx, { flagged: !attempt.items[currentIdx].flagged })}>
                    <FlagTriangleRight className="h-4 w-4 mr-2"/>{i18n[lang].review}
                  </Button>
                  <div className="flex-1">
                    <Input placeholder={i18n[lang].feedback} value={attempt.items[currentIdx].feedback||''} onChange={(e)=> recordAnswer(currentIdx, { feedback: e.target.value })}/>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button variant="secondary" disabled={currentIdx===0} onClick={()=> setCurrentIdx(i=> Math.max(0, i-1))}>{i18n[lang].previous}</Button>
                <Button variant="secondary" disabled={currentIdx===attempt.items.length-1} onClick={()=> setCurrentIdx(i=> Math.min(attempt.items.length-1, i+1))}>{i18n[lang].next}</Button>
              </div>
              <div className="flex gap-1 flex-wrap max-w-[70%]">
                {attempt.items.map((it,i)=> (
                  <button key={i} onClick={()=> setCurrentIdx(i)} className={`w-8 h-8 rounded-full text-xs font-medium ${i===currentIdx?'bg-black text-white': (it.answerIndex!=null || (it.openText&&it.openText.trim()))? 'bg-green-600 text-white' : it.flagged? 'bg-yellow-400 text-black':'bg-slate-200 text-slate-700'}`}>{i+1}</button>
                ))}
              </div>
              <div><Button onClick={submitAttempt}>{i18n[lang].submit}</Button></div>
            </div>
          </div>
        )}

        {/* Results */}
        {hasSubmitted && attempt && (
          <div className="mt-4 space-y-4">
            <Card>
              <CardHeader><CardTitle>{i18n[lang].resultsSummary}</CardTitle></CardHeader>
              <CardContent className="grid md:grid-cols-4 gap-3">
                <div className="p-4 bg-white rounded-2xl shadow">
                  <div className="text-sm text-slate-500">{i18n[lang].candidate}</div>
                  <div className="text-lg font-semibold">{attempt.user?.name || 'Anonymous'}</div>
                </div>
                <div className="p-4 bg-white rounded-2xl shadow">
                  <div className="text-sm text-slate-500">Started</div>
                  <div className="text-lg font-semibold">{new Date(attempt.started).toLocaleString()}</div>
                </div>
                <div className="p-4 bg-white rounded-2xl shadow">
                  <div className="text-sm text-slate-500">Submitted</div>
                  <div className="text-lg font-semibold">{new Date(attempt.submitted).toLocaleString()}</div>
                </div>
                <div className="p-4 bg-white rounded-2xl shadow">
                  <div className="text-sm text-slate-500">{mode==='logic'? i18n[lang].scoreWeighted : i18n[lang].scoreRaw}</div>
                  <div className="text-2xl font-extrabold">
                    {mode==='logic' ? `${attempt.score?.finalPct ?? 0}%` : `${attempt.score?.raw?.correct ?? 0}/${attempt.score?.raw?.total ?? 0} (${attempt.score?.finalPct ?? 0}%)`}
                  </div>
                </div>
                <div className="md:col-span-4 flex gap-2">
                  <Button onClick={()=>{
                    const rows = [["Attempt ID", attempt.id],["Mode", attempt.mode+(attempt.level?` L${attempt.level}`:"")],["Name", attempt.user?.name||''],["Started", new Date(attempt.started).toISOString()],["Submitted", new Date(attempt.submitted).toISOString()],["Score %", attempt.score?.finalPct ?? ''],[],["#","Question ID","Bucket","Type","Question","Your Answer","Correct Answer","Is Correct","Flagged","Feedback"]];
                    attempt.items.forEach((it,idx)=>{
                      const q = it.question;
                      const bucket = mode==='logic'? (q.category||'') : `Level ${attempt.level||engLevel}`;
                      const your = q.type==='mcq'? (q.choices?.[it.answerIndex]??'') : (it.openText||'');
                      const correct = q.type==='mcq'? (q.choices?.[q.answer]??'') : '';
                      const ok = q.type==='mcq'? (it.answerIndex===q.answer? 'YES':'NO') : '';
                      rows.push([String(idx+1), q.id, bucket, q.type, q.text.replace(/\n/g,' '), your.replace? your.replace(/\n/g,' '):your, correct, ok, it.flagged? 'YES':'NO', it.feedback||'']);
                    });
                    exportCSV(rows, `attempt_${attempt.id}.csv`);
                  }}><Download className="h-4 w-4 mr-2"/>{i18n[lang].exportCSV}</Button>
                  <Button variant="secondary" onClick={()=> window.print()}><FileText className="h-4 w-4 mr-2"/>Print report</Button>
                  <Button variant="ghost" onClick={()=>{ setAttempt(null); setInProgress(false); }}><RotateCcw className="h-4 w-4 mr-2"/>New</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <footer className="mt-8 text-center text-xs text-white/80">
          CDC • Trendy & professional UI • Local storage • Ready for Netlify
        </footer>
      </div>
    </div>
  );
}
