import { NextResponse } from 'next/server';
import { supabase, Poem } from '@/lib/supabase';

// Static seed data for server fallback when Supabase is not connected
const SEED_POEMS: Poem[] = [
  {
    id: '1',
    device_uuid: 'system-seed',
    takhallus: 'Faraz',
    mood: 'gham',
    genre: 'sher',
    content_roman: "Silsilay tod gaya woh sabhi jaate jaate,\nAb sadiyon tak humeinte rehna hai rona unhe.",
    content_nastaliq: "سلسلے توڑ گیا وہ سبھی جاتے جاتے\nاب صدیوں تک ہمیں رہے گا رونا انہیں",
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
    content_roman: "Patta patta, boota boota haal humara jaane hai,\nJaane na jaane gul hi na jaane, baagh toh saara jaane hai.",
    content_nastaliq: "پتہ پتہ بوٹا بوٹا حال ہمارا جانے ہے\nجانے نہ جانے گل ہی نہ جانے باغ تو سارا جانے ہے",
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
    content_roman: "Dil-e-nadaan tujhe hua kya hai,\nAakhir iss dard ki dawa kya hai?",
    content_nastaliq: "دلِ ناداں تجھے ہوا کیا ہے\nآخر اس درد کی دوا کیا ہے؟",
    is_anonymous: false,
    collab_open: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  }
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mood = searchParams.get('mood');
    const genre = searchParams.get('genre');

    if (supabase) {
      let query = supabase.from('poems').select('*').order('created_at', { ascending: false });
      if (mood && mood !== 'all') {
        query = query.eq('mood', mood);
      }
      if (genre && genre !== 'all') {
        query = query.eq('genre', genre);
      }
      const { data, error } = await query;
      if (!error && data) {
        return NextResponse.json(data);
      }
      console.error('Supabase fetch error, falling back to seed:', error);
    }

    // Server-side fallback (filtered static seeds)
    let filtered = [...SEED_POEMS];
    if (mood && mood !== 'all') {
      filtered = filtered.filter(p => p.mood === mood);
    }
    if (genre && genre !== 'all') {
      filtered = filtered.filter(p => p.genre === genre);
    }
    return NextResponse.json(filtered);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const poemData = await req.json();
    
    if (supabase) {
      const { data, error } = await supabase.from('poems').insert([poemData]).select().single();
      if (!error && data) {
        return NextResponse.json(data);
      }
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error?.message || 'Supabase insert error' }, { status: 400 });
    }

    // If no Supabase, return the created object (the client will save to local storage as primary backup)
    const newPoem = {
      ...poemData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    return NextResponse.json(newPoem);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
