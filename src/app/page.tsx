"use client";

import { useState, useEffect } from 'react';
import { db, Poem, Collab } from '@/lib/supabase';
import { getIdentity, saveIdentity, Identity } from '@/lib/identity';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'weave' | 'circle' | 'mushaira' | 'profile'>('weave');
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [tempTakhallus, setTempTakhallus] = useState('');
  
  // Wizard flow step tracker for the poetry weaving process
  const [wizardStep, setWizardStep] = useState<number>(1);
  
  // Weave Creator State
  const [selectedMood, setSelectedMood] = useState('ishq');
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
  
  // Sharing Options State
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [allowCollab, setAllowCollab] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Feed (The Circle) State
  const [feedPoems, setFeedPoems] = useState<Poem[]>([]);
  const [feedMoodFilter, setFeedMoodFilter] = useState('all');
  const [feedGenreFilter, setFeedGenreFilter] = useState('all');
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [showNastaliqMap, setShowNastaliqMap] = useState<Record<string, boolean>>({});
  const [showEnglishMap, setShowEnglishMap] = useState<Record<string, boolean>>({});
  const [likedPoems, setLikedPoems] = useState<string[]>([]);

  // Mushaira Collab State
  const [collabPoems, setCollabPoems] = useState<Poem[]>([]);
  const [selectedCollabPoem, setSelectedCollabPoem] = useState<Poem | null>(null);
  const [collabContribution, setCollabContribution] = useState('');
  const [activeCollabResponses, setActiveCollabResponses] = useState<Collab[]>([]);
  const [isSubmittingCollab, setIsSubmittingCollab] = useState(false);
  const [isStartingCollab, setIsStartingCollab] = useState(false);
  const [collabStarterRoman, setCollabStarterRoman] = useState('');
  const [collabStarterGenre, setCollabStarterGenre] = useState('sher');
  const [collabStarterMood, setCollabStarterMood] = useState('ishq');

  // Load User Identity and Seed Feed
  useEffect(() => {
    const ident = getIdentity();
    if (!ident) {
      setShowWelcomeModal(true);
    } else {
      setIdentity(ident);
    }

    // Load Liked states
    const localLikes = localStorage.getItem('sufisoul_likes');
    if (localLikes) {
      setLikedPoems(JSON.parse(localLikes));
    }

    fetchFeed();
    fetchCollabFeed();
  }, []);

  // Fetch feed list
  const fetchFeed = async (mood = feedMoodFilter, genre = feedGenreFilter) => {
    setIsLoadingFeed(true);
    try {
      const list = await db.getPoems({ mood, genre });
      setFeedPoems(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  // Fetch open collaborations
  const fetchCollabFeed = async () => {
    try {
      const list = await db.getPoems({ genre: 'all' });
      setCollabPoems(list.filter(p => p.collab_open));
    } catch (err) {
      console.error(err);
    }
  };

  const handleWelcomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempTakhallus.trim()) return;
    const newIdent = saveIdentity(tempTakhallus);
    setIdentity(newIdent);
    setShowWelcomeModal(false);
  };

  const handleUpdateTakhallus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempTakhallus.trim()) return;
    const newIdent = saveIdentity(tempTakhallus, identity?.device_uuid);
    setIdentity(newIdent);
    setTempTakhallus('');
    alert('Takhallus updated successfully.');
  };

  // Weave Action
  const handleWeavePoetry = async () => {
    setIsWeaving(true);
    setGeneratedPoem(null);
    setWizardStep(5); // Transition to loading step
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: selectedMood,
          genre: selectedGenre,
          length: selectedLength,
          custom_input: customInput
        })
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedPoem(data);
        setWizardStep(6); // Show output step
      } else {
        alert(data.error || 'Failed to weave poetry.');
        setWizardStep(4);
      }
    } catch (err) {
      console.error(err);
      alert('Network or server error during generation.');
      setWizardStep(4);
    } finally {
      setIsWeaving(false);
    }
  };

  // Publish Generated Poetry
  const handlePublishPoetry = async () => {
    if (!generatedPoem || !identity) return;
    setIsPublishing(true);
    try {
      await db.createPoem({
        device_uuid: identity.device_uuid,
        takhallus: isAnonymous ? 'Gumnaam' : identity.takhallus,
        mood: selectedMood,
        genre: selectedGenre,
        content_roman: generatedPoem.content_roman,
        content_nastaliq: generatedPoem.content_nastaliq,
        is_anonymous: isAnonymous,
        collab_open: allowCollab
      });
      setGeneratedPoem(null);
      setCustomInput('');
      setWizardStep(1); // Reset wizard
      fetchFeed();
      fetchCollabFeed();
      setActiveTab('circle');
    } catch (err) {
      console.error(err);
      alert('Failed to publish poetry.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Like a Poem
  const handleLikePoem = (poemId: string) => {
    let updatedLikes = [...likedPoems];
    if (likedPoems.includes(poemId)) {
      updatedLikes = updatedLikes.filter(id => id !== poemId);
    } else {
      updatedLikes.push(poemId);
    }
    setLikedPoems(updatedLikes);
    localStorage.setItem('sufisoul_likes', JSON.stringify(updatedLikes));
  };

  // Share Poem (Copy)
  const handleCopyPoem = (poem: Poem) => {
    const textToCopy = `${poem.content_roman}\n\n— ${poem.is_anonymous ? 'Gumnaam' : poem.takhallus || 'Sufi'}\n\nShared via SufiSoul`;
    navigator.clipboard.writeText(textToCopy);
    alert('Poem copied to clipboard!');
  };

  // Share via WhatsApp
  const handleShareWhatsApp = (poem: Poem) => {
    const textToShare = `${poem.content_roman}\n\n— ${poem.is_anonymous ? 'Gumnaam' : poem.takhallus || 'Sufi'}\n\nShared via SufiSoul`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(textToShare)}`;
    window.open(url, '_blank');
  };

  // Fetch Collabs for a parent poem
  const handleOpenCollabModal = async (poem: Poem) => {
    setSelectedCollabPoem(poem);
    setCollabContribution('');
    try {
      const list = await db.getCollabs(poem.id);
      setActiveCollabResponses(list);
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Collaboration
  const handleSubmitCollab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollabPoem || !collabContribution.trim() || !identity) return;
    setIsSubmittingCollab(true);
    try {
      await db.createCollab({
        parent_poem_id: selectedCollabPoem.id,
        device_uuid: identity.device_uuid,
        takhallus: identity.takhallus,
        contribution: collabContribution
      });
      const list = await db.getCollabs(selectedCollabPoem.id);
      setActiveCollabResponses(list);
      setCollabContribution('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingCollab(false);
    }
  };

  // Create collaboration starter
  const handleStartCollabPoem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collabStarterRoman.trim() || !identity) return;
    setIsStartingCollab(true);
    try {
      await db.createPoem({
        device_uuid: identity.device_uuid,
        takhallus: identity.takhallus,
        mood: collabStarterMood,
        genre: collabStarterGenre,
        content_roman: collabStarterRoman,
        is_anonymous: false,
        collab_open: true
      });
      setCollabStarterRoman('');
      fetchCollabFeed();
    } catch (err) {
      console.error(err);
    } finally {
      setIsStartingCollab(false);
    }
  };

  // Delete a poem
  const handleDeletePoem = async (id: string) => {
    if (!identity) return;
    if (!confirm('Are you sure you want to delete this poetry?')) return;
    try {
      const deleted = await db.deletePoem(id, identity.device_uuid);
      if (deleted) {
        fetchFeed();
        fetchCollabFeed();
      } else {
        alert('You can only delete poetry created on this device.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 md:pb-0">
      
      {/* HEADER SECTION */}
      <header className="sufi-header">
        <div className="header-content">
          <div className="logo" onClick={() => { setActiveTab('weave'); setWizardStep(1); }} style={{cursor: 'pointer'}}>
            Sufi<span>Soul</span>
          </div>
          {identity && (
            <div 
              className="sufi-badge sufi-badge-emerald cursor-pointer"
              onClick={() => {
                setActiveTab('profile');
                setTempTakhallus(identity.takhallus);
              }}
            >
              ~ {identity.takhallus}
            </div>
          )}
        </div>
      </header>

      {/* MAIN CONTENT SPACE */}
      <main className="container flex-grow">
        
        {/* WEAVE POETRY (PSYCHIC WIZARD FLOW) */}
        {activeTab === 'weave' && (
          <div className="step-container">
            
            {/* Progress indicators for the ritual flow */}
            {wizardStep <= 4 && (
              <div className="w-full bg-[#111] h-1 rounded overflow-hidden mb-8">
                <div 
                  className="bg-emerald-primary h-full transition-all duration-300"
                  style={{ width: `${(wizardStep / 4) * 100}%` }}
                ></div>
              </div>
            )}

            {/* STEP 1: MOOD */}
            {wizardStep === 1 && (
              <div className="animate-fade-in">
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-bold tracking-tight text-white mb-2">How does your heart feel today?</h1>
                  <p className="text-sm text-dim">Select the emotional resonance that guides your search.</p>
                </div>

                <div className="options-grid">
                  {[
                    { id: 'ishq', label: 'Ishq', desc: 'Devotion & intense love' },
                    { id: 'gham', label: 'Gham', desc: 'Heartbreak, grief & longing' },
                    { id: 'falsafa', label: 'Falsafa', desc: 'Reflective life philosophy' },
                    { id: 'sufi', label: 'Sufi', desc: 'Mysticism & divine connection' },
                    { id: 'umeed', label: 'Umeed', desc: 'Hope, light & renewal' }
                  ].map(m => (
                    <div 
                      key={m.id} 
                      className={`option-box py-8 ${selectedMood === m.id ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedMood(m.id);
                        setWizardStep(2);
                      }}
                    >
                      <div className="option-box-title text-xl mb-1">{m.label}</div>
                      <div className="option-box-desc">{m.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: GENRE */}
            {wizardStep === 2 && (
              <div className="animate-fade-in">
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-bold tracking-tight text-white mb-2">What form shall this take?</h1>
                  <p className="text-sm text-dim">Choose the poetic rhythm that best fits your expression.</p>
                </div>

                <div className="options-grid">
                  {[
                    { id: 'sher', label: 'Sher', desc: 'A stand-alone two-line couplet' },
                    { id: 'ghazal', label: 'Ghazal', desc: 'Traditional rhyming multi-couplet poem' },
                    { id: 'nazm', label: 'Nazm', desc: 'Continuous themed structured poem' },
                    { id: 'free_verse', label: 'Free Verse', desc: 'Modern layout without strict rhyme rules' },
                    { id: 'rap', label: 'Rap Bars', desc: 'Punchy street poetry with heavy rhythms' }
                  ].map(g => (
                    <div 
                      key={g.id} 
                      className={`option-box py-6 ${selectedGenre === g.id ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedGenre(g.id);
                        setWizardStep(3);
                      }}
                    >
                      <div className="option-box-title text-lg mb-1">{g.label}</div>
                      <div className="option-box-desc">{g.desc}</div>
                    </div>
                  ))}
                </div>

                <div className="text-center mt-6">
                  <button 
                    className="text-xs text-emerald-primary hover:underline"
                    onClick={() => setWizardStep(1)}
                  >
                    ← Back to mood
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: EXPERIENCE (WORDS) */}
            {wizardStep === 3 && (
              <div className="animate-fade-in">
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Any specific words or memories?</h1>
                  <p className="text-sm text-dim">Provide a memory, a phrase, or words like "rain" or "waiting". Skip to let the weaver flow freely.</p>
                </div>

                <div className="sufi-card">
                  <textarea 
                    className="sufi-textarea h-32 resize-none text-center italic text-lg"
                    placeholder="Enter keywords or feelings... (or leave empty to skip)"
                    value={customInput}
                    onChange={e => setCustomInput(e.target.value)}
                    autoFocus
                  />
                  
                  <div className="flex gap-4 mt-6">
                    <button 
                      className="sufi-btn sufi-btn-outline flex-1"
                      onClick={() => setWizardStep(2)}
                    >
                      Back
                    </button>
                    <button 
                      className="sufi-btn sufi-btn-emerald flex-1"
                      onClick={() => setWizardStep(4)}
                    >
                      {customInput.trim() ? 'Continue' : 'Skip & Continue'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: LENGTH & RUN */}
            {wizardStep === 4 && (
              <div className="animate-fade-in">
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-bold tracking-tight text-white mb-2">How deep shall the poetry run?</h1>
                  <p className="text-sm text-dim">Set the duration and length parameters before the weaving begins.</p>
                </div>

                <div className="sufi-card">
                  <div className="flex gap-4 mb-8">
                    {[
                      { id: 'short', label: 'Brief Moment', desc: 'A quick, powerful capture' },
                      { id: 'medium', label: 'A Journey', desc: 'A longer, detailed exploration' }
                    ].map(l => (
                      <button 
                        key={l.id}
                        className={`flex-1 py-6 rounded border text-center ${
                          selectedLength === l.id 
                            ? 'border-emerald-primary text-emerald-primary bg-emerald-glow' 
                            : 'border-card-border text-text-muted bg-transparent'
                        }`}
                        onClick={() => setSelectedLength(l.id)}
                      >
                        <div className="font-semibold text-lg">{l.label}</div>
                        <div className="text-[10px] opacity-70 mt-1">{l.desc}</div>
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-4">
                    <button 
                      className="sufi-btn sufi-btn-outline flex-1"
                      onClick={() => setWizardStep(3)}
                    >
                      Back
                    </button>
                    <button 
                      className="sufi-btn sufi-btn-emerald flex-1 py-4 font-bold"
                      onClick={handleWeavePoetry}
                    >
                      Weave Poetry
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: WEAVING ANIMATION */}
            {wizardStep === 5 && (
              <div className="weaving-mandalas py-12 animate-pulse">
                <div className="spinner mb-6"></div>
                <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Weaving your verses...</h2>
                <div className="text-sm text-emerald-primary italic h-6 animate-pulse">
                  {selectedMood === 'ishq' && "Searching the realms of devotion..."}
                  {selectedMood === 'gham' && "Gathering the echoes of parting..."}
                  {selectedMood === 'falsafa' && "Pondering the architecture of life..."}
                  {selectedMood === 'sufi' && "Communing with the divine whispers..."}
                  {selectedMood === 'umeed' && "Stoking the sparks of a new dawn..."}
                </div>
              </div>
            )}

            {/* STEP 6: OUTPUT & PUBLISHING */}
            {wizardStep === 6 && generatedPoem && (
              <div className="animate-fade-in max-w-xl mx-auto">
                <div className="text-center mb-6">
                  <span className="sufi-badge sufi-badge-emerald">Weaved Creation</span>
                </div>

                <div className="sufi-card featured relative overflow-hidden py-10 px-8">
                  {/* Subtle ambient gold radial background glow */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)] pointer-events-none"></div>

                  <div className="poetic-text text-white text-2xl leading-loose font-serif italic mb-8 whitespace-pre-line">
                    {generatedPoem.content_roman}
                  </div>

                  {generatedPoem.content_nastaliq && (
                    <div className="urdu-text text-emerald-primary text-3xl leading-relaxed py-6 border-t border-dashed border-[#1a1a1a]">
                      {generatedPoem.content_nastaliq}
                    </div>
                  )}

                  {generatedPoem.english_translation && (
                    <div className="text-center italic text-sm text-dim border-t border-[#121212] pt-4 px-4">
                      "{generatedPoem.english_translation}"
                    </div>
                  )}

                  {generatedPoem.meter_note && (
                    <div className="mt-6 text-xs text-emerald-primary bg-emerald-glow p-4 rounded border border-emerald-primary/20">
                      <strong>Weaver's Note:</strong> {generatedPoem.meter_note}
                    </div>
                  )}

                  {/* Publishing Options */}
                  <div className="mt-8 border-t border-card-border pt-6 flex flex-col gap-4">
                    <div className="flex justify-between items-center text-xs text-dim">
                      <label className="flex items-center gap-2 cursor-pointer" htmlFor="anonymity-toggle">
                        <input 
                          id="anonymity-toggle"
                          type="checkbox" 
                          checked={isAnonymous} 
                          onChange={e => setIsAnonymous(e.target.checked)}
                          className="accent-emerald-primary"
                        />
                        Post anonymously (Gumnaam)
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer" htmlFor="collab-toggle">
                        <input 
                          id="collab-toggle"
                          type="checkbox" 
                          checked={allowCollab} 
                          onChange={e => setAllowCollab(e.target.checked)}
                          className="accent-emerald-primary"
                        />
                        Open for collaborations
                      </label>
                    </div>

                    <div className="flex gap-3 mt-2">
                      <button 
                        className="sufi-btn sufi-btn-outline flex-1"
                        onClick={() => setWizardStep(1)}
                      >
                        Discard
                      </button>
                      
                      <button 
                        className="sufi-btn sufi-btn-emerald flex-1"
                        onClick={handlePublishPoetry}
                        disabled={isPublishing}
                      >
                        {isPublishing ? 'Publishing...' : 'Release to Circle'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FEED (THE CIRCLE) TAB */}
        {activeTab === 'circle' && (
          <div className="animate-fade-in">
            <div className="text-center py-6 mb-4">
              <h1 className="text-3xl font-bold mb-2">The Circle</h1>
              <p className="text-sm text-dim">Scroll through the echoes shared by the subcontinent tribe.</p>
            </div>

            {/* Filter Bar */}
            <div className="feed-filter-bar">
              {['all', 'ishq', 'gham', 'falsafa', 'sufi', 'umeed'].map(mood => (
                <button
                  key={mood}
                  className={`filter-chip ${feedMoodFilter === mood ? 'active' : ''}`}
                  onClick={() => {
                    setFeedMoodFilter(mood);
                    fetchFeed(mood, feedGenreFilter);
                  }}
                >
                  {mood.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="feed-filter-bar mb-6">
              {['all', 'sher', 'ghazal', 'nazm', 'free_verse', 'rap'].map(genre => (
                <button
                  key={genre}
                  className={`filter-chip ${feedGenreFilter === genre ? 'active' : ''}`}
                  onClick={() => {
                    setFeedGenreFilter(genre);
                    fetchFeed(feedMoodFilter, genre);
                  }}
                >
                  {genre.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>

            {isLoadingFeed ? (
              <div className="text-center py-12 text-dim">
                <div className="spinner mx-auto mb-4"></div>
                Reading the circle's logs...
              </div>
            ) : feedPoems.length === 0 ? (
              <div className="text-center py-12 text-dim sufi-card">
                No poetry matching this resonance yet. Go weave one and share!
              </div>
            ) : (
              feedPoems.map(poem => (
                <div key={poem.id} className="sufi-card py-8 px-6 hover:border-emerald-primary/40 transition-all">
                  
                  {/* Card Header info */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="font-semibold text-white">
                        {poem.is_anonymous ? 'Gumnaam' : poem.takhallus || 'Sufi'}
                      </span>
                      <span className="text-[10px] text-dim block mt-0.5">
                        {new Date(poem.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="sufi-badge text-[9px]">{poem.mood}</span>
                      <span className="sufi-badge sufi-badge-emerald text-[9px]">{poem.genre}</span>
                    </div>
                  </div>

                  {/* Primary text (Roman Urdu) */}
                  <div className="poetic-text text-white my-8 whitespace-pre-line leading-relaxed">
                    {poem.content_roman}
                  </div>

                  {/* Secondary Toggles (Nastaliq & Translation) */}
                  <div className="flex gap-3 justify-center mb-6">
                    {poem.content_nastaliq && (
                      <button 
                        className={`text-xs px-3 py-1 rounded border ${
                          showNastaliqMap[poem.id] ? 'border-emerald-primary text-emerald-primary' : 'border-card-border text-dim'
                        }`}
                        onClick={() => setShowNastaliqMap(prev => ({ ...prev, [poem.id]: !prev[poem.id] }))}
                      >
                        Urdu Script
                      </button>
                    )}
                    <button 
                      className={`text-xs px-3 py-1 rounded border ${
                        showEnglishMap[poem.id] ? 'border-emerald-primary text-emerald-primary' : 'border-card-border text-dim'
                      }`}
                      onClick={() => setShowEnglishMap(prev => ({ ...prev, [poem.id]: !prev[poem.id] }))}
                    >
                      English Translation
                    </button>
                  </div>

                  {/* Toggled Content */}
                  {showNastaliqMap[poem.id] && poem.content_nastaliq && (
                    <div className="urdu-text my-8 border-t border-dashed border-[#1a1a1a] pt-6 text-emerald-primary">
                      {poem.content_nastaliq}
                    </div>
                  )}

                  {showEnglishMap[poem.id] && (
                    <div className="text-center italic text-sm text-dim my-6 border-t border-card-border pt-4 px-4">
                      "{poem.genre === 'sher' ? 'A couplet captured in time...' : 'A song woven from the depths...'}"
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="card-actions justify-between">
                    <div className="flex gap-4">
                      <button 
                        className={`action-btn ${likedPoems.includes(poem.id) ? 'active' : ''}`}
                        onClick={() => handleLikePoem(poem.id)}
                      >
                        <svg className="w-5 h-5" fill={likedPoems.includes(poem.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                      
                      <button 
                        className="action-btn"
                        onClick={() => handleCopyPoem(poem)}
                        title="Copy to clipboard"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </button>

                      <button 
                        className="action-btn hover:text-emerald-primary"
                        onClick={() => handleShareWhatsApp(poem)}
                        title="Share on WhatsApp"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.488 1.459 5.407 1.46h.007c5.858 0 10.622-4.76 10.626-10.623.002-2.84-1.102-5.511-3.111-7.521C17.567 3.459 14.896 2.35 12.057 2.35 6.2 2.35 1.433 7.11 1.429 12.97c-.001 1.956.509 3.864 1.478 5.485L1.879 22.21l4.768-1.255zM17.47 14.39c-.3-.149-1.777-.878-2.054-.978-.277-.1-.479-.149-.68.149-.2.3-.779.979-.954 1.179-.176.2-.351.224-.652.075-.301-.15-1.267-.467-2.413-1.49-.893-.797-1.496-1.78-1.672-2.08-.176-.3-.019-.462.131-.61.136-.134.301-.351.451-.525.15-.176.2-.301.3-.502.1-.2.05-.376-.025-.526-.075-.15-.68-1.64-.931-2.24-.244-.587-.492-.507-.679-.517-.175-.008-.375-.01-.576-.01-.2 0-.526.075-.802.376-.276.3-1.053 1.028-1.053 2.507 0 1.48 1.077 2.913 1.227 3.114.15.2 2.12 3.238 5.137 4.542.717.31 1.277.495 1.713.633.72.23 1.375.197 1.892.12.576-.087 1.777-.726 2.028-1.43.25-.702.25-1.303.176-1.43-.076-.127-.277-.202-.578-.352z"/>
                        </svg>
                      </button>

                      {poem.collab_open && (
                        <button 
                          className="action-btn text-emerald-primary font-semibold"
                          onClick={() => {
                            setActiveTab('mushaira');
                            handleOpenCollabModal(poem);
                          }}
                        >
                          Collab
                        </button>
                      )}
                    </div>

                    {identity && poem.device_uuid === identity.device_uuid && (
                      <button 
                        className="action-btn text-red-500 hover:text-red-400"
                        onClick={() => handleDeletePoem(poem.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* MUSHAIRA (COLLAB HUB) */}
        {activeTab === 'mushaira' && (
          <div className="animate-fade-in">
            <div className="text-center py-6 mb-4">
              <h1 className="text-3xl font-bold mb-2">Mushaira</h1>
              <p className="text-sm text-dim">Add your line (Misra-e-Sani), join active sessions, and write together.</p>
            </div>

            {/* Create collaboration starter line */}
            <div className="sufi-card">
              <span className="sufi-label">Start a new collaboration starter</span>
              <form onSubmit={handleStartCollabPoem} className="flex flex-col gap-3 mt-2">
                <input 
                  type="text" 
                  className="sufi-input text-center italic text-lg"
                  placeholder="Write the starter line..."
                  value={collabStarterRoman}
                  onChange={e => setCollabStarterRoman(e.target.value)}
                  required
                />
                
                <div className="flex gap-2">
                  <select 
                    className="sufi-select flex-1"
                    value={collabStarterGenre}
                    onChange={e => setCollabStarterGenre(e.target.value)}
                  >
                    <option value="sher">Sher (Couplet)</option>
                    <option value="ghazal">Ghazal (Refrain-based)</option>
                    <option value="rap">Rap (Rhyme Battle)</option>
                    <option value="free_verse">Free Verse</option>
                  </select>

                  <select 
                    className="sufi-select flex-1"
                    value={collabStarterMood}
                    onChange={e => setCollabStarterMood(e.target.value)}
                  >
                    <option value="ishq">Ishq</option>
                    <option value="gham">Gham</option>
                    <option value="falsafa">Falsafa</option>
                    <option value="sufi">Sufi</option>
                    <option value="umeed">Umeed</option>
                  </select>
                </div>

                <button type="submit" className="sufi-btn sufi-btn-emerald mt-2" disabled={isStartingCollab}>
                  {isStartingCollab ? 'Posting...' : 'Open Starter for Collaboration'}
                </button>
              </form>
            </div>

            {/* Open collaborations lists */}
            <h2 className="text-xl font-semibold mb-4 border-b border-[#1a1a1a] pb-2 text-white">Open Verses</h2>
            {collabPoems.length === 0 ? (
              <div className="text-center py-8 text-dim sufi-card">
                No active collaborations yet. Be the first to start!
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {collabPoems.map(poem => (
                  <div key={poem.id} className="sufi-card border-l-2 border-l-emerald-primary py-6 px-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-white">~ {poem.takhallus}</span>
                      <span className="sufi-badge sufi-badge-emerald text-[9px]">{poem.genre}</span>
                    </div>

                    <p className="poetic-text text-white text-lg my-4 italic">
                      "{poem.content_roman}"
                    </p>

                    <button 
                      className="sufi-btn sufi-btn-outline w-auto mt-2"
                      onClick={() => handleOpenCollabModal(poem)}
                    >
                      Answer / Complete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="animate-fade-in">
            <div className="text-center py-6 mb-4">
              <h1 className="text-3xl font-bold mb-2">Your Sufi Identity</h1>
              <p className="text-sm text-dim font-poetic">Device-local. Bookmarks & Personal Archives.</p>
            </div>

            {/* Edit Takhallus */}
            <div className="sufi-card">
              <span className="sufi-label">Configure Takhallus (Pen-Name)</span>
              <form onSubmit={handleUpdateTakhallus} className="flex gap-3 mt-2">
                <input 
                  type="text" 
                  className="sufi-input"
                  placeholder="New Takhallus"
                  value={tempTakhallus}
                  onChange={e => setTempTakhallus(e.target.value)}
                  required
                />
                <button type="submit" className="sufi-btn sufi-btn-emerald w-auto">
                  Save
                </button>
              </form>
            </div>

            {/* Device-uuid info */}
            <div className="sufi-card text-xs text-dim flex flex-col gap-1.5">
              <div><strong>Your Pen Name:</strong> {identity?.takhallus}</div>
              <div><strong>Device Identity Token:</strong> <code className="text-emerald-primary">{identity?.device_uuid}</code></div>
              <div className="mt-2 text-[10px]">Your posts are tied to this device. Clearing your browser cache will reset your identity.</div>
            </div>

            {/* User personal feed */}
            <h2 className="text-xl font-semibold mb-4 border-b border-[#1a1a1a] pb-2 text-white">Your Weavings</h2>
            {feedPoems.filter(p => identity && p.device_uuid === identity.device_uuid).length === 0 ? (
              <div className="text-center py-8 text-dim sufi-card">
                You haven't posted any shayari yet.
              </div>
            ) : (
              feedPoems.filter(p => identity && p.device_uuid === identity.device_uuid).map(poem => (
                <div key={poem.id} className="sufi-card py-6 px-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-dim">{new Date(poem.created_at).toLocaleDateString()}</span>
                    <span className="sufi-badge sufi-badge-emerald text-[9px]">{poem.genre}</span>
                  </div>
                  <p className="poetic-text text-white text-lg my-4">
                    {poem.content_roman}
                  </p>
                  <div className="text-right">
                    <button 
                      className="text-xs text-red-500 hover:text-red-400"
                      onClick={() => handleDeletePoem(poem.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* FOOTER NAVIGATION TABS */}
      <nav className="sufi-nav">
        {[
          { id: 'weave', label: 'Weave', icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          )},
          { id: 'circle', label: 'Circle', icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          )},
          { id: 'mushaira', label: 'Mushaira', icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )},
          { id: 'profile', label: 'Identity', icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        ].map(t => (
          <button 
            key={t.id}
            className={`nav-link ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(t.id as any);
              if (t.id === 'weave') setWizardStep(1); // Reset wizard when going to weave tab
            }}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {/* IDENTITY SETUP MODAL */}
      {showWelcomeModal && (
        <div className="sufi-modal-overlay">
          <div className="sufi-modal">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-2 text-center">Step into the Circle</h2>
            <p className="text-sm text-dim mb-6 text-center">Set your device-local pen name (takhallus) to weave and share Shayari.</p>
            
            <form onSubmit={handleWelcomeSubmit} className="flex flex-col gap-4">
              <div>
                <input 
                  id="welcome-takhallus"
                  type="text" 
                  className="sufi-input text-center text-xl py-3 border-b border-emerald-primary"
                  placeholder="E.g., Faiz, Ghalib, Faraz"
                  value={tempTakhallus}
                  onChange={e => setTempTakhallus(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <button type="submit" className="sufi-btn sufi-btn-emerald py-3 mt-2">
                Begin the Ritual
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MUSHARA COLLAB MODAL */}
      {selectedCollabPoem && (
        <div className="sufi-modal-overlay">
          <div className="sufi-modal max-w-lg">
            <button 
              className="sufi-modal-close"
              onClick={() => setSelectedCollabPoem(null)}
            >
              ✕
            </button>
            
            <div className="mb-6">
              <span className="sufi-badge sufi-badge-emerald mb-2">Original verse by ~ {selectedCollabPoem.takhallus}</span>
              <p className="poetic-text text-white text-xl border-b border-card-border pb-4 italic">
                "{selectedCollabPoem.content_roman}"
              </p>
            </div>

            {/* Contributions list */}
            <div className="max-h-40 overflow-y-auto mb-6 flex flex-col gap-2 pr-1">
              <span className="sufi-label text-[10px]">Active completions</span>
              {activeCollabResponses.length === 0 ? (
                <div className="text-xs text-dim italic">No replies yet. Match the misra first!</div>
              ) : (
                activeCollabResponses.map(c => (
                  <div key={c.id} className="bg-black p-3 rounded border border-card-border">
                    <p className="poetic-text text-base italic text-emerald-primary mb-1">"{c.contribution}"</p>
                    <div className="text-right text-[10px] text-dim">— ~ {c.takhallus}</div>
                  </div>
                ))
              )}
            </div>

            {/* Answer Form */}
            <form onSubmit={handleSubmitCollab} className="flex flex-col gap-3">
              <div>
                <label className="sufi-label text-[10px]" htmlFor="collab-contribution">Add your line (Misra-e-Sani)</label>
                <textarea 
                  id="collab-contribution"
                  className="sufi-textarea h-24 resize-none text-base"
                  placeholder="Complete the rhythm..."
                  value={collabContribution}
                  onChange={e => setCollabContribution(e.target.value)}
                  required
                />
              </div>
              
              <button type="submit" className="sufi-btn sufi-btn-emerald py-3" disabled={isSubmittingCollab}>
                {isSubmittingCollab ? 'Submitting...' : 'Complete Couplet'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
