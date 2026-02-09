# WS Metrics Dashboard (Next.js + Recharts + Basic Auth)

## Deploy (Vercel)
1. Push this project to GitHub
2. Import into Vercel
3. Set env vars:
   - DASH_USER
   - DASH_PASS
   - NEXT_PUBLIC_METRICS_API_BASE (e.g. https://your-api.example.com)
4. Deploy

## Local run
```bash
npm install
npm run dev
```

Open http://localhost:3000 (browser prompts Basic Auth).

## API required
- GET {API_BASE}/api/metrics/timeseries/requests
- GET {API_BASE}/api/metrics/timeseries/latency
