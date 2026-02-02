import axios from 'axios';
import https from 'https';
import { HueAuth } from '../src/hue-auth';

const bridgeIp = process.argv[2];

if (!bridgeIp) {
    console.error('Usage: npx ts-node scripts/test-connection.ts <BRIDGE_IP>');
    process.exit(1);
}

const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const hueAuth = new HueAuth(); // Uses default ~/.hue-motion-aware-auth.json

async function startPairing(ip: string) {
    const logger = {
        info: (msg: string) => console.log(`[INFO] ${msg}`),
        warn: (msg: string) => console.warn(`[WARN] ${msg}`),
        error: (msg: string) => console.error(`[ERROR] ${msg}`),
        debug: (msg: string) => { },
    };
    return await hueAuth.resolveApiKey(ip, logger);
}

async function testConnection() {
    console.log(`Testing reachability of Hue Bridge at ${bridgeIp}...`);

    try {
        const response = await axios.get(`http://${bridgeIp}/description.xml`, { timeout: 5000 });
        console.log('✅ Successfully reached bridge via HTTP!');
        console.log('Model Name:', response.data.match(/<modelName>(.*?)<\/modelName>/)?.[1]);
    } catch (error: any) {
        console.warn('⚠️ Failed to reach bridge via HTTP (Port 80 might be closed).');
    }

    try {
        console.log('Testing HTTPS (V2 API endpoint)...');
        const response = await axios.get(`https://${bridgeIp}/clip/v2/resource`, {
            httpsAgent,
            timeout: 5000
        }).catch(err => err.response);

        if (response && (response.status === 403 || response.status === 401)) {
            console.log('✅ Bridge reached via HTTPS!');
            await startPairing(bridgeIp);
        } else if (response && response.status === 200) {
            console.log('✅ Bridge reached and API key works!');
        } else {
            console.error('❌ Failed to reach bridge via HTTPS.');
        }
    } catch (error: any) {
        console.error('❌ Error during HTTPS test:', error.message);
    }
}

testConnection();
