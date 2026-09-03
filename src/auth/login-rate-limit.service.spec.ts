import { LoginRateLimitService } from './login-rate-limit.service';

describe('LoginRateLimitService', () => {
  it('blocks an address after five failed attempts', () => {
    const service = new LoginRateLimitService();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      service.recordFailure('127.0.0.1');
    }

    expect(() => service.assertAllowed('127.0.0.1')).toThrow(
      'Слишком много попыток входа',
    );
  });

  it('clears failures after a successful login', () => {
    const service = new LoginRateLimitService();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      service.recordFailure('127.0.0.1');
    }
    service.reset('127.0.0.1');

    expect(() => service.assertAllowed('127.0.0.1')).not.toThrow();
  });
});
