// backend/src/services/securityService.js
import prisma from '../config/prismaClient.js';
import NotificationService from './notificationService.js';
import { buildDeviceId } from './securityUtils.js';
import { decryptValue } from '../utils/fieldEncryption.js';

const NOTIFICATION_COOLDOWN_MINUTES = 30;

class SecurityService {
    static async recordDeviceLogin(user, deviceInfo = {}, ipAddress = '') {
        if (!user) return null;
        const normalizedId = buildDeviceId(deviceInfo, user.id);
        if (!normalizedId) return null;

        const compositeKey = {
            userId_deviceId: {
                userId: user.id,
                deviceId: normalizedId,
            },
        };

        const existingDevice = await prisma.userDevice.findUnique({
            where: compositeKey,
        });

        if (existingDevice) {
            await prisma.userDevice.update({
                where: { id: existingDevice.id },
                data: {
                    lastLoginAt: new Date(),
                    deviceName: deviceInfo.deviceName || existingDevice.deviceName,
                    platform: deviceInfo.platform || existingDevice.platform,
                    ipAddress: ipAddress || existingDevice.ipAddress,
                },
            });
            return existingDevice;
        }

        const newDeviceName = deviceInfo.deviceName || deviceInfo.userAgent || deviceInfo.platform || 'Dispositivo Desconhecido';
        const newDevice = await prisma.userDevice.create({
            data: {
                userId: user.id,
                deviceId: normalizedId,
                deviceName: newDeviceName,
                platform: deviceInfo.platform || 'web',
                ipAddress: ipAddress || null,
            },
        });

        await prisma.securityEvent.create({
            data: {
                userId: user.id,
                type: 'NEW_DEVICE',
                message: `Novo login no dispositivo ${newDeviceName}`,
                metadata: {
                    platform: deviceInfo.platform || 'web',
                    ipAddress,
                },
            },
        });

        const now = new Date();
        const lastAlert = user.lastSecurityNotificationAt ? new Date(user.lastSecurityNotificationAt) : null;
        const minutesSinceLastAlert = lastAlert ? (now.getTime() - lastAlert.getTime()) / (1000 * 60) : Infinity;

        if (minutesSinceLastAlert > NOTIFICATION_COOLDOWN_MINUTES) {
            await NotificationService.createNotification(prisma, user, {
                title: 'Novo dispositivo detectado',
                message: `Detectamos um novo acesso em ${newDeviceName}. Se não foi você, altere sua senha imediatamente.`,
                type: 'SECURITY_ALERT',
            });

            await prisma.user.update({
                where: { id: user.id },
                data: { lastSecurityNotificationAt: now },
            });
        }

        return newDevice;
    }

    static async markDeviceTrusted(userId, deviceRecordId) {
        const device = await prisma.userDevice.findFirst({
            where: { id: deviceRecordId, userId },
        });
        if (!device) {
            return null;
        }
        return prisma.userDevice.update({
            where: { id: device.id },
            data: { trusted: true },
        });
    }

    static async getSecuritySummary(userOrId) {
        const baseUser = typeof userOrId === 'string'
            ? await prisma.user.findUnique({
                where: { id: userOrId },
                select: { id: true, twoFactorEnabled: true, phoneVerified: true, phoneNumber: true },
            })
            : userOrId;

        if (!baseUser) return null;

        const decryptedPhone = baseUser.phoneNumber ? decryptValue(baseUser.phoneNumber) : null;

        const devices = await prisma.userDevice.findMany({
            where: { userId: baseUser.id },
            orderBy: { lastLoginAt: 'desc' },
            take: 5,
        });

        return {
            twoFactorEnabled: baseUser.twoFactorEnabled,
            phoneVerified: baseUser.phoneVerified,
            hasPhone: !!decryptedPhone,
            pendingApprovals: devices.filter(device => !device.trusted).map(device => ({
                id: device.id,
                deviceName: device.deviceName,
                platform: device.platform,
                lastLoginAt: device.lastLoginAt,
            })),
            recentDevices: devices.map(device => ({
                id: device.id,
                deviceName: device.deviceName,
                platform: device.platform,
                trusted: device.trusted,
                lastLoginAt: device.lastLoginAt,
            })),
            phoneNumber: decryptedPhone,
        };
    }
}

export default SecurityService;
