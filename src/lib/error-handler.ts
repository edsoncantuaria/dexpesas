
import { logger } from './logger';

interface ApiErrorResponse {
    message?: string;
    error?: string;
    statusCode?: number;
    details?: { message: string }[];
}

/**
 * Extracts a user-friendly error message from an API error object.
 */
export function getApiErrorMessage(error: any): string {
    if (error.response) {
        const data = error.response.data;

        if (typeof data === 'string') {
            return data;
        }

        if (data && typeof data === 'object') {
            // Prioritize details array for validation errors
            // Cast to any to ensure we can access details even if interface doesn't match perfectly at runtime
            const details = (data as any).details;
            if (Array.isArray(details) && details.length > 0) {
                return details
                    .map((d: any) => {
                        const msg = d.message || '';
                        return msg.includes(' is ') ? msg.split(' is ')[1] : msg;
                    })
                    .filter(Boolean)
                    .join('\n');
            }

            // If it's the generic "Invalid input data" but no details were found/parsed,
            // return a better message instead of the technical error string.
            if (data.error === 'Invalid input data') {
                return 'Verifique os dados preenchidos e tente novamente.';
            }

            return data.message || data.error || '';
        }
    }
    return error.message || '';
}

/**
 * Handles API errors by logging them and showing a user-friendly toast message.
 * 
 * @param error The error object caught from the try/catch block
 * @param toast The toast function from useToast hook
 * @param fallbackTitle A default title for the error toast (should be operation-specific in Portuguese)
 */
export function handleApiError(error: any, toast: any, fallbackTitle: string = 'Erro na operação') {
    // Log the full error for debugging/system monitoring
    logger.error('API Error:', error);

    let title = fallbackTitle;
    let description = 'Ocorreu um erro inesperado. Tente novamente mais tarde.';

    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range 2xx
        const status = error.response.status;
        const serverMessage = getApiErrorMessage(error);

        if (status >= 500) {
            // System error - Don't show technical details to user, just log it (already logged above)
            // User message should be generic but polite
            title = 'Erro no Sistema';
            description = 'Nossos servidores encontraram um problema. Nossa equipe já foi notificada.';
        } else if (status === 400) {
            // Bad request - validation error or invalid data
            // Use server message if available (it's likely a specific validation error in Portuguese)
            if (serverMessage) {
                description = serverMessage;
            } else {
                // Provide a more helpful fallback based on the operation
                description = 'Verifique se todos os campos obrigatórios foram preenchidos corretamente.';
            }
        } else if (status === 401) {
            // Unauthorized
            title = 'Sessão Expirada';
            description = serverMessage || 'Sua sessão expirou. Por favor, faça login novamente.';
        } else if (status === 403) {
            // Forbidden
            title = 'Acesso Negado';
            description = serverMessage || 'Você não tem permissão para realizar esta ação.';
        } else if (status === 404) {
            // Not found
            title = 'Não Encontrado';
            description = serverMessage || 'O item que você está procurando não existe ou foi removido.';
        } else if (status === 409) {
            // Conflict
            title = 'Conflito de Dados';
            description = serverMessage || 'Esta operação conflita com dados existentes. Verifique e tente novamente.';
        } else if (status === 422) {
            // Unprocessable Entity - validation error
            title = 'Dados Inválidos';
            description = serverMessage || 'Alguns dados fornecidos são inválidos. Verifique e corrija antes de continuar.';
        } else if (status === 429) {
            // Too many requests
            title = 'Muitas Tentativas';
            description = serverMessage || 'Você está fazendo muitas requisições. Aguarde alguns instantes e tente novamente.';
        } else {
            // Other 4xx errors - use server message if available
            if (serverMessage) {
                description = serverMessage;
            } else {
                description = 'Não foi possível completar a operação. Verifique os dados e tente novamente.';
            }
        }
    } else if (error.request) {
        // The request was made but no response was received
        title = 'Sem Conexão';
        description = 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.';
    } else {
        // Something happened in setting up the request that triggered an Error
        description = error.message || description;
    }

    toast({
        variant: 'destructive',
        title,
        description,
    });
}
