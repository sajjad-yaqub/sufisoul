import { NextResponse } from 'next/server';
import { supabase, Collab } from '@/lib/supabase';

const SEED_COLLABS: Collab[] = [
  {
    id: 'c1',
    parent_poem_id: '3',
    device_uuid: 'system-seed-collab',
    takhallus: 'Faiz',
    contribution: "Hum hain toh kya gham hai,\nIshq mein toh ab yeh silsila aam hai.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
  }
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parentPoemId = searchParams.get('parent_poem_id');

    if (!parentPoemId) {
      return NextResponse.json({ error: 'parent_poem_id is required' }, { status: 400 });
    }

    if (supabase) {
      const { data, error } = await supabase
        .from('collaborations')
        .select('*')
        .eq('parent_poem_id', parentPoemId)
        .order('created_at', { ascending: true });
      if (!error && data) {
        return NextResponse.json(data);
      }
      console.error('Supabase fetch collabs error:', error);
    }

    // Static server fallback
    const filtered = SEED_COLLABS.filter(c => c.parent_poem_id === parentPoemId);
    return NextResponse.json(filtered);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const collabData = await req.json();

    if (supabase) {
      const { data, error } = await supabase.from('collaborations').insert([collabData]).select().single();
      if (!error && data) {
        return NextResponse.json(data);
      }
      console.error('Supabase insert collab error:', error);
      return NextResponse.json({ error: error?.message || 'Supabase insert error' }, { status: 400 });
    }

    // Mock client fallback return
    const newCollab = {
      ...collabData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    return NextResponse.json(newCollab);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
