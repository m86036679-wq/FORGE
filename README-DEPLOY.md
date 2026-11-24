# FORGE deployen (Netlify oder Vercel)

Die KI-Funktionen laufen über einen kleinen Proxy (`/api/groq`). Der Groq-Schlüssel liegt nur serverseitig, nie im Browser.

## Umgebungsvariablen
- `GROQ_API_KEY` (Pflicht): Schlüssel von console.groq.com/keys
- `ALLOWED_ORIGIN` (optional): nur diese Herkunft darf den Proxy nutzen, z. B. `https://forge-xyz.netlify.app`

## Netlify
1. Netlify > Add new site > Import from Git > dieses Repo wählen. Build command leer, Publish directory `.`
2. Site configuration > Environment variables: `GROQ_API_KEY` (und optional `ALLOWED_ORIGIN`) anlegen.
3. Deploys > Trigger deploy. Test: `https://DEINE-SEITE/api/groq` muss `{"ok":true,"configured":true}` zeigen.

## Vercel
1. Vercel > Add New Project > Repo importieren. Framework Preset: Other, keine Build-Einstellungen.
2. Settings > Environment Variables: `GROQ_API_KEY` (und optional `ALLOWED_ORIGIN`), danach neu deployen.
3. Test: `https://DEINE-SEITE/api/groq` muss `{"ok":true,"configured":true}` zeigen.

## Hinweise
- Ist der Proxy erreichbar und konfiguriert, fragt die App nicht mehr nach einem eigenen Schlüssel. Ein eigener Schlüssel im Profil hat weiterhin Vorrang.
- Auf GitHub Pages gibt es keinen Proxy; dort bleibt der eigene Schlüssel nötig.
- Erlaubte Modelle: llama, meta-llama, qwen, openai/gpt-oss. `max_tokens` ist auf 2000 begrenzt.
