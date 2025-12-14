"""
Demand-Supply Matching Service
Real-time matching visualization, control recommendations, AI chatbot for ontology
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import sys
from pathlib import Path

# Import digital twin
from smart_grid_digital_twin import SmartGridDigitalTwin

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RESULTS_DIR = os.path.join(BASE_DIR, 'results')
os.makedirs(RESULTS_DIR, exist_ok=True)

# Store active matching sessions
active_sessions = {}


class MatchingService:
    """Service for real-time demand-supply matching"""
    
    def __init__(self):
        self.digital_twin = SmartGridDigitalTwin()
        self.matching_history = []
    
    def get_current_matching(self) -> Dict:
        """Get current demand-supply matching status"""
        state = self.digital_twin.get_system_state()
        
        # Run control cycle to get matching
        result = self.digital_twin.run_control_cycle()
        
        matching = {
            'timestamp': result['timestamp'].isoformat(),
            'demand': {
                'total': state['total_demand'],
                'devices': [
                    {
                        'id': d.device_id,
                        'type': d.device_type.value,
                        'power': d.current_power,
                        'is_active': d.is_active,
                        'priority': d.priority
                    }
                    for d in state['devices']
                ]
            },
            'supply': {
                'total': state['total_supply'],
                'sources': [
                    {
                        'id': s.source_id,
                        'type': s.source_type.value,
                        'output': s.current_output,
                        'capacity': s.capacity
                    }
                    for s in state['supplies']
                ],
                'ess_soc': self.digital_twin.ess.current_soc * 100
            },
            'balance': state['power_balance'],
            'matching_ratio': min(state['total_supply'] / max(state['total_demand'], 1), 1.0),
            'recommendations': self._generate_recommendations(state, result)
        }
        
        self.matching_history.append(matching)
        
        return matching
    
    def _generate_recommendations(self, state: Dict, result: Dict) -> List[Dict]:
        """Generate control recommendations based on matching"""
        recommendations = []
        
        balance = state['power_balance']
        total_demand = state['total_demand']
        total_supply = state['total_supply']
        
        if balance < -10:  # Power shortage
            recommendations.append({
                'type': 'warning',
                'priority': 'high',
                'message': f'Power shortage detected: {abs(balance):.2f} kW deficit',
                'action': 'Consider reducing non-essential loads or activating backup power',
                'devices_to_control': [
                    {
                        'id': d.device_id,
                        'type': d.device_type.value,
                        'priority': d.priority,
                        'suggested_action': 'turn_off' if d.priority > 5 else 'reduce'
                    }
                    for d in state['devices']
                    if d.is_active and d.priority > 5
                ][:5]  # Top 5 recommendations
            })
        elif balance > 50:  # Power surplus
            recommendations.append({
                'type': 'info',
                'priority': 'medium',
                'message': f'Power surplus detected: {balance:.2f} kW available',
                'action': 'Consider charging ESS or activating additional loads',
                'suggested_actions': [
                    'Charge ESS if SOC < 90%',
                    'Activate high-priority devices',
                    'Store excess energy'
                ]
            })
        else:  # Balanced
            recommendations.append({
                'type': 'success',
                'priority': 'low',
                'message': 'Demand and supply are well balanced',
                'action': 'Continue monitoring',
                'efficiency': f'{(total_supply / max(total_demand, 1)) * 100:.1f}%'
            })
        
        # Renewable energy recommendations
        renewable_ratio = result.get('performance_metrics', {}).get('renewable_ratio', 0)
        if renewable_ratio < 50:
            recommendations.append({
                'type': 'info',
                'priority': 'medium',
                'message': f'Renewable energy ratio is {renewable_ratio:.1f}%',
                'action': 'Consider increasing renewable energy capacity or optimizing usage',
                'suggestions': [
                    'Check solar panel efficiency',
                    'Optimize wind turbine positioning',
                    'Increase ESS capacity for renewable storage'
                ]
            })
        
        return recommendations
    
    def get_matching_timeseries(self, hours: int = 24) -> List[Dict]:
        """Get time series data for matching visualization"""
        if len(self.matching_history) == 0:
            # Generate sample data
            self.digital_twin.run_simulation(duration_hours=hours, time_step_minutes=30)
            for log in self.digital_twin.simulation_log:
                state = {
                    'total_demand': log['power']['total_demand'],
                    'total_supply': log['power']['total_supply'],
                    'power_balance': log['power']['balance']
                }
                matching = {
                    'timestamp': log['timestamp'].isoformat(),
                    'demand': {'total': state['total_demand']},
                    'supply': {'total': state['total_supply']},
                    'balance': state['power_balance'],
                    'matching_ratio': min(state['total_supply'] / max(state['total_demand'], 1), 1.0)
                }
                self.matching_history.append(matching)
        
        # Return recent history
        return self.matching_history[-hours*2:] if len(self.matching_history) > hours*2 else self.matching_history


class OntologyChatbot:
    """AI Chatbot for ontology creation"""
    
    def __init__(self):
        self.ontology = {
            'demand_assets': [],
            'supply_assets': [],
            'relationships': [],
            'rules': []
        }
    
    def process_message(self, message: str, context: Dict = None) -> Dict:
        """Process user message and generate ontology"""
        message_lower = message.lower()
        
        response = {
            'message': '',
            'ontology_updates': {},
            'suggestions': []
        }
        
        # Detect intent
        if 'add' in message_lower or 'create' in message_lower:
            if 'demand' in message_lower or 'device' in message_lower:
                response = self._add_demand_asset(message, context)
            elif 'supply' in message_lower or 'source' in message_lower:
                response = self._add_supply_asset(message, context)
            elif 'rule' in message_lower or 'relationship' in message_lower:
                response = self._add_relationship(message, context)
        
        elif 'list' in message_lower or 'show' in message_lower:
            response = self._list_ontology()
        
        elif 'export' in message_lower or 'save' in message_lower:
            response = self._export_ontology()
        
        else:
            response['message'] = "I can help you create an ontology for demand-supply matching. Try:\n" \
                                "- 'Add demand asset: [name] with [power] kW'\n" \
                                "- 'Add supply asset: [name] with [capacity] kW'\n" \
                                "- 'List all assets'\n" \
                                "- 'Export ontology'"
        
        return response
    
    def _add_demand_asset(self, message: str, context: Dict = None) -> Dict:
        """Add demand asset to ontology"""
        # Simple extraction (can be enhanced with NLP)
        parts = message.split()
        name = None
        power = None
        
        for i, part in enumerate(parts):
            if part.lower() in ['device', 'asset', 'demand'] and i + 1 < len(parts):
                name = parts[i + 1]
            if 'kw' in part.lower() and i > 0:
                try:
                    power = float(parts[i - 1])
                except:
                    pass
        
        if name and power:
            asset = {
                'id': f"demand_{len(self.ontology['demand_assets']) + 1}",
                'name': name,
                'power_rating': power,
                'type': 'demand',
                'created_at': datetime.now().isoformat()
            }
            self.ontology['demand_assets'].append(asset)
            
            return {
                'message': f"Added demand asset: {name} ({power} kW)",
                'ontology_updates': {'demand_assets': [asset]},
                'suggestions': ['Add supply asset to match this demand']
            }
        else:
            return {
                'message': "I couldn't extract the asset details. Please specify: 'Add demand asset: [name] with [power] kW'",
                'suggestions': ['Example: Add demand asset: Air Conditioner with 3.5 kW']
            }
    
    def _add_supply_asset(self, message: str, context: Dict = None) -> Dict:
        """Add supply asset to ontology"""
        parts = message.split()
        name = None
        capacity = None
        
        for i, part in enumerate(parts):
            if part.lower() in ['source', 'supply', 'asset'] and i + 1 < len(parts):
                name = parts[i + 1]
            if 'kw' in part.lower() and i > 0:
                try:
                    capacity = float(parts[i - 1])
                except:
                    pass
        
        if name and capacity:
            asset = {
                'id': f"supply_{len(self.ontology['supply_assets']) + 1}",
                'name': name,
                'capacity': capacity,
                'type': 'supply',
                'created_at': datetime.now().isoformat()
            }
            self.ontology['supply_assets'].append(asset)
            
            return {
                'message': f"Added supply asset: {name} ({capacity} kW)",
                'ontology_updates': {'supply_assets': [asset]},
                'suggestions': ['Add matching rules between demand and supply']
            }
        else:
            return {
                'message': "I couldn't extract the asset details. Please specify: 'Add supply asset: [name] with [capacity] kW'",
                'suggestions': ['Example: Add supply asset: Solar Panel with 100 kW']
            }
    
    def _add_relationship(self, message: str, context: Dict = None) -> Dict:
        """Add relationship/rule to ontology"""
        rule = {
            'id': f"rule_{len(self.ontology['rules']) + 1}",
            'description': message,
            'created_at': datetime.now().isoformat()
        }
        self.ontology['rules'].append(rule)
        
        return {
            'message': f"Added rule: {message}",
            'ontology_updates': {'rules': [rule]},
            'suggestions': ['Test the rule with matching simulation']
        }
    
    def _list_ontology(self) -> Dict:
        """List current ontology"""
        return {
            'message': f"Current ontology:\n" \
                      f"- Demand assets: {len(self.ontology['demand_assets'])}\n" \
                      f"- Supply assets: {len(self.ontology['supply_assets'])}\n" \
                      f"- Rules: {len(self.ontology['rules'])}",
            'ontology': self.ontology
        }
    
    def _export_ontology(self) -> Dict:
        """Export ontology to JSON"""
        filepath = os.path.join(RESULTS_DIR, f'ontology_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json')
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.ontology, f, indent=2)
        
        return {
            'message': f"Ontology exported to {filepath}",
            'filepath': filepath,
            'ontology': self.ontology
        }


# Initialize services
matching_service = MatchingService()
chatbot = OntologyChatbot()


@app.route('/')
def index():
    return jsonify({
        'service': 'Demand-Supply Matching Service',
        'version': '1.0.0',
        'endpoints': {
            '/api/matching/current': 'Get current matching status',
            '/api/matching/timeseries': 'Get time series matching data',
            '/api/matching/recommendations': 'Get control recommendations',
            '/api/chatbot/message': 'Send message to ontology chatbot'
        }
    })


@app.route('/api/matching/current', methods=['GET'])
def get_current_matching():
    """Get current demand-supply matching"""
    try:
        matching = matching_service.get_current_matching()
        return jsonify({
            'success': True,
            'matching': matching
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/matching/timeseries', methods=['GET'])
def get_matching_timeseries():
    """Get time series matching data"""
    try:
        hours = int(request.args.get('hours', 24))
        timeseries = matching_service.get_matching_timeseries(hours)
        
        return jsonify({
            'success': True,
            'timeseries': timeseries,
            'count': len(timeseries)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/matching/recommendations', methods=['GET'])
def get_recommendations():
    """Get control recommendations"""
    try:
        matching = matching_service.get_current_matching()
        
        return jsonify({
            'success': True,
            'recommendations': matching.get('recommendations', [])
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/chatbot/message', methods=['POST'])
def chatbot_message():
    """Send message to ontology chatbot"""
    try:
        data = request.get_json()
        message = data.get('message', '')
        context = data.get('context', {})
        
        if not message:
            return jsonify({
                'success': False,
                'error': 'Message is required'
            }), 400
        
        response = chatbot.process_message(message, context)
        
        return jsonify({
            'success': True,
            'response': response
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/chatbot/ontology', methods=['GET'])
def get_ontology():
    """Get current ontology"""
    try:
        return jsonify({
            'success': True,
            'ontology': chatbot.ontology
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5003))
    app.run(host='0.0.0.0', port=port, debug=True)

