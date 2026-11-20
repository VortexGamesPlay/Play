// Configuration PUBLIQUE de PayPal pour le jeu : le Client ID (public par nature) et l'environnement.
// Le Secret n'est JAMAIS renvoyé.
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve((req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, 405);
  const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
  if (!clientId) return json({ error: "PayPal n'est pas encore configuré." }, 503);
  return json({ clientId, env: Deno.env.get('PAYPAL_ENV') === 'live' ? 'live' : 'sandbox' });
});
