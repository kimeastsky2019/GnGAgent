import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Zap, Battery, Building2, AlertTriangle, Cloud, Network, Image } from 'lucide-react';

const NavContainer = styled(motion.nav)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
`;

const NavContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const Logo = styled(motion.a)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: white;
  text-decoration: none;
  font-weight: 700;
  font-size: 1.25rem;
  cursor: pointer;
  white-space: nowrap;
  
  &:hover {
    opacity: 0.9;
  }
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  flex: 1;
  justify-content: center;
  
  @media (max-width: 768px) {
    gap: 0.5rem;
    width: 100%;
    justify-content: flex-start;
    overflow-x: auto;
    padding: 0.5rem 0;
  }
`;

const NavLink = styled(motion.a)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  color: white;
  text-decoration: none;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 0.95rem;
  white-space: nowrap;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  &.active {
    background: rgba(255, 255, 255, 0.25);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  @media (max-width: 768px) {
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
  }
`;

const LanguageSelector = styled(motion.select)`
  padding: 0.75rem 1rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  color: white;
  font-weight: 500;
  font-size: 0.95rem;
  cursor: pointer;
  outline: none;
  transition: all 0.3s ease;
  white-space: nowrap;
  
  &:hover {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.5);
  }
  
  option {
    background: #667eea;
    color: white;
  }
  
  @media (max-width: 768px) {
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
  }
`;

const NavigationHeader = () => {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    const isRTL = ['ar', 'he'].includes(lang);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const navItems = [
    { path: '/eop', icon: Home, label: t('navigation.dashboard', '대시보드') },
    { path: '/da', icon: Zap, label: t('navigation.demand', '수요 분석') },
    { path: '/sa', icon: Battery, label: t('navigation.supply', '공급 분석') },
    { path: '/dtwin', icon: Building2, label: t('navigation.digital_twin', '디지털 트윈') },
    { path: '/disaster', icon: AlertTriangle, label: t('navigation.disasters', '재난 관리') },
    { path: '/weather', icon: Cloud, label: t('navigation.weather', '날씨') },
    { path: '/ontology', icon: Network, label: t('navigation.ontology', '온톨로지') },
    { path: '/ibs', icon: Image, label: t('navigation.image_broadcasting', '영상 방송') },
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <NavContainer
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        background: scrolled 
          ? 'rgba(255, 255, 255, 0.15)' 
          : 'rgba(255, 255, 255, 0.1)',
      }}
    >
      <NavContent>
        <Logo
          href="/eop"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Home size={24} />
          <span>Energy Orchestrator Platform</span>
        </Logo>

        <NavLinks>
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                href={item.path}
                className={isActive(item.path) ? 'active' : ''}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </NavLinks>

        <LanguageSelector
          value={i18n.language || 'ko'}
          onChange={(e) => changeLanguage(e.target.value)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <option value="ko">한국어</option>
          <option value="en">English</option>
          <option value="ja">日本語</option>
          <option value="de">Deutsch</option>
          <option value="fr">Français</option>
          <option value="es">Español</option>
        </LanguageSelector>
      </NavContent>
    </NavContainer>
  );
};

export default NavigationHeader;
