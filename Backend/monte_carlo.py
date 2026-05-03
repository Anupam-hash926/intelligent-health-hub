import random
import copy

class VirtualPatient:
    def __init__(self, apt_id, scheduled_minute, base_priority, no_show_risk):
        self.apt_id = apt_id
        self.scheduled_minute = scheduled_minute
        self.base_priority = base_priority
        self.no_show_risk = no_show_risk
        
        self.arrival_minute = None
        self.wait_time = 0

    def get_effective_priority(self, current_minute):
        """Calculates Priority dynamically based on simulated wait time."""
        if self.arrival_minute is None:
            return -1
        self.wait_time = current_minute - self.arrival_minute
        return self.base_priority + (self.wait_time * 0.1)

class MonteCarloSimulator:
    def __init__(self, schedule_data, appt_duration=15):
        # Convert raw database dicts into VirtualPatient objects
        self.base_schedule = [
            VirtualPatient(p['id'], p['scheduled_minute'], p['base_priority'], p['no_show_risk'])
            for p in schedule_data
        ]
        self.appt_duration = appt_duration

    def run_single_day(self):
        """Simulates one single day of routing."""
        schedule = copy.deepcopy(self.base_schedule)
        schedule.sort(key=lambda x: x.scheduled_minute)
        
        virtual_queue = []
        
        # Start the clock at the very first appointment of the day
        current_minute = schedule[0].scheduled_minute if schedule else 0
        doctor_free_at = current_minute
        
        total_wait_time = 0
        patients_seen = 0
        doctor_idle_time = 0

        # Loop until everyone is processed
        while schedule or virtual_queue:
            
            # 1. The Gatekeeper: Who is scheduled right now?
            arriving_now = [p for p in schedule if p.scheduled_minute == current_minute]
            
            for p in arriving_now:
                schedule.remove(p)
                # Roll the dice (0 to 100). If the roll is HIGHER than the risk, they arrive!
                if random.uniform(0, 100) > p.no_show_risk:
                    p.arrival_minute = current_minute
                    virtual_queue.append(p)
            
            # 2. The Sorter: Virtual Doctor pulls from the Queue
            if current_minute >= doctor_free_at and virtual_queue:
                # Sort by effective priority (highest first)
                virtual_queue.sort(key=lambda x: x.get_effective_priority(current_minute), reverse=True)
                
                next_patient = virtual_queue.pop(0)
                total_wait_time += next_patient.wait_time
                patients_seen += 1
                
                # Lock the doctor up for 15 minutes
                doctor_free_at = current_minute + self.appt_duration
                
            # 3. Idle Tracker: Doctor is free, but nobody showed up yet
            elif current_minute >= doctor_free_at and not virtual_queue and schedule:
                doctor_idle_time += 1
            
            # Tick the clock forward 1 minute
            current_minute += 1
        
        return total_wait_time, patients_seen, doctor_idle_time

    def run_simulation(self, iterations=1000):
        """Runs the day 1,000 times to smooth out randomness."""
        if not self.base_schedule:
            return {"expected_wait_time": 0, "expected_idle_time": 0, "total_cost": 0}

        total_avg_wait = 0
        total_idle = 0

        for _ in range(iterations):
            wait, seen, idle = self.run_single_day()
            total_avg_wait += (wait / seen) if seen > 0 else 0
            total_idle += idle

        # Calculate final averages
        final_wait = round(total_avg_wait / iterations, 2)
        final_idle = round(total_idle / iterations, 2)
        
        # Calculate the Final "Cost" (Idle time is penalized harder than wait time)
        total_cost = round(final_wait + (final_idle * 1.5), 2)
        
        return {
            "expected_wait_time": final_wait,
            "expected_idle_time": final_idle,
            "total_cost": total_cost
        }