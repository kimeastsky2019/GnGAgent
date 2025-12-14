"""
Enhanced Energy Demand Analysis Service
Features: Data Source Management, Metadata AI Agent, Model Selection, Enhanced EDA
"""

from flask import Flask, render_template_string, send_from_directory, jsonify, request, session
from flask_cors import CORS
import os
import json
from werkzeug.utils import secure_filename
from datetime import datetime
import traceback
import sys
from pathlib import Path
import pandas as pd

# Import local modules
from data_source_manager import DataSourceManager
from metadata_agent import MetadataAgent
from energy_agent_enhanced import EnergyDemandAgentEnhanced

app = Flask(__name__)
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024
app.config['UPLOAD_FOLDER'] = 'uploads'
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, app.config['UPLOAD_FOLDER'])
RESULTS_DIR = os.path.join(BASE_DIR, 'results')
ALLOWED_EXTENSIONS = {'csv', 'txt'}

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

# Initialize managers
data_source_manager = DataSourceManager()
metadata_agent = MetadataAgent()

# Available models from series_modeling
AVAILABLE_MODELS = {
    'forecasting': [
        {'id': 'RandomForest', 'name': 'Random Forest', 'description': 'Ensemble tree-based model'},
        {'id': 'LSTM', 'name': 'LSTM', 'description': 'Long Short-Term Memory neural network'},
        {'id': 'CNN', 'name': 'CNN', 'description': '1D Convolutional Neural Network'},
        {'id': 'Multivariate_LSTM', 'name': 'Multivariate LSTM', 'description': 'LSTM for multiple time series'},
        {'id': 'CNN_LSTM', 'name': 'CNN-LSTM', 'description': 'Hybrid CNN-LSTM model'},
        {'id': 'AutoEncoder', 'name': 'Auto-Encoder', 'description': 'Autoencoder-based forecasting'},
        {'id': 'TimeGAN', 'name': 'TimeGAN', 'description': 'Generative Adversarial Network for time series'}
    ],
    'anomaly_detection': [
        {'id': 'IsolationForest', 'name': 'Isolation Forest', 'description': 'Isolation Forest algorithm'},
        {'id': 'Prophet', 'name': 'Prophet', 'description': 'Facebook Prophet with anomaly detection'},
        {'id': 'HMM', 'name': 'HMM', 'description': 'Hidden Markov Model'},
        {'id': 'Transformer', 'name': 'Transformer', 'description': 'Transformer-based anomaly detection'},
        {'id': 'TFT', 'name': 'Temporal Fusion Transformer', 'description': 'Advanced transformer for time series'},
        {'id': 'TadGAN', 'name': 'TadGAN', 'description': 'Time-series Anomaly Detection GAN'}
    ]
}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def read_dashboard_html():
    try:
        with open(os.path.join(BASE_DIR, 'dashboard.html'), 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        # Fallback to old dashboard
        try:
            with open(os.path.join(BASE_DIR, 'energy_dashboard.html'), 'r', encoding='utf-8') as f:
                return f.read()
        except:
            return f'Error loading dashboard: {str(e)}'


@app.route('/')
def index():
    html_content = read_dashboard_html()
    return html_content


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Energy Demand Analysis Service',
        'timestamp': datetime.now().isoformat()
    })


# ==================== Data Source Management ====================

@app.route('/api/data-sources', methods=['GET'])
def get_data_sources():
    """Get all data sources"""
    try:
        sources = data_source_manager.get_all_sources()
        return jsonify({
            'success': True,
            'sources': sources
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/data-sources', methods=['POST'])
def add_data_source():
    """Add a new data source (CSV or API)"""
    try:
        data = request.get_json()
        source_type = data.get('type')  # 'csv' or 'api'
        name = data.get('name')
        description = data.get('description', '')
        
        if not name:
            return jsonify({
                'success': False,
                'error': 'Name is required'
            }), 400
        
        if source_type == 'csv':
            # Handle CSV file upload
            if 'file' not in request.files:
                return jsonify({
                    'success': False,
                    'error': 'No file provided'
                }), 400
            
            file = request.files['file']
            if file.filename == '':
                return jsonify({
                    'success': False,
                    'error': 'No file selected'
                }), 400
            
            if not allowed_file(file.filename):
                return jsonify({
                    'success': False,
                    'error': 'Invalid file type. Only CSV files are allowed.'
                }), 400
            
            filename = secure_filename(file.filename)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            saved_filename = f'{timestamp}_{filename}'
            filepath = os.path.join(UPLOAD_DIR, saved_filename)
            file.save(filepath)
            
            source = data_source_manager.add_csv_source(name, description, filepath)
            
        elif source_type == 'api':
            # Handle API source
            api_url = data.get('api_url')
            api_config = data.get('api_config', {})
            
            if not api_url:
                return jsonify({
                    'success': False,
                    'error': 'API URL is required'
                }), 400
            
            source = data_source_manager.add_api_source(name, description, api_url, api_config)
            
        else:
            return jsonify({
                'success': False,
                'error': 'Invalid source type. Must be "csv" or "api"'
            }), 400
        
        return jsonify({
            'success': True,
            'source': source,
            'message': 'Data source added successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/data-sources/<int:source_id>', methods=['GET'])
def get_data_source(source_id):
    """Get a specific data source"""
    try:
        source = data_source_manager.get_source(source_id)
        if not source:
            return jsonify({
                'success': False,
                'error': 'Data source not found'
            }), 404
        
        return jsonify({
            'success': True,
            'source': source
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/data-sources/<int:source_id>', methods=['DELETE'])
def delete_data_source(source_id):
    """Delete a data source"""
    try:
        data_source_manager.delete_source(source_id)
        return jsonify({
            'success': True,
            'message': 'Data source deleted successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/data-sources/<int:source_id>/fetch', methods=['POST'])
def fetch_data_source(source_id):
    """Fetch data from a data source"""
    try:
        df = data_source_manager.load_data(source_id)
        
        # Convert to JSON-serializable format
        data_dict = df.to_dict('records')
        
        return jsonify({
            'success': True,
            'data': data_dict,
            'columns': df.columns.tolist(),
            'row_count': len(df)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ==================== Metadata AI Agent ====================

@app.route('/api/data-sources/<int:source_id>/metadata', methods=['POST'])
def extract_metadata(source_id):
    """Extract metadata from data source using AI agent"""
    try:
        # Load data
        df = data_source_manager.load_data(source_id)
        source_info = data_source_manager.get_source(source_id)
        
        # Extract metadata
        metadata = metadata_agent.extract_metadata(df, source_info)
        
        # Clean data
        cleaned_df = metadata_agent.clean_data(df, metadata)
        
        # Update source metadata in database
        data_source_manager.update_metadata(source_id, metadata)
        
        # Save cleaned data
        cleaned_filepath = os.path.join(RESULTS_DIR, f'cleaned_{source_id}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv')
        cleaned_df.to_csv(cleaned_filepath, index=False)
        
        return jsonify({
            'success': True,
            'metadata': metadata,
            'cleaned_data_path': cleaned_filepath,
            'row_count': len(cleaned_df)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ==================== Model Selection ====================

@app.route('/api/models', methods=['GET'])
def get_available_models():
    """Get available models"""
    return jsonify({
        'success': True,
        'models': AVAILABLE_MODELS
    })


# ==================== Analysis ====================

@app.route('/api/data-sources/<int:source_id>/analyze', methods=['POST'])
def analyze_data_source(source_id):
    """Run full analysis on a data source"""
    try:
        data = request.get_json() or {}
        forecasting_model = data.get('forecasting_model', 'RandomForest')
        anomaly_model = data.get('anomaly_model', 'IsolationForest')
        
        # Load data
        df = data_source_manager.load_data(source_id)
        source_info = data_source_manager.get_source(source_id)
        
        # Extract metadata
        metadata = metadata_agent.extract_metadata(df, source_info)
        
        # Clean data
        cleaned_df = metadata_agent.clean_data(df, metadata)
        
        # Save cleaned data temporarily
        temp_filepath = os.path.join(RESULTS_DIR, f'temp_{source_id}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv')
        cleaned_df.to_csv(temp_filepath, index=False)
        
        # Initialize agent
        agent = EnergyDemandAgentEnhanced(temp_filepath, model_type=forecasting_model)
        
        # Run full analysis
        results = agent.run_full_analysis()
        
        # Add metadata to results
        results['metadata'] = metadata
        results['source_info'] = source_info
        
        # Save results
        result_filepath = os.path.join(RESULTS_DIR, f'analysis_{source_id}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json')
        with open(result_filepath, 'w', encoding='utf-8') as f:
            json.dump({
                'metadata': metadata,
                'quality_report': results.get('quality_report', {}),
                'statistics': results.get('statistics', {}),
                'predictions_count': len(results.get('predictions', [])) if results.get('predictions') is not None else 0,
                'anomalies_count': len(results.get('anomalies', [])) if results.get('anomalies') is not None else 0
            }, f, indent=2, default=str)
        
        return jsonify({
            'success': True,
            'results': {
                'metadata': metadata,
                'quality_report': results.get('quality_report', {}),
                'statistics': results.get('statistics', {}),
                'predictions_count': len(results.get('predictions', [])) if results.get('predictions') is not None else 0,
                'anomalies_count': len(results.get('anomalies', [])) if results.get('anomalies') is not None else 0,
                'model_metrics': results.get('metrics', {})
            },
            'result_file': result_filepath
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/data-sources/<int:source_id>/forecast', methods=['POST'])
def forecast_data_source(source_id):
    """Generate forecasts for a data source"""
    try:
        data = request.get_json() or {}
        model_type = data.get('model_type', 'RandomForest')
        hours_ahead = data.get('hours_ahead', 168)  # Default 7 days
        
        # Load and process data
        df = data_source_manager.load_data(source_id)
        cleaned_df = metadata_agent.clean_data(df)
        
        temp_filepath = os.path.join(RESULTS_DIR, f'temp_forecast_{source_id}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv')
        cleaned_df.to_csv(temp_filepath, index=False)
        
        # Initialize agent
        agent = EnergyDemandAgentEnhanced(temp_filepath, model_type=model_type)
        agent.load_data()
        agent.preprocess_data()
        agent.train_forecast_model()
        predictions = agent.generate_future_predictions(hours_ahead=hours_ahead)
        
        # Convert predictions to JSON
        if predictions is not None and len(predictions) > 0:
            predictions_dict = predictions.to_dict('records')
        else:
            predictions_dict = []
        
        return jsonify({
            'success': True,
            'predictions': predictions_dict,
            'model_type': model_type,
            'hours_ahead': hours_ahead
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/data-sources/<int:source_id>/anomalies', methods=['POST'])
def detect_anomalies(source_id):
    """Detect anomalies in a data source"""
    try:
        data = request.get_json() or {}
        model_type = data.get('model_type', 'IsolationForest')
        
        # Load and process data
        df = data_source_manager.load_data(source_id)
        cleaned_df = metadata_agent.clean_data(df)
        
        temp_filepath = os.path.join(RESULTS_DIR, f'temp_anomaly_{source_id}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv')
        cleaned_df.to_csv(temp_filepath, index=False)
        
        # Initialize agent
        agent = EnergyDemandAgentEnhanced(temp_filepath)
        agent.load_data()
        agent.preprocess_data()
        anomalies = agent.detect_anomalies()
        
        # Convert anomalies to JSON
        if anomalies is not None and len(anomalies) > 0:
            anomalies_dict = anomalies.to_dict('records')
        else:
            anomalies_dict = []
        
        return jsonify({
            'success': True,
            'anomalies': anomalies_dict,
            'anomaly_count': len(anomalies) if anomalies is not None else 0,
            'model_type': model_type
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/data-sources/<int:source_id>/eda', methods=['POST'])
def generate_eda(source_id):
    """Generate Enhanced EDA (Exploratory Data Analysis)"""
    try:
        # Load data
        df = data_source_manager.load_data(source_id)
        cleaned_df = metadata_agent.clean_data(df)
        
        # Extract metadata
        source_info = data_source_manager.get_source(source_id)
        metadata = metadata_agent.extract_metadata(cleaned_df, source_info)
        
        # Generate EDA statistics
        eda_results = {
            'metadata': metadata,
            'summary_statistics': cleaned_df.describe().to_dict(),
            'correlation_matrix': cleaned_df.select_dtypes(include=['number']).corr().to_dict() if len(cleaned_df.select_dtypes(include=['number']).columns) > 0 else {},
            'missing_values': cleaned_df.isnull().sum().to_dict(),
            'data_types': {col: str(dtype) for col, dtype in cleaned_df.dtypes.items()},
            'shape': {
                'rows': len(cleaned_df),
                'columns': len(cleaned_df.columns)
            }
        }
        
        return jsonify({
            'success': True,
            'eda': eda_results
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5002))
    app.run(host='0.0.0.0', port=port, debug=True)
