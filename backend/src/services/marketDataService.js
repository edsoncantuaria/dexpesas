import axios from 'axios';

class MarketDataService {
    constructor() {
        this.brapiApi = axios.create({
            baseURL: 'https://brapi.dev/api',
        });
        this.brasilApi = axios.create({
            baseURL: 'https://brasilapi.com.br/api',
        });
        this.awesomeApi = axios.create({
            baseURL: 'https://economia.awesomeapi.com.br/last',
        });
        this.coinGeckoApi = axios.create({
            baseURL: 'https://api.coingecko.com/api/v3',
        });
    }

    /**
     * Get stock/FII/ETF quotes from Brapi
     * @param {string} ticker e.g., "PETR4", "VALE3"
     */
    async getQuote(ticker) {
        try {
            const response = await this.brapiApi.get(`/quote/${ticker}`, {
                params: {
                    range: '1d',
                    interval: '1d',
                    fundamental: 'true',
                }
            });

            if (response.data && response.data.results && response.data.results.length > 0) {
                const result = response.data.results[0];
                return {
                    symbol: result.symbol,
                    price: result.regularMarketPrice,
                    changePercent: result.regularMarketChangePercent,
                    logo: result.logourl,
                    name: result.longName || result.shortName,
                    type: result.type, // 'stock', 'fund', etc.
                    updatedAt: new Date(result.regularMarketTime),
                };
            }
            return null;
        } catch (error) {
            console.error(`Error fetching quote for ${ticker}:`, error.message);
            return null;
        }
    }

    /**
     * Get currency rates (USD, EUR) from AwesomeAPI
     */
    async getCurrencyRates() {
        try {
            const response = await this.awesomeApi.get('/USD-BRL,EUR-BRL,BTC-BRL');
            return {
                USD: {
                    price: parseFloat(response.data.USDBRL.bid),
                    change: parseFloat(response.data.USDBRL.pctChange),
                },
                EUR: {
                    price: parseFloat(response.data.EURBRL.bid),
                    change: parseFloat(response.data.EURBRL.pctChange),
                },
                BTC: {
                    price: parseFloat(response.data.BTCBRL.bid),
                    change: parseFloat(response.data.BTCBRL.pctChange),
                }
            };
        } catch (error) {
            console.error('Error fetching currency rates:', error.message);
            return null;
        }
    }

    /**
     * Get official rates (CDI, SELIC, IPCA) from BrasilAPI
     */
    async getOfficialRates() {
        try {
            const [cdi, selic, ipca] = await Promise.all([
                this.brasilApi.get('/taxas/v1/cdi'),
                this.brasilApi.get('/taxas/v1/selic'),
                this.brasilApi.get('/taxas/v1/ipca'),
            ]);

            return {
                cdi: cdi.data.valor, // Annual rate
                selic: selic.data.valor,
                ipca: ipca.data.valor,
            };
        } catch (error) {
            console.error('Error fetching official rates:', error.message);
            return null;
        }
    }

    /**
     * Get crypto prices from CoinGecko
     * @param {string[]} ids e.g., ['bitcoin', 'ethereum']
     */
    async getCryptoPrices(ids = ['bitcoin', 'ethereum']) {
        try {
            const response = await this.coinGeckoApi.get('/simple/price', {
                params: {
                    ids: ids.join(','),
                    vs_currencies: 'brl',
                    include_24hr_change: 'true',
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching crypto prices:', error.message);
            return null;
        }
    }

    /**
     * Get Treasury Direct (Tesouro Direto) rates
     * Note: This uses the official JSON endpoint which might change.
     */
    async getTreasuryRates() {
        try {
            const response = await axios.get('https://www.tesourodireto.com.br/json/br/com/b3/tesourodireto/service/api/treasurybondsinfo.json');
            // The structure of this JSON is complex and changes. 
            // We'll return the raw data or a simplified version if possible.
            // For now, let's return the raw response to be processed by the caller or refined later.
            return response.data.response.TrsrBdTradgList;
        } catch (error) {
            console.error('Error fetching treasury rates:', error.message);
            return null;
        }
    }
}

export default new MarketDataService();
