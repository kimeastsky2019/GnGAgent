"""
Digital Twin Scenario Simulation Service
Simulate various scenarios and generate optimal matching scenarios
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from smart_grid_digital_twin import SmartGridDigitalTwin
import copy

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RESULTS_DIR = os.path.join(BASE_DIR, 'results')
os.makedirs(RESULTS_DIR, exist_ok=True)


class ScenarioSimulator:
    """Simulate various scenarios for demand-supply matching"""
    
    def __init__(self):
        self.scenarios = {}
        self.simulation_results = {}
    
    def simulate_scenario(self, scenario_config: Dict) -> Dict:
        """Simulate a specific scenario"""
        scenario_id = scenario_config.get('id', f"scenario_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
        scenario_name = scenario_config.get('name', 'Custom Scenario')
        
        # Create digital twin instance
        twin = SmartGridDigitalTwin()
        
        # Apply scenario modifications
        if 'demand_modifications' in scenario_config:
            self._apply_demand_modifications(twin, scenario_config['demand_modifications'])
        
        if 'supply_modifications' in scenario_config:
            self._apply_supply_modifications(twin, scenario_config['supply_modifications'])
        
        if 'environment_modifications' in scenario_config:
            self._apply_environment_modifications(twin, scenario_config['environment_modifications'])
        
        # Run simulation
        duration_hours = scenario_config.get('duration_hours', 24)
        time_step_minutes = scenario_config.get('time_step_minutes', 30)
        
        results = twin.run_simulation(duration_hours=duration_hours, time_step_minutes=time_step_minutes)
        df = twin.generate_report()
        
        # Calculate scenario metrics
        metrics = self._calculate_scenario_metrics(df, results)
        
        scenario_result = {
            'scenario_id': scenario_id,
            'scenario_name': scenario_name,
            'config': scenario_config,
            'results': results,
            'metrics': metrics,
            'dataframe': df.to_dict('records') if df is not None else [],
            'timestamp': datetime.now().isoformat()
        }
        
        self.simulation_results[scenario_id] = scenario_result
        
        return scenario_result
    
    def _apply_demand_modifications(self, twin: SmartGridDigitalTwin, modifications: Dict):
        """Apply demand modifications to digital twin"""
        if 'add_devices' in modifications:
            for device_config in modifications['add_devices']:
                from smart_grid_digital_twin import Device, DeviceType, ControlMode
                device = Device(
                    device_id=device_config.get('id', f"device_{len(twin.devices)}"),
                    device_type=DeviceType[device_config.get('type', 'TEMPERATURE')],
                    control_mode=ControlMode[device_config.get('control_mode', 'CONTROLLABLE')],
                    power_rating=device_config.get('power_rating', 1.0),
                    priority=device_config.get('priority', 5),
                    flexibility=device_config.get('flexibility', 0.5)
                )
                twin.devices.append(device)
        
        if 'modify_devices' in modifications:
            for mod in modifications['modify_devices']:
                device_id = mod.get('device_id')
                device = next((d for d in twin.devices if d.device_id == device_id), None)
                if device:
                    if 'power_rating' in mod:
                        device.power_rating = mod['power_rating']
                    if 'priority' in mod:
                        device.priority = mod['priority']
                    if 'flexibility' in mod:
                        device.flexibility = mod['flexibility']
        
        if 'remove_devices' in modifications:
            device_ids = modifications['remove_devices']
            twin.devices = [d for d in twin.devices if d.device_id not in device_ids]
    
    def _apply_supply_modifications(self, twin: SmartGridDigitalTwin, modifications: Dict):
        """Apply supply modifications to digital twin"""
        if 'add_supplies' in modifications:
            for supply_config in modifications['add_supplies']:
                from smart_grid_digital_twin import PowerSupply, EnergySource
                supply = PowerSupply(
                    source_id=supply_config.get('id', f"supply_{len(twin.supplies)}"),
                    source_type=EnergySource[supply_config.get('type', 'SOLAR')],
                    capacity=supply_config.get('capacity', 50.0),
                    efficiency=supply_config.get('efficiency', 0.95),
                    cost_per_kwh=supply_config.get('cost_per_kwh', 0.0)
                )
                twin.supplies.append(supply)
        
        if 'modify_supplies' in modifications:
            for mod in modifications['modify_supplies']:
                source_id = mod.get('source_id')
                supply = next((s for s in twin.supplies if s.source_id == source_id), None)
                if supply:
                    if 'capacity' in mod:
                        supply.capacity = mod['capacity']
                    if 'efficiency' in mod:
                        supply.efficiency = mod['efficiency']
                    if 'cost_per_kwh' in mod:
                        supply.cost_per_kwh = mod['cost_per_kwh']
        
        if 'modify_ess' in modifications:
            ess_mod = modifications['modify_ess']
            if 'capacity' in ess_mod:
                twin.ess.capacity = ess_mod['capacity']
            if 'max_charge_rate' in ess_mod:
                twin.ess.max_charge_rate = ess_mod['max_charge_rate']
            if 'max_discharge_rate' in ess_mod:
                twin.ess.max_discharge_rate = ess_mod['max_discharge_rate']
    
    def _apply_environment_modifications(self, twin: SmartGridDigitalTwin, modifications: Dict):
        """Apply environment modifications to digital twin"""
        # Store modifications for use during simulation
        twin.environment_modifications = modifications
    
    def _calculate_scenario_metrics(self, df: pd.DataFrame, results: List[Dict]) -> Dict:
        """Calculate metrics for scenario evaluation"""
        if df is None or len(df) == 0:
            return {}
        
        metrics = {
            'average_demand': float(df['전력수요'].mean()) if '전력수요' in df.columns else 0,
            'average_supply': float(df['전력공급'].mean()) if '전력공급' in df.columns else 0,
            'average_balance': float(df['전력균형'].mean()) if '전력균형' in df.columns else 0,
            'renewable_ratio': float(df['재생에너지비율'].mean()) if '재생에너지비율' in df.columns else 0,
            'stability_score': float(df['안정성점수'].mean()) if '안정성점수' in df.columns else 0,
            'cost_efficiency': float(df['비용효율성'].mean()) if '비용효율성' in df.columns else 0,
            'overall_score': float(df['종합점수'].mean()) if '종합점수' in df.columns else 0,
            'matching_efficiency': 0.0,
            'optimal_matching_score': 0.0
        }
        
        # Calculate matching efficiency
        if metrics['average_demand'] > 0:
            metrics['matching_efficiency'] = min(
                metrics['average_supply'] / metrics['average_demand'], 1.0
            ) * 100
        
        # Calculate optimal matching score (combination of multiple factors)
        metrics['optimal_matching_score'] = (
            metrics['matching_efficiency'] * 0.3 +
            metrics['renewable_ratio'] * 0.3 +
            metrics['stability_score'] * 0.2 +
            metrics['cost_efficiency'] * 0.2
        )
        
        return metrics
    
    def find_optimal_scenario(self, scenario_configs: List[Dict]) -> Dict:
        """Find optimal matching scenario from multiple scenarios"""
        results = []
        
        for config in scenario_configs:
            result = self.simulate_scenario(config)
            results.append(result)
        
        # Find scenario with highest optimal matching score
        optimal = max(results, key=lambda x: x['metrics'].get('optimal_matching_score', 0))
        
        return {
            'optimal_scenario': optimal,
            'all_scenarios': results,
            'comparison': {
                'scenarios_tested': len(results),
                'best_score': optimal['metrics'].get('optimal_matching_score', 0),
                'best_scenario_id': optimal['scenario_id'],
                'best_scenario_name': optimal['scenario_name']
            }
        }
    
    def generate_scenario_templates(self) -> List[Dict]:
        """Generate common scenario templates"""
        templates = [
            {
                'id': 'baseline',
                'name': 'Baseline Scenario',
                'description': 'Current system configuration',
                'duration_hours': 24,
                'time_step_minutes': 30
            },
            {
                'id': 'high_demand',
                'name': 'High Demand Scenario',
                'description': 'Simulate peak demand conditions',
                'duration_hours': 24,
                'time_step_minutes': 30,
                'demand_modifications': {
                    'modify_devices': [
                        {'device_id': f'temp_{i}', 'power_rating': 4.0}
                        for i in range(20)
                    ]
                }
            },
            {
                'id': 'low_renewable',
                'name': 'Low Renewable Energy Scenario',
                'description': 'Simulate low renewable energy availability',
                'duration_hours': 24,
                'time_step_minutes': 30,
                'supply_modifications': {
                    'modify_supplies': [
                        {'source_id': 'solar_1', 'capacity': 50.0},
                        {'source_id': 'wind_1', 'capacity': 25.0}
                    ]
                }
            },
            {
                'id': 'optimal_matching',
                'name': 'Optimal Matching Scenario',
                'description': 'Optimized configuration for best matching',
                'duration_hours': 24,
                'time_step_minutes': 30,
                'demand_modifications': {
                    'modify_devices': [
                        {'device_id': f'temp_{i}', 'priority': 3, 'flexibility': 0.8}
                        for i in range(20)
                    ]
                },
                'supply_modifications': {
                    'modify_ess': {
                        'capacity': 300.0,
                        'max_charge_rate': 75.0,
                        'max_discharge_rate': 75.0
                    }
                }
            }
        ]
        
        return templates


# Initialize simulator
simulator = ScenarioSimulator()


@app.route('/')
def index():
    return jsonify({
        'service': 'Digital Twin Scenario Simulation Service',
        'version': '1.0.0',
        'endpoints': {
            '/api/scenarios/templates': 'Get scenario templates',
            '/api/scenarios/simulate': 'Simulate a scenario',
            '/api/scenarios/optimal': 'Find optimal matching scenario',
            '/api/scenarios/results/<scenario_id>': 'Get scenario results'
        }
    })


@app.route('/api/scenarios/templates', methods=['GET'])
def get_scenario_templates():
    """Get available scenario templates"""
    try:
        templates = simulator.generate_scenario_templates()
        return jsonify({
            'success': True,
            'templates': templates
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/scenarios/simulate', methods=['POST'])
def simulate_scenario():
    """Simulate a scenario"""
    try:
        scenario_config = request.get_json()
        
        if not scenario_config:
            return jsonify({
                'success': False,
                'error': 'Scenario configuration is required'
            }), 400
        
        result = simulator.simulate_scenario(scenario_config)
        
        # Save results
        filepath = os.path.join(RESULTS_DIR, f'scenario_{result["scenario_id"]}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json')
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, default=str)
        
        return jsonify({
            'success': True,
            'result': result,
            'filepath': filepath
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/scenarios/optimal', methods=['POST'])
def find_optimal_scenario():
    """Find optimal matching scenario"""
    try:
        data = request.get_json()
        scenario_configs = data.get('scenarios', [])
        
        if not scenario_configs:
            return jsonify({
                'success': False,
                'error': 'At least one scenario configuration is required'
            }), 400
        
        result = simulator.find_optimal_scenario(scenario_configs)
        
        # Save results
        filepath = os.path.join(RESULTS_DIR, f'optimal_scenario_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json')
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, default=str)
        
        return jsonify({
            'success': True,
            'result': result,
            'filepath': filepath
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/scenarios/results/<scenario_id>', methods=['GET'])
def get_scenario_results(scenario_id):
    """Get results for a specific scenario"""
    try:
        if scenario_id not in simulator.simulation_results:
            return jsonify({
                'success': False,
                'error': 'Scenario not found'
            }), 404
        
        result = simulator.simulation_results[scenario_id]
        
        return jsonify({
            'success': True,
            'result': result
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5004))
    app.run(host='0.0.0.0', port=port, debug=True)

