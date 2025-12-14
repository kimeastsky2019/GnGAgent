"""
개선된 Demand Analysis Service - 다국어 지원 추가
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

# 공통 i18n 라이브러리 import
sys.path.insert(0, str(Path(__file__).parent.parent / "shared"))
from i18n import translate, get_i18n, create_flask_translator

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

# Flask에 번역 컨텍스트 추가
create_flask_translator(app)


def get_request_language():
    """요청에서 언어 가져오기"""
    # 세션에서 언어 가져오기
    lang = session.get('lang')
    if lang:
        return lang
    
    # Accept-Language 헤더에서 가져오기
    accept_language = request.headers.get('Accept-Language', '')
    if accept_language:
        parts = accept_language.split(',')
        if parts:
            lang = parts[0].split(';')[0].strip().split('-')[0]
            return lang.lower()
    
    return 'ko'  # 기본 언어


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def read_dashboard_html():
    try:
        with open(os.path.join(BASE_DIR, 'energy_dashboard.html'), 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        lang = get_request_language()
        return f'{translate("errors.generic", lang=lang)}: {str(e)}'


@app.route('/')
def index():
    html_content = read_dashboard_html()
    return html_content


@app.route('/api/health', methods=['GET'])
def health_check():
    """헬스체크 엔드포인트"""
    lang = get_request_language()
    
    return jsonify({
        'status': 'healthy',
        'service': translate('services.energy_demand.title', lang=lang),
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/language/<lang_code>', methods=['POST'])
def set_language(lang_code):
    """언어 설정 변경"""
    i18n = get_i18n()
    if i18n.is_language_supported(lang_code):
        session['lang'] = lang_code
        return jsonify({
            'success': True,
            'message': translate('common.success', lang=lang_code),
            'language': lang_code
        })
    else:
        lang = get_request_language()
        return jsonify({
            'success': False,
            'error': translate('errors.generic', lang=lang)
        }), 400


@app.route('/api/upload', methods=['POST'])
def upload_file():
    """파일 업로드 및 처리"""
    lang = get_request_language()
    
    try:
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': translate('errors.no_file_provided', lang=lang)
            }), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': translate('errors.no_file_selected', lang=lang)
            }), 400
        
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'error': translate(
                    'file_upload.invalid_type',
                    lang=lang,
                    types='CSV'
                )
            }), 400
        
        # 모델 타입 가져오기
        model_type = request.form.get('model_type', 'RandomForest')
        
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        saved_filename = f'{timestamp}_{filename}'
        filepath = os.path.join(UPLOAD_DIR, saved_filename)
        
        try:
            file.save(filepath)
        except Exception as e:
            return jsonify({
                'success': False,
                'error': translate('errors.file_upload_failed', lang=lang)
            }), 500
        
        if not os.path.exists(filepath):
            return jsonify({
                'success': False,
                'error': translate('errors.file_upload_failed', lang=lang)
            }), 500
        
        try:
            # 파일 처리 (기존 로직 유지)
            result = process_energy_data(filepath, saved_filename, model_type)
            
            return jsonify({
                'success': True,
                'message': translate('file_upload.success', lang=lang),
                'filename': saved_filename,
                'result': result
            })
        
        except Exception as e:
            return jsonify({
                'success': True,
                'message': translate('file_upload.success', lang=lang),
                'filename': saved_filename,
                'processing_error': translate('errors.processing_failed', lang=lang),
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
            'error': f'{translate("errors.generic", lang=lang)}: {str(e)}'
        }), 500


@app.route('/api/analyze', methods=['POST'])
def analyze_data():
    """데이터 분석 실행"""
    lang = get_request_language()
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': translate('errors.generic', lang=lang)
            }), 400
        
        # 분석 로직 (실제 구현 필요)
        # result = perform_analysis(data)
        
        return jsonify({
            'success': True,
            'message': translate('api.success', lang=lang),
            'result': {}
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': translate('errors.server_error', lang=lang)
        }), 500


@app.route('/api/results/<filename>', methods=['GET'])
def get_results(filename):
    """분석 결과 조회"""
    lang = get_request_language()
    
    try:
        filepath = os.path.join(RESULTS_DIR, secure_filename(filename))
        
        if not os.path.exists(filepath):
            return jsonify({
                'success': False,
                'error': translate('errors.file_not_found', lang=lang, path=filename)
            }), 404
        
        with open(filepath, 'r', encoding='utf-8') as f:
            result = json.load(f)
        
        return jsonify({
            'success': True,
            'result': result
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': translate('errors.server_error', lang=lang)
        }), 500


@app.route('/api/translations', methods=['GET'])
def get_translations():
    """현재 언어의 모든 번역 가져오기 (프론트엔드용)"""
    lang = get_request_language()
    i18n = get_i18n()
    
    translations = i18n.get_translations_for_language(lang)
    
    return jsonify({
        'language': lang,
        'translations': translations,
        'available_languages': i18n.get_available_languages()
    })


def process_energy_data(filepath, filename, model_type):
    """
    에너지 데이터 처리 (기존 로직 유지)
    
    실제 구현 필요
    """
    # TODO: 실제 데이터 처리 로직 구현
    return {
        'quality_score': 85,
        'total_records': 1000,
        'anomalies_count': 5,
        'predictions_count': 100
    }


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
