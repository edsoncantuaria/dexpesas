import sharp from 'sharp';

const API_URL = 'http://127.0.0.1:6090/api/ai/scan-receipt';
const LOGIN_URL = 'http://127.0.0.1:6090/api/auth/login';
const REGISTER_URL = 'http://127.0.0.1:6090/api/auth/register';

async function createSampleReceipt() {
    const image = await sharp({
        create: {
            width: 400,
            height: 600,
            channels: 3,
            background: { r: 255, g: 255, b: 255 }
        }
    })
        .composite([{
            input: Buffer.from(`
            <svg width="400" height="600">
                <text x="50" y="50" font-family="Arial" font-size="24" fill="black">Supermercado Teste</text>
                <text x="50" y="100" font-family="Arial" font-size="16" fill="black">Data: 27/11/2025</text>
                <text x="50" y="150" font-family="Arial" font-size="16" fill="black">Item 1 10.00</text>
                <text x="50" y="180" font-family="Arial" font-size="16" fill="black">Item 2 20.00</text>
                <text x="50" y="250" font-family="Arial" font-size="20" fill="black">TOTAL 30.00</text>
            </svg>
        `),
            top: 0,
            left: 0
        }])
        .png()
        .toBuffer();

    return `data:image/png;base64,${image.toString('base64')}`;
}

import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

async function curlRequest(url, method, body, token) {
    let cmd = `curl -s -X ${method} "${url}" -H "Content-Type: application/json"`;
    if (token) cmd += ` -H "Authorization: Bearer ${token}"`;
    if (body) cmd += ` -d '${JSON.stringify(body)}'`;

    const { stdout } = await execAsync(cmd);
    try {
        return JSON.parse(stdout);
    } catch (e) {
        console.error('Failed to parse curl output:', stdout);
        throw e;
    }
}

async function runTest() {
    try {
        console.log('Attempting login...');
        let token;
        try {
            const data = await curlRequest(LOGIN_URL, 'POST', {
                email: 'edson@example.com',
                password: 'password123'
            });
            if (data.token) {
                token = data.token;
                console.log('Login successful');
            } else {
                throw new Error('No token in login response');
            }
        } catch (e) {
            console.log('Login failed, trying register...');
            const data = await curlRequest(REGISTER_URL, 'POST', {
                name: 'Test User',
                email: `test${Date.now()}@example.com`,
                password: 'password123',
                username: `test${Date.now()}`
            });
            token = data.token;
            console.log('Registration successful');
        }

        const imageDataUri = await createSampleReceipt();

        console.log('Starting Request 1 (Cold Start)...');
        const start1 = Date.now();
        const res1 = await curlRequest(API_URL, 'POST', {
            imageDataUri,
            provider: 'TESSERACT'
        }, token);
        const end1 = Date.now();
        console.log(`Request 1 took: ${end1 - start1}ms`);
        console.log('Result 1:', JSON.stringify(res1, null, 2));

        console.log('Starting Request 2 (Warm Start)...');
        const start2 = Date.now();
        const res2 = await curlRequest(API_URL, 'POST', {
            imageDataUri,
            provider: 'TESSERACT'
        }, token);
        const end2 = Date.now();
        console.log(`Request 2 took: ${end2 - start2}ms`);
        console.log('Result 2:', JSON.stringify(res2, null, 2));

        if ((end2 - start2) < (end1 - start1)) {
            console.log('SUCCESS: Warm start was faster!');
        } else {
            console.log('WARNING: Warm start was not faster. Check optimization.');
        }

    } catch (error) {
        console.error('Test failed:', error);
    }
}

runTest();
