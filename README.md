# While Dashboard

Bidirectional, real-time sync between Notion calendar databases and Google Calendar.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmcsdevv%2Fwhile-dashboard-template&env=NEXTAUTH_SECRET,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,AUTHORIZED_EMAILS&envDescription=Required%20environment%20variables%20for%20While&envLink=https%3A%2F%2Fwhile.so%2Fdocs%2Fsetup%2Fvercel&project-name=while&repository-name=while)

## Quick Start

1. Click **Deploy with Vercel** above
2. Configure environment variables
3. Complete setup wizard at `/setup`
4. Start syncing!

## Prerequisites

- **Google Cloud Project** with Calendar API enabled ([Guide](https://while.so/docs/setup/google))
- **Notion Integration** ([Guide](https://while.so/docs/setup/notion))
- **Vercel Account** (Redis storage included via Vercel Marketplace)

## Local Development

```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env.local

# Start dev server
pnpm dev
```

## Environment Variables

See `.env.example` for all configuration options.

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `NEXTAUTH_SECRET` | Yes | Session encryption key |
| `AUTHORIZED_EMAILS` | Yes | Allowed email patterns (e.g., `*@company.com`) |

## Documentation

Full documentation: [while.so/docs](https://while.so/docs)

## License

MIT License - see [LICENSE](LICENSE) for details.

---

*This is a standalone deployment template. For the full monorepo with marketing site and development tools, see [github.com/mcsdevv/while](https://github.com/mcsdevv/while).*
