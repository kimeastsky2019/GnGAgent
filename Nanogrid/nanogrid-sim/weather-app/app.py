from flask import Flask, send_from_directory, jsonify, send_file
from flask_cors import CORS
import os

app = Flask(__name__, static_url_path='')
CORS(app)

# Base directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Static folders
BUILD_DIR = os.path.join(BASE_DIR, 'build')
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')

@app.route('/')
def index():
    """Serve the main HTML file with fixed static file paths"""
    # Try to find HTML files in order of preference
    html_files = [
        os.path.join('build', 'index.html'),
        os.path.join('public', 'index.html'),
        'index.html',
        'dashboard.html',
        'weather.html'
    ]
    
    html_path = None
    for html_file in html_files:
        file_path = os.path.join(BASE_DIR, html_file)
        if os.path.exists(file_path):
            html_path = file_path
            break
    
    if html_path:
        # Read the HTML file
        with open(html_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        # Fix static file paths to use /weather/static/ prefix
        html_content = html_content.replace('src="/static/', 'src="/weather/static/')
        html_content = html_content.replace('href="/static/', 'href="/weather/static/')
        html_content = html_content.replace('href="/favicon.ico', 'href="/weather/favicon.ico')
        html_content = html_content.replace('href="/manifest.json', 'href="/weather/manifest.json')
        html_content = html_content.replace('href="/logo192.png', 'href="/weather/logo192.png')
        # Fix title
        html_content = html_content.replace('<title>🌤️ Weather Analysis Dashboard</title>', '<title>한국 날씨 분석</title>')
        html_content = html_content.replace('Advanced Weather Analysis Dashboard', '한국 날씨 분석')
        
        # Hide LanguageSelector with CSS
        hide_css = '<style>.language-selector,[class*="language-selector"],[class*="LanguageSelector"]{display:none!important;}</style>'
        if '</head>' in html_content:
            html_content = html_content.replace('</head>', hide_css + '</head>')
        
        
        
        return html_content, 200, {'Content-Type': 'text/html; charset=utf-8'}
    
    # If no HTML file found, return a simple page
    html_content = '''<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>날씨 정보 서비스</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 15px;
            color: #333;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        h1 {
            color: #667eea;
            font-size: 2.5em;
            margin-bottom: 20px;
        }
        p {
            font-size: 1.1em;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌤️ 날씨 정보 서비스</h1>
        <p>날씨 데이터 및 기상 정보 서비스를 제공합니다.</p>
    </div>
</body>
</html>'''
    return html_content, 200, {'Content-Type': 'text/html; charset=utf-8'}

@app.route('/api/health')
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'weather_app'})

@app.route('/api/summary')
def summary():
    """Get service summary"""
    return jsonify({
        'status': 'active',
        'service': 'Weather Service',
        'description': '날씨 데이터 및 기상 정보 서비스를 제공합니다.',
        'version': '1.0.0'
    })

@app.route('/static/<path:filename>')
def serve_static_files(filename):
    """Serve static files from build/static or public"""
    # Try build/static first
    build_static = os.path.join(BUILD_DIR, 'static', filename)
    if os.path.exists(build_static):
        return send_from_directory(os.path.join(BUILD_DIR, 'static'), filename)
    
    # Try public/static
    public_static = os.path.join(PUBLIC_DIR, filename)
    if os.path.exists(public_static):
        return send_from_directory(PUBLIC_DIR, filename)
    
    return jsonify({'error': 'Static file not found'}), 404

@app.route('/favicon.ico')
def favicon():
    """Serve favicon"""
    for favicon_path in [
        os.path.join(BUILD_DIR, 'favicon.ico'),
        os.path.join(PUBLIC_DIR, 'favicon.ico'),
        'favicon.ico'
    ]:
        if os.path.exists(favicon_path):
            return send_file(favicon_path)
    return '', 204

@app.route('/manifest.json')
def manifest():
    """Serve manifest.json"""
    for manifest_path in [
        os.path.join(BUILD_DIR, 'manifest.json'),
        os.path.join(PUBLIC_DIR, 'manifest.json'),
        'manifest.json'
    ]:
        if os.path.exists(manifest_path):
            return send_file(manifest_path)
    return jsonify({'error': 'Manifest not found'}), 404

@app.route('/<path:filename>')
def serve_other_files(filename):
    """Serve other files from build directory"""
    # Try build directory first
    build_path = os.path.join(BUILD_DIR, filename)
    if os.path.exists(build_path):
        return send_file(build_path)
    
    # Try public directory
    public_path = os.path.join(PUBLIC_DIR, filename)
    if os.path.exists(public_path):
        return send_file(public_path)
    
    # Try root directory
    root_path = os.path.join(BASE_DIR, filename)
    if os.path.exists(root_path):
        return send_file(root_path)
    
    return jsonify({'error': 'File not found'}), 404

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5005))
    app.run(host='0.0.0.0', port=port, debug=False)
