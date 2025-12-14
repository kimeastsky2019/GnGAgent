"""
Metadata AI Agent for Time Series Data
Automatically extracts and structures metadata from time series data
"""

import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List, Optional, Any
import json


class MetadataAgent:
    """AI Agent that converts time series data into structured metadata"""
    
    def __init__(self):
        self.metadata_cache = {}
    
    def extract_metadata(self, df: pd.DataFrame, source_info: Dict = None) -> Dict:
        """
        Extract comprehensive metadata from time series data
        
        Args:
            df: DataFrame with time series data
            source_info: Optional source information
            
        Returns:
            Dictionary with structured metadata
        """
        metadata = {
            'extraction_timestamp': datetime.now().isoformat(),
            'source_info': source_info or {},
            'data_structure': self._analyze_structure(df),
            'temporal_info': self._analyze_temporal(df),
            'statistical_info': self._analyze_statistics(df),
            'data_quality': self._analyze_quality(df),
            'patterns': self._detect_patterns(df),
            'recommendations': []
        }
        
        # Generate recommendations
        metadata['recommendations'] = self._generate_recommendations(metadata)
        
        return metadata
    
    def _analyze_structure(self, df: pd.DataFrame) -> Dict:
        """Analyze data structure"""
        structure = {
            'total_records': len(df),
            'total_columns': len(df.columns),
            'column_names': df.columns.tolist(),
            'column_types': {col: str(dtype) for col, dtype in df.dtypes.items()},
            'memory_usage_mb': df.memory_usage(deep=True).sum() / 1024**2,
            'has_index': df.index.name is not None,
            'index_type': str(type(df.index))
        }
        
        return structure
    
    def _analyze_temporal(self, df: pd.DataFrame) -> Dict:
        """Analyze temporal characteristics"""
        temporal = {
            'has_time_column': False,
            'time_column': None,
            'time_range': None,
            'frequency': None,
            'time_gaps': None
        }
        
        # Find time column
        time_cols = ['time', 'Time', 'TIME', 'timestamp', 'Timestamp', 
                     'datetime', 'DateTime', 'date', 'Date']
        
        for col in df.columns:
            if col in time_cols or 'time' in col.lower() or 'date' in col.lower():
                try:
                    df[col] = pd.to_datetime(df[col], errors='coerce')
                    if df[col].notna().sum() > 0:
                        temporal['has_time_column'] = True
                        temporal['time_column'] = col
                        
                        valid_times = df[col].dropna()
                        temporal['time_range'] = {
                            'start': str(valid_times.min()),
                            'end': str(valid_times.max()),
                            'duration_days': (valid_times.max() - valid_times.min()).days
                        }
                        
                        # Detect frequency
                        if len(valid_times) > 1:
                            time_diffs = valid_times.diff().dropna()
                            most_common_diff = time_diffs.mode()[0] if len(time_diffs.mode()) > 0 else time_diffs.median()
                            temporal['frequency'] = str(most_common_diff)
                            
                            # Detect gaps
                            gaps = time_diffs[time_diffs > most_common_diff * 2]
                            temporal['time_gaps'] = {
                                'count': len(gaps),
                                'largest_gap': str(gaps.max()) if len(gaps) > 0 else None
                            }
                        break
                except:
                    continue
        
        return temporal
    
    def _analyze_statistics(self, df: pd.DataFrame) -> Dict:
        """Analyze statistical properties"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        stats = {}
        for col in numeric_cols:
            stats[col] = {
                'mean': float(df[col].mean()) if df[col].notna().sum() > 0 else None,
                'median': float(df[col].median()) if df[col].notna().sum() > 0 else None,
                'std': float(df[col].std()) if df[col].notna().sum() > 0 else None,
                'min': float(df[col].min()) if df[col].notna().sum() > 0 else None,
                'max': float(df[col].max()) if df[col].notna().sum() > 0 else None,
                'q25': float(df[col].quantile(0.25)) if df[col].notna().sum() > 0 else None,
                'q75': float(df[col].quantile(0.75)) if df[col].notna().sum() > 0 else None,
                'skewness': float(df[col].skew()) if df[col].notna().sum() > 0 else None,
                'kurtosis': float(df[col].kurtosis()) if df[col].notna().sum() > 0 else None
            }
        
        return stats
    
    def _analyze_quality(self, df: pd.DataFrame) -> Dict:
        """Analyze data quality"""
        quality = {
            'missing_values': {},
            'duplicates': int(df.duplicated().sum()),
            'outliers': {},
            'completeness_score': 0.0
        }
        
        # Missing values
        total_cells = len(df) * len(df.columns)
        missing_cells = df.isnull().sum().sum()
        
        for col in df.columns:
            missing_count = df[col].isnull().sum()
            missing_pct = (missing_count / len(df)) * 100 if len(df) > 0 else 0
            quality['missing_values'][col] = {
                'count': int(missing_count),
                'percentage': round(missing_pct, 2)
            }
        
        # Outliers (IQR method)
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            if IQR > 0:
                outliers = ((df[col] < (Q1 - 1.5 * IQR)) | 
                           (df[col] > (Q3 + 1.5 * IQR))).sum()
                quality['outliers'][col] = int(outliers)
        
        # Completeness score
        quality['completeness_score'] = round(
            (1 - missing_cells / total_cells) * 100, 2
        ) if total_cells > 0 else 0
        
        return quality
    
    def _detect_patterns(self, df: pd.DataFrame) -> Dict:
        """Detect patterns in the data"""
        patterns = {
            'trend': None,
            'seasonality': None,
            'cyclical': None,
            'stationarity': None
        }
        
        # Find numeric column for pattern detection
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) == 0:
            return patterns
        
        # Use first numeric column
        data_col = numeric_cols[0]
        values = df[data_col].dropna()
        
        if len(values) < 10:
            return patterns
        
        # Simple trend detection
        if len(values) > 1:
            trend_slope = np.polyfit(range(len(values)), values, 1)[0]
            patterns['trend'] = {
                'direction': 'increasing' if trend_slope > 0 else 'decreasing',
                'strength': abs(trend_slope) / values.std() if values.std() > 0 else 0
            }
        
        # Simple seasonality detection (check for periodic patterns)
        if len(values) >= 24:  # At least 24 data points
            # Check for daily patterns (if hourly data)
            if len(values) >= 168:  # At least a week
                daily_pattern = self._check_periodicity(values, period=24)
                if daily_pattern:
                    patterns['seasonality'] = {
                        'type': 'daily',
                        'period': 24,
                        'strength': daily_pattern
                    }
        
        return patterns
    
    def _check_periodicity(self, values: pd.Series, period: int) -> Optional[float]:
        """Check for periodicity in time series"""
        if len(values) < period * 2:
            return None
        
        # Simple autocorrelation at lag = period
        mean_val = values.mean()
        centered = values - mean_val
        
        if len(centered) < period:
            return None
        
        autocorr = np.corrcoef(
            centered[:-period] if len(centered) > period else centered,
            centered[period:] if len(centered) > period else centered[:period]
        )[0, 1]
        
        return float(autocorr) if not np.isnan(autocorr) else None
    
    def _generate_recommendations(self, metadata: Dict) -> List[str]:
        """Generate recommendations based on metadata"""
        recommendations = []
        
        # Data quality recommendations
        quality = metadata.get('data_quality', {})
        completeness = quality.get('completeness_score', 100)
        
        if completeness < 80:
            recommendations.append(
                f"Data completeness is {completeness}%. Consider data imputation."
            )
        
        if quality.get('duplicates', 0) > 0:
            recommendations.append(
                f"Found {quality['duplicates']} duplicate records. Consider removing duplicates."
            )
        
        # Temporal recommendations
        temporal = metadata.get('temporal_info', {})
        if not temporal.get('has_time_column'):
            recommendations.append(
                "No time column detected. Ensure time column is properly formatted."
            )
        
        # Pattern recommendations
        patterns = metadata.get('patterns', {})
        if patterns.get('trend'):
            trend = patterns['trend']
            if trend['strength'] > 0.5:
                recommendations.append(
                    f"Strong {trend['direction']} trend detected. Consider detrending for better forecasting."
                )
        
        if patterns.get('seasonality'):
            recommendations.append(
                "Seasonal patterns detected. Consider using seasonal models for forecasting."
            )
        
        return recommendations
    
    def clean_data(self, df: pd.DataFrame, metadata: Dict = None) -> pd.DataFrame:
        """Clean data based on metadata analysis"""
        if metadata is None:
            metadata = self.extract_metadata(df)
        
        cleaned_df = df.copy()
        
        # Remove duplicates
        if metadata['data_quality']['duplicates'] > 0:
            cleaned_df = cleaned_df.drop_duplicates()
        
        # Handle missing values (forward fill, then backward fill)
        numeric_cols = cleaned_df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            cleaned_df[col] = cleaned_df[col].fillna(method='ffill').fillna(method='bfill')
        
        return cleaned_df

