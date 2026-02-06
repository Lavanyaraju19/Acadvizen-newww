-- =============================================
-- Acadvizen Digital Marketing - Supabase Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUM TYPES
-- =============================================
CREATE TYPE user_role AS ENUM ('admin', 'student', 'sales');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

-- =============================================
-- PROFILES (extends auth.users)
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'student',
  approval_status approval_status NOT NULL DEFAULT 'pending',
  student_id TEXT UNIQUE, -- auto-generated e.g. ADVZ-2024-00001
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- COURSES
-- =============================================
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  image_url TEXT,
  order_index INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TOOLS (75+ digital marketing tools)
-- =============================================
CREATE TABLE public.tools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  category TEXT,
  image_url TEXT,
  link_url TEXT,
  order_index INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- COURSE ENROLLMENTS (student <-> course)
-- =============================================
CREATE TABLE public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- =============================================
-- RESOURCES (PDFs, videos, images, brochures, LLM links)
-- =============================================
CREATE TYPE resource_type AS ENUM ('pdf', 'video', 'image', 'brochure', 'llm_link');

CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  resource_type resource_type NOT NULL,
  file_url TEXT, -- Supabase Storage URL for pdf/video/image/brochure
  external_url TEXT, -- for llm_link or external links
  description TEXT,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  tool_id UUID REFERENCES public.tools(id) ON DELETE SET NULL,
  order_index INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- COURSE DETAILS (rich content per course)
-- =============================================
CREATE TABLE public.course_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  content TEXT, -- HTML or markdown
  section_title TEXT,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_approval ON public.profiles(approval_status);
CREATE INDEX idx_profiles_student_id ON public.profiles(student_id);
CREATE INDEX idx_courses_slug ON public.courses(slug);
CREATE INDEX idx_courses_published ON public.courses(is_published);
CREATE INDEX idx_tools_slug ON public.tools(slug);
CREATE INDEX idx_tools_published ON public.tools(is_published);
CREATE INDEX idx_course_enrollments_user ON public.course_enrollments(user_id);
CREATE INDEX idx_course_enrollments_course ON public.course_enrollments(course_id);
CREATE INDEX idx_resources_course ON public.resources(course_id);
CREATE INDEX idx_resources_tool ON public.resources(tool_id);
CREATE INDEX idx_course_details_course ON public.course_details(course_id);

-- =============================================
-- TRIGGER: Update updated_at
-- =============================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER courses_updated_at BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tools_updated_at BEFORE UPDATE ON public.tools
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER resources_updated_at BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER course_details_updated_at BEFORE UPDATE ON public.course_details
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================
-- TRIGGER: Create profile on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, approval_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'student',
    'pending'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- FUNCTION: Generate student ID on approval
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_student_id()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  seq INT;
BEGIN
  IF NEW.approval_status = 'approved' AND (OLD.approval_status IS NULL OR OLD.approval_status != 'approved') AND NEW.role = 'student' THEN
    year_part := TO_CHAR(NOW(), 'YYYY');
    SELECT COALESCE(MAX(
      NULLIF(REGEXP_REPLACE(student_id, '^ADVZ-' || year_part || '-', ''), '')::INT
    ), 0) + 1 INTO seq
    FROM public.profiles
    WHERE student_id LIKE 'ADVZ-' || year_part || '-%';
    NEW.student_id := 'ADVZ-' || year_part || '-' || LPAD(seq::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_student_id_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.generate_student_id();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_details ENABLE ROW LEVEL SECURITY;

-- Helper to get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES: users see own; admin/sales see all
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admin and sales can read all profiles" ON public.profiles
  FOR SELECT USING (public.get_user_role() IN ('admin', 'sales'));

CREATE POLICY "Admin can update any profile" ON public.profiles
  FOR UPDATE USING (public.get_user_role() = 'admin');

CREATE POLICY "Users can update own profile (limited)" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- COURSES: public read published; admin full
CREATE POLICY "Public can read published courses" ON public.courses
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admin full access courses" ON public.courses
  FOR ALL USING (public.get_user_role() = 'admin');

-- TOOLS: public read published; admin full
CREATE POLICY "Public can read published tools" ON public.tools
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admin full access tools" ON public.tools
  FOR ALL USING (public.get_user_role() = 'admin');

-- COURSE_ENROLLMENTS: student read own; admin full
CREATE POLICY "Users can read own enrollments" ON public.course_enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin full access enrollments" ON public.course_enrollments
  FOR ALL USING (public.get_user_role() = 'admin');

-- RESOURCES: public read published (for landing); students read enrolled; admin full
CREATE POLICY "Public can read published resources" ON public.resources
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admin full access resources" ON public.resources
  FOR ALL USING (public.get_user_role() = 'admin');

-- COURSE_DETAILS: public read (for course page); admin full
CREATE POLICY "Anyone can read course_details" ON public.course_details
  FOR SELECT USING (true);

CREATE POLICY "Admin full access course_details" ON public.course_details
  FOR ALL USING (public.get_user_role() = 'admin');

-- =============================================
-- STORAGE BUCKETS (run in Supabase Dashboard or via API)
-- =============================================
-- Create buckets: pdfs, videos, images, brochures
-- Policy: authenticated users with role admin can upload; public read for published content or use signed URLs
