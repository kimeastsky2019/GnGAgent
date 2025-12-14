"""
Data Source Manager for Energy Demand Analysis
Handles CSV files and IoT sensor API data sources
"""

import os
import json
import pandas as pd
import requests
from datetime import datetime
from typing import Dict, List, Optional
from pathlib import Path
import sqlite3


class DataSourceManager:
    """Manages data sources (CSV files and IoT API endpoints)"""
    
    def __init__(self, db_path: str = "data_sources.db"):
        self.db_path = db_path
        self.base_dir = Path(__file__).parent
        self.data_dir = self.base_dir / "data_sources"
        self.data_dir.mkdir(exist_ok=True)
        self._init_database()
    
    def _init_database(self):
        """Initialize SQLite database for data source metadata"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS data_sources (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                source_type TEXT NOT NULL,
                source_path TEXT,
                api_url TEXT,
                api_config TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active INTEGER DEFAULT 1,
                metadata TEXT
            )
        """)
        
        conn.commit()
        conn.close()
    
    def add_csv_source(self, name: str, description: str, file_path: str) -> Dict:
        """Add a CSV file data source"""
        source_id = self._save_to_db({
            'name': name,
            'description': description,
            'source_type': 'csv',
            'source_path': file_path,
            'api_url': None,
            'api_config': None
        })
        
        return {
            'id': source_id,
            'name': name,
            'description': description,
            'type': 'csv',
            'path': file_path,
            'status': 'active'
        }
    
    def add_api_source(self, name: str, description: str, api_url: str, 
                       api_config: Dict) -> Dict:
        """Add an IoT sensor API data source"""
        source_id = self._save_to_db({
            'name': name,
            'description': description,
            'source_type': 'api',
            'source_path': None,
            'api_url': api_url,
            'api_config': json.dumps(api_config)
        })
        
        return {
            'id': source_id,
            'name': name,
            'description': description,
            'type': 'api',
            'url': api_url,
            'config': api_config,
            'status': 'active'
        }
    
    def _save_to_db(self, data: Dict) -> int:
        """Save data source to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO data_sources 
            (name, description, source_type, source_path, api_url, api_config)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            data['name'],
            data['description'],
            data['source_type'],
            data.get('source_path'),
            data.get('api_url'),
            data.get('api_config')
        ))
        
        source_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return source_id
    
    def get_all_sources(self) -> List[Dict]:
        """Get all data sources"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, name, description, source_type, source_path, 
                   api_url, api_config, created_at, updated_at, is_active, metadata
            FROM data_sources
            WHERE is_active = 1
            ORDER BY created_at DESC
        """)
        
        rows = cursor.fetchall()
        conn.close()
        
        sources = []
        for row in rows:
            sources.append({
                'id': row[0],
                'name': row[1],
                'description': row[2],
                'type': row[3],
                'path': row[4],
                'api_url': row[5],
                'api_config': json.loads(row[6]) if row[6] else None,
                'created_at': row[7],
                'updated_at': row[8],
                'is_active': bool(row[9]),
                'metadata': json.loads(row[10]) if row[10] else None
            })
        
        return sources
    
    def get_source(self, source_id: int) -> Optional[Dict]:
        """Get a specific data source"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, name, description, source_type, source_path, 
                   api_url, api_config, created_at, updated_at, is_active, metadata
            FROM data_sources
            WHERE id = ?
        """, (source_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return None
        
        return {
            'id': row[0],
            'name': row[1],
            'description': row[2],
            'type': row[3],
            'path': row[4],
            'api_url': row[5],
            'api_config': json.loads(row[6]) if row[6] else None,
            'created_at': row[7],
            'updated_at': row[8],
            'is_active': bool(row[9]),
            'metadata': json.loads(row[10]) if row[10] else None
        }
    
    def fetch_api_data(self, source_id: int) -> pd.DataFrame:
        """Fetch data from IoT API endpoint"""
        source = self.get_source(source_id)
        if not source or source['type'] != 'api':
            raise ValueError(f"Source {source_id} is not an API source")
        
        api_url = source['api_url']
        config = source.get('api_config', {})
        
        # Make API request
        headers = config.get('headers', {})
        params = config.get('params', {})
        method = config.get('method', 'GET').upper()
        
        if method == 'GET':
            response = requests.get(api_url, headers=headers, params=params, timeout=30)
        elif method == 'POST':
            response = requests.post(api_url, headers=headers, json=params, timeout=30)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
        
        response.raise_for_status()
        data = response.json()
        
        # Convert to DataFrame
        if isinstance(data, list):
            df = pd.DataFrame(data)
        elif isinstance(data, dict):
            # Try to find data array in common structures
            if 'data' in data:
                df = pd.DataFrame(data['data'])
            elif 'results' in data:
                df = pd.DataFrame(data['results'])
            else:
                df = pd.DataFrame([data])
        else:
            raise ValueError("Unexpected API response format")
        
        return df
    
    def load_csv_data(self, source_id: int) -> pd.DataFrame:
        """Load data from CSV file"""
        source = self.get_source(source_id)
        if not source or source['type'] != 'csv':
            raise ValueError(f"Source {source_id} is not a CSV source")
        
        file_path = source['path']
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"CSV file not found: {file_path}")
        
        return pd.read_csv(file_path)
    
    def load_data(self, source_id: int) -> pd.DataFrame:
        """Load data from any source type"""
        source = self.get_source(source_id)
        if not source:
            raise ValueError(f"Source {source_id} not found")
        
        if source['type'] == 'csv':
            return self.load_csv_data(source_id)
        elif source['type'] == 'api':
            return self.fetch_api_data(source_id)
        else:
            raise ValueError(f"Unknown source type: {source['type']}")
    
    def update_metadata(self, source_id: int, metadata: Dict):
        """Update metadata for a data source"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE data_sources
            SET metadata = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (json.dumps(metadata), source_id))
        
        conn.commit()
        conn.close()
    
    def delete_source(self, source_id: int):
        """Delete (deactivate) a data source"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE data_sources
            SET is_active = 0, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (source_id,))
        
        conn.commit()
        conn.close()

