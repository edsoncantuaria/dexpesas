// backend/src/services/securityUtils.js

export function buildDeviceId(deviceInfo = {}, fallbackKey = '') {
    const { deviceId, fingerprint, platform, deviceName, userAgent } = deviceInfo || {};
    const candidate = deviceId || fingerprint || userAgent || (platform ? `${platform}-${deviceName || 'device'}` : '');
    if (candidate) {
        return candidate.toString().slice(0, 190).toLowerCase();
    }
    if (fallbackKey) {
        return `${fallbackKey}-${Date.now()}`;
    }
    return null;
}
