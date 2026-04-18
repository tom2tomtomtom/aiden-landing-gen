import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://briefsharpener.aiden.services';
const AUTH_COOKIE = __ENV.AUTH_COOKIE || '';

export const options = {
  scenarios: {
    ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 5 },
        { duration: '2m', target: 20 },
        { duration: '1m', target: 20 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<15000'],
  },
};

const SAMPLE_BRIEF = `Campaign brief for a hypothetical challenger athletic apparel brand targeting
Gen Z women aged 18 to 25 who train for strength and aesthetic outcomes equally.
The brief should produce a strategic platform, three creative territories, and a
hero campaign idea suitable for a nine month activation across TikTok, Instagram,
out-of-home in six major UK cities, and in-store at two retail partners. Tone is
confident and unapologetic without slipping into bro-energy. Budget is one point
four million pounds media plus production. KPIs are brand search lift against the
challenger set, unaided awareness in the target segment, and quarterly DTC revenue.
Non-negotiables are a founder-led tone of voice and a clearly differentiated visual
system that will not be confused with Gymshark, Alo or Lululemon at a glance.`;

export default function () {
  const res = http.post(
    `${BASE_URL}/api/analyze-brief`,
    JSON.stringify({
      briefText: SAMPLE_BRIEF,
      brandName: 'LoadTest Co',
      industry: 'apparel',
      briefType: 'campaign',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Cookie: AUTH_COOKIE ? `aiden-gw=${AUTH_COOKIE}` : '',
      },
      timeout: '60s',
    }
  );

  check(res, {
    'status is 200 or 402 (tokens)': (r) => r.status === 200 || r.status === 402,
    'not 5xx': (r) => r.status < 500,
    'response has body': (r) => r.body && r.body.length > 0,
  });

  sleep(Math.random() * 3 + 2);
}
