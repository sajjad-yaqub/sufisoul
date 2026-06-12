"use client";

import { useState, useEffect } from 'react';
import { db, Poem, Collab } from '@/lib/supabase';
import { getIdentity, saveIdentity, Identity } from '@/lib/identity';

/* ─────────────────────────────────────────────────────────
   ICONS — inline so there are zero external deps
───────────────────────────────────────────────────────── */
const IconFeather = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
      d="M20.24 12.24a6 6 0 00-8.49-8.49L5 10.5V19h8.5l6.74-6.76zM16 8L2 22M17.5 15H9" />
  </svg>
);
const IconCircle = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const IconMic = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);
const IconUser = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const IconHeart = ({ filled }: { filled?: boolean }) => (
  <svg fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);
const IconCopy = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
  </svg>
);
const IconWhatsApp = () => (
  <svg fill="currentColor" viewBox="0 0 24 24">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.488 1.459 5.407 1.46h.007c5.858 0 10.622-4.76 10.626-10.623.002-2.84-1.102-5.511-3.111-7.521C17.567 3.459 14.896 2.35 12.057 2.35 6.2 2.35 1.433 7.11 1.429 12.97c-.001 1.956.509 3.864 1.478 5.485L1.879 22.21l4.768-1.255zM17.47 14.39c-.3-.149-1.777-.878-2.054-.978-.277-.1-.479-.149-.68.149-.2.3-.779.979-.954 1.179-.176.2-.351.224-.652.075-.301-.15-1.267-.467-2.413-1.49-.893-.797-1.496-1.78-1.672-2.08-.176-.3-.019-.462.131-.61.136-.134.301-.351.451-.525.15-.176.2-.301.3-.502.1-.2.05-.376-.025-.526-.075-.15-.68-1.64-.931-2.24-.244-.587-.492-.507-.679-.517-.175-.008-.375-.01-.576-.01-.2 0-.526.075-.802.376-.276.3-1.053 1.028-1.053 2.507 0 1.48 1.077 2.913 1.227 3.114.15.2 2.12 3.238 5.137 4.542.717.31 1.277.495 1.713.633.72.23 1.375.197 1.892.12.576-.087 1.777-.726 2.028-1.43.25-.702.25-1.303.176-1.43-.076-.127-.277-.202-.578-.352z"/>
  </svg>
);

/* ─────────────────────────────────────────────────────────
   MOOD / GENRE / LOADING DATA
───────────────────────────────────────────────────────── */
const MOODS = [
  { id: 'ishq',    label: 'Ishq',    urdu: 'عشق',    desc: 'Devotion & intense love' },
  { id: 'gham',    label: 'Gham',    urdu: 'غم',      desc: 'Heartbreak & longing' },
  { id: 'falsafa', label: 'Falsafa', urdu: 'فلسفہ',  desc: 'Reflective philosophy' },
  { id: 'sufi',    label: 'Sufi',    urdu: 'صوفی',   desc: 'Mysticism & divinity' },
  { id: 'umeed',   label: 'Umeed',   urdu: 'امید',   desc: 'Hope & renewal' },
];

const GENRES = [
  { id: 'sher',       label: 'Sher',       urdu: 'شعر',      desc: 'A stand-alone couplet' },
  { id: 'ghazal',     label: 'Ghazal',     urdu: 'غزل',      desc: 'Rhyming multi-couplet' },
  { id: 'nazm',       label: 'Nazm',       urdu: 'نظم',      desc: 'Continuous themed poem' },
  { id: 'free_verse', label: 'Free Verse', urdu: 'آزاد',     desc: 'Modern, without strict rules' },
];

const LOADING_LINES: Record<string, string> = {
  ishq:    'Searching the realms of devotion…',
  gham:    'Gathering the echoes of parting…',
  falsafa: 'Pondering the architecture of life…',
  sufi:    'Communing with the divine whispers…',
  umeed:   'Stoking the sparks of a new dawn…',
};

/* ─────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────── */
export default function Home() {
  const [activeTab, setActiveTab] = useState<'weave' | 'circle' | 'mushaira' | 'profile'>('weave');
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [tempTakhallus, setTempTakhallus] = useState('');

  // Wizard
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedMoods, setSelectedMoods] = useState<string[]>(['ishq']);
  const [hasSetInitialMood, setHasSetInitialMood] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('sher');
  const [selectedLength, setSelectedLength] = useState('short');
  const [customInput, setCustomInput] = useState('');
  const [isWeaving, setIsWeaving] = useState(false);
  const [generatedPoem, setGeneratedPoem] = useState<{
    content_roman: string;
    content_nastaliq?: string;
    english_translation?: string;
    meter_note?: string;
  } | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [allowCollab, setAllowCollab] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Feed
  const [feedPoems, setFeedPoems] = useState<Poem[]>([]);
  const [feedMoodFilter, setFeedMoodFilter] = useState('all');
  const [feedGenreFilter, setFeedGenreFilter] = useState('all');
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [showNastaliqMap, setShowNastaliqMap] = useState<Record<string, boolean>>({});
  const [showEnglishMap, setShowEnglishMap] = useState<Record<string, boolean>>({});
  const [likedPoems, setLikedPoems] = useState<string[]>([]);

  // Mushaira
  const [collabPoems, setCollabPoems] = useState<Poem[]>([]);
  const [selectedCollabPoem, setSelectedCollabPoem] = useState<Poem | null>(null);
  const [collabContribution, setCollabContribution] = useState('');
  const [activeCollabResponses, setActiveCollabResponses] = useState<Collab[]>([]);
  const [isSubmittingCollab, setIsSubmittingCollab] = useState(false);
  const [isStartingCollab, setIsStartingCollab] = useState(false);
  const [collabStarterRoman, setCollabStarterRoman] = useState('');
  const [collabStarterGenre, setCollabStarterGenre] = useState('sher');
  const [collabStarterMood, setCollabStarterMood] = useState('ishq');

  useEffect(() => {
    const ident = getIdentity();
    if (!ident) { setShowWelcomeModal(true); } else { setIdentity(ident); }

    // Load selected moods from localStorage
    const savedMoods = localStorage.getItem('sufisoul_selected_moods');
    let moods = ['ishq'];
    if (savedMoods) {
      try {
        moods = JSON.parse(savedMoods);
        setSelectedMoods(moods);
      } catch (e) {
        console.error(e);
      }
    }

    const savedInitial = localStorage.getItem('sufisoul_has_set_initial_mood');
    const hasSet = savedInitial === 'true';
    setHasSetInitialMood(hasSet);

    if (hasSet) {
      setActiveTab('circle');
      setFeedMoodFilter(moods.join(','));
      fetchFeed(moods.join(','), feedGenreFilter);
    } else {
      setActiveTab('weave');
      setWizardStep(1);
    }

    const localLikes = localStorage.getItem('sufisoul_likes');
    if (localLikes) setLikedPoems(JSON.parse(localLikes));
    fetchCollabFeed();
  }, []);

  const fetchFeed = async (mood = feedMoodFilter, genre = feedGenreFilter) => {
    setIsLoadingFeed(true);
    try { setFeedPoems(await db.getPoems({ mood, genre })); }
    catch (err) { console.error(err); }
    finally { setIsLoadingFeed(false); }
  };

  const fetchCollabFeed = async () => {
    try {
      const list = await db.getPoems({ genre: 'all' });
      setCollabPoems(list.filter(p => p.collab_open));
    } catch (err) { console.error(err); }
  };

  const handleWelcomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempTakhallus.trim()) return;
    setIdentity(saveIdentity(tempTakhallus));
    setShowWelcomeModal(false);
  };

  const handleUpdateTakhallus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempTakhallus.trim()) return;
    setIdentity(saveIdentity(tempTakhallus, identity?.device_uuid));
    setTempTakhallus('');
    alert('Takhallus updated.');
  };

  const handleWeavePoetry = async () => {
    setIsWeaving(true);
    setGeneratedPoem(null);
    setWizardStep(5);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: selectedMoods.join(', '), genre: selectedGenre, length: selectedLength, custom_input: customInput }),
      });
      const data = await res.json();
      if (res.ok) { setGeneratedPoem(data); setWizardStep(6); }
      else { alert(data.error || 'Failed.'); setWizardStep(4); }
    } catch { alert('Network error.'); setWizardStep(4); }
    finally { setIsWeaving(false); }
  };

  const handlePublishPoetry = async () => {
    if (!generatedPoem || !identity) return;
    setIsPublishing(true);
    try {
      await db.createPoem({
        device_uuid: identity.device_uuid,
        takhallus: isAnonymous ? 'Gumnaam' : identity.takhallus,
        mood: selectedMoods.join(','), genre: selectedGenre,
        content_roman: generatedPoem.content_roman,
        content_nastaliq: generatedPoem.content_nastaliq,
        is_anonymous: isAnonymous, collab_open: allowCollab,
      });
      setGeneratedPoem(null); setCustomInput(''); setWizardStep(hasSetInitialMood ? 2 : 1);
      fetchFeed(); fetchCollabFeed(); setActiveTab('circle');
    } catch { alert('Failed to publish.'); }
    finally { setIsPublishing(false); }
  };

  const handleLikePoem = (id: string) => {
    const updated = likedPoems.includes(id)
      ? likedPoems.filter(x => x !== id)
      : [...likedPoems, id];
    setLikedPoems(updated);
    localStorage.setItem('sufisoul_likes', JSON.stringify(updated));
  };

  const handleCopyPoem = (poem: Poem) => {
    navigator.clipboard.writeText(
      `${poem.content_roman}\n\n— ${poem.is_anonymous ? 'Gumnaam' : poem.takhallus || 'Sufi'}\n\nShared via SufiSoul`
    );
    alert('Copied!');
  };

  const handleShareWhatsApp = (poem: Poem) => {
    const text = `${poem.content_roman}\n\n— ${poem.is_anonymous ? 'Gumnaam' : poem.takhallus || 'Sufi'}\n\nShared via SufiSoul`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleOpenCollabModal = async (poem: Poem) => {
    setSelectedCollabPoem(poem);
    setCollabContribution('');
    try { setActiveCollabResponses(await db.getCollabs(poem.id)); }
    catch (err) { console.error(err); }
  };

  const handleSubmitCollab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollabPoem || !collabContribution.trim() || !identity) return;
    setIsSubmittingCollab(true);
    try {
      await db.createCollab({ parent_poem_id: selectedCollabPoem.id, device_uuid: identity.device_uuid, takhallus: identity.takhallus, contribution: collabContribution });
      setActiveCollabResponses(await db.getCollabs(selectedCollabPoem.id));
      setCollabContribution('');
    } catch (err) { console.error(err); }
    finally { setIsSubmittingCollab(false); }
  };

  const handleStartCollabPoem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collabStarterRoman.trim() || !identity) return;
    setIsStartingCollab(true);
    try {
      await db.createPoem({ device_uuid: identity.device_uuid, takhallus: identity.takhallus, mood: collabStarterMood, genre: collabStarterGenre, content_roman: collabStarterRoman, is_anonymous: false, collab_open: true });
      setCollabStarterRoman('');
      fetchCollabFeed();
    } catch (err) { console.error(err); }
    finally { setIsStartingCollab(false); }
  };

  const handleDeletePoem = async (id: string) => {
    if (!identity || !confirm('Delete this poem?')) return;
    try {
      const deleted = await db.deletePoem(id, identity.device_uuid);
      if (deleted) { fetchFeed(); fetchCollabFeed(); }
      else alert('You can only delete your own poetry.');
    } catch (err) { console.error(err); }
  };

  /* ── helpers ── */
  const goTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === 'weave') {
      setWizardStep(hasSetInitialMood ? 2 : 1);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* ── HEADER ── */}
      <header className="sufi-header">
        <div className="header-content">
          <div className="logo" onClick={() => goTab('weave')} style={{ cursor: 'pointer' }}>
            Sufi<span>Soul</span>
          </div>
          {identity && (
            <button
              className="sufi-badge sufi-badge-emerald"
              style={{ cursor: 'pointer', border: 'none', fontFamily: 'inherit' }}
              onClick={() => { goTab('profile'); setTempTakhallus(identity.takhallus); }}
            >
              ~ {identity.takhallus}
            </button>
          )}
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="container" style={{ flexGrow: 1 }}>

        {/* ════════════════════════════════
            WEAVE — PSYCHIC WIZARD
        ════════════════════════════════ */}
        {activeTab === 'weave' && (
          <div className="step-container">

            {/* progress bar */}
            {wizardStep <= 4 && (
              <div style={{
                width: '100%', height: '2px', background: '#111',
                borderRadius: '2px', overflow: 'hidden', marginBottom: '0.5rem',
              }}>
                <div style={{
                  height: '100%', background: 'var(--emerald)',
                  width: `${(wizardStep / 4) * 100}%`,
                  transition: 'width 400ms cubic-bezier(0.25,0,0,1)',
                }} />
              </div>
            )}

            {/* STEP 1 — MOOD */}
            {wizardStep === 1 && (
              <div className="animate-fade-in">
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--emerald)', textTransform: 'uppercase', marginBottom: '1rem' }}>
                    {hasSetInitialMood ? 'Step 1 of 4' : 'Resonance Selection'}
                  </p>
                  <h1 style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                    How does your heart feel?
                  </h1>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Select the emotional resonance(s) that guide your soul. You can select multiple.
                  </p>
                </div>

                <div className="options-grid">
                  {MOODS.map(m => (
                    <div
                      key={m.id}
                      className={`option-box ${selectedMoods.includes(m.id) ? 'active' : ''}`}
                      style={{ padding: '1.75rem 1rem' }}
                      onClick={() => {
                        setSelectedMoods(prev => {
                          let next;
                          if (prev.includes(m.id)) {
                            next = prev.length > 1 ? prev.filter(x => x !== m.id) : prev;
                          } else {
                            next = [...prev, m.id];
                          }
                          localStorage.setItem('sufisoul_selected_moods', JSON.stringify(next));
                          return next;
                        });
                      }}
                    >
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem', fontFamily: 'var(--font-urdu)', lineHeight: 1 }}>
                        {m.urdu}
                      </div>
                      <div className="option-box-title" style={{ fontSize: '1rem', marginBottom: '0.4rem' }}>{m.label}</div>
                      <div className="option-box-desc">{m.desc}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.5rem' }}>
                  {hasSetInitialMood ? (
                    <button
                      className="sufi-btn sufi-btn-emerald"
                      style={{ maxWidth: '300px', padding: '1rem 2rem', fontSize: '1rem' }}
                      onClick={() => setWizardStep(2)}
                      disabled={selectedMoods.length === 0}
                    >
                      Continue to Form →
                    </button>
                  ) : (
                    <button
                      className="sufi-btn sufi-btn-emerald"
                      style={{ maxWidth: '300px', padding: '1rem 2rem', fontSize: '1rem' }}
                      onClick={() => {
                        if (selectedMoods.length === 0) return;
                        localStorage.setItem('sufisoul_has_set_initial_mood', 'true');
                        setHasSetInitialMood(true);
                        const moodsStr = selectedMoods.join(',');
                        setFeedMoodFilter(moodsStr);
                        fetchFeed(moodsStr, feedGenreFilter);
                        setActiveTab('circle');
                      }}
                      disabled={selectedMoods.length === 0}
                    >
                      Explore the Circle ✦
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2 — GENRE */}
            {wizardStep === 2 && (
              <div className="animate-fade-in">
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--emerald)', textTransform: 'uppercase', marginBottom: '1rem' }}>
                    Step 2 of 4
                  </p>
                  <h1 style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                    What form shall this take?
                  </h1>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Choose the poetic structure that best fits your expression.
                  </p>
                </div>

                <div className="options-grid">
                  {GENRES.map(g => (
                    <div
                      key={g.id}
                      className={`option-box ${selectedGenre === g.id ? 'active' : ''}`}
                      style={{ padding: '1.5rem 1rem' }}
                      onClick={() => { setSelectedGenre(g.id); setWizardStep(3); }}
                    >
                      <div style={{ fontSize: '1.2rem', marginBottom: '0.4rem', fontFamily: 'var(--font-urdu)', lineHeight: 1 }}>
                        {g.urdu}
                      </div>
                      <div className="option-box-title" style={{ fontSize: '0.95rem', marginBottom: '0.35rem' }}>{g.label}</div>
                      <div className="option-box-desc">{g.desc}</div>
                    </div>
                  ))}
                </div>

                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                  <button style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.8rem', cursor: 'pointer' }}
                    onClick={() => setWizardStep(1)}>
                    ← Back to mood
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 — WORDS */}
            {wizardStep === 3 && (
              <div className="animate-fade-in">
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--emerald)', textTransform: 'uppercase', marginBottom: '1rem' }}>
                    Step 3 of 4
                  </p>
                  <h1 style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                    Any words or memories?
                  </h1>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    A phrase, a name, or a feeling. Leave empty to let the weaver flow freely.
                  </p>
                </div>

                <div className="sufi-card">
                  <label className="sufi-label">Your seed words</label>
                  <textarea
                    className="sufi-textarea"
                    style={{ height: '120px', resize: 'none', textAlign: 'center', fontStyle: 'italic', fontSize: '1.1rem', lineHeight: 1.7 }}
                    placeholder="rain, waiting, her name, last summer…"
                    value={customInput}
                    onChange={e => setCustomInput(e.target.value)}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button className="sufi-btn sufi-btn-outline" style={{ flex: 1 }} onClick={() => setWizardStep(2)}>
                      Back
                    </button>
                    <button className="sufi-btn sufi-btn-emerald" style={{ flex: 1 }} onClick={() => setWizardStep(4)}>
                      {customInput.trim() ? 'Continue →' : 'Skip & Continue →'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4 — LENGTH */}
            {wizardStep === 4 && (
              <div className="animate-fade-in">
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--emerald)', textTransform: 'uppercase', marginBottom: '1rem' }}>
                    Step 4 of 4
                  </p>
                  <h1 style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                    How deep shall it run?
                  </h1>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Set the length before the weaving begins.
                  </p>
                </div>

                <div className="sufi-card">
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {[
                      { id: 'short', label: 'Brief Moment', desc: 'Quick & powerful' },
                      { id: 'medium', label: 'A Journey', desc: 'Longer exploration' },
                    ].map(l => (
                      <button
                        key={l.id}
                        onClick={() => setSelectedLength(l.id)}
                        style={{
                          flex: 1, padding: '1.5rem 0.75rem', borderRadius: 'var(--radius)',
                          border: `1px solid ${selectedLength === l.id ? 'var(--emerald)' : 'var(--border)'}`,
                          background: selectedLength === l.id ? 'var(--emerald-glow)' : 'transparent',
                          color: selectedLength === l.id ? 'var(--emerald)' : 'var(--text-secondary)',
                          cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit',
                          transition: 'all 200ms ease',
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.35rem' }}>{l.label}</div>
                        <div style={{ fontSize: '0.72rem', opacity: 0.7 }}>{l.desc}</div>
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="sufi-btn sufi-btn-outline" style={{ flex: 1 }} onClick={() => setWizardStep(3)}>
                      Back
                    </button>
                    <button className="sufi-btn sufi-btn-emerald" style={{ flex: 2, padding: '1rem' }} onClick={handleWeavePoetry}>
                      ✦ Weave Poetry
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5 — LOADING */}
            {wizardStep === 5 && (
              <div className="weaving-mandalas">
                <div className="spinner" />
                <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                  Weaving your verses…
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--emerald)', fontStyle: 'italic' }}>
                  {selectedMoods.length > 1
                    ? 'Blending the resonances of your heart...'
                    : LOADING_LINES[selectedMoods[0]] || 'Tuning the instrument of soul...'}
                </p>
              </div>
            )}

            {/* STEP 6 — OUTPUT */}
            {wizardStep === 6 && generatedPoem && (
              <div className="animate-fade-in" style={{ maxWidth: '580px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <span className="sufi-badge sufi-badge-emerald">✦ Weaved Creation</span>
                </div>

                <div className="sufi-card featured" style={{ padding: '2.5rem 2rem', position: 'relative', overflow: 'hidden' }}>
                  {/* ambient glow */}
                  <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: 'radial-gradient(circle at center, rgba(16,185,129,0.06) 0%, transparent 70%)',
                  }} />

                  <div className="poetic-text" style={{ fontSize: '1.4rem', lineHeight: 2.1, marginBottom: '1rem', whiteSpace: 'pre-line' }}>
                    {generatedPoem.content_roman}
                  </div>

                  {generatedPoem.content_nastaliq && (
                    <div className="urdu-text" style={{
                      color: 'var(--emerald)', borderTop: '1px dashed #1a1a1a',
                      padding: '1.5rem 0 0.5rem',
                    }}>
                      {generatedPoem.content_nastaliq}
                    </div>
                  )}

                  {generatedPoem.english_translation && (
                    <div style={{
                      textAlign: 'center', fontStyle: 'italic', fontSize: '0.85rem',
                      color: 'var(--text-dim)', borderTop: '1px solid #121212',
                      paddingTop: '1.25rem', marginTop: '0.5rem',
                    }}>
                      &ldquo;{generatedPoem.english_translation}&rdquo;
                    </div>
                  )}

                  {generatedPoem.meter_note && (
                    <div style={{
                      marginTop: '1.5rem', fontSize: '0.78rem', color: 'var(--emerald)',
                      background: 'var(--emerald-glow)', padding: '0.875rem 1rem',
                      borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16,185,129,0.2)',
                    }}>
                      <strong>Weaver&apos;s Note:</strong> {generatedPoem.meter_note}
                    </div>
                  )}

                  {/* publish controls */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-dim)', cursor: 'pointer' }}>
                        <input type="checkbox" id="anon-toggle" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} style={{ accentColor: 'var(--emerald)' }} />
                        Post as Gumnaam
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-dim)', cursor: 'pointer' }}>
                        <input type="checkbox" id="collab-toggle" checked={allowCollab} onChange={e => setAllowCollab(e.target.checked)} style={{ accentColor: 'var(--emerald)' }} />
                        Open for collaboration
                      </label>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button className="sufi-btn sufi-btn-outline" style={{ flex: 1 }} onClick={() => setWizardStep(1)}>
                        Discard
                      </button>
                      <button className="sufi-btn sufi-btn-emerald" style={{ flex: 2 }} onClick={handlePublishPoetry} disabled={isPublishing}>
                        {isPublishing ? 'Publishing…' : '✦ Release to Circle'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════
            THE CIRCLE — FEED
        ════════════════════════════════ */}
        {activeTab === 'circle' && (
          <div className="animate-fade-in">
            <div style={{ textAlign: 'center', padding: '2rem 0 2rem' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>The Circle</h1>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Echoes shared by the subcontinent tribe.</p>
            </div>

            {/* mood chips */}
            <div className="feed-filter-bar">
              {['all', 'ishq', 'gham', 'falsafa', 'sufi', 'umeed'].map(m => (
                <button key={m} className={`filter-chip ${feedMoodFilter === m ? 'active' : ''}`}
                  onClick={() => { setFeedMoodFilter(m); fetchFeed(m, feedGenreFilter); }}>
                  {m === 'all' ? 'All Moods' : m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>

            {/* genre chips */}
            <div className="feed-filter-bar" style={{ marginBottom: '1.5rem' }}>
              {['all', 'sher', 'ghazal', 'nazm', 'free_verse'].map(g => (
                <button key={g} className={`filter-chip ${feedGenreFilter === g ? 'active' : ''}`}
                  onClick={() => { setFeedGenreFilter(g); fetchFeed(feedMoodFilter, g); }}>
                  {g === 'all' ? 'All Forms' : g.replace('_', ' ').charAt(0).toUpperCase() + g.replace('_', ' ').slice(1)}
                </button>
              ))}
            </div>

            {isLoadingFeed ? (
              <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-dim)' }}>
                <div className="spinner" style={{ margin: '0 auto 1.25rem' }} />
                Reading the circle&apos;s logs…
              </div>
            ) : feedPoems.length === 0 ? (
              <div className="sufi-card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-dim)' }}>
                No poetry matching this resonance yet.<br />
                <span style={{ color: 'var(--emerald)', cursor: 'pointer' }} onClick={() => goTab('weave')}>
                  Go weave one →
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {feedPoems.map(poem => (
                  <div key={poem.id} className="sufi-card" style={{ padding: '2rem' }}>
                    {/* header row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                          ~ {poem.is_anonymous ? 'Gumnaam' : poem.takhallus || 'Sufi'}
                        </span>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                          {new Date(poem.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <span className="sufi-badge">{poem.mood}</span>
                        <span className="sufi-badge sufi-badge-emerald">{poem.genre}</span>
                      </div>
                    </div>

                    {/* poem body */}
                    <div className="poetic-text" style={{ padding: '1.25rem 0', whiteSpace: 'pre-line', textAlign: 'center' }}>
                      {poem.content_roman}
                    </div>

                    {/* script toggles */}
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '0.5rem' }}>
                      {poem.content_nastaliq && (
                        <button
                          style={{
                            fontSize: '0.72rem', padding: '0.3rem 0.75rem', borderRadius: '20px', cursor: 'pointer',
                            border: `1px solid ${showNastaliqMap[poem.id] ? 'var(--emerald)' : 'var(--border)'}`,
                            color: showNastaliqMap[poem.id] ? 'var(--emerald)' : 'var(--text-dim)',
                            background: 'transparent', fontFamily: 'inherit',
                          }}
                          onClick={() => setShowNastaliqMap(p => ({ ...p, [poem.id]: !p[poem.id] }))}
                        >Urdu Script</button>
                      )}
                      <button
                        style={{
                          fontSize: '0.72rem', padding: '0.3rem 0.75rem', borderRadius: '20px', cursor: 'pointer',
                          border: `1px solid ${showEnglishMap[poem.id] ? 'var(--emerald)' : 'var(--border)'}`,
                          color: showEnglishMap[poem.id] ? 'var(--emerald)' : 'var(--text-dim)',
                          background: 'transparent', fontFamily: 'inherit',
                        }}
                        onClick={() => setShowEnglishMap(p => ({ ...p, [poem.id]: !p[poem.id] }))}
                      >English</button>
                    </div>

                    {showNastaliqMap[poem.id] && poem.content_nastaliq && (
                      <div className="urdu-text" style={{ color: 'var(--emerald)', borderTop: '1px dashed var(--border)', paddingTop: '1.25rem' }}>
                        {poem.content_nastaliq}
                      </div>
                    )}
                    {showEnglishMap[poem.id] && (
                      <div style={{ textAlign: 'center', fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                        &ldquo;{poem.genre === 'sher' ? 'A couplet captured in time…' : 'A song woven from the depths…'}&rdquo;
                      </div>
                    )}

                    {/* action row */}
                    <div className="card-actions" style={{ justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button className={`action-btn ${likedPoems.includes(poem.id) ? 'active' : ''}`} onClick={() => handleLikePoem(poem.id)}>
                          <IconHeart filled={likedPoems.includes(poem.id)} />
                        </button>
                        <button className="action-btn" onClick={() => handleCopyPoem(poem)} title="Copy">
                          <IconCopy />
                        </button>
                        <button className="action-btn" onClick={() => handleShareWhatsApp(poem)} title="WhatsApp" style={{ color: 'var(--text-dim)' }}>
                          <span style={{ width: '20px', height: '20px', display: 'inline-block' }}><IconWhatsApp /></span>
                        </button>
                        {poem.collab_open && (
                          <button className="action-btn" style={{ color: 'var(--emerald)', fontWeight: 600, fontSize: '0.78rem' }}
                            onClick={() => { goTab('mushaira'); handleOpenCollabModal(poem); }}>
                            Collab
                          </button>
                        )}
                      </div>
                      {identity && poem.device_uuid === identity.device_uuid && (
                        <button className="action-btn" style={{ color: '#ef4444', fontSize: '0.75rem' }}
                          onClick={() => handleDeletePoem(poem.id)}>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════
            MUSHAIRA — COLLAB HUB
        ════════════════════════════════ */}
        {activeTab === 'mushaira' && (
          <div className="animate-fade-in">
            <div style={{ textAlign: 'center', padding: '2rem 0 2rem' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Mushaira</h1>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Add your Misra-e-Sani and complete the couplet together.</p>
            </div>

            {/* Start new collab */}
            <div className="sufi-card" style={{ marginBottom: '2rem' }}>
              <span className="sufi-label">Start a new collaboration</span>
              <form onSubmit={handleStartCollabPoem} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginTop: '0.25rem' }}>
                <input
                  type="text" className="sufi-input"
                  style={{ textAlign: 'center', fontStyle: 'italic', fontSize: '1.05rem' }}
                  placeholder="Write the opening line…"
                  value={collabStarterRoman}
                  onChange={e => setCollabStarterRoman(e.target.value)}
                  required
                />
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <select className="sufi-select" style={{ flex: 1 }} value={collabStarterGenre} onChange={e => setCollabStarterGenre(e.target.value)}>
                    <option value="sher">Sher</option>
                    <option value="ghazal">Ghazal</option>
                    <option value="free_verse">Free Verse</option>
                  </select>
                  <select className="sufi-select" style={{ flex: 1 }} value={collabStarterMood} onChange={e => setCollabStarterMood(e.target.value)}>
                    {MOODS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                </div>
                <button type="submit" className="sufi-btn sufi-btn-emerald" disabled={isStartingCollab}>
                  {isStartingCollab ? 'Posting…' : '✦ Open for Collaboration'}
                </button>
              </form>
            </div>

            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              Open Verses
            </h2>

            {collabPoems.length === 0 ? (
              <div className="sufi-card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-dim)' }}>
                No active collaborations yet. Start one above!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {collabPoems.map(poem => (
                  <div key={poem.id} className="sufi-card" style={{ padding: '1.75rem', borderLeft: '2px solid var(--emerald)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>~ {poem.takhallus}</span>
                      <span className="sufi-badge sufi-badge-emerald">{poem.genre}</span>
                    </div>
                    <p className="poetic-text" style={{ fontSize: '1.1rem', marginBottom: '1.25rem', fontStyle: 'italic' }}>
                      &ldquo;{poem.content_roman}&rdquo;
                    </p>
                    <button className="sufi-btn sufi-btn-outline" style={{ width: 'auto', padding: '0.6rem 1.25rem', fontSize: '0.82rem' }}
                      onClick={() => handleOpenCollabModal(poem)}>
                      Answer / Complete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════
            PROFILE / IDENTITY
        ════════════════════════════════ */}
        {activeTab === 'profile' && (
          <div className="animate-fade-in">
            <div style={{ textAlign: 'center', padding: '2rem 0 2rem' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Your Identity</h1>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-poetic)', fontStyle: 'italic' }}>
                Device-local. Anonymous by default.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* edit takhallus */}
              <div className="sufi-card" style={{ padding: '1.75rem' }}>
                <label className="sufi-label" style={{ marginBottom: '1rem', display: 'block' }}>Configure Pen Name (Takhallus)</label>
                <form onSubmit={handleUpdateTakhallus} style={{ display: 'flex', gap: '0.75rem' }}>
                  <input type="text" className="sufi-input" placeholder="New takhallus" value={tempTakhallus} onChange={e => setTempTakhallus(e.target.value)} required />
                  <button type="submit" className="sufi-btn sufi-btn-emerald" style={{ width: 'auto', padding: '0.75rem 1.25rem', whiteSpace: 'nowrap' }}>
                    Save
                  </button>
                </form>
              </div>

              {/* device info */}
              <div className="sufi-card" style={{ padding: '1.5rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                <div style={{ marginBottom: '0.6rem' }}>
                  <strong style={{ color: 'var(--text-secondary)' }}>Pen Name:</strong> {identity?.takhallus}
                </div>
                <div style={{ marginBottom: '0.6rem', wordBreak: 'break-all' }}>
                  <strong style={{ color: 'var(--text-secondary)' }}>Device Token:</strong>{' '}
                  <code style={{ color: 'var(--emerald)', fontSize: '0.72rem' }}>{identity?.device_uuid}</code>
                </div>
                <div style={{ fontSize: '0.72rem', marginTop: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                  Your posts are tied to this device. Clearing browser cache will reset identity.
                </div>
              </div>

              {/* user poems */}
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)', marginTop: '0.5rem' }}>
                Your Weavings
              </h2>

              {feedPoems.filter(p => identity && p.device_uuid === identity.device_uuid).length === 0 ? (
                <div className="sufi-card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-dim)' }}>
                  You haven&apos;t woven any shayari yet.{' '}
                  <span style={{ color: 'var(--emerald)', cursor: 'pointer' }} onClick={() => goTab('weave')}>Start here →</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {feedPoems.filter(p => identity && p.device_uuid === identity.device_uuid).map(poem => (
                    <div key={poem.id} className="sufi-card" style={{ padding: '1.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                          {new Date(poem.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="sufi-badge sufi-badge-emerald">{poem.genre}</span>
                      </div>
                      <p className="poetic-text" style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>
                        {poem.content_roman}
                      </p>
                      <div style={{ textAlign: 'right' }}>
                        <button style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit' }}
                          onClick={() => handleDeletePoem(poem.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── BOTTOM NAV ── */}
      <nav className="sufi-nav">
        {([
          { id: 'weave',    label: 'Weave',    Icon: IconFeather },
          { id: 'circle',   label: 'Circle',   Icon: IconCircle  },
          { id: 'mushaira', label: 'Mushaira', Icon: IconMic     },
          { id: 'profile',  label: 'Identity', Icon: IconUser    },
        ] as const).map(t => (
          <button key={t.id} className={`nav-link ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => goTab(t.id)}>
            <t.Icon />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {/* ── WELCOME MODAL ── */}
      {showWelcomeModal && (
        <div className="sufi-modal-overlay">
          <div className="sufi-modal">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✦</div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Step into the Circle
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Choose a pen name — your takhallus — to weave and share Shayari. It stays on this device only.
              </p>
            </div>

            <form onSubmit={handleWelcomeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                id="welcome-takhallus"
                type="text"
                className="sufi-input"
                style={{ textAlign: 'center', fontSize: '1.2rem', padding: '1rem', letterSpacing: '0.02em' }}
                placeholder="E.g., Faiz, Ghalib, Faraz…"
                value={tempTakhallus}
                onChange={e => setTempTakhallus(e.target.value)}
                required
                autoFocus
              />
              <button type="submit" className="sufi-btn sufi-btn-emerald" style={{ padding: '1rem', fontSize: '1rem' }}>
                ✦ Begin the Ritual
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── COLLAB MODAL ── */}
      {selectedCollabPoem && (
        <div className="sufi-modal-overlay">
          <div className="sufi-modal" style={{ maxWidth: '520px' }}>
            <button className="sufi-modal-close" onClick={() => setSelectedCollabPoem(null)}>✕</button>

            <div>
              <span className="sufi-badge sufi-badge-emerald" style={{ marginBottom: '0.875rem', display: 'inline-block' }}>
                Original by ~ {selectedCollabPoem.takhallus}
              </span>
              <p className="poetic-text" style={{ fontSize: '1.2rem', fontStyle: 'italic', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem' }}>
                &ldquo;{selectedCollabPoem.content_roman}&rdquo;
              </p>
            </div>

            <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem' }}>
              <span className="sufi-label">Active completions</span>
              {activeCollabResponses.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>No replies yet. Match the misra first!</div>
              ) : (
                activeCollabResponses.map(c => (
                  <div key={c.id} style={{ background: 'black', padding: '0.875rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <p className="poetic-text" style={{ fontSize: '0.95rem', fontStyle: 'italic', color: 'var(--emerald)', marginBottom: '0.35rem' }}>
                      &ldquo;{c.contribution}&rdquo;
                    </p>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textAlign: 'right' }}>— ~ {c.takhallus}</div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSubmitCollab} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <label className="sufi-label" htmlFor="collab-contribution">Add your line (Misra-e-Sani)</label>
              <textarea
                id="collab-contribution"
                className="sufi-textarea"
                style={{ height: '96px', resize: 'none', fontSize: '1rem' }}
                placeholder="Complete the rhythm…"
                value={collabContribution}
                onChange={e => setCollabContribution(e.target.value)}
                required
              />
              <button type="submit" className="sufi-btn sufi-btn-emerald" style={{ padding: '1rem' }} disabled={isSubmittingCollab}>
                {isSubmittingCollab ? 'Submitting…' : '✦ Complete Couplet'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
