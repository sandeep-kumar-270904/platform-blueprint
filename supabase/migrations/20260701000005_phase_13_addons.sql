-- Phase 13A: i18n
ALTER TABLE public.profiles 
ADD COLUMN language TEXT NOT NULL DEFAULT 'en',
ADD COLUMN timezone TEXT;

-- Phase 13C: Templates and Invites
ALTER TABLE public.virtual_classroom_invites
ADD COLUMN role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('co-host', 'participant'));

CREATE TABLE public.virtual_classroom_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subject TEXT,
    description TEXT,
    duration_minutes INT NOT NULL DEFAULT 60,
    max_participants INT NOT NULL DEFAULT 50,
    visibility TEXT NOT NULL DEFAULT 'public',
    type TEXT NOT NULL DEFAULT 'interactive',
    is_paid BOOLEAN NOT NULL DEFAULT false,
    price NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.virtual_classroom_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their templates" ON public.virtual_classroom_templates FOR ALL USING (auth.uid() = host_id);

-- Phase 13D: Discovery
ALTER TABLE public.virtual_classrooms
ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE public.virtual_classroom_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    is_platform_curated BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.virtual_classroom_collection_items (
    collection_id UUID NOT NULL REFERENCES public.virtual_classroom_collections(id) ON DELETE CASCADE,
    classroom_id UUID NOT NULL REFERENCES public.virtual_classrooms(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (collection_id, classroom_id)
);

ALTER TABLE public.virtual_classroom_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_classroom_collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view collections" ON public.virtual_classroom_collections FOR SELECT USING (true);
CREATE POLICY "Creators can manage collections" ON public.virtual_classroom_collections FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Anyone can view collection items" ON public.virtual_classroom_collection_items FOR SELECT USING (true);
CREATE POLICY "Creators can manage collection items" ON public.virtual_classroom_collection_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.virtual_classroom_collections c WHERE c.id = collection_id AND c.created_by = auth.uid())
);
