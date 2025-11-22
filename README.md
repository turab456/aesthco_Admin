## Backend Environment Setup

| Script           | Description                                                   | Environment file |
| ---------------- | ------------------------------------------------------------- | ---------------- |
| `npm run local`  | Runs the API with your local Postgres instance.               | `.env.local`     |
| `npm run dev`    | Runs the API against the hosted dev/Supabase DB.              | `.env.dev`       |
| `npm run prod`   | Runs the API with production configuration (placeholders).    | `.env.prod`      |

### Quick Start

```bash
cd backend
npm install

# choose one
npm run local    # local Postgres
npm run dev      # Supabase dev
npm run prod     # production config
```

Each environment file contains the required variables (database, JWT, email, Cloudinary). Update `.env.prod` with real production credentials before deploying.***
