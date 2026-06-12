import { NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROK_API_KEY = process.env.GROK_API_KEY || process.env.XAI_API_KEY;

// Pre-curated high-quality poetic fragments for robust offline/no-API fallback
const FALLBACK_SHAYARI: Record<string, { roman: string; nastaliq: string; translation: string }[]> = {
  ishq: [
    {
      roman: "Tere khayal se abad hai dunya meri,\nTujh se shuru hai aur tujh pe hi khatm daastan meri.",
      nastaliq: "تیرے خیال سے آباد ہے دنیا میری\nتجھ سے شروع ہے اور تجھ پہ ہی ختم داستاں میری",
      translation: "My world is inhabited by your thoughts,\nMy story begins with you and ends with you."
    },
    {
      roman: "Nazar nazar mein woh jazba-e-ulfat chhupa gaye,\nHum toh bekhabar the, woh chupke se dil chura gaye.",
      nastaliq: "نظر نظر میں وہ جذبہِ الفت چھپا گئے\nہم تو بے خبر تھے، وہ چپکے سے دل چرا گئے",
      translation: "In a single glance, they hid the feeling of love,\nI was unaware, they quietly stole my heart."
    }
  ],
  gham: [
    {
      roman: "Dard hota hai bohot jab koi apna badalta hai,\nWarna gairon ki kya aukaat jo aankhein num kar dein.",
      nastaliq: "درد ہوتا ہے بہت جب کوئی apna بدلتا ہے\nورنہ غیروں کی کیا اوقات جو آنکھیں نم کر دیں",
      translation: "It hurts deeply when one of your own changes,\nOtherwise, what power do strangers have to make your eyes wet?"
    },
    {
      roman: "Hijr ki raat ka azaab na pucho mere dost,\nHar saans pe lagta hai dam nikalne wala hai.",
      nastaliq: "ہجر کی رات کا عذاب نہ پوچھو میرے دوست\nہر سانس پہ لگتا ہے دم نکلنے والا ہے",
      translation: "Do not ask about the torment of the night of separation, my friend,\nWith every breath, it feels as if life is about to leave."
    }
  ],
  falsafa: [
    {
      roman: "Zindagi kya hai, faqat ek khwab ka aalam hai,\nJo mila hai usi mein sukoon ki talash kar.",
      nastaliq: "زندگی کیا ہے، فقط ایک خواب کا عالم ہے\nجو ملا ہے اسی میں سکون کی تلاش کر",
      translation: "What is life? It is merely a realm of dreams,\nSearch for peace in whatever you have found."
    },
    {
      roman: "Khudi ko kar buland itna ke har taqdeer se pehle,\nKhuda bande se khud pooche, bata teri raza kya hai.",
      nastaliq: "خودی کو کر بلند اتنا کہ ہر تقدیر سے پہلے\nخدا بندے سے خود پوچھے بتا تیری رضا کیا ہے",
      translation: "Elevate your selfhood to such heights that before writing your destiny,\nGod himself asks you: 'Tell me, what is your desire?'"
    }
  ],
  sufi: [
    {
      roman: "Tu jo har dil mein basa hai, tujhe dhoondein kahan,\nTu hai mere hi andar, par main dhoondta hoon jahan jahan.",
      nastaliq: "تو جو ہر دل میں بسا ہے تجھے ڈھونڈیں کہاں\nتو ہے میرے ہی اندر پر میں ڈھونڈتا ہوں جہاں جہاں",
      translation: "You who reside in every heart, where should we look for you?\nYou are inside me, yet I search for you all over the universe."
    },
    {
      roman: "Mera na koi thikana na koi apna nishaan hai,\nMain ishq-e-haqeeqi ka ek gumshuda raahi hoon.",
      nastaliq: "میرا نہ کوئی ٹھکانہ نہ کوئی اپنا نشان ہے\nمیں عشقِ حقیقی کا ایک گمشدہ راہی ہوں",
      translation: "I have no destination nor any sign of my own,\nI am a lost traveler in the path of divine love."
    }
  ],
  umeed: [
    {
      roman: "Gham-e-douran se tang na ho aye musafir,\nTufan ke baad hi milta hai hamesha sahil.",
      nastaliq: "غمِ دوراں سے تنگ نہ ہو اے مسافر\nطوفان کے بعد ہی ملتا ہے ہمیشہ ساحل",
      translation: "Do not grow weary of the struggles of life, O traveler,\nIt is always after the storm that the shore is reached."
    },
    {
      roman: "Subah-e-nau aayegi zaroor iss andhere ke baad,\nUmeed ka diya jalaye rakh, aane wala hai bahaar.",
      nastaliq: "صبحِ نو آئے گی ضرور اس اندھیرے کے بعد\nامید کا دیا جلائے رکھ آنے والا ہے بہار",
      translation: "A new morning will surely arrive after this darkness,\nKeep the lamp of hope burning, spring is about to arrive."
    }
  ]
};

const SHAYARI_GENRES: Record<string, string> = {
  sher: "couplet",
  ghazal: "ghazal (structured multi-couplet poem with rhyming and refrain)",
  nazm: "nazm (thematic descriptive poem with custom rhyme)",
  free_verse: "free verse (unconstrained expressive poem)",
  rap: "rap bars (high rhythm, punchy lyrics, strong end rhymes, modern street-poetry format)"
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mood = 'ishq', genre = 'sher', length = 'short', custom_input = '' } = body;

    const systemPrompt = `You are SufiSoul, an elite master of Urdu Shayari and modern poetic expressions. 
Your task is to write a highly evocative poem in Roman Urdu based on the user's criteria.

Return strictly a JSON object with this exact structure:
{
  "content_roman": "Line 1\\nLine 2...",
  "content_nastaliq": "اردو رسم الخط میں...",
  "english_translation": "English translation here...",
  "meter_note": "A small explanation of the meter (Behr), rhyming scheme, or rhythmic style used."
}

Poetry Guidelines:
1. Primary Output: The content_roman must use natural Roman Urdu (e.g. 'Mohabbat', 'Khwab', 'Dard', 'Zindagi', 'Zameen', 'Aasman').
2. Match the requested Genre:
   - Sher: stand-alone 2-line couplet with rhyming end words (qafia/radif) or balanced rhythm.
   - Ghazal: 3 to 5 couplets (ash'aar) where the first couplet (matla) rhymes on both lines, and subsequent couplets rhyme on the second line with a consistent refrain (radif) and rhyming word (qafia).
   - Nazm: a narrative or thematic poem of 4-8 lines with custom/flexible rhyming.
   - Free Verse: modern poetry with natural breathing cadences and emotional depth, bypassing strict meters but holding deep rhythm.
   - Rap: punchy, high-rhyme, rhythmic modern lyrics in Roman Urdu, utilizing double-rhymes, street metaphors, and strong rhythm suited for beats.
3. Incorporate custom words or experiences: if the user provides keywords or a personal experience, embed it deeply and artistically into the poem, making it feel organic and not just thrown in.
4. Keep the vocabulary rich yet accessible to subcontinent youth. Use classical Urdu imagery (gul, shama, parwana, hijr, mehtaab, saqi) where appropriate.`;

    const prompt = `Write a ${SHAYARI_GENRES[genre] || genre} representing a mood of "${mood}".
The length of the poem should be suited for a ${length} duration (about ${genre === 'sher' ? '2 lines' : '4 to 8 lines'}).
${custom_input ? `Deeply embed the following custom experience/words: "${custom_input}"` : ""}

Ensure the response is valid JSON.`;

    let poetryResult = null;

    if (GROK_API_KEY) {
      // Use xAI Grok API (OpenAI-compatible)
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROK_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "grok-2-1212",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || "Grok API Error");
      }
      const jsonText = data.choices?.[0]?.message?.content;
      poetryResult = JSON.parse(jsonText);
    } else if (GEMINI_API_KEY) {
      // Use Gemini API (Free tier from Google AI Studio)
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || "Gemini API Error");
      }
      const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      poetryResult = JSON.parse(jsonText);
    } else if (GROQ_API_KEY) {
      // Use Groq API (Free tier with high limits)
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || "Groq API Error");
      }
      const jsonText = data.choices?.[0]?.message?.content;
      poetryResult = JSON.parse(jsonText);
    } else if (ANTHROPIC_API_KEY) {
      // Use Claude API
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" }
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || "Claude API Error");
      }
      const jsonText = data.content[0].text;
      poetryResult = JSON.parse(jsonText);
      // Fallback Procedural Generator: dynamic template selection injecting custom words
      const primaryMood = typeof mood === 'string' ? mood.split(',')[0].trim() : 'ishq';
      const list = FALLBACK_SHAYARI[primaryMood] || FALLBACK_SHAYARI.ishq;
      const base = list[Math.floor(Math.random() * list.length)];

      let roman = base.roman;
      let nastaliq = base.nastaliq;
      let translation = base.translation;

      if (custom_input) {
        const cleanWord = custom_input.trim();
        roman = `${roman}\n\n[Dhyaan rahe, yeh kalaam '${cleanWord}' ke ehsaas ko bayan karta hai...]`;
        nastaliq = `${nastaliq}\n\n[یہ کلام '${cleanWord}' کے احساس کو بیاں کرتا ہے...]`;
        translation = `${translation}\n\n(Written with the feeling of: ${cleanWord})`;
      }

      return NextResponse.json({
        content_roman: roman,
        content_nastaliq: nastaliq,
        english_translation: translation,
        meter_note: "Created via client-side SufiSoul Legacy Engine. [Set GEMINI_API_KEY, GROQ_API_KEY, or ANTHROPIC_API_KEY in environment for full AI generation]"
      });
    }

    return NextResponse.json(poetryResult);

  } catch (error: any) {
    console.error("Poetry generation api error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate poetry" }, { status: 500 });
  }
}

