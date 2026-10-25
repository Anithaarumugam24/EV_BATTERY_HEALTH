"""
Database module for EV Battery Health & Remaining Life Prediction AI.
Stores prediction history using SQLite.
"""

import os
import sqlite3
from datetime import datetime
from typing import List, Dict, Any, Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "data", "predictions.db")

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                battery_id TEXT DEFAULT 'User_Pack_01',
                cycle INTEGER NOT NULL,
                voltage_mean REAL NOT NULL,
                voltage_min REAL NOT NULL,
                current_mean REAL NOT NULL,
                temperature_mean REAL NOT NULL,
                temperature_max REAL NOT NULL,
                discharge_duration_s REAL NOT NULL,
                internal_resistance_est REAL NOT NULL,
                predicted_soh REAL NOT NULL,
                predicted_rul REAL NOT NULL,
                predicted_capacity REAL NOT NULL,
                condition TEXT NOT NULL,
                health_score REAL NOT NULL,
                notes TEXT
            );
        """)
        conn.commit()

def save_prediction(data: Dict[str, Any]) -> int:
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO predictions (
                timestamp, battery_id, cycle, voltage_mean, voltage_min,
                current_mean, temperature_mean, temperature_max,
                discharge_duration_s, internal_resistance_est,
                predicted_soh, predicted_rul, predicted_capacity,
                condition, health_score, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data.get("timestamp", datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")),
            data.get("battery_id", "Custom_EV_Cell"),
            data.get("cycle", 1),
            data.get("voltage_mean", 3.6),
            data.get("voltage_min", 2.7),
            data.get("current_mean", 2.0),
            data.get("temperature_mean", 25.0),
            data.get("temperature_max", 30.0),
            data.get("discharge_duration_s", 3000.0),
            data.get("internal_resistance_est", 0.05),
            data.get("predicted_soh", 80.0),
            data.get("predicted_rul", 50.0),
            data.get("predicted_capacity", 1.6),
            data.get("condition", "Good"),
            data.get("health_score", 80.0),
            data.get("notes", "")
        ))
        conn.commit()
        return cursor.lastrowid

def get_predictions(limit: int = 50) -> List[Dict[str, Any]]:
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM predictions ORDER BY id DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def clear_predictions():
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM predictions")
        conn.commit()

if __name__ == "__main__":
    init_db()
    print("Database initialized at:", DB_PATH)
