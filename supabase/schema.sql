CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  city TEXT NOT NULL,
  locality TEXT,
  phone TEXT,
  language TEXT DEFAULT 'English',
  plan TEXT DEFAULT 'starter',
  website_url TEXT DEFAULT 'https://www.zariyaa.in',
  logo_url TEXT,
  brand_color TEXT DEFAULT '#4A7C6F',
  brand_tone TEXT DEFAULT 'calm, warm, mindful',
  whatsapp_connected BOOLEAN DEFAULT FALSE,
  gmb_connected BOOLEAN DEFAULT FALSE,
  instagram_connected BOOLEAN DEFAULT FALSE,
  facebook_connected BOOLEAN DEFAULT FALSE,
  youtube_connected BOOLEAN DEFAULT FALSE,
  linkedin_connected BOOLEAN DEFAULT FALSE,
  google_ads_connected BOOLEAN DEFAULT FALSE,
  gsc_connected BOOLEAN DEFAULT FALSE,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  monthly_ad_budget INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Channel columns added after initial release (idempotent for existing databases)
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS facebook_connected BOOLEAN DEFAULT FALSE;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS youtube_connected BOOLEAN DEFAULT FALSE;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS linkedin_connected BOOLEAN DEFAULT FALSE;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS google_ads_connected BOOLEAN DEFAULT FALSE;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS gsc_connected BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  email TEXT,
  segment TEXT DEFAULT 'new',
  interest_level TEXT DEFAULT 'warm',
  source TEXT DEFAULT 'manual',
  last_contacted TIMESTAMPTZ,
  total_interactions INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  message_body TEXT NOT NULL,
  segment TEXT DEFAULT 'all',
  status TEXT DEFAULT 'draft',
  campaign_type TEXT DEFAULT 'promotional',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_read INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  action_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  platform TEXT DEFAULT 'google',
  status TEXT DEFAULT 'pending',
  response_draft TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gmb_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  post_text TEXT NOT NULL,
  image_url TEXT,
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmb_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS business_owner_policy ON businesses
  FOR ALL USING (owner_user_id = auth.uid());

CREATE POLICY IF NOT EXISTS contacts_policy ON contacts
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS campaigns_policy ON campaigns
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS chat_policy ON chat_messages
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS reviews_policy ON reviews
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS gmb_policy ON gmb_posts
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_contacts_business ON contacts(business_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_business ON campaigns(business_id);
CREATE INDEX IF NOT EXISTS idx_chat_business ON chat_messages(business_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_business ON reviews(business_id);
