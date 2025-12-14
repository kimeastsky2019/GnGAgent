from flask import Flask, render_template_string, send_from_directory, jsonify, request
from flask_cors import CORS
import os
import json
from werkzeug.utils import secure_filename
from datetime import datetime
import traceback
import sys

app = Flask(__name__)
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024
app.config['UPLOAD_FOLDER'] = 'uploads'

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, app.config['UPLOAD_FOLDER'])
RESULTS_DIR = os.path.join(BASE_DIR, 'results')
ALLOWED_EXTENSIONS = {'csv', 'txt'}

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def read_dashboard_html():
    try:
        with open(os.path.join(BASE_DIR, 'energy_dashboard.html'), 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        return f'Error loading dashboard: {str(e)}'

@app.route('/')
def index():
    html_content = read_dashboard_html()
    return html_content
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'Energy Demand Analysis',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'Invalid file type. Only CSV files are allowed.'}), 400
        
        # Get model type from request
        model_type = request.form.get('model_type', 'RandomForest')
        
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        saved_filename = f'{timestamp}_{filename}'
        filepath = os.path.join(UPLOAD_DIR, saved_filename)
        
        try:
            file.save(filepath)
        except Exception as e:
            return jsonify({'success': False, 'error': f'Failed to save file: {str(e)}'}), 500
        
        if not os.path.exists(filepath):
            return jsonify({'success': False, 'error': 'File was not saved successfully'}), 500
        
        try:
            result = process_energy_data(filepath, saved_filename, model_type)
            return jsonify({
                'success': True,
                'message': 'File uploaded and processed successfully',
                'filename': saved_filename,
                'result': result
            })
        except Exception as e:
            return jsonify({
                'success': True,
                'message': 'File uploaded but processing failed',
                'filename': saved_filename,
                'error': str(e),
                'result': {
                    'quality_score': 0,
                    'total_records': 0,
                    'anomalies_count': 0,
                    'predictions_count': 0
                }
            })
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Upload failed: {str(e)}'
        }), 500

def process_energy_data(filepath, original_filename, model_type='RandomForest'):
    try:
        sys.path.insert(0, BASE_DIR)
        
        # Try enhanced agent first, fallback to original
        try:
            from energy_agent_enhanced import EnergyDemandAgentEnhanced
            use_enhanced = True
        except ImportError:
            # Fallback to original agent
            from energy_agent import EnergyDemandAgent as EnergyDemandAgentEnhanced
            use_enhanced = False
        
        # Create agent (enhanced or original)
        if use_enhanced:
            agent = EnergyDemandAgentEnhanced(filepath, model_type=model_type)
        else:
            # Original agent doesn't support model_type parameter
            agent = EnergyDemandAgentEnhanced(filepath)
        agent.load_data()
        quality_report = agent.validate_data_quality()
        clean_data = agent.preprocess_data()
        anomalies = agent.detect_anomalies()
        
        # Train model and generate predictions
        predictions = None
        metrics = None
        try:
            if len(agent.clean_data) >= 20:
                metrics, test_data, y_pred = agent.train_forecast_model(model_type)
                predictions = agent.generate_future_predictions(hours_ahead=168)
            else:
                import pandas as pd
                predictions = pd.DataFrame({
                    'time': [],
                    'predicted_kWh': [],
                    'confidence_lower': [],
                    'confidence_upper': []
                })
        except Exception as e:
            print(f'Warning: Model training failed: {str(e)}')
            import pandas as pd
            predictions = pd.DataFrame({
                'time': [],
                'predicted_kWh': [],
                'confidence_lower': [],
                'confidence_upper': []
            })
        
        metadata = {
            'filename': original_filename,
            'upload_time': datetime.now().isoformat(),
            'total_records': len(agent.raw_data) if agent.raw_data is not None else 0,
            'quality_score': quality_report.get('quality_score', 0),
            'data_range': quality_report.get('date_range', {}),
            'anomalies_count': len(anomalies) if anomalies is not None and hasattr(anomalies, '__len__') else 0,
            'predictions_count': len(predictions) if predictions is not None and hasattr(predictions, '__len__') else 0,
            'model_type': model_type
        }
        
        os.makedirs(RESULTS_DIR, exist_ok=True)
        
        if predictions is not None and hasattr(predictions, 'to_csv'):
            predictions.to_csv(os.path.join(RESULTS_DIR, 'predictions.csv'), index=False)
        if anomalies is not None and hasattr(anomalies, 'to_csv'):
            anomalies.to_csv(os.path.join(RESULTS_DIR, 'anomalies.csv'), index=False)
        
        with open(os.path.join(RESULTS_DIR, 'metadata.json'), 'w') as f:
            json.dump(metadata, f, indent=2, default=str)
        
        summary = {
            'quality_score': metadata['quality_score'],
            'total_records': metadata['total_records'],
            'anomalies_count': metadata['anomalies_count'],
            'predictions_count': metadata['predictions_count'],
            'data_range': metadata['data_range'],
            'metadata': metadata,
            'model_type': model_type
        }
        
        with open(os.path.join(RESULTS_DIR, 'analysis_summary.json'), 'w') as f:
            json.dump(summary, f, indent=2, default=str)
        
        with open(os.path.join(BASE_DIR, 'analysis_summary.json'), 'w') as f:
            json.dump(summary, f, indent=2, default=str)
        
        return summary
    except Exception as e:
        error_msg = str(e)
        error_trace = traceback.format_exc()
        print(f'Processing error: {error_msg}')
        print(f'Traceback: {error_trace}')
        raise Exception(f'Processing error: {error_msg}')

@app.route('/api/summary', methods=['GET'])
def get_summary():
    try:
        results_path = os.path.join(RESULTS_DIR, 'analysis_summary.json')
        summary_path = os.path.join(BASE_DIR, 'analysis_summary.json')
        
        if os.path.exists(results_path):
            with open(results_path, 'r', encoding='utf-8') as f:
                return jsonify(json.load(f))
        elif os.path.exists(summary_path):
            with open(summary_path, 'r', encoding='utf-8') as f:
                return jsonify(json.load(f))
        else:
            return jsonify({'error': 'Summary file not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/patterns', methods=['GET'])
def get_patterns():
    try:
        sys.path.insert(0, BASE_DIR)
        from energy_agent_enhanced import EnergyDemandAgentEnhanced
        
        uploads = sorted([f for f in os.listdir(UPLOAD_DIR) if f.endswith('.csv')], reverse=True)
        if not uploads:
            return jsonify({'error': 'No data file found'}), 404
        
        filepath = os.path.join(UPLOAD_DIR, uploads[0])
        agent = EnergyDemandAgentEnhanced(filepath)
        agent.load_data()
        agent.validate_data_quality()
        agent.preprocess_data()
        
        # Get patterns (if method exists)
        if hasattr(agent, 'get_time_patterns'):
            patterns = agent.get_time_patterns()
        else:
            patterns = {}
        return jsonify(patterns)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/heatmap', methods=['GET'])
def get_heatmap():
    try:
        sys.path.insert(0, BASE_DIR)
        from energy_agent_enhanced import EnergyDemandAgentEnhanced
        
        uploads = sorted([f for f in os.listdir(UPLOAD_DIR) if f.endswith('.csv')], reverse=True)
        if not uploads:
            return jsonify({'error': 'No data file found'}), 404
        
        filepath = os.path.join(UPLOAD_DIR, uploads[0])
        agent = EnergyDemandAgentEnhanced(filepath)
        agent.load_data()
        agent.validate_data_quality()
        agent.preprocess_data()
        
        # Get heatmap data (if method exists)
        if hasattr(agent, 'get_heatmap_data'):
            heatmap_data = agent.get_heatmap_data()
        else:
            heatmap_data = None
        if heatmap_data is None:
            return jsonify({'error': 'Heatmap data not available'}), 404
        return jsonify(heatmap_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/analyze', methods=['GET', 'POST'])
def analyze_file():
    """Analyze file from URL parameter or request"""
    try:
        # Get filename from query parameter or form
        filename = request.args.get('file') or request.form.get('file')
        
        if not filename:
            return jsonify({'success': False, 'error': 'No file specified'}), 400
        
        # Security: only allow CSV files
        if not filename.endswith('.csv'):
            return jsonify({'success': False, 'error': 'Only CSV files are allowed'}), 400
        
        # Find file in uploads directory
        filepath = None
        
        # Check uploads directory first
        upload_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(upload_path):
            filepath = upload_path
        else:
            # Search in parent directories
            search_paths = [
                BASE_DIR,
                os.path.join(BASE_DIR, '..'),
                os.path.join(BASE_DIR, '../..'),
                os.path.join(BASE_DIR, '../../..')
            ]
            
            for search_path in search_paths:
                if os.path.exists(search_path):
                    for root, dirs, files in os.walk(search_path):
                        if filename in files:
                            filepath = os.path.join(root, filename)
                            break
                    if filepath:
                        break
        
        if not filepath or not os.path.exists(filepath):
            return jsonify({
                'success': False,
                'error': f'File not found: {filename}. Searched in: {UPLOAD_DIR}'
            }), 404
        
        # Get model type from request
        model_type = request.args.get('model_type') or request.form.get('model_type', 'RandomForest')
        
        # Process the file
        try:
            result = process_energy_data(filepath, filename, model_type)
            return jsonify({
                'success': True,
                'message': 'File analyzed successfully',
                'filename': filename,
                'result': result
            })
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f'Analysis error: {error_trace}')
            return jsonify({
                'success': False,
                'error': f'Analysis failed: {str(e)}',
                'filename': filename
            }), 500
            
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f'Analysis endpoint error: {error_trace}')
        return jsonify({
            'success': False,
            'error': f'Analysis error: {str(e)}'
        }), 500

@app.route('/api/data/<path:filename>')
def get_data(filename):
    try:
        return send_from_directory(BASE_DIR, filename, as_attachment=False)
    except Exception as e:
        return jsonify({'error': str(e)}), 404

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5002))
    app.run(debug=False, host='0.0.0.0', port=port)
