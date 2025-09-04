// src/lib/api.ts
/**
 * @file Configuração da instância do Axios para comunicação com o backend.
 * 
 * Este arquivo centraliza a criação da instância do Axios, permitindo uma configuração
 * única para a URL base da API e para a injeção de headers, como o token de autenticação.
 */

import axios from 'axios';
import Cookies from 'js-cookie';

// A URL base do seu backend Express, lida a partir das variáveis de ambiente.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
});

/**
 * Intercepta as requisições para adicionar o token JWT de autenticação,
 * que é lido dos cookies.
 */
api.interceptors.request.use(
  (config) => {
    // Verifica se o código está rodando no lado do cliente
    if (typeof window !== 'undefined') {
      const token = Cookies.get('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


export default api;
