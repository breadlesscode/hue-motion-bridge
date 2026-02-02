
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as os from 'os';

export interface AuthData {
    apiKey: string;
}

export class HueAuth {
    private readonly storagePath: string;
    private readonly httpsAgent = new https.Agent({ rejectUnauthorized: false });

    constructor(customStoragePath?: string) {
        // Determine the storage path. 
        // Plugins pass api.user.storagePath().
        // Standalone scripts can pass a path or default to ~/.homebridge or home dir.
        if (customStoragePath) {
            // Ensure we treat it as a directory if it doesn't end in .json
            this.storagePath = customStoragePath.endsWith('.json')
                ? customStoragePath
                : path.join(customStoragePath, 'hue-motion-aware-auth.json');
        } else {
            // Fallback for standalone scripts: Check standard Homebridge location first, then home dir
            const hbPath = path.join(os.homedir(), '.homebridge');
            if (fs.existsSync(hbPath)) {
                this.storagePath = path.join(hbPath, 'hue-motion-aware-auth.json');
            } else {
                this.storagePath = path.join(os.homedir(), '.hue-motion-aware-auth.json');
            }
        }
    }

    /**
     * Resolves the API key by checking local storage or initiating a pairing process.
     */
    async resolveApiKey(bridgeIp: string, logger: { info: (msg: string) => void, warn: (msg: string) => void, error: (msg: string) => void, debug: (msg: string) => void }): Promise<string | undefined> {
        const storedKey = this.loadKey();
        if (storedKey) {
            logger.debug(`Loaded existing API key from ${this.storagePath}`);
            return storedKey;
        }

        return await this.startPairing(bridgeIp, logger);
    }

    private loadKey(): string | undefined {
        if (fs.existsSync(this.storagePath)) {
            try {
                const data: AuthData = JSON.parse(fs.readFileSync(this.storagePath, 'utf-8'));
                return data.apiKey;
            } catch (e) {
                // Corrupted file, ignore
            }
        }
        return undefined;
    }

    private saveKey(apiKey: string): void {
        try {
            const dir = path.dirname(this.storagePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.storagePath, JSON.stringify({ apiKey }, null, 2));
        } catch (e: any) {
            console.error(`Failed to save API key to ${this.storagePath}: ${e.message}`);
        }
    }

    private async startPairing(bridgeIp: string, logger: { info: (msg: string) => void, warn: (msg: string) => void, error: (msg: string) => void, debug: (msg: string) => void }): Promise<string | undefined> {
        logger.warn('*************************************************************');
        logger.warn('  NO HUE API KEY FOUND. STARTING AUTOMATIC PAIRING.');
        logger.warn('  PLEASE PRESS THE LINK BUTTON ON YOUR HUE BRIDGE NOW!');
        logger.warn(`  Storage location: ${this.storagePath}`);
        logger.warn('*************************************************************');

        const maxAttempts = 30; // 60 seconds
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const response = await axios.post(
                    `https://${bridgeIp}/api`,
                    { devicetype: 'homebridge#hue-motion-aware' },
                    { httpsAgent: this.httpsAgent, timeout: 5000 }
                );

                if (response.data[0]?.success?.username) {
                    const key = response.data[0].success.username;
                    logger.info('SUCCESSFULLY PAIRED! API Key obtained.');
                    this.saveKey(key);
                    return key;
                }
            } catch (e: any) {
                logger.debug(`Pairing attempt ${i + 1} failed: ${e.message}`);
            }
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        logger.error('PAIRING TIMEOUT. Please try again.');
        return undefined;
    }
}
