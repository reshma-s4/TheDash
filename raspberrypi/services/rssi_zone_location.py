# This module is currently NOT being used in our 
# current project implementations due to constrains with 
# network connectivity.
# wlan0 set up as an access point
# wlan1 set up to connect to network in order to push out data
# to firebase. If ethernet connection is possible, then wlan1
# can be used to monitor rssi signals of connected devices.
# RSSI signals for controllers not dependent on this module.

import time
import re
import subprocess

# WIFI adapter is wlan1
# Current assumption is that any device connected is a user.
def get_all_rssi(interface="wlan1"):
    devices = []

    output = subprocess.check_output(
        ["iw", "dev", interface, "station", "dump"]
    ).decode()

    blocks = output.split("Station ")
    for block in blocks:
        if not block.strip():
            continue

        lines = block.splitlines()
        mac = lines[0].strip().split()[0].lower()

        rssi = None
        for line in lines:
            if "signal:" in line and "avg" not in line:
                match = re.search(r"(-\d+)", line)
                if match:
                    rssi = int(match.group(1))

        if rssi is not None:
            devices.append({
                "mac": mac,
                "rssi": rssi
            })

    return devices

# Used with classify_zone function to determine the zone of the user.
def classify_subzone(rssi):
    if rssi is None:
        return "unknown"
    if rssi >= -55:
        return "near"
    elif rssi >= -67:
        return "mid"
    else:
        return "far"
    
# Used to classify zone based on camera ID and RSSI value.
# Not curently being used in the project but is there if it needs implementation
def classify_zone(cam_id, rssi):
    subzone = classify_subzone(rssi)
    
    if cam_id == "cam1":
        return {
            "zone" : "A",
            "subzone" : subzone
            }
    elif cam_id == "cam2":
        return {
            "zone" : "C",
            "subzone" : subzone
            }
    else:
        return {
            "zone" : "B",
            "subzone" : subzone
            }
        
def get_user_location(cam_id):
    rssi_data = get_all_rssi()
    if rssi_data is None:
        return None
    
    user_locations = []
    for device in rssi_data:
        location_info = classify_zone(cam_id, device["rssi"])
        user_locations.append({
            "mac": device["mac"],
            "zone": location_info["zone"],
            "subzone": location_info["subzone"]
        })
    
    return user_locations

def get_zone_occupancy(cam_id):
    user_locations = get_user_location(cam_id)
    if user_locations is None:
        return None
    
    occupancy = {
        "A": 0,
        "B": 0,
        "C": 0
    }
    
    for user in user_locations:
        zone = user["zone"]
        if zone in occupancy:
            occupancy[zone] += 1
            
    return occupancy
    
def get_subzone_occupancy(cam_id):
    user_locations = get_user_location(cam_id)
    if user_locations is None:
        return None
    
    occupancy = {
        "near": 0,
        "mid": 0,
        "far": 0,
        "unknown": 0
    }
    
    for user in user_locations:
        subzone = user["subzone"]
        if subzone in occupancy:
            occupancy[subzone] += 1
            
    return occupancy
        
# Main function here only to test that 
# devices are connecting to adapter and 
# rssi is able to be retrieved
def main():
    while True:
        connected_devices = get_all_rssi()
        if connected_devices:
            for device in connected_devices:
                print(f"Device: {device['mac']}, RSSI: {device['rssi']}")
        else:
            print("Failed to read RSSI.")
        
        time.sleep(5)
        
if __name__ == "__main__":
    main()