import re

# HTML 파일 읽기
with open('energy_dashboard.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 다국어 지원 스크립트 추가 (head 태그 안에)
i18n_script = '''
    <script>
        // 다국어 지원
        let currentLang = localStorage.getItem('language') || 'ko';
        let translations = {};
        
        // 번역 로드
        async function loadTranslations(lang) {
            try {
                const response = await fetch(`/api/translations?lang=${lang}`);
                const data = await response.json();
                translations = data.translations || {};
                currentLang = lang;
                localStorage.setItem('language', lang);
                applyTranslations();
            } catch (error) {
                console.error('Failed to load translations:', error);
            }
        }
        
        // 번역 적용
        function applyTranslations() {
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                const translation = getNestedTranslation(translations, key);
                if (translation) {
                    if (el.tagName === 'INPUT' && el.type === 'placeholder') {
                        el.placeholder = translation;
                    } else {
                        el.textContent = translation;
                    }
                }
            });
        }
        
        // 중첩된 번역 키 접근
        function getNestedTranslation(obj, path) {
            return path.split('.').reduce((o, p) => o && o[p], obj);
        }
        
        // 언어 변경
        function changeLanguage(lang) {
            loadTranslations(lang);
        }
        
        // 초기 로드
        loadTranslations(currentLang);
    </script>
'''

# 헤더 추가 (body 태그 바로 다음)
header_html = '''
    <nav class="top-nav" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px 20px; color: white; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="display: flex; align-items: center; gap: 20px;">
            <a href="/eop" style="color: white; text-decoration: none; font-weight: 600; font-size: 1.2em;">🏠 Energy Orchestrator Platform</a>
            <a href="/da" style="color: white; text-decoration: none;">⚡ 수요 분석</a>
            <a href="/sa" style="color: white; text-decoration: none;">🔋 공급 분석</a>
            <a href="/dtwin" style="color: white; text-decoration: none;">🏫 디지털 트윈</a>
            <a href="/disaster" style="color: white; text-decoration: none;">🚨 재난 관리</a>
        </div>
        <div style="display: flex; align-items: center; gap: 15px;">
            <select id="language-selector" onchange="changeLanguage(this.value)" style="padding: 5px 10px; border-radius: 5px; border: none; background: white; color: #333;">
                <option value="ko">한국어</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
            </select>
        </div>
    </nav>
'''

# head 태그 안에 스크립트 추가
if '</head>' in html:
    html = html.replace('</head>', i18n_script + '</head>')

# body 태그 바로 다음에 헤더 추가
if '<body>' in html:
    html = html.replace('<body>', '<body>' + header_html)

# 백업 저장
with open('energy_dashboard.html.backup2', 'w', encoding='utf-8') as f:
    f.write(html)

print('HTML 파일에 다국어 지원과 헤더가 추가되었습니다.')
