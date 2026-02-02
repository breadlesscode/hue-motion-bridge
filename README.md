# Homebridge Hue Motion Aware

Homebridge plugin for the new **MotionAware** zones of the Philips Hue Bridge Pro. This plugin exposes virtual motion areas (created through wireless Zigbee signal analysis between Hue lights) as native motion sensors in HomeKit.

## Prerequisites

- **Philips Hue Bridge Pro** (required for MotionAware feature).
- At least 3-4 compatible Hue lights configured as a "Motion area" in the Philips Hue app.

## Installation

### Via Homebridge UI
1. Go to the **Plugins** tab in your Homebridge UI.
2. Search for `homebridge-hue-motion-aware` and click **Install**.

### Via Command Line
```bash
hb-service add homebridge-hue-motion-aware
```

## Configuration

The plugin can be configured via the Homebridge UI settings:

- **Hue Bridge IP**: The local IP address of your Philips Hue Bridge (e.g., `192.168.178.140`).
- **Hue API Key**: Your Philips Hue application key.

### Creating an API Key (Pairing)
If you don't have an API key yet:
1. Press the link button on your Hue Bridge.
2. Within 30 seconds, send a POST request to `https://<BRIDGE_IP>/api` with body `{"devicetype":"homebridge#hue-motion-aware"}`.
3. Copy the `username` value into the **Hue API Key** field in settings.

## Debugging & Tools

The plugin includes utility scripts to test connection and monitor events. These scripts handle pairing automatically when you provide your Bridge IP.

### Test Connection & Pairing
This script tests connectivity and helps you generate an API key if you don't want to do it through Homebridge.
```bash
npm run test-connection -- <BRIDGE_IP>
```

### Real-time Motion Monitor
Monitor your MotionAware zones in real-time.
```bash
npm run debug-motion -- <BRIDGE_IP>
```

## Quality Standards

This project uses:
- **oxlint**: ultra-fast linting.
- **oxfmt**: fast code formatting.

## License
MIT
