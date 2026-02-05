# Meeting Alert

A SaaS application that monitors Google Meet meetings and sends real-time notifications when participants join.

## Overview

Meeting Alert integrates with Google Calendar to track your upcoming meetings and monitors Google Meet sessions to notify you immediately when participants join. Perfect for professionals who want to be alerted when important attendees arrive.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase
- **Payment Processing**: Stripe
- **Email Notifications**: Resend
- **Calendar Integration**: Google Calendar API
- **Additional Libraries**:
  - `date-fns` - Date manipulation
  - `lucide-react` - Icon system
  - `zod` - Schema validation

## Project Structure

```
meeting-alert/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   └── lib/
│       ├── supabase/     # Supabase client & utilities
│       ├── google/       # Google Calendar & Meet API integration
│       ├── stripe/       # Stripe payment processing
│       └── notifications/ # Notification system (email, etc.)
├── .env.local            # Environment variables (not committed)
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account
- Google Cloud project with Calendar API enabled
- Stripe account
- Resend account

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd meeting-alert
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Copy `.env.local` and fill in your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Google OAuth & API
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_PRICE_ID=your_stripe_price_id_here

# Resend
RESEND_API_KEY=your_resend_api_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Configuration Steps

#### 1. Supabase Setup
- Create a new project at [supabase.com](https://supabase.com)
- Copy your project URL and anon key from Settings > API
- Copy your service role key (keep this secure!)

#### 2. Google Cloud Setup
- Go to [Google Cloud Console](https://console.cloud.google.com)
- Create a new project or select existing
- Enable Google Calendar API
- Create OAuth 2.0 credentials (Web application)
- Add authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
- Copy Client ID and Client Secret

#### 3. Stripe Setup
- Create account at [stripe.com](https://stripe.com)
- Get API keys from Developers > API keys
- Create a product and price
- Copy the Price ID
- Set up webhook endpoint at `/api/webhooks/stripe`

#### 4. Resend Setup
- Create account at [resend.com](https://resend.com)
- Generate an API key
- Verify your domain (optional, for production)

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features (To Be Implemented)

- User authentication with Supabase
- Google Calendar integration
- Google Meet monitoring
- Real-time participant join notifications
- Email notifications via Resend
- Subscription management with Stripe
- Dashboard for managing meetings and alerts
- Meeting history and analytics

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Style

This project uses:
- TypeScript for type safety
- ESLint for code linting
- Tailwind CSS for styling

## Deployment

The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add all environment variables
4. Deploy

Remember to update `NEXT_PUBLIC_APP_URL` to your production URL.

## License

[Your chosen license]

## Contributing

[Your contribution guidelines]
