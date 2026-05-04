from flask import Flask
from routes.routes import main
from services.motion_sensor import MotionSensorService
import services.firebase_services as fb

app = Flask(__name__)
app.register_blueprint(main, url_prefix="/")

if __name__ == "__main__":
    fb.init_firebase()
    MotionSensorService(pir_pin=4, camera_id="pi_cam", cooldown=5).start()
    app.run(host="0.0.0.0", port=8080, debug=True, use_reloader=False)