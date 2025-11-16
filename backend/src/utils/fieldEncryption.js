// backend/src/utils/fieldEncryption.js
import crypto from 'crypto';
import config from '../config/config.js';

const ALGORITHM = 'aes-256-gcm';
const KEY_SOURCE = config.encryptionKey;

if (!KEY_SOURCE) {
    console.warn('[FieldEncryption] DATA_ENCRYPTION_KEY não configurada. Dados sensíveis serão armazenados em texto plano.');
}

function getKey() {
    if (!KEY_SOURCE) return null;
    return crypto.createHash('sha256').update(KEY_SOURCE).digest();
}

const KEY = getKey();

export function encryptValue(value) {
    if (value === null || value === undefined) return null;
    if (!KEY) return typeof value === 'string' ? value : JSON.stringify(value);

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    const input = typeof value === 'string' ? value : JSON.stringify(value);
    const encrypted = Buffer.concat([cipher.update(input, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

export function decryptValue(payload) {
    if (!payload) return null;
    if (!KEY) return payload;
    try {
        const buffer = Buffer.from(payload, 'base64');
        const iv = buffer.subarray(0, 12);
        const authTag = buffer.subarray(12, 28);
        const data = buffer.subarray(28);
        const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
        return decrypted;
    } catch (error) {
        console.error('Erro ao descriptografar campo sensível:', error.message);
        // Se falhar, assume que o valor já estava salvo em texto plano
        return payload;
    }
}

export function decryptJson(payload) {
    const raw = decryptValue(payload);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (error) {
        console.error('Erro ao converter campo descriptografado em JSON:', error.message);
        return null;
    }
}
