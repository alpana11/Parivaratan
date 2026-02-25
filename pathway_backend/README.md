# 🌊 Pathway Streaming Backend for Waste Management

Official **Pathway Framework** implementation for Hack For Green Bharat (Pathway Track).

## Architecture

```
Firebase Firestore → Pathway Streaming Engine → Real-time Aggregations → LLM Analysis → FastAPI → React Dashboard
```

## Features

✅ **Real Pathway Framework** - Uses official `pathway` Python library  
✅ **Continuous Streaming** - `pw.run()` in background thread  
✅ **Real-time Aggregations** - Incremental updates every 2 seconds  
✅ **FastAPI Endpoints** - REST API for React frontend  
✅ **No External LLM** - Pure streaming analytics  

## Setup

### 1. Install Dependencies

```bash
cd pathway_backend
pip install -r requirements.txt
```

### 2. Run Pathway Pipeline

```bash
# Start API server with continuous streaming
python api_server.py
```

Server runs on: `http://localhost:8000`

Pipeline runs continuously in background with `pw.run()`

## API Endpoints

### GET `/stream/analytics`
Real-time streaming analytics from Pathway pipeline
```json
{
  "status_counts": [...],
  "type_distribution": [...],
  "location_stats": [...],
  "partner_performance": [...]
}
```

### GET `/stream/insights`
Basic insights from streaming data (no external LLM)
```json
{
  "insights": ["..."],
  "recommendations": ["..."],
  "summary": "..."
}
```

### GET `/stream/status`
Pipeline health and status
```json
{
  "stream_active": true,
  "last_update": "2025-01-20T10:30:00",
  "total_records": 150
}
```

## Integration with React

Update your React app to fetch from Pathway backend:

```typescript
// src/services/pathwayService.ts
const PATHWAY_API = 'http://localhost:8000';

export const pathwayService = {
  async getStreamingAnalytics() {
    const response = await fetch(`${PATHWAY_API}/stream/analytics`);
    return response.json();
  },
  
  async getLLMInsights() {
    const response = await fetch(`${PATHWAY_API}/stream/insights`);
    return response.json();
  }
};
```

## Pathway Features Used

1. **Streaming Source** - `pw.demo.range_stream()`
2. **Continuous Processing** - `pw.run()` in background thread
3. **GroupBy Aggregations** - `groupby().reduce()`
4. **Reducers** - `pw.reducers.count()`, `pw.reducers.avg()`
5. **Schema Definition** - `pw.Schema` for type safety
6. **Incremental Updates** - New data every 2 seconds

## For Production

Replace simulated data source with:

```python
# Kafka connector
waste_stream = pw.io.kafka.read(
    rdkafka_settings={
        "bootstrap.servers": "localhost:9092",
        "group.id": "waste-consumer"
    },
    topic="waste-requests",
    schema=WasteRequestSchema
)

# Or REST connector
waste_stream = pw.io.http.rest_connector(
    host="0.0.0.0",
    port=8080,
    schema=WasteRequestSchema
)
```

## Hackathon Demo

1. Start backend: `python api_server.py`
2. Start React app: `npm run dev`
3. Show real-time updates in dashboard
4. Demonstrate LLM insights generation
5. Explain Pathway streaming architecture

## Tech Stack

- **Pathway** - Real-time data streaming framework
- **FastAPI** - Modern Python web framework
- **React** - Frontend dashboard
- **Firebase** - Backend database

## License

MIT
