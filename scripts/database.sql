

CREATE TYPE user_role AS ENUM ('buyer','seller','admin');
CREATE TYPE moderation_status AS ENUM ('pending','approved','rejected');
CREATE TYPE promo_scope AS ENUM ('general','product','category','combo');
CREATE TYPE discount_type AS ENUM ('none','percentage','fixed');
CREATE TYPE promo_payment_state AS ENUM ('unpaid','paid','rejected');
CREATE TYPE placement_type AS ENUM ('none','search_boost','featured');


CREATE TABLE auth_users (
  id_AUT uuid PRIMARY KEY
);


CREATE TABLE profiles (
  id_PRF uuid PRIMARY KEY REFERENCES auth_users(id_AUT),
  full_name_PRF varchar NOT NULL,
  phone_number_PRF varchar UNIQUE,
  role_PRF user_role NOT NULL DEFAULT 'buyer',
  is_active_PRF boolean NOT NULL DEFAULT true,
  created_at_PRF timestamptz NOT NULL DEFAULT now(),
  updated_at_PRF timestamptz NOT NULL DEFAULT now()
);


CREATE TABLE locations (
  id_LOC uuid PRIMARY KEY,
  country_LOC varchar,
  province_LOC varchar,
  canton_LOC varchar,
  district_LOC varchar,
  address_LOC varchar,
  latitude_LOC decimal NOT NULL,
  longitude_LOC decimal NOT NULL,
  created_at_LOC timestamptz NOT NULL DEFAULT now()
);


CREATE TABLE business_categories (
  id_BCA uuid PRIMARY KEY,
  name_BCA varchar NOT NULL UNIQUE
);

CREATE TABLE businesses (
  id_BUS uuid PRIMARY KEY,
  owner_id_BUS uuid NOT NULL REFERENCES profiles(id_PRF),
  name_BUS varchar NOT NULL,
  description_BUS text,
  category_id_BUS uuid REFERENCES business_categories(id_BCA),
  location_id_BUS uuid REFERENCES locations(id_LOC),

  whatsapp_phone_BUS varchar,
  contact_phone_BUS varchar,
  contact_email_BUS varchar,
  website_BUS varchar,

  moderation_status_BUS moderation_status NOT NULL DEFAULT 'pending',
  reviewed_by_BUS uuid REFERENCES profiles(id_PRF),
  reviewed_at_BUS timestamptz,
  moderation_note_BUS text,

  is_active_BUS boolean NOT NULL DEFAULT true,
  created_at_BUS timestamptz NOT NULL DEFAULT now(),
  updated_at_BUS timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON businesses (owner_id_BUS);
CREATE INDEX ON businesses (category_id_BUS);
CREATE INDEX ON businesses (moderation_status_BUS);
CREATE INDEX ON businesses (is_active_BUS);


CREATE TABLE business_images (
  id_BIM uuid PRIMARY KEY,
  business_id_BIM uuid NOT NULL REFERENCES businesses(id_BUS),
  bucket_BIM varchar NOT NULL,
  path_BIM varchar NOT NULL,
  sort_order_BIM int NOT NULL DEFAULT 0,
  created_at_BIM timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id_BIM, path_BIM)
);

CREATE INDEX ON business_images (business_id_BIM, sort_order_BIM);


CREATE TABLE business_social_links (
  id_BSL uuid PRIMARY KEY,
  business_id_BSL uuid NOT NULL REFERENCES businesses(id_BUS),
  platform_BSL varchar NOT NULL,
  url_BSL varchar NOT NULL
);

CREATE INDEX ON business_social_links (business_id_BSL);


CREATE TABLE product_categories (
  id_PCA uuid PRIMARY KEY,
  name_PCA varchar NOT NULL UNIQUE
);

CREATE TABLE products (
  id_PRD uuid PRIMARY KEY,
  business_id_PRD uuid NOT NULL REFERENCES businesses(id_BUS),
  name_PRD varchar NOT NULL,
  description_PRD text,
  price_PRD decimal NOT NULL,
  currency_PRD varchar NOT NULL DEFAULT 'CRC',
  is_active_PRD boolean NOT NULL DEFAULT true,
  created_at_PRD timestamptz NOT NULL DEFAULT now(),
  updated_at_PRD timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON products (business_id_PRD);
CREATE INDEX ON products (is_active_PRD);

CREATE TABLE product_images (
  id_PIM uuid PRIMARY KEY,
  product_id_PIM uuid NOT NULL REFERENCES products(id_PRD),
  bucket_PIM varchar NOT NULL,
  path_PIM varchar NOT NULL,
  sort_order_PIM int NOT NULL DEFAULT 0,
  created_at_PIM timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id_PIM, path_PIM)
);

CREATE INDEX ON product_images (product_id_PIM, sort_order_PIM);


CREATE TABLE product_category_map (
  product_id_PCM uuid NOT NULL REFERENCES products(id_PRD),
  category_id_PCM uuid NOT NULL REFERENCES product_categories(id_PCA),
  UNIQUE (product_id_PCM, category_id_PCM)
);

CREATE INDEX ON product_category_map (category_id_PCM);


CREATE TABLE attraction_categories (
  id_ACA uuid PRIMARY KEY,
  name_ACA varchar NOT NULL UNIQUE
);


CREATE TABLE attractions (
  id_ATR uuid PRIMARY KEY,
  submitted_by_ATR uuid NOT NULL REFERENCES profiles(id_PRF),
  name_ATR varchar NOT NULL,
  description_ATR text,
  category_id_ATR uuid REFERENCES attraction_categories(id_ACA),
  location_id_ATR uuid REFERENCES locations(id_LOC),

  moderation_status_ATR moderation_status NOT NULL DEFAULT 'pending',
  reviewed_by_ATR uuid REFERENCES profiles(id_PRF),
  reviewed_at_ATR timestamptz,
  moderation_note_ATR text,

  is_active_ATR boolean NOT NULL DEFAULT true,
  created_at_ATR timestamptz NOT NULL DEFAULT now(),
  updated_at_ATR timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON attractions (submitted_by_ATR);
CREATE INDEX ON attractions (category_id_ATR);
CREATE INDEX ON attractions (moderation_status_ATR);
CREATE INDEX ON attractions (is_active_ATR);


CREATE TABLE attraction_images (
  id_AIM uuid PRIMARY KEY,
  attraction_id_AIM uuid NOT NULL REFERENCES attractions(id_ATR),
  bucket_AIM varchar NOT NULL,
  path_AIM varchar NOT NULL,
  sort_order_AIM int NOT NULL DEFAULT 0,
  created_at_AIM timestamptz NOT NULL DEFAULT now(),
  UNIQUE (attraction_id_AIM, path_AIM)
);

CREATE INDEX ON attraction_images (attraction_id_AIM, sort_order_AIM);


CREATE TABLE promotions (
  id_PRM uuid PRIMARY KEY,
  business_id_PRM uuid NOT NULL REFERENCES businesses(id_BUS),
  created_by_PRM uuid NOT NULL REFERENCES profiles(id_PRF),

  scope_PRM promo_scope NOT NULL,
  title_PRM varchar NOT NULL,
  description_PRM text,

  discount_type_PRM discount_type NOT NULL DEFAULT 'none',
  discount_value_PRM decimal NOT NULL DEFAULT 0,

  start_at_PRM timestamptz NOT NULL,
  end_at_PRM timestamptz NOT NULL,

  placement_PRM placement_type NOT NULL DEFAULT 'none',
  placement_score_PRM int NOT NULL DEFAULT 0,

  moderation_status_PRM moderation_status NOT NULL DEFAULT 'pending',
  reviewed_by_PRM uuid REFERENCES profiles(id_PRF),
  reviewed_at_PRM timestamptz,
  moderation_note_PRM text,

  payment_state_PRM promo_payment_state NOT NULL DEFAULT 'unpaid',
  payment_reference_PRM varchar,
  payment_note_PRM text,

  created_at_PRM timestamptz NOT NULL DEFAULT now(),
  updated_at_PRM timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT promotions_dates_check
    CHECK (start_at_PRM < end_at_PRM),

  CONSTRAINT promotions_discount_logic_check
    CHECK (
      (discount_type_PRM = 'none' AND discount_value_PRM = 0)
      OR
      (discount_type_PRM = 'percentage' AND discount_value_PRM BETWEEN 0 AND 100)
      OR
      (discount_type_PRM = 'fixed' AND discount_value_PRM >= 0)
    ),

  CONSTRAINT promotions_placement_logic_check
    CHECK (
      (placement_PRM = 'none' AND placement_score_PRM = 0)
      OR
      (placement_PRM <> 'none' AND placement_score_PRM >= 0)
    )
);

CREATE INDEX ON promotions (business_id_PRM);
CREATE INDEX ON promotions (scope_PRM);
CREATE INDEX ON promotions (moderation_status_PRM);
CREATE INDEX ON promotions (payment_state_PRM);
CREATE INDEX ON promotions (start_at_PRM, end_at_PRM);
CREATE INDEX ON promotions (placement_PRM, placement_score_PRM);


CREATE TABLE promotion_products (
  promotion_id_PPR uuid NOT NULL REFERENCES promotions(id_PRM),
  product_id_PPR uuid NOT NULL REFERENCES products(id_PRD),
  UNIQUE (promotion_id_PPR, product_id_PPR)
);

CREATE INDEX ON promotion_products (product_id_PPR);

CREATE TABLE promotion_categories (
  promotion_id_PCR uuid NOT NULL REFERENCES promotions(id_PRM),
  category_id_PCR uuid NOT NULL REFERENCES product_categories(id_PCA),
  UNIQUE (promotion_id_PCR, category_id_PCR)
);

CREATE INDEX ON promotion_categories (category_id_PCR);

CREATE TABLE promotion_combo_items (
  id_PCI uuid PRIMARY KEY,
  promotion_id_PCI uuid NOT NULL REFERENCES promotions(id_PRM),
  product_id_PCI uuid NOT NULL REFERENCES products(id_PRD),
  quantity_PCI int NOT NULL DEFAULT 1
);

CREATE INDEX ON promotion_combo_items (promotion_id_PCI);
CREATE INDEX ON promotion_combo_items (product_id_PCI);


CREATE TABLE business_reviews (
  id_BRV uuid PRIMARY KEY,
  business_id_BRV uuid NOT NULL REFERENCES businesses(id_BUS),
  user_id_BRV uuid NOT NULL REFERENCES profiles(id_PRF),
  rating_BRV int NOT NULL CHECK (rating_BRV BETWEEN 1 AND 5),
  comment_BRV text,
  created_at_BRV timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id_BRV, user_id_BRV)
);

CREATE INDEX ON business_reviews (business_id_BRV);

CREATE TABLE product_reviews (
  id_PRV uuid PRIMARY KEY,
  product_id_PRV uuid NOT NULL REFERENCES products(id_PRD),
  user_id_PRV uuid NOT NULL REFERENCES profiles(id_PRF),
  rating_PRV int NOT NULL CHECK (rating_PRV BETWEEN 1 AND 5),
  comment_PRV text,
  created_at_PRV timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id_PRV, user_id_PRV)
);

CREATE INDEX ON product_reviews (product_id_PRV);

CREATE TABLE attraction_reviews (
  id_ARV uuid PRIMARY KEY,
  attraction_id_ARV uuid NOT NULL REFERENCES attractions(id_ATR),
  user_id_ARV uuid NOT NULL REFERENCES profiles(id_PRF),
  rating_ARV int NOT NULL CHECK (rating_ARV BETWEEN 1 AND 5),
  comment_ARV text,
  created_at_ARV timestamptz NOT NULL DEFAULT now(),
  UNIQUE (attraction_id_ARV, user_id_ARV)
);

CREATE INDEX ON attraction_reviews (attraction_id_ARV);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id_PRF,
    full_name_PRF,
    phone_number_PRF,
    role_PRF,
    is_active_PRF,
    created_at_PRF,
    updated_at_PRF
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name_prf',
    NULLIF(NEW.raw_user_meta_data->>'phone_number_prf', ''),
    COALESCE(
      NEW.raw_user_meta_data->>'role_prf',
      'buyer'
    )::user_role,
    true,
    now(),
    now()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

NOTIFY pgrst, 'reload schema';
