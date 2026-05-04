import random
import math
import copy
from monte_carlo import MonteCarloSimulator

class ScheduleOptimizer:
    def __init__(self, initial_schedule, initial_temp=100.0, cooling_rate=0.95, max_iterations=100):
        self.current_schedule = initial_schedule
        self.initial_temp = initial_temp
        self.cooling_rate = cooling_rate
        self.max_iterations = max_iterations
        
    def _evaluate_schedule(self, schedule):
        """Runs the Phase 5 Monte Carlo engine to score this specific schedule layout."""
        # Note: We run fewer iterations (e.g., 50) during optimization for speed, 
        # otherwise 100 max_iterations * 1000 Monte Carlo runs = 100,000 simulations!
        simulator = MonteCarloSimulator(schedule)
        results = simulator.run_simulation(iterations=50) 
        return results['total_cost']

    def _get_neighbor_schedule(self, schedule):
        """Swaps patients OR nudges them to fix double-bookings."""
        if len(schedule) < 2:
            return schedule
            
        new_schedule = copy.deepcopy(schedule)
        
        # 1. Pick a random patient
        idx1 = random.randint(0, len(new_schedule) - 1)
        patient1 = new_schedule[idx1]
        
        # 2. Check for Double-Bookings
        double_booked = [i for i, p in enumerate(new_schedule) if p['scheduled_minute'] == patient1['scheduled_minute'] and i != idx1]
        
        if double_booked:
            # THE FIX: If there is a double booking, push one patient forward by 15 minutes!
            new_schedule[idx1]['scheduled_minute'] += 15
            return new_schedule
            
        # 3. If no double booking, do a normal swap with someone close by (within 45 mins)
        valid_neighbors = []
        for i, p in enumerate(new_schedule):
            if i != idx1 and abs(p['scheduled_minute'] - patient1['scheduled_minute']) <= 45:
                valid_neighbors.append(i)
                
        if not valid_neighbors:
            return new_schedule
            
        idx2 = random.choice(valid_neighbors)
        
        # Swap their times
        temp_time = new_schedule[idx1]['scheduled_minute']
        new_schedule[idx1]['scheduled_minute'] = new_schedule[idx2]['scheduled_minute']
        new_schedule[idx2]['scheduled_minute'] = temp_time
        
        return new_schedule

    def run_optimization(self):
        """The core Simulated Annealing algorithm."""
        if len(self.current_schedule) < 2:
            return {"optimized_schedule": self.current_schedule, "improvement": 0}

        current_cost = self._evaluate_schedule(self.current_schedule)
        
        best_schedule = copy.deepcopy(self.current_schedule)
        best_cost = current_cost
        
        temp = self.initial_temp

        for iteration in range(self.max_iterations):
            # 1. Tweak the schedule
            neighbor_schedule = self._get_neighbor_schedule(self.current_schedule)
            
            # 2. Score the tweaked schedule
            neighbor_cost = self._evaluate_schedule(neighbor_schedule)
            
            # 3. Calculate the difference
            cost_diff = neighbor_cost - current_cost
            
            # 4. Decide whether to keep the tweak
            # If it's better (cost_diff < 0), ALWAYS keep it.
            # If it's worse, MAYBE keep it based on the temperature.
            if cost_diff < 0 or random.random() < math.exp(-cost_diff / temp):
                self.current_schedule = neighbor_schedule
                current_cost = neighbor_cost
                
                # Check if this is the absolute best we've seen so far
                if current_cost < best_cost:
                    best_schedule = copy.deepcopy(self.current_schedule)
                    best_cost = current_cost
                    
            # 5. Cool the temperature
            temp *= self.cooling_rate

        return {
            "optimized_schedule": best_schedule,
            "final_cost": best_cost,
            "starting_cost": self._evaluate_schedule(best_schedule) # Quick re-eval for exact metrics
        }