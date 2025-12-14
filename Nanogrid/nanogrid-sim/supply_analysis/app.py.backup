from flask import Flask, send_file
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DASHBOARD_HTML = os.path.join(BASE_DIR, 'dashboard.html')

@app.route('/')
def index():
    try:
        if os.path.exists(DASHBOARD_HTML):
            return send_file(DASHBOARD_HTML)
        return {'error': 'Dashboard not found'}, 404
    except Exception as e:
        return {'error': str(e)}, 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return {'status': 'healthy', 'service': 'supply_analysis'}

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5003))
    app.run(host='0.0.0.0', port=port, debug=False)
