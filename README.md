# TheDash

## Overview
 The Dash is an innovative indoor navigation application designed for campuses, making it easily accessible for students to locate their classes, along with other key points throughtout it.

## Hardware Requirements
	- 1 Raspberry Pi 5 (configured with 16GB RAM)
	- 1 Raspberry Pi compatible camera
 	- 2 AI-Thinker ESP32-CAM board equipped with cameras
 	- 3 PIR Sensors

## Hardware Setup

### Raspberry Pi (Processor)
	1. Installed OS (Bookworm) on Raspberry Pi using Raspberry Pi Imager.
	2. Configured wlan0 to act as a hotspot (thedashAP)
	3. Installed PIR sensor to Pi using following configuration:
		- PIR pin 1 (VCC) to Pi pin 2 (5V)
		- PIR pin 3 (GND) to Pi pin 6 (GND)
		- PIR pin 2 (OUT) to Pi pin 7 (GPIO 4)
	4. Installed compatible Pi camera to an available CAM/DISP connector

### ESP32-CAM Board (Edge Device)
	1. Configured GPIO pin 13 to be used to read input value of PIR sensor
	2. Using a 5V power adapter, VCC was connected to 5V power pin and GND was connected to GND pin. 
	3. Installed PIR sensor to board using following configuration:
		- PIR pin 1 (VCC) to 5V pin (5V)
		- PIR pin 3 (GND) to GND pin (GND)
		- PIR pin 2 (OUT) to GPIO 13

## Hardware Implementation
	- Raspberry Pi and edge devices communicate with each other via Wi-Fi.
	- Raspberry Pi initializes camera and system goes on standby. 
	- Edge devices look for and connect to Raspberry Pi and go on standby. 
	- When motion is detected:
		* On edge device:
			- Frame is captured, frame is sent to Pi along with ID of edge device