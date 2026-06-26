// Vercel serverless function (racine) — proxy vers Google Gemini 2.5 Flash Image (« nano-banana »).
// Sert l'app piscine (/piscine). La clé reste côté serveur (env GEMINI_API_KEY) — JAMAIS dans le code.
// Reçoit { imageBase64, mimeType, prompt } et renvoie { imageBase64, mimeType }.

const MODEL = 'gemini-2.5-flash-image';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée.' });
    return;
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    res.status(500).json({ error: "Le moteur de rendu n'est pas encore configuré : ajoutez la variable d'environnement GEMINI_API_KEY dans les réglages Vercel du projet, puis redéployez." });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { imageBase64, mimeType, prompt } = body;

    if (!imageBase64 || !prompt) {
      res.status(400).json({ error: 'Photo ou description manquante.' });
      return;
    }

    // Édition d'image fidèle (« nano-banana ») : la PHOTO doit venir EN PREMIER, le
    // texte ensuite. Ainsi Gemini ÉDITE la photo (même cadrage, même format) au lieu
    // de régénérer une scène. On n'envoie PAS le plan technique du modèle : une 2e
    // image déclenche un mode « composition » qui invente un nouveau jardin (la forme
    // est décrite en texte à la place).
    const parts = [
      { inline_data: { mime_type: mimeType || 'image/jpeg', data: imageBase64 } },
      { text: prompt }
    ];

    const payload = {
      contents: [{ role: 'user', parts }],
      generationConfig: { responseModalities: ['IMAGE'] }
    };

    const r = await fetch(`${ENDPOINT}?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await r.json();

    if (!r.ok) {
      const msg = (data && data.error && data.error.message) || 'Erreur du service de génération.';
      let friendly = msg;
      if (/quota|RESOURCE_EXHAUSTED/i.test(msg)) friendly = "Quota du service IA atteint. Réessayez dans un moment.";
      else if (/API key|API_KEY_INVALID|PERMISSION/i.test(msg)) friendly = "Clé API invalide ou non autorisée pour ce modèle.";
      else if (/SAFETY|blocked/i.test(msg)) friendly = "La génération a été bloquée pour cette image. Essayez une autre photo.";
      res.status(r.status).json({ error: friendly });
      return;
    }

    const respParts = (((data.candidates || [])[0] || {}).content || {}).parts || [];
    const imgPart = respParts.find(p => (p.inline_data && p.inline_data.data) || (p.inlineData && p.inlineData.data));

    if (!imgPart) {
      const txt = respParts.map(p => p.text).filter(Boolean).join(' ');
      res.status(502).json({ error: txt ? ('Le modèle a répondu sans image : ' + txt.slice(0, 160)) : "Aucune image générée. Réessayez." });
      return;
    }

    const inline = imgPart.inline_data || imgPart.inlineData;
    res.status(200).json({
      imageBase64: inline.data,
      mimeType: inline.mime_type || inline.mimeType || 'image/png'
    });
  } catch (e) {
    res.status(500).json({ error: 'Erreur interne : ' + (e.message || 'inconnue') });
  }
}
