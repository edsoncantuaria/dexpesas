
type LogLevel = 'info' | 'warn' | 'error';

class Logger {
    private log(level: LogLevel, message: string, meta?: any) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

        if (meta) {
            console[level](logMessage, meta);
        } else {
            console[level](logMessage);
        }

        // Here we could send logs to an external service like Sentry, Datadog, etc.
    }

    info(message: string, meta?: any) {
        this.log('info', message, meta);
    }

    warn(message: string, meta?: any) {
        this.log('warn', message, meta);
    }

    error(message: string, meta?: any) {
        this.log('error', message, meta);
    }
}

export const logger = new Logger();
