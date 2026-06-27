// Proxy CORS pour récupérer les plans Génération Piscine depuis le navigateur.
// Reçoit ?url=https://www.generationpiscine.com/... et renvoie l'image avec CORS.
export default async function handler(req, res) {
  const url = (req.query || {}).url || '';
  if (!url || !/^https:\/\/(www\.)?generationpiscine\.com\//.test(url)) {
    res.status(400).end(); return;
  }
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0 Safari/537.36' }
    });
    if (!r.ok) { res.status(r.status).end(); return; }
    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type', r.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(buf);
  } catch (_) { res.status(502).end(); }
}
