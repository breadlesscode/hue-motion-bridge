import { API } from "homebridge";
import { HueMotionAwarePlatform } from "./platform";

/**
 * Register the platform with Homebridge
 */
export = (api: API) => {
  api.registerPlatform("HueMotionAware", HueMotionAwarePlatform);
};
