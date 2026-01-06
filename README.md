# XConnect Studio (Frontend)

Minimal n8n-style workflow editor UI:
- pastel modern look (dark + soft accents)
- drag-drop nodes
- connect edges
- inspector edits node config JSON

## Run
```bash
npm i
npm run dev
```

Backend base URL:
```bash
VITE_API_BASE=http://127.0.0.1:8000 npm run dev
```

## Backend endpoints to add next
- GET  /api/workflows
- POST /api/workflows
- GET  /api/workflows/{id}
- PUT  /api/workflows/{id}
- POST /api/workflows/{id}/run
- GET  /api/executions?workflow_id=...
