'use client';

import { Firestore, doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { dbService } from './db';

export const SUPPORTED_CURRENCIES = ['USD', 'AED', 'SAR', 'EUR', 'GBP', 'EGP', 'TRY', 'PLN', 'CNY', 'JPY'] as const;
export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number];

export interface ExchangeRates {
  base: 'USD';
  rates: Record<CurrencyCode, number>;
  updatedAt: string;
  source: 'primary' | 'fallback' | 'cache';
}

const PRIMARY_API = 'https://open.er-api.com/v6/latest/USD';
const FALLBACK_API = 'https://api.fxrates.live/v1/rates?base=USD';

/**
 * Service handling live exchange rates and multi-currency conversions.
 */
export const currencyService = {
  /**
   * Fetches latest rates from APIs with timeout and fallback logic.
   */
  fetchLatestRates: async (db: Firestore): Promise<ExchangeRates> => {
    const fetchWithTimeout = async (url: string, timeout = 5000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      return response.json();
    };

    try {
      // 1. Try Primary API
      const data = await fetchWithTimeout(PRIMARY_API);
      if (data.result === 'success' && data.rates) {
        return currencyService.saveRates(db, data.rates, 'primary');
      }
      throw new Error('Primary API failed');
    } catch (e) {
      console.warn('Primary exchange rate API failed, trying fallback...', e);
      try {
        // 2. Try Fallback API
        const data = await fetchWithTimeout(FALLBACK_API);
        if (data.rates) {
          return currencyService.saveRates(db, data.rates, 'fallback');
        }
        throw new Error('Fallback API failed');
      } catch (e2) {
        console.error('All exchange rate APIs failed, using cache.', e2);
        // 3. Use Firestore Cache
        const cached = await currencyService.getCachedRates(db);
        if (cached) return { ...cached, source: 'cache' };
        
        // Final fallback to static defaults if everything fails
        return {
          base: 'USD',
          rates: { USD: 1, AED: 3.67, SAR: 3.75, EUR: 0.92, GBP: 0.79, EGP: 48.0, TRY: 32.0, PLN: 4.0, CNY: 7.2, JPY: 150.0 } as any,
          updatedAt: new Date().toISOString(),
          source: 'cache'
        };
      }
    }
  },

  /**
   * Saves fetched rates to Firestore for persistence.
   */
  saveRates: async (rates: any, source: ExchangeRates['source'], db?: Firestore): Promise<ExchangeRates> => {
    const filteredRates: any = { USD: 1 };
    SUPPORTED_CURRENCIES.forEach(code => {
      if (rates[code]) filteredRates[code] = rates[code];
    });

    const exchangeRates: ExchangeRates = {
      base: 'USD',
      rates: filteredRates,
      updatedAt: new Date().toISOString(),
      source
    };

    if (db) {
      const rateRef = doc(db, 'system_config', 'exchangeRates');
      setDoc(rateRef, exchangeRates, { merge: true });
      
      // Also log to history
      const historyRef = doc(collection(db, 'exchangeRatesHistory'));
      setDoc(historyRef, exchangeRates);
    }

    return exchangeRates;
  },

  /**
   * Retrieves last successful rates from Firestore.
   */
  getCachedRates: async (db: Firestore): Promise<ExchangeRates | null> => {
    const rateRef = doc(db, 'system_config', 'exchangeRates');
    const snap = await getDoc(rateRef);
    return snap.exists() ? snap.data() as ExchangeRates : null;
  },

  /**
   * Converts amount between currencies using provided rates.
   */
  convert: (amount: number, from: CurrencyCode, to: CurrencyCode, rates: Record<string, number>): number => {
    if (from === to) return amount;
    // Standardize to USD first (amount / fromRate) then to target ( * toRate)
    const inUSD = from === 'USD' ? amount : amount / (rates[from] || 1);
    return to === 'USD' ? inUSD : inUSD * (rates[to] || 1);
  },

  /**
   * Formats currency with proper symbol.
   */
  format: (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  }
};
