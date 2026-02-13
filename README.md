# Acadvizen Digital Marketing Platform

A complete, production-ready digital marketing education platform built with React, Vite, Tailwind CSS, Framer Motion, and Supabase.

## Features

### Public Website
- **5 Landing Pages**: Home, Tools, Courses, About, Contact
- **Hero Section**: Smooth scrolling slider showcasing 75+ digital marketing tools
- **Tools Page**: Grid view with search and category filters
- **Tool Details**: Individual tool pages with resources
- **Courses Page**: Course catalog with cards
- **Course Details**: Rich course content pages
- **Fully Responsive**: Mobile-first design

### Authentication
- User registration with email verification
- Login/logout
- Forgot password via email
- Role-based access control (admin, student, sales)

### Student Dashboard
- View enrolled courses
- Access to 75+ digital marketing tools
- Download PDFs, videos, images, brochures
- Access LLM links
- Auto-generated student ID (e.g., ADVZ-2024-00001)

### Admin Dashboard (`/admin`)
- **Courses Management**: Full CRUD operations
- **Tools Management**: Add/edit/delete 75+ tools
- **Resources Management**: Upload PDFs, videos, images, brochures, LLM links
- **Course Details**: Manage rich course content
- **Student Approval**: Approve/reject students with email notifications
- **File Uploads**: Direct upload to Supabase Storage

### Sales Team View (`/sales`)
- Excel-like table of all registered users
- Search and filter by role/status
- View-only access

## Tech Stack

- **Frontend**: Vite + React 18
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Backend**: Supabase (Auth, Database, Storage, RLS)
- **Routing**: React Router v6

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)

## Setup Instructions

### 1. Clone and Install

```bash
cd acadvizen-new
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema from `supabase/schema.sql`
3. Go to **Storage** and create these buckets:
   - `pdfs` (public read, authenticated admin write)
   - `videos` (public read, authenticated admin write)
   - `images` (public read, authenticated admin write)
   - `brochures` (public read, authenticated admin write)
4. Go to **Settings > API** and copy:
   - Project URL
   - `anon` public key

### 3. Configure Environment Variables

Create a `.env` file in the root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Add Logo

Place your logo file as `public/logo.png`. The logo should be:
- PNG format
- Transparent background (optional)
- Recommended size: 200x200px or larger

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 6. Create First Admin User

1. Register a new account via `/register`
2. Go to Supabase Dashboard > **Table Editor** > `profiles`
3. Find your user and update:
   - `role` = `admin`
   - `approval_status` = `approved`
4. Log in and access `/admin`

## Production Build

```bash
npm run build
```

The `dist` folder contains the production-ready files. Deploy to:
- Vercel
- Netlify
- Cloudflare Pages
- Any static hosting service

## Database Schema

The schema includes:
- `profiles` - User profiles with roles and approval status
- `courses` - Course catalog
- `tools` - Digital marketing tools (75+)
- `course_enrollments` - Student-course relationships
- `resources` - PDFs, videos, images, brochures, LLM links
- `course_details` - Rich course content sections

All tables have Row Level Security (RLS) enabled with proper policies.

## Email Notifications

The student approval flow includes email notification placeholders. To enable:

1. Set up Supabase Edge Function for email sending (Resend, SendGrid, etc.)
2. Update `src/pages/admin/StudentsAdmin.jsx` to call the Edge Function
3. Or integrate directly with an email service API

## Project Structure

```
acadvizen-new/
├── public/
│   └── logo.png          # Your logo (add this)
├── src/
│   ├── components/       # Reusable components
│   ├── contexts/         # Auth context
│   ├── lib/              # Supabase client
│   ├── pages/            # Page components
│   │   ├── admin/        # Admin dashboard pages
│   │   ├── dashboard/    # Student dashboard
│   │   └── sales/        # Sales view
│   └── App.jsx           # Main app with routes
├── supabase/
│   └── schema.sql        # Database schema
├── .env.example          # Environment template
└── package.json
```

## Features in Detail

### Hero Slider
- Automatically displays tools in groups of 6
- Smooth transitions every 4 seconds
- Manual navigation dots
- Responsive grid layout

### Admin CRUD
- Add/Edit/Delete for all entities
- File uploads to Supabase Storage
- Slug auto-generation
- Order indexing for sorting

### Student Approval
- Pending → Approved workflow
- Auto-generates student ID on approval
- Email notification (integrate with service)
- Role assignment

## Security

- Row Level Security (RLS) on all tables
- Admin-only write access
- Public read for published content
- Protected routes for authenticated pages
- Role-based UI visibility

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Proprietary - Acadvizen Digital Marketing

## Support

For issues or questions, contact the development team.

---

**Built with ❤️ for Acadvizen**
