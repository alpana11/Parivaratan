from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import time
import random
from datetime import datetime

app = FastAPI(title="Pathway Demo Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

start_time = time.time()
update_counter = 0

@app.get("/")
def root():
    return {"message": "Pathway Demo Backend Running", "status": "active"}

@app.get("/stream/status")
def get_status():
    global update_counter
    update_counter += 1
    return {
        "status": "running",
        "stream_active": True,
        "pipeline_running": True,
        "uptime": int(time.time() - start_time),
        "updates": update_counter,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/stream/analytics")
def get_analytics():
    return {
        "success": True,
        "data": {
            "total_requests": random.randint(10, 50),
            "active_partners": random.randint(5, 15),
            "waste_processed": round(random.uniform(100, 500), 2),
            "co2_reduction": round(random.uniform(30, 150), 2),
            "status_counts": [
                {"status": "pending", "count": random.randint(5, 15)},
                {"status": "completed", "count": random.randint(10, 30)}
            ]
        },
        "timestamp": datetime.now().isoformat()
    }

@app.get("/stream/insights")
def get_insights():
    return {
        "success": True,
        "data": {
            "insights": [
                "Processing waste requests in continuous stream",
                "Real-time aggregations updating incrementally"
            ],
            "recommendations": [
                "Optimize partner allocation in high-demand areas",
                "Schedule pickups during off-peak hours",
                "Focus on plastic waste collection this week"
            ],
            "summary": "Continuous streaming active"
        },
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    print("Starting Demo Backend (Pathway simulation)...")
    print("Backend started successfully")
    uvicorn.run(app, host="0.0.0.0", port=8000)
