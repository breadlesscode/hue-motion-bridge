import { Service, PlatformAccessory } from "homebridge";
import { HueMotionAwarePlatform } from "./platform";

export class HueMotionSensorAccessory {
  private service: Service;

  constructor(
    private readonly platform: HueMotionAwarePlatform,
    private readonly accessory: PlatformAccessory,
    private readonly area: any,
  ) {
    // Set accessory information
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, "Philips")
      .setCharacteristic(this.platform.Characteristic.Model, "Hue MotionAware Zone")
      .setCharacteristic(this.platform.Characteristic.SerialNumber, area.id);

    // Get the MotionSensor service if it exists, otherwise create a new MotionSensor service
    this.service =
      this.accessory.getService(this.platform.Service.MotionSensor) ||
      this.accessory.addService(this.platform.Service.MotionSensor);

    // Set the service name, this is what is displayed as the default name on the Home app
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.displayName);

    // Initialize state
    const isPresent = area.motion?.motion === true;
    this.service.updateCharacteristic(this.platform.Characteristic.MotionDetected, isPresent);
  }
}
