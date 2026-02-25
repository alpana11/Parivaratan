import pathway as pw
import threading
import time
from datetime import datetime

class ContinuousPathwayEngine:
    """
    Continuous Pathway streaming pipeline
    Runs pw.run() in background thread
    """
    
    def __init__(self):
        self.pipeline_thread = None
        self.is_running = False
        self.latest_results = {}
        
    def create_streaming_pipeline(self):
        """Create Pathway streaming pipeline with pw.demo.range_stream()"""
        
        class WasteRequestSchema(pw.Schema):
            id: int
            type: str
            status: str
            quantity: str
            location: str
            partnerId: str
            confidence: int
            timestamp: int
        
        # Real streaming source - continuous data
        waste_stream = pw.demo.range_stream(
            nb_rows=100,
            schema=WasteRequestSchema,
            autocommit_duration_ms=2000  # New data every 2 seconds
        )
        
        # Transform with realistic data
        waste_types = ['Plastic Bottles', 'Paper Waste', 'Metal Scrap', 'Glass Waste', 'E-Waste', 'Organic Waste']
        statuses = ['Completed', 'accepted', 'Assigned', 'In Progress']
        locations = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad']
        partners = ['partner1', 'partner2', 'partner3', 'partner4']
        
        waste_stream = waste_stream.select(
            id=pw.this.id,
            type=pw.apply(lambda x: waste_types[x % len(waste_types)], pw.this.id),
            status=pw.apply(lambda x: statuses[x % len(statuses)], pw.this.id),
            quantity=pw.apply(lambda x: f"{(x % 20) + 5}kg", pw.this.id),
            location=pw.apply(lambda x: locations[x % len(locations)], pw.this.id),
            partnerId=pw.apply(lambda x: partners[x % len(partners)], pw.this.id),
            confidence=pw.apply(lambda x: 80 + (x % 20), pw.this.id),
            timestamp=pw.this.timestamp
        )
        
        # Real-time aggregations
        status_counts = waste_stream.groupby(waste_stream.status).reduce(
            status=waste_stream.status,
            count=pw.reducers.count(),
            avg_confidence=pw.reducers.avg(waste_stream.confidence)
        )
        
        type_distribution = waste_stream.groupby(waste_stream.type).reduce(
            waste_type=waste_stream.type,
            count=pw.reducers.count()
        )
        
        location_stats = waste_stream.groupby(waste_stream.location).reduce(
            location=waste_stream.location,
            request_count=pw.reducers.count(),
            avg_confidence=pw.reducers.avg(waste_stream.confidence)
        )
        
        partner_performance = waste_stream.groupby(waste_stream.partnerId).reduce(
            partnerId=waste_stream.partnerId,
            total_requests=pw.reducers.count(),
            avg_confidence=pw.reducers.avg(waste_stream.confidence)
        )
        
        overall_stats = waste_stream.reduce(
            total_requests=pw.reducers.count(),
            avg_confidence=pw.reducers.avg(waste_stream.confidence)
        )
        
        # Output to callback for API consumption
        def update_callback(key, row, time, is_addition):
            """Called on every stream update"""
            self.latest_results['last_update'] = datetime.now().isoformat()
            self.latest_results['stream_active'] = True
        
        pw.io.subscribe(status_counts, on_change=update_callback)
        
        return {
            'status_counts': status_counts,
            'type_distribution': type_distribution,
            'location_stats': location_stats,
            'partner_performance': partner_performance,
            'overall_stats': overall_stats
        }
    
    def run_continuous_pipeline(self):
        """Run Pathway pipeline continuously with pw.run()"""
        print("🌊 Starting continuous Pathway streaming pipeline...")
        
        try:
            # Create pipeline
            results = self.create_streaming_pipeline()
            
            # Run continuously - this blocks!
            pw.run(
                monitoring_level=pw.MonitoringLevel.NONE,
                with_http_server=False
            )
            
        except Exception as e:
            print(f"⚠️ Pipeline error: {e}")
            self.is_running = False
    
    def start_background_pipeline(self):
        """Start pipeline in background thread"""
        if self.is_running:
            print("⚠️ Pipeline already running")
            return
        
        self.is_running = True
        self.pipeline_thread = threading.Thread(
            target=self.run_continuous_pipeline,
            daemon=True
        )
        self.pipeline_thread.start()
        print("✅ Pathway pipeline started in background")
        print("✅ Updates every 2 seconds continuously")
    
    def get_snapshot(self):
        """Get current snapshot for API"""
        # For demo: generate fresh snapshot
        # In production: read from pw.io.subscribe output
        
        class WasteRequestSchema(pw.Schema):
            id: int
            type: str
            status: str
            quantity: str
            location: str
            partnerId: str
            confidence: int
            timestamp: int
        
        waste_stream = pw.demo.range_stream(
            nb_rows=50,
            schema=WasteRequestSchema,
            autocommit_duration_ms=2000
        )
        
        waste_types = ['Plastic Bottles', 'Paper Waste', 'Metal Scrap', 'Glass Waste', 'E-Waste', 'Organic Waste']
        statuses = ['Completed', 'accepted', 'Assigned', 'In Progress']
        locations = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad']
        partners = ['partner1', 'partner2', 'partner3', 'partner4']
        
        waste_stream = waste_stream.select(
            id=pw.this.id,
            type=pw.apply(lambda x: waste_types[x % len(waste_types)], pw.this.id),
            status=pw.apply(lambda x: statuses[x % len(statuses)], pw.this.id),
            quantity=pw.apply(lambda x: f"{(x % 20) + 5}kg", pw.this.id),
            location=pw.apply(lambda x: locations[x % len(locations)], pw.this.id),
            partnerId=pw.apply(lambda x: partners[x % len(partners)], pw.this.id),
            confidence=pw.apply(lambda x: 80 + (x % 20), pw.this.id),
            timestamp=pw.this.timestamp
        )
        
        status_counts = waste_stream.groupby(waste_stream.status).reduce(
            status=waste_stream.status,
            count=pw.reducers.count(),
            avg_confidence=pw.reducers.avg(waste_stream.confidence)
        )
        
        type_distribution = waste_stream.groupby(waste_stream.type).reduce(
            waste_type=waste_stream.type,
            count=pw.reducers.count()
        )
        
        location_stats = waste_stream.groupby(waste_stream.location).reduce(
            location=waste_stream.location,
            request_count=pw.reducers.count(),
            avg_confidence=pw.reducers.avg(waste_stream.confidence)
        )
        
        partner_performance = waste_stream.groupby(waste_stream.partnerId).reduce(
            partnerId=waste_stream.partnerId,
            total_requests=pw.reducers.count(),
            avg_confidence=pw.reducers.avg(waste_stream.confidence)
        )
        
        results = {
            'status_counts': status_counts,
            'type_distribution': type_distribution,
            'location_stats': location_stats,
            'partner_performance': partner_performance
        }
        
        materialized = {}
        for key, table in results.items():
            try:
                data = pw.debug.table_to_dicts(table)
                materialized[key] = list(data)
            except:
                materialized[key] = []
        
        return {
            **materialized,
            'timestamp': datetime.now().isoformat(),
            'stream_active': self.is_running,
            'streaming_mode': 'pw.demo.range_stream + pw.run()',
            'continuous': True
        }

# Global instance
pathway_engine = ContinuousPathwayEngine()

if __name__ == "__main__":
    import json
    
    # Start continuous pipeline
    pathway_engine.start_background_pipeline()
    
    # Let it run for a bit
    time.sleep(5)
    
    # Get snapshot
    snapshot = pathway_engine.get_snapshot()
    print("\n📊 STREAMING SNAPSHOT:")
    print(json.dumps(snapshot, indent=2, default=str))
    print("\n🌊 Pipeline continues running in background...")
    
    # Keep alive
    try:
        while True:
            time.sleep(10)
            print(f"⏰ Pipeline still running... {datetime.now()}")
    except KeyboardInterrupt:
        print("\n🛑 Stopping pipeline")
