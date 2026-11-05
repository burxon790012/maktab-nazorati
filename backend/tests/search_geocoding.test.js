import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server.js';
import { generateQueryVariants } from '../services/geocodingService.js';

describe('Address & School Search Geocoding Engine Test Suite', () => {
  it('1. should generate smart query variants for "Urganch 30-maktab"', () => {
    const variants = generateQueryVariants('Urganch 30-maktab');
    expect(variants).toContain('Urganch 30-maktab');
    expect(variants).toContain('30-maktab Urganch');
    expect(variants).toContain('30 maktab Urganch');
    expect(variants).toContain('Школа 30 Ургенч');
  });

  it('2. should generate variants for Russian query "Школа 30 Ургенч"', () => {
    const variants = generateQueryVariants('Школа 30 Ургенч');
    expect(variants.some(v => v.includes('30') && v.includes('Urganch'))).toBe(true);
  });

  it('3. should return empty results without error for very short query', async () => {
    const res = await request(app).get('/api/geocode/search?q=a');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.results.length).toBe(0);
  });

  it('4. should handle forward search via server proxy', async () => {
    const res = await request(app).get('/api/geocode/search?q=Urganch%2030-maktab');
    // Either returns 200 with results or 503 if Nominatim is unreachable in test sandbox
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.results)).toBe(true);
    } else {
      expect(res.status).toBe(503);
      expect(res.body.error).toBe('NETWORK_ERROR');
    }
  });
});
