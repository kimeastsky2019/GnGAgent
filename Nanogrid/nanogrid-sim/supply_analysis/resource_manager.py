"""
Resource Manager for Energy Supply Analysis
Handles energy resource management (CSV files and IoT API endpoints)
"""

import os
import json
import pandas as pd
import requests
from datetime import datetime
from typing import Dict, List, Optional
from pathlib import Path
import sqlite3


class ResourceManager:
    """Manages energy resources (CSV files and IoT API endpoints)"""
    
    def __init__(self, db_path: str = "energy_resources.db"):
        self.db_path = db_path
        self.base_dir = Path(__file__).parent
        self.data_dir = self.base_dir / "resources"
        self.data_dir.mkdir(exist_ok=True)
        self._init_database()
    
    def _init_database(self):
        """Initialize SQLite database for resource metadata"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS energy_resources (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                resource_type TEXT NOT NULL,
                source_path TEXT,
                api_url TEXT,
                api_config TEXT,
                weather_api_url TEXT,
                weather_api_config TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active INTEGER DEFAULT 1,
                metadata TEXT
            )
        """)
        
        conn.commit()
        conn.close()
    
    def add_csv_resource(self, name: str, description: str, file_path: str, 
                         weather_api_url: str = None, weather_api_config: Dict = None) -> Dict:
        """Add a CSV file energy resource"""
        resource_id = self._save_to_db({
            'name': name,
            'description': description,
            'resource_type': 'csv',
            'source_path': file_path,
            'api_url': None,
            'api_config': None,
            'weather_api_url': weather_api_url,
            'weather_api_config': json.dumps(weather_api_config) if weather_api_config else None
        })
        
        return {
            'id': resource_id,
            'name': name,
            'description': description,
            'type': 'csv',
            'path': file_path,
            'weather_api_url': weather_api_url,
            'status': 'active'
        }
    
    def add_api_resource(self, name: str, description: str, api_url: str, 
                        api_config: Dict, weather_api_url: str = None, 
                        weather_api_config: Dict = None) -> Dict:
        """Add an IoT sensor API energy resource"""
        resource_id = self._save_to_db({
            'name': name,
            'description': description,
            'resource_type': 'api',
            'source_path': None,
            'api_url': api_url,
            'api_config': json.dumps(api_config),
            'weather_api_url': weather_api_url,
            'weather_api_config': json.dumps(weather_api_config) if weather_api_config else None
        })
        
        return {
            'id': resource_id,
            'name': name,
            'description': description,
            'type': 'api',
            'url': api_url,
            'config': api_config,
            'weather_api_url': weather_api_url,
            'status': 'active'
        }
    
    def _save_to_db(self, data: Dict) -> int:
        """Save resource to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO energy_resources 
            (name, description, resource_type, source_path, api_url, api_config, 
             weather_api_url, weather_api_config)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data['name'],
            data['description'],
            data['resource_type'],
            data.get('source_path'),
            data.get('api_url'),
            data.get('api_config'),
            data.get('weather_api_url'),
            data.get('weather_api_config')
        ))
        
        resource_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return resource_id
    
    def get_all_resources(self) -> List[Dict]:
        """Get all energy resources"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, name, description, resource_type, source_path, 
                   api_url, api_config, weather_api_url, weather_api_config,
                   created_at, updated_at, is_active, metadata
            FROM energy_resources
            WHERE is_active = 1
            ORDER BY created_at DESC
        """)
        
        rows = cursor.fetchall()
        conn.close()
        
        resources = []
        for row in rows:
            resources.append({
                'id': row[0],
                'name': row[1],
                'description': row[2],
                'type': row[3],
                'path': row[4],
                'api_url': row[5],
                'api_config': json.loads(row[6]) if row[6] else None,
                'weather_api_url': row[7],
                'weather_api_config': json.loads(row[8]) if row[8] else None,
                'created_at': row[9],
                'updated_at': row[10],
                'is_active': bool(row[11]),
                'metadata': json.loads(row[12]) if row[12] else None
            })
        
        return resources
    
    def get_resource(self, resource_id: int) -> Optional[Dict]:
        """Get a specific energy resource"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, name, description, resource_type, source_path, 
                   api_url, api_config, weather_api_url, weather_api_config,
                   created_at, updated_at, is_active, metadata
            FROM energy_resources
            WHERE id = ?
        """, (resource_id,))
        
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
            'weather_api_url': row[7],
            'weather_api_config': json.loads(row[8]) if row[8] else None,
            'created_at': row[9],
            'updated_at': row[10],
            'is_active': bool(row[11]),
            'metadata': json.loads(row[12]) if row[12] else None
        }
    
    def fetch_api_data(self, resource_id: int) -> pd.DataFrame:
        """Fetch data from IoT API endpoint"""
        resource = self.get_resource(resource_id)
        if not resource or resource['type'] != 'api':
            raise ValueError(f"Resource {resource_id} is not an API resource")
        
        api_url = resource['api_url']
        config = resource.get('api_config', {})
        
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
            if 'data' in data:
                df = pd.DataFrame(data['data'])
            elif 'results' in data:
                df = pd.DataFrame(data['results'])
            else:
                df = pd.DataFrame([data])
        else:
            raise ValueError("Unexpected API response format")
        
        return df
    
    def fetch_weather_data(self, resource_id: int) -> pd.DataFrame:
        """Fetch weather data for a resource"""
        resource = self.get_resource(resource_id)
        if not resource or not resource.get('weather_api_url'):
            raise ValueError(f"Weather API not configured for resource {resource_id}")
        
        weather_url = resource['weather_api_url']
        config = resource.get('weather_api_config', {})
        
        headers = config.get('headers', {})
        params = config.get('params', {})
        method = config.get('method', 'GET').upper()
        
        if method == 'GET':
            response = requests.get(weather_url, headers=headers, params=params, timeout=30)
        elif method == 'POST':
            response = requests.post(weather_url, headers=headers, json=params, timeout=30)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
        
        response.raise_for_status()
        data = response.json()
        
        # Convert to DataFrame
        if isinstance(data, list):
            df = pd.DataFrame(data)
        elif isinstance(data, dict):
            if 'data' in data:
                df = pd.DataFrame(data['data'])
            elif 'forecast' in data:
                df = pd.DataFrame(data['forecast'])
            else:
                df = pd.DataFrame([data])
        else:
            raise ValueError("Unexpected weather API response format")
        
        return df
    
    def load_csv_data(self, resource_id: int) -> pd.DataFrame:
        """Load data from CSV file"""
        resource = self.get_resource(resource_id)
        if not resource or resource['type'] != 'csv':
            raise ValueError(f"Resource {resource_id} is not a CSV resource")
        
        file_path = resource['path']
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"CSV file not found: {file_path}")
        
        return pd.read_csv(file_path)
    
    def load_data(self, resource_id: int, include_weather: bool = False) -> pd.DataFrame:
        """Load data from any resource type, optionally including weather data"""
        resource = self.get_resource(resource_id)
        if not resource:
            raise ValueError(f"Resource {resource_id} not found")
        
        if resource['type'] == 'csv':
            df = self.load_csv_data(resource_id)
        elif resource['type'] == 'api':
            df = self.fetch_api_data(resource_id)
        else:
            raise ValueError(f"Unknown resource type: {resource['type']}")
        
        # Merge weather data if requested
        if include_weather and resource.get('weather_api_url'):
            try:
                weather_df = self.fetch_weather_data(resource_id)
                # Merge on timestamp if available
                if 'time' in df.columns and 'time' in weather_df.columns:
                    df = pd.merge(df, weather_df, on='time', how='left', suffixes=('', '_weather'))
                else:
                    # Append weather columns
                    for col in weather_df.columns:
                        if col not in df.columns:
                            df[col] = weather_df[col].values[:len(df)]
            except Exception as e:
                print(f"Warning: Could not fetch weather data: {e}")
        
        return df
    
    def update_metadata(self, resource_id: int, metadata: Dict):
        """Update metadata for a resource"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE energy_resources
            SET metadata = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (json.dumps(metadata), resource_id))
        
        conn.commit()
        conn.close()
    
    def delete_resource(self, resource_id: int):
        """Delete (deactivate) a resource"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE energy_resources
            SET is_active = 0, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (resource_id,))
        
        conn.commit()
        conn.close()

