// src/contexts/NotificationProvider.tsx
'use client';

import { useEffect, useCallback } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app as firebaseApp } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();

  const requestPermissionAndToken = useCallback(async () => {
    // Verifica se estamos no navegador e se o navegador suporta messaging.
    if (typeof window === 'undefined' || !('Notification' in window) || !navigator.serviceWorker) {
        console.log("Este navegador não suporta notificações push.");
        return;
    }
    
    // Pede permissão ao usuário
    console.log('Requesting permission...');
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      try {
        const messaging = getMessaging(firebaseApp);
        // Chave VAPID do seu projeto Firebase para autenticar as requisições push
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        
        if (!vapidKey) {
            console.error("VAPID key não encontrada. Verifique suas variáveis de ambiente.");
            return;
        }

        const currentToken = await getToken(messaging, { vapidKey });
        
        if (currentToken) {
          console.log('FCM Token obtido:', currentToken);
          // Envia o token para o seu backend para salvá-lo
          await api.post('/user/register-fcm-token', { token: currentToken });
          console.log('FCM Token enviado para o servidor.');
        } else {
          console.log('Não foi possível obter o token de registro. Permissão foi concedida?');
        }
      } catch (error) {
        console.error('Ocorreu um erro ao obter o token FCM.', error);
      }
    } else {
      console.log('Não foi possível obter permissão para notificações.');
    }
  }, []);

  useEffect(() => {
    requestPermissionAndToken();
  }, [requestPermissionAndToken]);

  // Lida com mensagens recebidas enquanto o app está em primeiro plano
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const messaging = getMessaging(firebaseApp);
        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Mensagem recebida em primeiro plano. ', payload);
            toast({
                title: payload.notification?.title,
                description: payload.notification?.body,
            });
             // Dispara um evento para que o painel de notificações possa se atualizar
             window.dispatchEvent(new Event('notification-received'));
        });
        return () => unsubscribe();
    }
  }, [toast]);

  return <>{children}</>;
}
