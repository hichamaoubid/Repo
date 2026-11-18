import { Coordinates, Qibla } from 'adhan';
import { alignmentState, KAABA, qiblaBearing } from '..';

const CITIES: [string, number, number][] = [
  ['Paris', 48.8566, 2.3522], ['Lyon', 45.764, 4.8357], ['London', 51.5074, -0.1278],
  ['New York', 40.7128, -74.006], ['Washington DC', 38.9072, -77.0369], ['San Francisco', 37.7749, -122.4194],
  ['Toronto', 43.6532, -79.3832], ['Casablanca', 33.5731, -7.5898], ['Cairo', 30.0444, 31.2357],
  ['Istanbul', 41.0082, 28.9784], ['Karachi', 24.8607, 67.0011], ['Jakarta', -6.2088, 106.8456],
  ['Kuala Lumpur', 3.139, 101.6869], ['Sydney', -33.8688, 151.2093], ['Tokyo', 35.6762, 139.6503],
  ['Oslo', 59.9139, 10.7522], ['Cape Town', -33.9249, 18.4241], ['Buenos Aires', -34.6037, -58.3816],
  ['Anchorage', 61.2181, -149.9003], ['Medina', 24.5247, 39.5692],
];

describe('qiblaBearing', () => {
  it.each(CITIES)('%s agrees with the adhan reference implementation within ±0.5°', (_n, lat, lng) => {
    const ours = qiblaBearing({ latitude: lat, longitude: lng });
    const ref = Qibla(new Coordinates(lat, lng));
    const diff = Math.abs(((ours - ref + 540) % 360) - 180);
    expect(diff).toBeLessThanOrEqual(0.5);
  });

  it.each([
    // Hand-checked great-circle values (degrees from true north)
    ['New York', 40.7128, -74.006, 58.48],
    ['London', 51.5074, -0.1278, 118.99],
    ['Jakarta', -6.2088, 106.8456, 295.15],
  ])('%s is %s° (published value) within ±0.5°', (_n, lat, lng, expected) => {
    expect(Math.abs(qiblaBearing({ latitude: lat, longitude: lng }) - expected)).toBeLessThanOrEqual(0.5);
  });

  it('returns a bearing in [0, 360)', () => {
    for (const [, lat, lng] of CITIES) {
      const b = qiblaBearing({ latitude: lat, longitude: lng });
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThan(360);
    }
  });

  it('is undefined at the Kaaba itself', () => {
    expect(() => qiblaBearing(KAABA)).toThrow(/kaaba/i);
  });
});

describe('alignmentState', () => {
  it('is aligned within ±3° and handles wrap-around at north', () => {
    expect(alignmentState(358, 1)).toEqual({ aligned: true, turnDegrees: 3 });
    expect(alignmentState(119, 119.5).aligned).toBe(true);
  });

  it('gives the shortest signed turn (positive = clockwise)', () => {
    expect(alignmentState(100, 119)).toEqual({ aligned: false, turnDegrees: 19 });
    expect(alignmentState(10, 350)).toEqual({ aligned: false, turnDegrees: -20 });
  });

  it('asks for calibration when heading accuracy is worse than 15°', () => {
    expect(alignmentState(100, 119, 20)).toEqual({ aligned: false, turnDegrees: 19, needsCalibration: true });
  });
});
