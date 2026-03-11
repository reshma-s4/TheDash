'''
This small script tests the voltage values of the pin, shows 1 when
voltage is HIGH (3.3V) when motion is detected, then 0 for LOW, and enters
a cooldown based on position of potentiometer
'''

from time import sleep
from gpiozero import MotionSensor

def main():
	pir = MotionSensor(4)
	
	while True:
		print("Value: ", pir.value)
		sleep(1)
if __name__ == "__main__":
	main()
