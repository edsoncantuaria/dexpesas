// src/contexts/PushNotificationProvider.tsx
'use client';

import { useEffect, useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

/**
 * Converte uma string base64url para um Uint8Array.
 * Necessário para usar a chave pública VAPID.
 */
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
    const { toast } = useToast();
    const [isSubscribed, setIsSubscribed] = useState(false);

    const subscribeUser = useCallback(async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push notifications não são suportadas neste navegador.');
            return;
        }

        try {
            const swRegistration = await navigator.serviceWorker.ready;
            let subscription = await swRegistration.pushManager.getSubscription();

            if (subscription) {
                console.log('Usuário já inscrito.');
                setIsSubscribed(true);
                return;
            }

            const response = await api.get('/notifications/vapid-public-key');
            const applicationServerKey = urlBase64ToUint8Array(response.data.publicKey);
            
            subscription = await swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey,
            });

            console.log('Nova inscrição de push obtida:', subscription);
            await api.post('/notifications/subscribe', { subscription });
            toast({ title: 'Notificações Ativadas!', description: 'Você receberá alertas importantes.' });
            setIsSubscribed(true);

        } catch (error) {
            console.error('Falha ao se inscrever para notificações push:', error);
            toast({ variant: 'destructive', title: 'Falha nas Notificações', description: 'Não foi possível ativar as notificações push.' });
        }
    }, [toast]);
    
    const requestPermission = useCallback(async () => {
         if (!('Notification' in window)) return;
         
         const permission = await Notification.requestPermission();
         if (permission === 'granted') {
             await subscribeUser();
         }
    }, [subscribeUser])


    useEffect(() => {
        // A permissão só pode ser solicitada por uma ação do usuário,
        // então não chamamos requestPermission() diretamente aqui.
        // A lógica de UI (um botão, um switch) deve chamar `requestPermission`.
        // Por agora, vamos checar se já existe uma inscrição.
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(reg => {
                reg.pushManager.getSubscription().then(sub => {
                    if (sub) setIsSubscribed(true);
                });
            });
        }
    }, []);

    // Este provider pode no futuro expor o estado e a função de inscrição
    // para serem usados por um botão na UI de configurações.

    return <>{children}</>;
}
