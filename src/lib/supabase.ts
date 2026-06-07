import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Initialize client only if variables are available
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Local storage simulator for seamless developer experience
const LOCAL_POEMS_KEY = 'sufisoul_local_db_poems';
const LOCAL_COLLABS_KEY = 'sufisoul_local_db_collabs';

export interface Poem {
  id: string;
  device_uuid: string;
  takhallus?: string;
  mood: string;
  genre: string;
  content_roman: string;
  content_nastaliq?: string;
  is_anonymous: boolean;
  collab_open: boolean;
  created_at: string;
}

export interface Collab {
  id: string;
  parent_poem_id: string;
  device_uuid: string;
  takhallus?: string;
  contribution: string;
  created_at: string;
}

// Simulated Database Functions
const getLocalPoems = (): Poem[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(LOCAL_POEMS_KEY);
  if (!stored) {
    // Seed data
    const initial: Poem[] = [
      {
        id: '1',
        device_uuid: 'system-seed',
        takhallus: 'Faraz',
        mood: 'gham',
        genre: 'sher',
        content_roman: 'Silsilay tod gaya woh sabhi jaate jaate,\nAb sadiyon tak humeinte rehna hai rona unhe.',
        content_nastaliq: 'سلسلے توڑ گیا وہ سبھی جاتے جاتے\nاب صدیوں تک ہمیں رہے گا رونا انہیں',
        is_anonymous: false,
        collab_open: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
      {
        id: '2',
        device_uuid: 'system-seed',
        takhallus: 'Meer',
        mood: 'ishq',
        genre: 'ghazal',
        content_roman: 'Patta patta, boota boota haal humara jaane hai,\nJaane na jaane gul hi na jaane, baagh toh saara jaane hai.',
        content_nastaliq: 'پتہ پتہ بوٹا بوٹا حال ہمارا جانے ہے\nجانے نہ جانے گل ہی نہ جانے باغ تو سارا جانے ہے',
        is_anonymous: false,
        collab_open: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
      {
        id: '3',
        device_uuid: 'system-seed',
        takhallus: 'Ghalib',
        mood: 'falsafa',
        genre: 'sher',
        content_roman: 'Dil-e-nadaan tujhe hua kya hai,\nAakhir iss dard ki dawa kya hai?',
        content_nastaliq: 'دلِ ناداں تجھے ہوا کیا ہے\nآخر اس درد کی دوا کیا ہے؟',
        is_anonymous: false,
        collab_open: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      }
    ];
    localStorage.setItem(LOCAL_POEMS_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(stored);
};

const setLocalPoems = (poems: Poem[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_POEMS_KEY, JSON.stringify(poems));
  }
};

const getLocalCollabs = (): Collab[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(LOCAL_COLLABS_KEY);
  if (!stored) {
    const initial: Collab[] = [
      {
        id: 'c1',
        parent_poem_id: '3',
        device_uuid: 'system-seed-collab',
        takhallus: 'Faiz',
        contribution: 'Hum hain toh kya gham hai,\nIshq mein toh ab yeh silsila aam hai.',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
      }
    ];
    localStorage.setItem(LOCAL_COLLABS_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(stored);
};

const setLocalCollabs = (collabs: Collab[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_COLLABS_KEY, JSON.stringify(collabs));
  }
};

// Unified Data Helper
export const db = {
  getPoems: async (filters?: { mood?: string; genre?: string }): Promise<Poem[]> => {
    if (supabase) {
      try {
        let query = supabase.from('poems').select('*').order('created_at', { ascending: false });
        if (filters?.mood && filters.mood !== 'all') {
          query = query.eq('mood', filters.mood);
        }
        if (filters?.genre && filters.genre !== 'all') {
          query = query.eq('genre', filters.genre);
        }
        const { data, error } = await query;
        if (!error && data) return data as Poem[];
        console.error('Supabase getPoems error:', error);
      } catch (err) {
        console.error('Supabase connection error:', err);
      }
    }
    
    // Local storage fallback
    let poems = getLocalPoems();
    if (filters?.mood && filters.mood !== 'all') {
      poems = poems.filter(p => p.mood === filters.mood);
    }
    if (filters?.genre && filters.genre !== 'all') {
      poems = poems.filter(p => p.genre === filters.genre);
    }
    return [...poems].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  createPoem: async (poemData: Omit<Poem, 'id' | 'created_at'>): Promise<Poem> => {
    const newPoem = {
      ...poemData,
      id: typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString()
    };

    if (supabase) {
      try {
        const { data, error } = await supabase.from('poems').insert([newPoem]).select().single();
        if (!error && data) return data as Poem;
        console.error('Supabase createPoem error:', error);
      } catch (err) {
        console.error('Supabase connection error:', err);
      }
    }

    const poems = getLocalPoems();
    poems.push(newPoem);
    setLocalPoems(poems);
    return newPoem;
  },

  deletePoem: async (id: string, device_uuid: string): Promise<boolean> => {
    if (supabase) {
      try {
        const { error } = await supabase.from('poems').delete().eq('id', id).eq('device_uuid', device_uuid);
        if (!error) return true;
        console.error('Supabase deletePoem error:', error);
      } catch (err) {
        console.error('Supabase connection error:', err);
      }
    }

    const poems = getLocalPoems();
    const index = poems.findIndex(p => p.id === id && p.device_uuid === device_uuid);
    if (index !== -1) {
      poems.splice(index, 1);
      setLocalPoems(poems);
      return true;
    }
    return false;
  },

  getCollabs: async (parentPoemId: string): Promise<Collab[]> => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('collaborations')
          .select('*')
          .eq('parent_poem_id', parentPoemId)
          .order('created_at', { ascending: true });
        if (!error && data) return data as Collab[];
        console.error('Supabase getCollabs error:', error);
      } catch (err) {
        console.error('Supabase connection error:', err);
      }
    }

    const collabs = getLocalCollabs();
    return collabs.filter(c => c.parent_poem_id === parentPoemId);
  },

  createCollab: async (collabData: Omit<Collab, 'id' | 'created_at'>): Promise<Collab> => {
    const newCollab = {
      ...collabData,
      id: typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString()
    };

    if (supabase) {
      try {
        const { data, error } = await supabase.from('collaborations').insert([newCollab]).select().single();
        if (!error && data) return data as Collab;
        console.error('Supabase createCollab error:', error);
      } catch (err) {
        console.error('Supabase connection error:', err);
      }
    }

    const collabs = getLocalCollabs();
    collabs.push(newCollab);
    setLocalCollabs(collabs);
    return newCollab;
  }
};
