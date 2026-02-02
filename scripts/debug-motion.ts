import axios from 'axios';
import EventSource from 'eventsource';
import https from 'https';
import { HueAuth } from '../src/hue-auth';

const bridgeIp = process.argv[2];

if (!bridgeIp) {
    console.error('Usage: npx ts-node scripts/debug-motion.ts <BRIDGE_IP>');
    process.exit(1);
}

const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const hueAuth = new HueAuth(); // Uses default ~/.hue-motion-aware-auth.json

async function debugMotion() {
    // Use console as logger for the standalone script
    const logger = {
        info: (msg: string) => console.log(`[INFO] ${msg}`),
        warn: (msg: string) => console.warn(`[WARN] ${msg}`),
        error: (msg: string) => console.error(`[ERROR] ${msg}`),
        debug: (msg: string) => { }, // Suppress debug logs in CLI
    };

    const apiKey = await hueAuth.resolveApiKey(bridgeIp, logger);

    if (!apiKey) {
        console.error('\nFailed to get API key. Setup aborted.');
        process.exit(1);
    }

    console.log(`\nSuccessfully authenticated! Key: ${apiKey}`);
    console.log('--- Hue MotionAware CLI Debug Tool ---');

    try {
        console.log('Fetching resource map...');
        const response = await axios.get(`https://${bridgeIp}/clip/v2/resource`, {
            headers: { 'hue-application-key': apiKey },
            httpsAgent
        });

        const resources = response.data.data;
        const nameMap = new Map<string, string>();

        const motionConfigs = resources.filter((r: any) => r.type === 'motion_area_configuration');
        const motionServices = resources.filter((r: any) =>
            r.type === 'convenience_area_motion' || r.type === 'security_area_motion'
        );

        for (const service of motionServices) {
            const config = motionConfigs.find((c: any) => c.id === service.owner.rid);
            const name = config?.name || `Unknown Zone (${service.owner.rid})`;
            nameMap.set(service.id, `${name} [${service.type}]`);
            console.log(`Initial State - ${nameMap.get(service.id)}: ${service.motion?.motion ? '🔴 MOTION' : '⚪ idle'}`);
        }

        console.log('\n--- Starting Real-time Event Log ---');
        const es = new EventSource(`https://${bridgeIp}/eventstream/clip/v2`, {
            headers: { 'hue-application-key': apiKey },
            https: { rejectUnauthorized: false }
        } as any);

        es.onmessage = (event) => {
            const messages = JSON.parse(event.data);
            for (const message of messages) {
                if (message.type === 'update') {
                    for (const data of message.data) {
                        if (nameMap.has(data.id) && data.motion !== undefined) {
                            const name = nameMap.get(data.id);
                            const isMotion = data.motion.motion;
                            const timestamp = new Date().toLocaleTimeString();
                            if (isMotion) {
                                console.log(`\x1b[31m[${timestamp}] ${name}: DETECTED MOTION 🔴\x1b[0m`);
                            } else {
                                console.log(`\x1b[32m[${timestamp}] ${name}: Cleared ⚪\x1b[0m`);
                            }
                        }
                    }
                }
            }
        };

        es.onerror = (err) => {
            console.error('EventStream Error:', err);
        };

        console.log('Listening for motion events... (Press Ctrl+C to stop)');

    } catch (error: any) {
        console.error('Debug failed:', error.message);
    }
}

debugMotion();
