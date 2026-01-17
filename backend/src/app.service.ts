import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getLandingPage() {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>JU-AMS Backend</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Inter", "Segoe UI", system-ui, sans-serif;
        background: linear-gradient(130deg, #eef8ff 0%, #d7edff 45%, #f3fbff 100%);
        color: #0f172a;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: min(5vw, 48px);
      }
      .shell {
        width: min(900px, 100%);
        border-radius: 32px;
        padding: clamp(24px, 5vw, 48px);
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid rgba(148, 163, 184, 0.35);
        box-shadow: 0 25px 80px rgba(15, 23, 42, 0.18);
        backdrop-filter: blur(18px);
      }
      .hero {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }
      .hero h1 {
        font-size: clamp(2rem, 5vw, 3rem);
        margin: 0;
        color: #075985;
      }
      .badge {
        display: inline-flex;
        gap: 0.35rem;
        font-size: 0.75rem;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: #0284c7;
      }
      .pill {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.45rem 1.1rem;
        border-radius: 999px;
        background: rgba(14, 165, 233, 0.12);
        color: #0369a1;
        font-size: 0.9rem;
      }
      .logo-wrap {
        width: clamp(72px, 12vw, 100px);
        height: clamp(72px, 12vw, 100px);
        border-radius: 24px;
        background: #e0f2ff;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 12px 35px rgba(14, 165, 233, 0.25);
        animation: float 6s ease-in-out infinite;
      }
      .logo-wrap svg { width: 70%; height: 70%; }
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }
      .grid {
        margin-top: clamp(28px, 4vw, 40px);
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }
      .panel {
        padding: 1.4rem;
        border-radius: 20px;
        border: 1px solid rgba(14, 165, 233, 0.2);
        background: rgba(248, 250, 252, 0.9);
      }
      .panel h3 {
        margin: 0 0 0.35rem;
        font-size: 1rem;
      }
      .panel p {
        margin: 0;
        color: #1e293b;
        font-size: 0.9rem;
      }
      .endpoints {
        list-style: none;
        padding: 0;
        margin: 1.2rem 0 0;
      }
      .endpoints li {
        font-family: "JetBrains Mono", monospace;
        font-size: 0.88rem;
        margin-bottom: 0.35rem;
      }
      .cta {
        margin-top: clamp(28px, 4vw, 42px);
        display: flex;
        flex-wrap: wrap;
        gap: 0.8rem;
      }
      .cta a {
        padding: 0.8rem 1.6rem;
        border-radius: 999px;
        text-decoration: none;
        font-weight: 600;
        background: linear-gradient(135deg, #0ea5e9, #38bdf8);
        color: white;
        box-shadow: 0 12px 30px rgba(14, 165, 233, 0.25);
      }
      .cta a.secondary {
        background: white;
        color: #0284c7;
        border: 1px solid rgba(14, 165, 233, 0.35);
        box-shadow: none;
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <section class="hero">
        <div>
          <span class="badge">JU Activity Hub</span>
          <h1>Backend Operational & Ready</h1>
          <p class="pill">JU-AMS API · NestJS · Prisma · PostgreSQL</p>
        </div>
        <div class="logo-wrap">
          <svg viewBox="0 0 128 128" aria-label="JU-AMS icon" role="img">
            <defs>
              <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#0ea5e9" />
                <stop offset="100%" stop-color="#1d4ed8" />
              </linearGradient>
              <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#e0f2ff" />
                <stop offset="100%" stop-color="#bae6fd" />
              </linearGradient>
            </defs>
            <rect width="128" height="128" rx="28" fill="url(#bg)" />
            <rect x="16" y="20" width="96" height="88" rx="22" fill="url(#glass)" stroke="#e0f2ff" stroke-width="3" opacity="0.9" />
            <text x="64" y="75" font-family="'Segoe UI', 'Helvetica Neue', Arial, sans-serif" font-size="30" font-weight="700" text-anchor="middle" fill="#0f172a">JU-AMS</text>
          </svg>
        </div>
      </section>
      <section class="grid">
        <article class="panel">
          <h3>API Status</h3>
          <p>Operational · Version 1.0.0</p>
        </article>
        <article class="panel">
          <h3>Authentication</h3>
          <p>JWT Bearer tokens · Clerk + Prisma</p>
        </article>
        <article class="panel">
          <h3>Database</h3>
          <p>PostgreSQL via Prisma Client</p>
        </article>
      </section>
      <div class="cta">
        <a href="/api/auth/login" rel="nofollow">Explore Auth</a>
        <a href="/health" class="secondary" rel="nofollow">Health Check</a>
      </div>
    </main>
  </body>
</html>`;
  }

  getHello() {
    return {
      status: 'ok',
      message: 'JU Activity Hub Backend API',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        users: '/api/users',
        activities: '/api/activities',
        applications: '/api/applications',
        notifications: '/api/notifications',
        attendance: '/api/attendance',
      },
      database: 'connected',
    };
  }
}
