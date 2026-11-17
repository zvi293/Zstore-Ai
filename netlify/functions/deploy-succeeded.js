// Netlify event function — runs automatically after every successful deploy.
// Sends every page in the sitemap to IndexNow (Bing, and through it ChatGPT search / Copilot),
// so new and updated pages get crawled within minutes instead of weeks.
const HOST = 'zstore-ai.co.il';
const KEY = '596302da8fd68cffcaca356d4b5391bd';

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const context = body.payload && body.payload.context;
    if (context && context !== 'production') return { statusCode: 200, body: 'skipped: ' + context };

    const res = await fetch('https://' + HOST + '/sitemap.xml', { headers: { 'cache-control': 'no-cache' } });
    const xml = await res.text();
    const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((m) => m[1].trim())
      .filter((u) => u.startsWith('https://' + HOST + '/'));

    const ping = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: HOST, key: KEY, keyLocation: 'https://' + HOST + '/' + KEY + '.txt', urlList }),
    });
    console.log('IndexNow:', ping.status, 'for', urlList.length, 'urls');
    return { statusCode: 200, body: 'IndexNow ' + ping.status + ' for ' + urlList.length + ' urls' };
  } catch (err) {
    console.error('IndexNow failed:', err);
    return { statusCode: 200, body: 'IndexNow error: ' + err.message };
  }
};
