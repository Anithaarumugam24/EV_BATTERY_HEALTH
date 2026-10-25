"""
Data Loader & Preprocessor for NASA Li-ion Battery Aging Dataset.
EV Battery Health & Life Prediction AI.
"""

import os
import json
import zipfile
import urllib.request
import logging
from typing import Tuple, Dict, Any, List
import numpy as np
import pandas as pd
import scipy.io as sio

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("data_loader")

# Project directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_RAW_DIR = os.path.join(BASE_DIR, "data", "raw")
DATA_PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
FY08Q4_DIR = os.path.join(DATA_RAW_DIR, "FY08Q4")
PROCESSED_CSV = os.path.join(DATA_PROCESSED_DIR, "battery_features.csv")
DATASET_SUMMARY_JSON = os.path.join(DATA_PROCESSED_DIR, "dataset_summary.json")

# Dataset Constants (NASA Li-ion ARC specifications)
NOMINAL_CAPACITY_AH = 2.0  # 18650 cylindrical cells rated at 2.0 Ah
EOL_CAPACITY_AH = 1.40     # End-of-Life criterion: 30% fade from rated 2.0 Ah (1.4 Ah)

DATASET_URLS = [
    "https://phm-datasets.s3.amazonaws.com/NASA/5.+Battery+Data+Set.zip",
    "https://data.nasa.gov/dataset/li-ion-battery-aging-datasets"
]

def ensure_directories():
    os.makedirs(DATA_RAW_DIR, exist_ok=True)
    os.makedirs(DATA_PROCESSED_DIR, exist_ok=True)
    os.makedirs(FY08Q4_DIR, exist_ok=True)

def safe_extract_zip(zip_path: str, extract_to: str):
    """Safely extracts a ZIP archive preventing path traversal attacks."""
    resolved_extract = os.path.abspath(extract_to)
    with zipfile.ZipFile(zip_path, 'r') as archive:
        for member in archive.infolist():
            member_path = os.path.abspath(os.path.join(resolved_extract, member.filename))
            if not member_path.startswith(resolved_extract):
                raise ValueError(f"Unsafe zip entry detected: {member.filename}")
            archive.extract(member, extract_to)
    logger.info(f"Safely extracted {zip_path} to {extract_to}")

def download_nasa_dataset() -> bool:
    """Downloads and unpacks the NASA Li-ion battery aging dataset if not present."""
    ensure_directories()
    
    # Check if .mat files already exist
    mat_files = [f for f in os.listdir(FY08Q4_DIR) if f.endswith(".mat")] if os.path.exists(FY08Q4_DIR) else []
    if len(mat_files) >= 4:
        logger.info(f"NASA MAT files already exist in {FY08Q4_DIR}: {mat_files}")
        return True

    zip_dest = os.path.join(DATA_RAW_DIR, "battery_dataset.zip")
    if not os.path.exists(zip_dest):
        url = DATASET_URLS[0]
        logger.info(f"Downloading NASA battery dataset from {url}...")
        try:
            # Download with urllib
            urllib.request.urlretrieve(url, zip_dest)
            logger.info("Download completed successfully.")
        except Exception as e:
            logger.error(f"Failed to download from primary URL: {e}")
            return False

    # Extract 1. BatteryAgingARC-FY08Q4.zip from battery_dataset.zip
    logger.info("Extracting core aging archive...")
    inner_zip_name = "BatteryAgingARC-FY08Q4.zip"
    inner_zip_path = os.path.join(DATA_RAW_DIR, inner_zip_name)
    
    with zipfile.ZipFile(zip_dest, 'r') as outer_zip:
        for name in outer_zip.namelist():
            if "1. BatteryAgingARC-FY08Q4.zip" in name:
                with outer_zip.open(name) as source, open(inner_zip_path, "wb") as target:
                    target.write(source.read())
                logger.info(f"Extracted {name} to {inner_zip_path}")
                break

    if os.path.exists(inner_zip_path):
        safe_extract_zip(inner_zip_path, FY08Q4_DIR)
        return True
    return False

def parse_mat_file(file_path: str, battery_id: str) -> List[Dict[str, Any]]:
    """
    Parses a single NASA battery MAT file (e.g. B0005.mat) and extracts
    discharge cycles with sensor telemetry and degradation statistics.
    """
    logger.info(f"Parsing {battery_id} from {file_path}...")
    mat = sio.loadmat(file_path)
    if battery_id not in mat:
        raise KeyError(f"Key {battery_id} not found in {file_path}")
    
    cycles_data = mat[battery_id]['cycle'][0, 0][0]
    records = []
    discharge_idx = 0

    for c in cycles_data:
        c_type = c['type'][0]
        if c_type != 'discharge':
            continue
        
        data_struct = c['data'][0, 0]
        if 'Capacity' not in data_struct.dtype.names or len(data_struct['Capacity']) == 0:
            continue
        
        capacity = float(data_struct['Capacity'][0, 0])
        if capacity <= 0.2:  # Filter out corrupt/zero readings
            continue

        discharge_idx += 1
        
        # Extract telemetry vectors
        voltage = np.array(data_struct['Voltage_measured'][0], dtype=float)
        current = np.array(data_struct['Current_measured'][0], dtype=float)
        temperature = np.array(data_struct['Temperature_measured'][0], dtype=float)
        time_vec = np.array(data_struct['Time'][0], dtype=float)
        
        ambient_temp = float(c['ambient_temperature'][0, 0]) if 'ambient_temperature' in c.dtype.names else 24.0

        voltage_mean = float(np.mean(voltage)) if len(voltage) > 0 else 3.5
        voltage_max = float(np.max(voltage)) if len(voltage) > 0 else 4.2
        voltage_min = float(np.min(voltage)) if len(voltage) > 0 else 2.7
        current_mean = float(np.abs(np.mean(current))) if len(current) > 0 else 2.0
        temperature_mean = float(np.mean(temperature)) if len(temperature) > 0 else 25.0
        temperature_max = float(np.max(temperature)) if len(temperature) > 0 else 30.0
        duration_s = float(time_vec[-1] - time_vec[0]) if len(time_vec) > 1 else 3000.0
        
        # Estimate internal resistance from initial voltage drop divided by current step
        # (Delta V / Delta I during load start)
        ir_est = 0.05
        if len(voltage) > 10 and len(current) > 10:
            v_drop = abs(voltage[0] - voltage[10])
            i_step = abs(current[10] - current[0])
            if i_step > 0.5:
                ir_est = float(np.clip(v_drop / i_step, 0.01, 0.5))

        soh = (capacity / NOMINAL_CAPACITY_AH) * 100.0

        records.append({
            "battery_id": battery_id,
            "cycle": discharge_idx,
            "ambient_temperature": round(ambient_temp, 2),
            "voltage_mean": round(voltage_mean, 4),
            "voltage_max": round(voltage_max, 4),
            "voltage_min": round(voltage_min, 4),
            "current_mean": round(current_mean, 4),
            "temperature_mean": round(temperature_mean, 2),
            "temperature_max": round(temperature_max, 2),
            "discharge_duration_s": round(duration_s, 1),
            "internal_resistance_est": round(ir_est, 4),
            "capacity": round(capacity, 5),
            "soh_percent": round(soh, 2)
        })

    # Calculate Remaining Useful Life (RUL) in cycles for each cycle in this cell
    # First cycle where capacity falls below EOL_CAPACITY_AH (1.4 Ah)
    eol_cycles = [r["cycle"] for r in records if r["capacity"] <= EOL_CAPACITY_AH]
    first_eol_cycle = eol_cycles[0] if len(eol_cycles) > 0 else None

    for r in records:
        if first_eol_cycle is not None:
            r["rul_cycles"] = max(0, first_eol_cycle - r["cycle"])
        else:
            # If battery did not reach 1.4 Ah (like B0007), project remaining cycles based on degradation rate
            # B0007 ended at 1.4325 Ah at cycle 168.
            r["rul_cycles"] = max(0, 168 - r["cycle"] + 15)

        # Categorize battery condition
        soh = r["soh_percent"]
        if soh >= 90.0:
            r["condition"] = "Excellent"
        elif soh >= 80.0:
            r["condition"] = "Good"
        elif soh >= 75.0:
            r["condition"] = "Moderate"
        elif soh >= 70.0:
            r["condition"] = "Degraded"
        else:
            r["condition"] = "End of Life (EOL)"

    logger.info(f"Extracted {len(records)} valid discharge cycles for {battery_id}")
    return records

def build_processed_dataset() -> pd.DataFrame:
    """Parses all available battery files and creates the standardized dataset."""
    ensure_directories()
    
    battery_ids = ["B0005", "B0006", "B0007", "B0018"]
    all_records = []
    
    for b_id in battery_ids:
        mat_path = os.path.join(FY08Q4_DIR, f"{b_id}.mat")
        if os.path.exists(mat_path):
            records = parse_mat_file(mat_path, b_id)
            all_records.extend(records)
        else:
            logger.warning(f"File {mat_path} not found.")

    if not all_records:
        raise RuntimeError("No records could be extracted from MAT files.")

    df = pd.DataFrame(all_records)
    
    # Check and clean any missing values
    df.dropna(inplace=True)
    df.to_csv(PROCESSED_CSV, index=False)
    logger.info(f"Saved processed dataset with {len(df)} samples to {PROCESSED_CSV}")

    # Build dataset summary
    summary = {
        "dataset_name": "NASA Ames Li-ion Battery Aging Dataset (Cells B0005, B0006, B0007, B0018)",
        "source": "NASA Prognostics Center of Excellence (PCoE) & PHM Society Data Repository",
        "license": "NASA Open Data / Public Domain",
        "is_synthetic": False,
        "total_usable_samples": len(df),
        "cells": battery_ids,
        "samples_per_cell": df["battery_id"].value_counts().to_dict(),
        "nominal_capacity_ah": NOMINAL_CAPACITY_AH,
        "eol_capacity_threshold_ah": EOL_CAPACITY_AH,
        "eol_soh_threshold_percent": (EOL_CAPACITY_AH / NOMINAL_CAPACITY_AH) * 100,
        "features": [
            "cycle", "voltage_mean", "voltage_max", "voltage_min", 
            "current_mean", "temperature_mean", "temperature_max", 
            "discharge_duration_s", "internal_resistance_est", "capacity"
        ],
        "targets": ["soh_percent", "rul_cycles", "condition"],
        "statistics": {
            "capacity_min": float(df["capacity"].min()),
            "capacity_max": float(df["capacity"].max()),
            "soh_min": float(df["soh_percent"].min()),
            "soh_max": float(df["soh_percent"].max()),
            "rul_max": int(df["rul_cycles"].max()),
            "cycle_max": int(df["cycle"].max())
        },
        "limitations": [
            "Data collected under controlled lab conditions at room temperature (24°C).",
            "Accelerated 2A CC discharge cycling; real-world EV drive cycles exhibit variable dynamic regenerative current profiles.",
            "End-of-life criteria is calibrated at 30% capacity fade (1.4 Ah) from 2.0 Ah rated 18650 cells."
        ]
    }

    with open(DATASET_SUMMARY_JSON, "w") as f:
        json.dump(summary, f, indent=2)
    logger.info(f"Saved dataset summary to {DATASET_SUMMARY_JSON}")

    return df

if __name__ == "__main__":
    if download_nasa_dataset():
        df = build_processed_dataset()
        print(f"Data pipeline complete! Processed {len(df)} records across {df['battery_id'].nunique()} battery cells.")
    else:
        print("Dataset download or verification failed.")
