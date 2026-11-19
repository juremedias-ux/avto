import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE SCHEMA IF NOT EXISTS "cms";
   CREATE TYPE "cms"."enum_clanki_zahtevnost" AS ENUM('zacetnik', 'srednje', 'napredno');
  CREATE TYPE "cms"."enum_clanki_status" AS ENUM('draft', 'published');
  CREATE TYPE "cms"."enum__clanki_v_version_zahtevnost" AS ENUM('zacetnik', 'srednje', 'napredno');
  CREATE TYPE "cms"."enum__clanki_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "cms"."enum_videi_vir" AS ENUM('youtube', 'datoteka', 'ni');
  CREATE TYPE "cms"."enum_videi_zahtevnost" AS ENUM('zacetnik', 'srednje', 'napredno');
  CREATE TYPE "cms"."enum_videi_status" AS ENUM('draft', 'published');
  CREATE TYPE "cms"."enum__videi_v_version_vir" AS ENUM('youtube', 'datoteka', 'ni');
  CREATE TYPE "cms"."enum__videi_v_version_zahtevnost" AS ENUM('zacetnik', 'srednje', 'napredno');
  CREATE TYPE "cms"."enum__videi_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "cms"."enum_ucne_poti_status" AS ENUM('draft', 'published');
  CREATE TYPE "cms"."enum__ucne_poti_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "cms"."enum_izdelki_zahtevnost_vgradnje" AS ENUM('preprosta', 'srednja', 'strokovna');
  CREATE TYPE "cms"."enum_izdelki_stanje" AS ENUM('na-zalogi', 'predprodaja', 'na-povprasevanje', 'kmalu');
  CREATE TYPE "cms"."enum_izdelki_status" AS ENUM('draft', 'published');
  CREATE TYPE "cms"."enum__izdelki_v_version_zahtevnost_vgradnje" AS ENUM('preprosta', 'srednja', 'strokovna');
  CREATE TYPE "cms"."enum__izdelki_v_version_stanje" AS ENUM('na-zalogi', 'predprodaja', 'na-povprasevanje', 'kmalu');
  CREATE TYPE "cms"."enum__izdelki_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "cms"."enum_povprasevanja_vrsta" AS ENUM('povprasevanje', 'vprasanje', 'rezervacija');
  CREATE TYPE "cms"."enum_povprasevanja_stanje" AS ENUM('nova', 'v-obdelavi', 'zakljuceno');
  CREATE TABLE "cms"."clanki_kljucni_poudarki" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"besedilo" varchar
  );
  
  CREATE TABLE "cms"."clanki" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"naslov" varchar,
  	"slug" varchar,
  	"povzetek" varchar,
  	"naslovna_slika_id" integer,
  	"cas_branja" numeric,
  	"zahtevnost" "cms"."enum_clanki_zahtevnost" DEFAULT 'zacetnik',
  	"faza_id" integer,
  	"vsebina" jsonb,
  	"varnostna_opomba" varchar,
  	"vzorec" boolean DEFAULT false,
  	"seo_naslov" varchar,
  	"seo_opis" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "cms"."enum_clanki_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "cms"."clanki_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"teme_id" integer,
  	"datoteke_id" integer,
  	"izdelki_id" integer,
  	"clanki_id" integer,
  	"videi_id" integer
  );
  
  CREATE TABLE "cms"."_clanki_v_version_kljucni_poudarki" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"besedilo" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "cms"."_clanki_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_naslov" varchar,
  	"version_slug" varchar,
  	"version_povzetek" varchar,
  	"version_naslovna_slika_id" integer,
  	"version_cas_branja" numeric,
  	"version_zahtevnost" "cms"."enum__clanki_v_version_zahtevnost" DEFAULT 'zacetnik',
  	"version_faza_id" integer,
  	"version_vsebina" jsonb,
  	"version_varnostna_opomba" varchar,
  	"version_vzorec" boolean DEFAULT false,
  	"version_seo_naslov" varchar,
  	"version_seo_opis" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "cms"."enum__clanki_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "cms"."_clanki_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"teme_id" integer,
  	"datoteke_id" integer,
  	"izdelki_id" integer,
  	"clanki_id" integer,
  	"videi_id" integer
  );
  
  CREATE TABLE "cms"."videi_poglavja" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"cas" varchar,
  	"naslov" varchar
  );
  
  CREATE TABLE "cms"."videi_kljucni_poudarki" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"besedilo" varchar
  );
  
  CREATE TABLE "cms"."videi" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"naslov" varchar,
  	"slug" varchar,
  	"povzetek" varchar,
  	"vir" "cms"."enum_videi_vir" DEFAULT 'youtube',
  	"youtube" varchar,
  	"datoteka_id" integer,
  	"podnapisi_id" integer,
  	"poster_id" integer,
  	"trajanje" numeric,
  	"zahtevnost" "cms"."enum_videi_zahtevnost" DEFAULT 'zacetnik',
  	"faza_id" integer,
  	"opis" jsonb,
  	"prepis" varchar,
  	"varnostna_opomba" varchar,
  	"vzorec" boolean DEFAULT false,
  	"seo_naslov" varchar,
  	"seo_opis" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "cms"."enum_videi_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "cms"."videi_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"teme_id" integer,
  	"datoteke_id" integer,
  	"izdelki_id" integer,
  	"clanki_id" integer,
  	"videi_id" integer
  );
  
  CREATE TABLE "cms"."_videi_v_version_poglavja" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"cas" varchar,
  	"naslov" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "cms"."_videi_v_version_kljucni_poudarki" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"besedilo" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "cms"."_videi_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_naslov" varchar,
  	"version_slug" varchar,
  	"version_povzetek" varchar,
  	"version_vir" "cms"."enum__videi_v_version_vir" DEFAULT 'youtube',
  	"version_youtube" varchar,
  	"version_datoteka_id" integer,
  	"version_podnapisi_id" integer,
  	"version_poster_id" integer,
  	"version_trajanje" numeric,
  	"version_zahtevnost" "cms"."enum__videi_v_version_zahtevnost" DEFAULT 'zacetnik',
  	"version_faza_id" integer,
  	"version_opis" jsonb,
  	"version_prepis" varchar,
  	"version_varnostna_opomba" varchar,
  	"version_vzorec" boolean DEFAULT false,
  	"version_seo_naslov" varchar,
  	"version_seo_opis" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "cms"."enum__videi_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "cms"."_videi_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"teme_id" integer,
  	"datoteke_id" integer,
  	"izdelki_id" integer,
  	"clanki_id" integer,
  	"videi_id" integer
  );
  
  CREATE TABLE "cms"."ucne_poti_koraki" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"opomba" varchar
  );
  
  CREATE TABLE "cms"."ucne_poti" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"naslov" varchar,
  	"slug" varchar,
  	"opis" varchar,
  	"za_koga" varchar,
  	"izpostavljena" boolean DEFAULT false,
  	"vzorec" boolean DEFAULT false,
  	"seo_naslov" varchar,
  	"seo_opis" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "cms"."enum_ucne_poti_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "cms"."ucne_poti_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"clanki_id" integer,
  	"videi_id" integer
  );
  
  CREATE TABLE "cms"."_ucne_poti_v_version_koraki" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"opomba" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "cms"."_ucne_poti_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_naslov" varchar,
  	"version_slug" varchar,
  	"version_opis" varchar,
  	"version_za_koga" varchar,
  	"version_izpostavljena" boolean DEFAULT false,
  	"version_vzorec" boolean DEFAULT false,
  	"version_seo_naslov" varchar,
  	"version_seo_opis" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "cms"."enum__ucne_poti_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "cms"."_ucne_poti_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"clanki_id" integer,
  	"videi_id" integer
  );
  
  CREATE TABLE "cms"."izdelki_tehnicni_podatki" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"lastnost" varchar,
  	"vrednost" varchar
  );
  
  CREATE TABLE "cms"."izdelki_primeri_uporabe" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"besedilo" varchar
  );
  
  CREATE TABLE "cms"."izdelki_pogosta_vprasanja" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"vprasanje" varchar,
  	"odgovor" varchar
  );
  
  CREATE TABLE "cms"."izdelki" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"naziv" varchar,
  	"slug" varchar,
  	"kategorija_id" integer,
  	"kratek_opis" varchar,
  	"opis" jsonb,
  	"zdruzljivost" varchar,
  	"zahtevnost_vgradnje" "cms"."enum_izdelki_zahtevnost_vgradnje" DEFAULT 'srednja',
  	"stanje" "cms"."enum_izdelki_stanje" DEFAULT 'na-povprasevanje',
  	"cena" numeric,
  	"vzorec" boolean DEFAULT false,
  	"seo_naslov" varchar,
  	"seo_opis" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "cms"."enum_izdelki_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "cms"."izdelki_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"faze_id" integer,
  	"mediji_id" integer,
  	"clanki_id" integer,
  	"videi_id" integer
  );
  
  CREATE TABLE "cms"."_izdelki_v_version_tehnicni_podatki" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"lastnost" varchar,
  	"vrednost" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "cms"."_izdelki_v_version_primeri_uporabe" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"besedilo" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "cms"."_izdelki_v_version_pogosta_vprasanja" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"vprasanje" varchar,
  	"odgovor" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "cms"."_izdelki_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_naziv" varchar,
  	"version_slug" varchar,
  	"version_kategorija_id" integer,
  	"version_kratek_opis" varchar,
  	"version_opis" jsonb,
  	"version_zdruzljivost" varchar,
  	"version_zahtevnost_vgradnje" "cms"."enum__izdelki_v_version_zahtevnost_vgradnje" DEFAULT 'srednja',
  	"version_stanje" "cms"."enum__izdelki_v_version_stanje" DEFAULT 'na-povprasevanje',
  	"version_cena" numeric,
  	"version_vzorec" boolean DEFAULT false,
  	"version_seo_naslov" varchar,
  	"version_seo_opis" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "cms"."enum__izdelki_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "cms"."_izdelki_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"faze_id" integer,
  	"mediji_id" integer,
  	"clanki_id" integer,
  	"videi_id" integer
  );
  
  CREATE TABLE "cms"."kategorije_izdelkov" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"naziv" varchar NOT NULL,
  	"slug" varchar,
  	"opis" varchar,
  	"slika_id" integer,
  	"vodic_id" integer,
  	"vrstni_red" numeric DEFAULT 10,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cms"."povprasevanja_izdelki" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"izdelek_id" integer,
  	"naziv" varchar,
  	"kolicina" numeric DEFAULT 1
  );
  
  CREATE TABLE "cms"."povprasevanja" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"vrsta" "cms"."enum_povprasevanja_vrsta" DEFAULT 'povprasevanje' NOT NULL,
  	"ime" varchar,
  	"email" varchar NOT NULL,
  	"sporocilo" varchar,
  	"stanje" "cms"."enum_povprasevanja_stanje" DEFAULT 'nova' NOT NULL,
  	"besedilo_obvestila" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cms"."faze_cilji" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"besedilo" varchar NOT NULL
  );
  
  CREATE TABLE "cms"."faze" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"naziv" varchar NOT NULL,
  	"slug" varchar,
  	"stevilka" numeric NOT NULL,
  	"kratek_opis" varchar NOT NULL,
  	"opis" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cms"."teme" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"naziv" varchar NOT NULL,
  	"slug" varchar,
  	"opis" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cms"."mediji" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"avtorstvo" varchar,
  	"prefix" varchar DEFAULT '',
  	"_objectkey" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "cms"."video_datoteke" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"naslov" varchar NOT NULL,
  	"prefix" varchar DEFAULT '',
  	"_objectkey" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "cms"."datoteke" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"naslov" varchar NOT NULL,
  	"opis" varchar,
  	"prefix" varchar DEFAULT '',
  	"_objectkey" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "cms"."uredniki_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "cms"."uredniki" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ime" varchar,
  	"nastavitveni_zeton" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "cms"."payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "cms"."payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cms"."payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"clanki_id" integer,
  	"videi_id" integer,
  	"ucne_poti_id" integer,
  	"izdelki_id" integer,
  	"kategorije_izdelkov_id" integer,
  	"povprasevanja_id" integer,
  	"faze_id" integer,
  	"teme_id" integer,
  	"mediji_id" integer,
  	"video_datoteke_id" integer,
  	"datoteke_id" integer,
  	"uredniki_id" integer
  );
  
  CREATE TABLE "cms"."payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cms"."payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"uredniki_id" integer
  );
  
  CREATE TABLE "cms"."payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cms"."domaca_stran_zaupanje" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"naslov" varchar NOT NULL,
  	"besedilo" varchar NOT NULL
  );
  
  CREATE TABLE "cms"."domaca_stran" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"prvi_zaslon_oznaka" varchar,
  	"prvi_zaslon_naslov" varchar NOT NULL,
  	"prvi_zaslon_podnaslov" varchar NOT NULL,
  	"prvi_zaslon_slika_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "cms"."domaca_stran_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"clanki_id" integer,
  	"videi_id" integer,
  	"kategorije_izdelkov_id" integer
  );
  
  CREATE TABLE "cms"."o_nas" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"naslov" varchar NOT NULL,
  	"uvod" varchar,
  	"vsebina" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "cms"."clanki_kljucni_poudarki" ADD CONSTRAINT "clanki_kljucni_poudarki_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."clanki"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."clanki" ADD CONSTRAINT "clanki_naslovna_slika_id_mediji_id_fk" FOREIGN KEY ("naslovna_slika_id") REFERENCES "cms"."mediji"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."clanki" ADD CONSTRAINT "clanki_faza_id_faze_id_fk" FOREIGN KEY ("faza_id") REFERENCES "cms"."faze"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."clanki_rels" ADD CONSTRAINT "clanki_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."clanki"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."clanki_rels" ADD CONSTRAINT "clanki_rels_teme_fk" FOREIGN KEY ("teme_id") REFERENCES "cms"."teme"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."clanki_rels" ADD CONSTRAINT "clanki_rels_datoteke_fk" FOREIGN KEY ("datoteke_id") REFERENCES "cms"."datoteke"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."clanki_rels" ADD CONSTRAINT "clanki_rels_izdelki_fk" FOREIGN KEY ("izdelki_id") REFERENCES "cms"."izdelki"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."clanki_rels" ADD CONSTRAINT "clanki_rels_clanki_fk" FOREIGN KEY ("clanki_id") REFERENCES "cms"."clanki"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."clanki_rels" ADD CONSTRAINT "clanki_rels_videi_fk" FOREIGN KEY ("videi_id") REFERENCES "cms"."videi"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_clanki_v_version_kljucni_poudarki" ADD CONSTRAINT "_clanki_v_version_kljucni_poudarki_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_clanki_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_clanki_v" ADD CONSTRAINT "_clanki_v_parent_id_clanki_id_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."clanki"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_clanki_v" ADD CONSTRAINT "_clanki_v_version_naslovna_slika_id_mediji_id_fk" FOREIGN KEY ("version_naslovna_slika_id") REFERENCES "cms"."mediji"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_clanki_v" ADD CONSTRAINT "_clanki_v_version_faza_id_faze_id_fk" FOREIGN KEY ("version_faza_id") REFERENCES "cms"."faze"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_clanki_v_rels" ADD CONSTRAINT "_clanki_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."_clanki_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_clanki_v_rels" ADD CONSTRAINT "_clanki_v_rels_teme_fk" FOREIGN KEY ("teme_id") REFERENCES "cms"."teme"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_clanki_v_rels" ADD CONSTRAINT "_clanki_v_rels_datoteke_fk" FOREIGN KEY ("datoteke_id") REFERENCES "cms"."datoteke"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_clanki_v_rels" ADD CONSTRAINT "_clanki_v_rels_izdelki_fk" FOREIGN KEY ("izdelki_id") REFERENCES "cms"."izdelki"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_clanki_v_rels" ADD CONSTRAINT "_clanki_v_rels_clanki_fk" FOREIGN KEY ("clanki_id") REFERENCES "cms"."clanki"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_clanki_v_rels" ADD CONSTRAINT "_clanki_v_rels_videi_fk" FOREIGN KEY ("videi_id") REFERENCES "cms"."videi"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."videi_poglavja" ADD CONSTRAINT "videi_poglavja_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."videi"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."videi_kljucni_poudarki" ADD CONSTRAINT "videi_kljucni_poudarki_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."videi"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."videi" ADD CONSTRAINT "videi_datoteka_id_video_datoteke_id_fk" FOREIGN KEY ("datoteka_id") REFERENCES "cms"."video_datoteke"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."videi" ADD CONSTRAINT "videi_podnapisi_id_datoteke_id_fk" FOREIGN KEY ("podnapisi_id") REFERENCES "cms"."datoteke"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."videi" ADD CONSTRAINT "videi_poster_id_mediji_id_fk" FOREIGN KEY ("poster_id") REFERENCES "cms"."mediji"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."videi" ADD CONSTRAINT "videi_faza_id_faze_id_fk" FOREIGN KEY ("faza_id") REFERENCES "cms"."faze"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."videi_rels" ADD CONSTRAINT "videi_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."videi"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."videi_rels" ADD CONSTRAINT "videi_rels_teme_fk" FOREIGN KEY ("teme_id") REFERENCES "cms"."teme"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."videi_rels" ADD CONSTRAINT "videi_rels_datoteke_fk" FOREIGN KEY ("datoteke_id") REFERENCES "cms"."datoteke"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."videi_rels" ADD CONSTRAINT "videi_rels_izdelki_fk" FOREIGN KEY ("izdelki_id") REFERENCES "cms"."izdelki"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."videi_rels" ADD CONSTRAINT "videi_rels_clanki_fk" FOREIGN KEY ("clanki_id") REFERENCES "cms"."clanki"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."videi_rels" ADD CONSTRAINT "videi_rels_videi_fk" FOREIGN KEY ("videi_id") REFERENCES "cms"."videi"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_videi_v_version_poglavja" ADD CONSTRAINT "_videi_v_version_poglavja_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_videi_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_videi_v_version_kljucni_poudarki" ADD CONSTRAINT "_videi_v_version_kljucni_poudarki_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_videi_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_videi_v" ADD CONSTRAINT "_videi_v_parent_id_videi_id_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."videi"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_videi_v" ADD CONSTRAINT "_videi_v_version_datoteka_id_video_datoteke_id_fk" FOREIGN KEY ("version_datoteka_id") REFERENCES "cms"."video_datoteke"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_videi_v" ADD CONSTRAINT "_videi_v_version_podnapisi_id_datoteke_id_fk" FOREIGN KEY ("version_podnapisi_id") REFERENCES "cms"."datoteke"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_videi_v" ADD CONSTRAINT "_videi_v_version_poster_id_mediji_id_fk" FOREIGN KEY ("version_poster_id") REFERENCES "cms"."mediji"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_videi_v" ADD CONSTRAINT "_videi_v_version_faza_id_faze_id_fk" FOREIGN KEY ("version_faza_id") REFERENCES "cms"."faze"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_videi_v_rels" ADD CONSTRAINT "_videi_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."_videi_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_videi_v_rels" ADD CONSTRAINT "_videi_v_rels_teme_fk" FOREIGN KEY ("teme_id") REFERENCES "cms"."teme"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_videi_v_rels" ADD CONSTRAINT "_videi_v_rels_datoteke_fk" FOREIGN KEY ("datoteke_id") REFERENCES "cms"."datoteke"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_videi_v_rels" ADD CONSTRAINT "_videi_v_rels_izdelki_fk" FOREIGN KEY ("izdelki_id") REFERENCES "cms"."izdelki"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_videi_v_rels" ADD CONSTRAINT "_videi_v_rels_clanki_fk" FOREIGN KEY ("clanki_id") REFERENCES "cms"."clanki"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_videi_v_rels" ADD CONSTRAINT "_videi_v_rels_videi_fk" FOREIGN KEY ("videi_id") REFERENCES "cms"."videi"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."ucne_poti_koraki" ADD CONSTRAINT "ucne_poti_koraki_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."ucne_poti"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."ucne_poti_rels" ADD CONSTRAINT "ucne_poti_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."ucne_poti"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."ucne_poti_rels" ADD CONSTRAINT "ucne_poti_rels_clanki_fk" FOREIGN KEY ("clanki_id") REFERENCES "cms"."clanki"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."ucne_poti_rels" ADD CONSTRAINT "ucne_poti_rels_videi_fk" FOREIGN KEY ("videi_id") REFERENCES "cms"."videi"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_ucne_poti_v_version_koraki" ADD CONSTRAINT "_ucne_poti_v_version_koraki_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_ucne_poti_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_ucne_poti_v" ADD CONSTRAINT "_ucne_poti_v_parent_id_ucne_poti_id_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."ucne_poti"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_ucne_poti_v_rels" ADD CONSTRAINT "_ucne_poti_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."_ucne_poti_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_ucne_poti_v_rels" ADD CONSTRAINT "_ucne_poti_v_rels_clanki_fk" FOREIGN KEY ("clanki_id") REFERENCES "cms"."clanki"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_ucne_poti_v_rels" ADD CONSTRAINT "_ucne_poti_v_rels_videi_fk" FOREIGN KEY ("videi_id") REFERENCES "cms"."videi"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."izdelki_tehnicni_podatki" ADD CONSTRAINT "izdelki_tehnicni_podatki_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."izdelki"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."izdelki_primeri_uporabe" ADD CONSTRAINT "izdelki_primeri_uporabe_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."izdelki"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."izdelki_pogosta_vprasanja" ADD CONSTRAINT "izdelki_pogosta_vprasanja_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."izdelki"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."izdelki" ADD CONSTRAINT "izdelki_kategorija_id_kategorije_izdelkov_id_fk" FOREIGN KEY ("kategorija_id") REFERENCES "cms"."kategorije_izdelkov"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."izdelki_rels" ADD CONSTRAINT "izdelki_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."izdelki"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."izdelki_rels" ADD CONSTRAINT "izdelki_rels_faze_fk" FOREIGN KEY ("faze_id") REFERENCES "cms"."faze"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."izdelki_rels" ADD CONSTRAINT "izdelki_rels_mediji_fk" FOREIGN KEY ("mediji_id") REFERENCES "cms"."mediji"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."izdelki_rels" ADD CONSTRAINT "izdelki_rels_clanki_fk" FOREIGN KEY ("clanki_id") REFERENCES "cms"."clanki"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."izdelki_rels" ADD CONSTRAINT "izdelki_rels_videi_fk" FOREIGN KEY ("videi_id") REFERENCES "cms"."videi"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_izdelki_v_version_tehnicni_podatki" ADD CONSTRAINT "_izdelki_v_version_tehnicni_podatki_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_izdelki_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_izdelki_v_version_primeri_uporabe" ADD CONSTRAINT "_izdelki_v_version_primeri_uporabe_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_izdelki_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_izdelki_v_version_pogosta_vprasanja" ADD CONSTRAINT "_izdelki_v_version_pogosta_vprasanja_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_izdelki_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_izdelki_v" ADD CONSTRAINT "_izdelki_v_parent_id_izdelki_id_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."izdelki"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_izdelki_v" ADD CONSTRAINT "_izdelki_v_version_kategorija_id_kategorije_izdelkov_id_fk" FOREIGN KEY ("version_kategorija_id") REFERENCES "cms"."kategorije_izdelkov"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_izdelki_v_rels" ADD CONSTRAINT "_izdelki_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."_izdelki_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_izdelki_v_rels" ADD CONSTRAINT "_izdelki_v_rels_faze_fk" FOREIGN KEY ("faze_id") REFERENCES "cms"."faze"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_izdelki_v_rels" ADD CONSTRAINT "_izdelki_v_rels_mediji_fk" FOREIGN KEY ("mediji_id") REFERENCES "cms"."mediji"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_izdelki_v_rels" ADD CONSTRAINT "_izdelki_v_rels_clanki_fk" FOREIGN KEY ("clanki_id") REFERENCES "cms"."clanki"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_izdelki_v_rels" ADD CONSTRAINT "_izdelki_v_rels_videi_fk" FOREIGN KEY ("videi_id") REFERENCES "cms"."videi"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."kategorije_izdelkov" ADD CONSTRAINT "kategorije_izdelkov_slika_id_mediji_id_fk" FOREIGN KEY ("slika_id") REFERENCES "cms"."mediji"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."kategorije_izdelkov" ADD CONSTRAINT "kategorije_izdelkov_vodic_id_clanki_id_fk" FOREIGN KEY ("vodic_id") REFERENCES "cms"."clanki"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."povprasevanja_izdelki" ADD CONSTRAINT "povprasevanja_izdelki_izdelek_id_izdelki_id_fk" FOREIGN KEY ("izdelek_id") REFERENCES "cms"."izdelki"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."povprasevanja_izdelki" ADD CONSTRAINT "povprasevanja_izdelki_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."povprasevanja"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."faze_cilji" ADD CONSTRAINT "faze_cilji_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."faze"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."uredniki_sessions" ADD CONSTRAINT "uredniki_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."uredniki"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_clanki_fk" FOREIGN KEY ("clanki_id") REFERENCES "cms"."clanki"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_videi_fk" FOREIGN KEY ("videi_id") REFERENCES "cms"."videi"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ucne_poti_fk" FOREIGN KEY ("ucne_poti_id") REFERENCES "cms"."ucne_poti"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_izdelki_fk" FOREIGN KEY ("izdelki_id") REFERENCES "cms"."izdelki"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_kategorije_izdelkov_fk" FOREIGN KEY ("kategorije_izdelkov_id") REFERENCES "cms"."kategorije_izdelkov"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_povprasevanja_fk" FOREIGN KEY ("povprasevanja_id") REFERENCES "cms"."povprasevanja"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faze_fk" FOREIGN KEY ("faze_id") REFERENCES "cms"."faze"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_teme_fk" FOREIGN KEY ("teme_id") REFERENCES "cms"."teme"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_mediji_fk" FOREIGN KEY ("mediji_id") REFERENCES "cms"."mediji"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_video_datoteke_fk" FOREIGN KEY ("video_datoteke_id") REFERENCES "cms"."video_datoteke"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_datoteke_fk" FOREIGN KEY ("datoteke_id") REFERENCES "cms"."datoteke"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_uredniki_fk" FOREIGN KEY ("uredniki_id") REFERENCES "cms"."uredniki"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_uredniki_fk" FOREIGN KEY ("uredniki_id") REFERENCES "cms"."uredniki"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."domaca_stran_zaupanje" ADD CONSTRAINT "domaca_stran_zaupanje_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."domaca_stran"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."domaca_stran" ADD CONSTRAINT "domaca_stran_prvi_zaslon_slika_id_mediji_id_fk" FOREIGN KEY ("prvi_zaslon_slika_id") REFERENCES "cms"."mediji"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."domaca_stran_rels" ADD CONSTRAINT "domaca_stran_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."domaca_stran"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."domaca_stran_rels" ADD CONSTRAINT "domaca_stran_rels_clanki_fk" FOREIGN KEY ("clanki_id") REFERENCES "cms"."clanki"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."domaca_stran_rels" ADD CONSTRAINT "domaca_stran_rels_videi_fk" FOREIGN KEY ("videi_id") REFERENCES "cms"."videi"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."domaca_stran_rels" ADD CONSTRAINT "domaca_stran_rels_kategorije_izdelkov_fk" FOREIGN KEY ("kategorije_izdelkov_id") REFERENCES "cms"."kategorije_izdelkov"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "clanki_kljucni_poudarki_order_idx" ON "cms"."clanki_kljucni_poudarki" USING btree ("_order");
  CREATE INDEX "clanki_kljucni_poudarki_parent_id_idx" ON "cms"."clanki_kljucni_poudarki" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "clanki_slug_idx" ON "cms"."clanki" USING btree ("slug");
  CREATE INDEX "clanki_naslovna_slika_idx" ON "cms"."clanki" USING btree ("naslovna_slika_id");
  CREATE INDEX "clanki_faza_idx" ON "cms"."clanki" USING btree ("faza_id");
  CREATE INDEX "clanki_updated_at_idx" ON "cms"."clanki" USING btree ("updated_at");
  CREATE INDEX "clanki_created_at_idx" ON "cms"."clanki" USING btree ("created_at");
  CREATE INDEX "clanki__status_idx" ON "cms"."clanki" USING btree ("_status");
  CREATE INDEX "clanki_rels_order_idx" ON "cms"."clanki_rels" USING btree ("order");
  CREATE INDEX "clanki_rels_parent_idx" ON "cms"."clanki_rels" USING btree ("parent_id");
  CREATE INDEX "clanki_rels_path_idx" ON "cms"."clanki_rels" USING btree ("path");
  CREATE INDEX "clanki_rels_teme_id_idx" ON "cms"."clanki_rels" USING btree ("teme_id");
  CREATE INDEX "clanki_rels_datoteke_id_idx" ON "cms"."clanki_rels" USING btree ("datoteke_id");
  CREATE INDEX "clanki_rels_izdelki_id_idx" ON "cms"."clanki_rels" USING btree ("izdelki_id");
  CREATE INDEX "clanki_rels_clanki_id_idx" ON "cms"."clanki_rels" USING btree ("clanki_id");
  CREATE INDEX "clanki_rels_videi_id_idx" ON "cms"."clanki_rels" USING btree ("videi_id");
  CREATE INDEX "_clanki_v_version_kljucni_poudarki_order_idx" ON "cms"."_clanki_v_version_kljucni_poudarki" USING btree ("_order");
  CREATE INDEX "_clanki_v_version_kljucni_poudarki_parent_id_idx" ON "cms"."_clanki_v_version_kljucni_poudarki" USING btree ("_parent_id");
  CREATE INDEX "_clanki_v_parent_idx" ON "cms"."_clanki_v" USING btree ("parent_id");
  CREATE INDEX "_clanki_v_version_version_slug_idx" ON "cms"."_clanki_v" USING btree ("version_slug");
  CREATE INDEX "_clanki_v_version_version_naslovna_slika_idx" ON "cms"."_clanki_v" USING btree ("version_naslovna_slika_id");
  CREATE INDEX "_clanki_v_version_version_faza_idx" ON "cms"."_clanki_v" USING btree ("version_faza_id");
  CREATE INDEX "_clanki_v_version_version_updated_at_idx" ON "cms"."_clanki_v" USING btree ("version_updated_at");
  CREATE INDEX "_clanki_v_version_version_created_at_idx" ON "cms"."_clanki_v" USING btree ("version_created_at");
  CREATE INDEX "_clanki_v_version_version__status_idx" ON "cms"."_clanki_v" USING btree ("version__status");
  CREATE INDEX "_clanki_v_created_at_idx" ON "cms"."_clanki_v" USING btree ("created_at");
  CREATE INDEX "_clanki_v_updated_at_idx" ON "cms"."_clanki_v" USING btree ("updated_at");
  CREATE INDEX "_clanki_v_latest_idx" ON "cms"."_clanki_v" USING btree ("latest");
  CREATE INDEX "_clanki_v_rels_order_idx" ON "cms"."_clanki_v_rels" USING btree ("order");
  CREATE INDEX "_clanki_v_rels_parent_idx" ON "cms"."_clanki_v_rels" USING btree ("parent_id");
  CREATE INDEX "_clanki_v_rels_path_idx" ON "cms"."_clanki_v_rels" USING btree ("path");
  CREATE INDEX "_clanki_v_rels_teme_id_idx" ON "cms"."_clanki_v_rels" USING btree ("teme_id");
  CREATE INDEX "_clanki_v_rels_datoteke_id_idx" ON "cms"."_clanki_v_rels" USING btree ("datoteke_id");
  CREATE INDEX "_clanki_v_rels_izdelki_id_idx" ON "cms"."_clanki_v_rels" USING btree ("izdelki_id");
  CREATE INDEX "_clanki_v_rels_clanki_id_idx" ON "cms"."_clanki_v_rels" USING btree ("clanki_id");
  CREATE INDEX "_clanki_v_rels_videi_id_idx" ON "cms"."_clanki_v_rels" USING btree ("videi_id");
  CREATE INDEX "videi_poglavja_order_idx" ON "cms"."videi_poglavja" USING btree ("_order");
  CREATE INDEX "videi_poglavja_parent_id_idx" ON "cms"."videi_poglavja" USING btree ("_parent_id");
  CREATE INDEX "videi_kljucni_poudarki_order_idx" ON "cms"."videi_kljucni_poudarki" USING btree ("_order");
  CREATE INDEX "videi_kljucni_poudarki_parent_id_idx" ON "cms"."videi_kljucni_poudarki" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "videi_slug_idx" ON "cms"."videi" USING btree ("slug");
  CREATE INDEX "videi_datoteka_idx" ON "cms"."videi" USING btree ("datoteka_id");
  CREATE INDEX "videi_podnapisi_idx" ON "cms"."videi" USING btree ("podnapisi_id");
  CREATE INDEX "videi_poster_idx" ON "cms"."videi" USING btree ("poster_id");
  CREATE INDEX "videi_faza_idx" ON "cms"."videi" USING btree ("faza_id");
  CREATE INDEX "videi_updated_at_idx" ON "cms"."videi" USING btree ("updated_at");
  CREATE INDEX "videi_created_at_idx" ON "cms"."videi" USING btree ("created_at");
  CREATE INDEX "videi__status_idx" ON "cms"."videi" USING btree ("_status");
  CREATE INDEX "videi_rels_order_idx" ON "cms"."videi_rels" USING btree ("order");
  CREATE INDEX "videi_rels_parent_idx" ON "cms"."videi_rels" USING btree ("parent_id");
  CREATE INDEX "videi_rels_path_idx" ON "cms"."videi_rels" USING btree ("path");
  CREATE INDEX "videi_rels_teme_id_idx" ON "cms"."videi_rels" USING btree ("teme_id");
  CREATE INDEX "videi_rels_datoteke_id_idx" ON "cms"."videi_rels" USING btree ("datoteke_id");
  CREATE INDEX "videi_rels_izdelki_id_idx" ON "cms"."videi_rels" USING btree ("izdelki_id");
  CREATE INDEX "videi_rels_clanki_id_idx" ON "cms"."videi_rels" USING btree ("clanki_id");
  CREATE INDEX "videi_rels_videi_id_idx" ON "cms"."videi_rels" USING btree ("videi_id");
  CREATE INDEX "_videi_v_version_poglavja_order_idx" ON "cms"."_videi_v_version_poglavja" USING btree ("_order");
  CREATE INDEX "_videi_v_version_poglavja_parent_id_idx" ON "cms"."_videi_v_version_poglavja" USING btree ("_parent_id");
  CREATE INDEX "_videi_v_version_kljucni_poudarki_order_idx" ON "cms"."_videi_v_version_kljucni_poudarki" USING btree ("_order");
  CREATE INDEX "_videi_v_version_kljucni_poudarki_parent_id_idx" ON "cms"."_videi_v_version_kljucni_poudarki" USING btree ("_parent_id");
  CREATE INDEX "_videi_v_parent_idx" ON "cms"."_videi_v" USING btree ("parent_id");
  CREATE INDEX "_videi_v_version_version_slug_idx" ON "cms"."_videi_v" USING btree ("version_slug");
  CREATE INDEX "_videi_v_version_version_datoteka_idx" ON "cms"."_videi_v" USING btree ("version_datoteka_id");
  CREATE INDEX "_videi_v_version_version_podnapisi_idx" ON "cms"."_videi_v" USING btree ("version_podnapisi_id");
  CREATE INDEX "_videi_v_version_version_poster_idx" ON "cms"."_videi_v" USING btree ("version_poster_id");
  CREATE INDEX "_videi_v_version_version_faza_idx" ON "cms"."_videi_v" USING btree ("version_faza_id");
  CREATE INDEX "_videi_v_version_version_updated_at_idx" ON "cms"."_videi_v" USING btree ("version_updated_at");
  CREATE INDEX "_videi_v_version_version_created_at_idx" ON "cms"."_videi_v" USING btree ("version_created_at");
  CREATE INDEX "_videi_v_version_version__status_idx" ON "cms"."_videi_v" USING btree ("version__status");
  CREATE INDEX "_videi_v_created_at_idx" ON "cms"."_videi_v" USING btree ("created_at");
  CREATE INDEX "_videi_v_updated_at_idx" ON "cms"."_videi_v" USING btree ("updated_at");
  CREATE INDEX "_videi_v_latest_idx" ON "cms"."_videi_v" USING btree ("latest");
  CREATE INDEX "_videi_v_rels_order_idx" ON "cms"."_videi_v_rels" USING btree ("order");
  CREATE INDEX "_videi_v_rels_parent_idx" ON "cms"."_videi_v_rels" USING btree ("parent_id");
  CREATE INDEX "_videi_v_rels_path_idx" ON "cms"."_videi_v_rels" USING btree ("path");
  CREATE INDEX "_videi_v_rels_teme_id_idx" ON "cms"."_videi_v_rels" USING btree ("teme_id");
  CREATE INDEX "_videi_v_rels_datoteke_id_idx" ON "cms"."_videi_v_rels" USING btree ("datoteke_id");
  CREATE INDEX "_videi_v_rels_izdelki_id_idx" ON "cms"."_videi_v_rels" USING btree ("izdelki_id");
  CREATE INDEX "_videi_v_rels_clanki_id_idx" ON "cms"."_videi_v_rels" USING btree ("clanki_id");
  CREATE INDEX "_videi_v_rels_videi_id_idx" ON "cms"."_videi_v_rels" USING btree ("videi_id");
  CREATE INDEX "ucne_poti_koraki_order_idx" ON "cms"."ucne_poti_koraki" USING btree ("_order");
  CREATE INDEX "ucne_poti_koraki_parent_id_idx" ON "cms"."ucne_poti_koraki" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "ucne_poti_slug_idx" ON "cms"."ucne_poti" USING btree ("slug");
  CREATE INDEX "ucne_poti_updated_at_idx" ON "cms"."ucne_poti" USING btree ("updated_at");
  CREATE INDEX "ucne_poti_created_at_idx" ON "cms"."ucne_poti" USING btree ("created_at");
  CREATE INDEX "ucne_poti__status_idx" ON "cms"."ucne_poti" USING btree ("_status");
  CREATE INDEX "ucne_poti_rels_order_idx" ON "cms"."ucne_poti_rels" USING btree ("order");
  CREATE INDEX "ucne_poti_rels_parent_idx" ON "cms"."ucne_poti_rels" USING btree ("parent_id");
  CREATE INDEX "ucne_poti_rels_path_idx" ON "cms"."ucne_poti_rels" USING btree ("path");
  CREATE INDEX "ucne_poti_rels_clanki_id_idx" ON "cms"."ucne_poti_rels" USING btree ("clanki_id");
  CREATE INDEX "ucne_poti_rels_videi_id_idx" ON "cms"."ucne_poti_rels" USING btree ("videi_id");
  CREATE INDEX "_ucne_poti_v_version_koraki_order_idx" ON "cms"."_ucne_poti_v_version_koraki" USING btree ("_order");
  CREATE INDEX "_ucne_poti_v_version_koraki_parent_id_idx" ON "cms"."_ucne_poti_v_version_koraki" USING btree ("_parent_id");
  CREATE INDEX "_ucne_poti_v_parent_idx" ON "cms"."_ucne_poti_v" USING btree ("parent_id");
  CREATE INDEX "_ucne_poti_v_version_version_slug_idx" ON "cms"."_ucne_poti_v" USING btree ("version_slug");
  CREATE INDEX "_ucne_poti_v_version_version_updated_at_idx" ON "cms"."_ucne_poti_v" USING btree ("version_updated_at");
  CREATE INDEX "_ucne_poti_v_version_version_created_at_idx" ON "cms"."_ucne_poti_v" USING btree ("version_created_at");
  CREATE INDEX "_ucne_poti_v_version_version__status_idx" ON "cms"."_ucne_poti_v" USING btree ("version__status");
  CREATE INDEX "_ucne_poti_v_created_at_idx" ON "cms"."_ucne_poti_v" USING btree ("created_at");
  CREATE INDEX "_ucne_poti_v_updated_at_idx" ON "cms"."_ucne_poti_v" USING btree ("updated_at");
  CREATE INDEX "_ucne_poti_v_latest_idx" ON "cms"."_ucne_poti_v" USING btree ("latest");
  CREATE INDEX "_ucne_poti_v_rels_order_idx" ON "cms"."_ucne_poti_v_rels" USING btree ("order");
  CREATE INDEX "_ucne_poti_v_rels_parent_idx" ON "cms"."_ucne_poti_v_rels" USING btree ("parent_id");
  CREATE INDEX "_ucne_poti_v_rels_path_idx" ON "cms"."_ucne_poti_v_rels" USING btree ("path");
  CREATE INDEX "_ucne_poti_v_rels_clanki_id_idx" ON "cms"."_ucne_poti_v_rels" USING btree ("clanki_id");
  CREATE INDEX "_ucne_poti_v_rels_videi_id_idx" ON "cms"."_ucne_poti_v_rels" USING btree ("videi_id");
  CREATE INDEX "izdelki_tehnicni_podatki_order_idx" ON "cms"."izdelki_tehnicni_podatki" USING btree ("_order");
  CREATE INDEX "izdelki_tehnicni_podatki_parent_id_idx" ON "cms"."izdelki_tehnicni_podatki" USING btree ("_parent_id");
  CREATE INDEX "izdelki_primeri_uporabe_order_idx" ON "cms"."izdelki_primeri_uporabe" USING btree ("_order");
  CREATE INDEX "izdelki_primeri_uporabe_parent_id_idx" ON "cms"."izdelki_primeri_uporabe" USING btree ("_parent_id");
  CREATE INDEX "izdelki_pogosta_vprasanja_order_idx" ON "cms"."izdelki_pogosta_vprasanja" USING btree ("_order");
  CREATE INDEX "izdelki_pogosta_vprasanja_parent_id_idx" ON "cms"."izdelki_pogosta_vprasanja" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "izdelki_slug_idx" ON "cms"."izdelki" USING btree ("slug");
  CREATE INDEX "izdelki_kategorija_idx" ON "cms"."izdelki" USING btree ("kategorija_id");
  CREATE INDEX "izdelki_updated_at_idx" ON "cms"."izdelki" USING btree ("updated_at");
  CREATE INDEX "izdelki_created_at_idx" ON "cms"."izdelki" USING btree ("created_at");
  CREATE INDEX "izdelki__status_idx" ON "cms"."izdelki" USING btree ("_status");
  CREATE INDEX "izdelki_rels_order_idx" ON "cms"."izdelki_rels" USING btree ("order");
  CREATE INDEX "izdelki_rels_parent_idx" ON "cms"."izdelki_rels" USING btree ("parent_id");
  CREATE INDEX "izdelki_rels_path_idx" ON "cms"."izdelki_rels" USING btree ("path");
  CREATE INDEX "izdelki_rels_faze_id_idx" ON "cms"."izdelki_rels" USING btree ("faze_id");
  CREATE INDEX "izdelki_rels_mediji_id_idx" ON "cms"."izdelki_rels" USING btree ("mediji_id");
  CREATE INDEX "izdelki_rels_clanki_id_idx" ON "cms"."izdelki_rels" USING btree ("clanki_id");
  CREATE INDEX "izdelki_rels_videi_id_idx" ON "cms"."izdelki_rels" USING btree ("videi_id");
  CREATE INDEX "_izdelki_v_version_tehnicni_podatki_order_idx" ON "cms"."_izdelki_v_version_tehnicni_podatki" USING btree ("_order");
  CREATE INDEX "_izdelki_v_version_tehnicni_podatki_parent_id_idx" ON "cms"."_izdelki_v_version_tehnicni_podatki" USING btree ("_parent_id");
  CREATE INDEX "_izdelki_v_version_primeri_uporabe_order_idx" ON "cms"."_izdelki_v_version_primeri_uporabe" USING btree ("_order");
  CREATE INDEX "_izdelki_v_version_primeri_uporabe_parent_id_idx" ON "cms"."_izdelki_v_version_primeri_uporabe" USING btree ("_parent_id");
  CREATE INDEX "_izdelki_v_version_pogosta_vprasanja_order_idx" ON "cms"."_izdelki_v_version_pogosta_vprasanja" USING btree ("_order");
  CREATE INDEX "_izdelki_v_version_pogosta_vprasanja_parent_id_idx" ON "cms"."_izdelki_v_version_pogosta_vprasanja" USING btree ("_parent_id");
  CREATE INDEX "_izdelki_v_parent_idx" ON "cms"."_izdelki_v" USING btree ("parent_id");
  CREATE INDEX "_izdelki_v_version_version_slug_idx" ON "cms"."_izdelki_v" USING btree ("version_slug");
  CREATE INDEX "_izdelki_v_version_version_kategorija_idx" ON "cms"."_izdelki_v" USING btree ("version_kategorija_id");
  CREATE INDEX "_izdelki_v_version_version_updated_at_idx" ON "cms"."_izdelki_v" USING btree ("version_updated_at");
  CREATE INDEX "_izdelki_v_version_version_created_at_idx" ON "cms"."_izdelki_v" USING btree ("version_created_at");
  CREATE INDEX "_izdelki_v_version_version__status_idx" ON "cms"."_izdelki_v" USING btree ("version__status");
  CREATE INDEX "_izdelki_v_created_at_idx" ON "cms"."_izdelki_v" USING btree ("created_at");
  CREATE INDEX "_izdelki_v_updated_at_idx" ON "cms"."_izdelki_v" USING btree ("updated_at");
  CREATE INDEX "_izdelki_v_latest_idx" ON "cms"."_izdelki_v" USING btree ("latest");
  CREATE INDEX "_izdelki_v_rels_order_idx" ON "cms"."_izdelki_v_rels" USING btree ("order");
  CREATE INDEX "_izdelki_v_rels_parent_idx" ON "cms"."_izdelki_v_rels" USING btree ("parent_id");
  CREATE INDEX "_izdelki_v_rels_path_idx" ON "cms"."_izdelki_v_rels" USING btree ("path");
  CREATE INDEX "_izdelki_v_rels_faze_id_idx" ON "cms"."_izdelki_v_rels" USING btree ("faze_id");
  CREATE INDEX "_izdelki_v_rels_mediji_id_idx" ON "cms"."_izdelki_v_rels" USING btree ("mediji_id");
  CREATE INDEX "_izdelki_v_rels_clanki_id_idx" ON "cms"."_izdelki_v_rels" USING btree ("clanki_id");
  CREATE INDEX "_izdelki_v_rels_videi_id_idx" ON "cms"."_izdelki_v_rels" USING btree ("videi_id");
  CREATE UNIQUE INDEX "kategorije_izdelkov_slug_idx" ON "cms"."kategorije_izdelkov" USING btree ("slug");
  CREATE INDEX "kategorije_izdelkov_slika_idx" ON "cms"."kategorije_izdelkov" USING btree ("slika_id");
  CREATE INDEX "kategorije_izdelkov_vodic_idx" ON "cms"."kategorije_izdelkov" USING btree ("vodic_id");
  CREATE INDEX "kategorije_izdelkov_updated_at_idx" ON "cms"."kategorije_izdelkov" USING btree ("updated_at");
  CREATE INDEX "kategorije_izdelkov_created_at_idx" ON "cms"."kategorije_izdelkov" USING btree ("created_at");
  CREATE INDEX "povprasevanja_izdelki_order_idx" ON "cms"."povprasevanja_izdelki" USING btree ("_order");
  CREATE INDEX "povprasevanja_izdelki_parent_id_idx" ON "cms"."povprasevanja_izdelki" USING btree ("_parent_id");
  CREATE INDEX "povprasevanja_izdelki_izdelek_idx" ON "cms"."povprasevanja_izdelki" USING btree ("izdelek_id");
  CREATE INDEX "povprasevanja_updated_at_idx" ON "cms"."povprasevanja" USING btree ("updated_at");
  CREATE INDEX "povprasevanja_created_at_idx" ON "cms"."povprasevanja" USING btree ("created_at");
  CREATE INDEX "faze_cilji_order_idx" ON "cms"."faze_cilji" USING btree ("_order");
  CREATE INDEX "faze_cilji_parent_id_idx" ON "cms"."faze_cilji" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "faze_slug_idx" ON "cms"."faze" USING btree ("slug");
  CREATE INDEX "faze_updated_at_idx" ON "cms"."faze" USING btree ("updated_at");
  CREATE INDEX "faze_created_at_idx" ON "cms"."faze" USING btree ("created_at");
  CREATE UNIQUE INDEX "teme_slug_idx" ON "cms"."teme" USING btree ("slug");
  CREATE INDEX "teme_updated_at_idx" ON "cms"."teme" USING btree ("updated_at");
  CREATE INDEX "teme_created_at_idx" ON "cms"."teme" USING btree ("created_at");
  CREATE INDEX "mediji_updated_at_idx" ON "cms"."mediji" USING btree ("updated_at");
  CREATE INDEX "mediji_created_at_idx" ON "cms"."mediji" USING btree ("created_at");
  CREATE UNIQUE INDEX "mediji_filename_idx" ON "cms"."mediji" USING btree ("filename");
  CREATE INDEX "video_datoteke_updated_at_idx" ON "cms"."video_datoteke" USING btree ("updated_at");
  CREATE INDEX "video_datoteke_created_at_idx" ON "cms"."video_datoteke" USING btree ("created_at");
  CREATE UNIQUE INDEX "video_datoteke_filename_idx" ON "cms"."video_datoteke" USING btree ("filename");
  CREATE INDEX "datoteke_updated_at_idx" ON "cms"."datoteke" USING btree ("updated_at");
  CREATE INDEX "datoteke_created_at_idx" ON "cms"."datoteke" USING btree ("created_at");
  CREATE UNIQUE INDEX "datoteke_filename_idx" ON "cms"."datoteke" USING btree ("filename");
  CREATE INDEX "uredniki_sessions_order_idx" ON "cms"."uredniki_sessions" USING btree ("_order");
  CREATE INDEX "uredniki_sessions_parent_id_idx" ON "cms"."uredniki_sessions" USING btree ("_parent_id");
  CREATE INDEX "uredniki_updated_at_idx" ON "cms"."uredniki" USING btree ("updated_at");
  CREATE INDEX "uredniki_created_at_idx" ON "cms"."uredniki" USING btree ("created_at");
  CREATE UNIQUE INDEX "uredniki_email_idx" ON "cms"."uredniki" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "cms"."payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "cms"."payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "cms"."payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "cms"."payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "cms"."payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "cms"."payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "cms"."payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_clanki_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("clanki_id");
  CREATE INDEX "payload_locked_documents_rels_videi_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("videi_id");
  CREATE INDEX "payload_locked_documents_rels_ucne_poti_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("ucne_poti_id");
  CREATE INDEX "payload_locked_documents_rels_izdelki_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("izdelki_id");
  CREATE INDEX "payload_locked_documents_rels_kategorije_izdelkov_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("kategorije_izdelkov_id");
  CREATE INDEX "payload_locked_documents_rels_povprasevanja_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("povprasevanja_id");
  CREATE INDEX "payload_locked_documents_rels_faze_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("faze_id");
  CREATE INDEX "payload_locked_documents_rels_teme_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("teme_id");
  CREATE INDEX "payload_locked_documents_rels_mediji_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("mediji_id");
  CREATE INDEX "payload_locked_documents_rels_video_datoteke_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("video_datoteke_id");
  CREATE INDEX "payload_locked_documents_rels_datoteke_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("datoteke_id");
  CREATE INDEX "payload_locked_documents_rels_uredniki_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("uredniki_id");
  CREATE INDEX "payload_preferences_key_idx" ON "cms"."payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "cms"."payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "cms"."payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "cms"."payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "cms"."payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "cms"."payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_uredniki_id_idx" ON "cms"."payload_preferences_rels" USING btree ("uredniki_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "cms"."payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "cms"."payload_migrations" USING btree ("created_at");
  CREATE INDEX "domaca_stran_zaupanje_order_idx" ON "cms"."domaca_stran_zaupanje" USING btree ("_order");
  CREATE INDEX "domaca_stran_zaupanje_parent_id_idx" ON "cms"."domaca_stran_zaupanje" USING btree ("_parent_id");
  CREATE INDEX "domaca_stran_prvi_zaslon_prvi_zaslon_slika_idx" ON "cms"."domaca_stran" USING btree ("prvi_zaslon_slika_id");
  CREATE INDEX "domaca_stran_rels_order_idx" ON "cms"."domaca_stran_rels" USING btree ("order");
  CREATE INDEX "domaca_stran_rels_parent_idx" ON "cms"."domaca_stran_rels" USING btree ("parent_id");
  CREATE INDEX "domaca_stran_rels_path_idx" ON "cms"."domaca_stran_rels" USING btree ("path");
  CREATE INDEX "domaca_stran_rels_clanki_id_idx" ON "cms"."domaca_stran_rels" USING btree ("clanki_id");
  CREATE INDEX "domaca_stran_rels_videi_id_idx" ON "cms"."domaca_stran_rels" USING btree ("videi_id");
  CREATE INDEX "domaca_stran_rels_kategorije_izdelkov_id_idx" ON "cms"."domaca_stran_rels" USING btree ("kategorije_izdelkov_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "cms"."clanki_kljucni_poudarki" CASCADE;
  DROP TABLE "cms"."clanki" CASCADE;
  DROP TABLE "cms"."clanki_rels" CASCADE;
  DROP TABLE "cms"."_clanki_v_version_kljucni_poudarki" CASCADE;
  DROP TABLE "cms"."_clanki_v" CASCADE;
  DROP TABLE "cms"."_clanki_v_rels" CASCADE;
  DROP TABLE "cms"."videi_poglavja" CASCADE;
  DROP TABLE "cms"."videi_kljucni_poudarki" CASCADE;
  DROP TABLE "cms"."videi" CASCADE;
  DROP TABLE "cms"."videi_rels" CASCADE;
  DROP TABLE "cms"."_videi_v_version_poglavja" CASCADE;
  DROP TABLE "cms"."_videi_v_version_kljucni_poudarki" CASCADE;
  DROP TABLE "cms"."_videi_v" CASCADE;
  DROP TABLE "cms"."_videi_v_rels" CASCADE;
  DROP TABLE "cms"."ucne_poti_koraki" CASCADE;
  DROP TABLE "cms"."ucne_poti" CASCADE;
  DROP TABLE "cms"."ucne_poti_rels" CASCADE;
  DROP TABLE "cms"."_ucne_poti_v_version_koraki" CASCADE;
  DROP TABLE "cms"."_ucne_poti_v" CASCADE;
  DROP TABLE "cms"."_ucne_poti_v_rels" CASCADE;
  DROP TABLE "cms"."izdelki_tehnicni_podatki" CASCADE;
  DROP TABLE "cms"."izdelki_primeri_uporabe" CASCADE;
  DROP TABLE "cms"."izdelki_pogosta_vprasanja" CASCADE;
  DROP TABLE "cms"."izdelki" CASCADE;
  DROP TABLE "cms"."izdelki_rels" CASCADE;
  DROP TABLE "cms"."_izdelki_v_version_tehnicni_podatki" CASCADE;
  DROP TABLE "cms"."_izdelki_v_version_primeri_uporabe" CASCADE;
  DROP TABLE "cms"."_izdelki_v_version_pogosta_vprasanja" CASCADE;
  DROP TABLE "cms"."_izdelki_v" CASCADE;
  DROP TABLE "cms"."_izdelki_v_rels" CASCADE;
  DROP TABLE "cms"."kategorije_izdelkov" CASCADE;
  DROP TABLE "cms"."povprasevanja_izdelki" CASCADE;
  DROP TABLE "cms"."povprasevanja" CASCADE;
  DROP TABLE "cms"."faze_cilji" CASCADE;
  DROP TABLE "cms"."faze" CASCADE;
  DROP TABLE "cms"."teme" CASCADE;
  DROP TABLE "cms"."mediji" CASCADE;
  DROP TABLE "cms"."video_datoteke" CASCADE;
  DROP TABLE "cms"."datoteke" CASCADE;
  DROP TABLE "cms"."uredniki_sessions" CASCADE;
  DROP TABLE "cms"."uredniki" CASCADE;
  DROP TABLE "cms"."payload_kv" CASCADE;
  DROP TABLE "cms"."payload_locked_documents" CASCADE;
  DROP TABLE "cms"."payload_locked_documents_rels" CASCADE;
  DROP TABLE "cms"."payload_preferences" CASCADE;
  DROP TABLE "cms"."payload_preferences_rels" CASCADE;
  DROP TABLE "cms"."payload_migrations" CASCADE;
  DROP TABLE "cms"."domaca_stran_zaupanje" CASCADE;
  DROP TABLE "cms"."domaca_stran" CASCADE;
  DROP TABLE "cms"."domaca_stran_rels" CASCADE;
  DROP TABLE "cms"."o_nas" CASCADE;
  DROP TYPE "cms"."enum_clanki_zahtevnost";
  DROP TYPE "cms"."enum_clanki_status";
  DROP TYPE "cms"."enum__clanki_v_version_zahtevnost";
  DROP TYPE "cms"."enum__clanki_v_version_status";
  DROP TYPE "cms"."enum_videi_vir";
  DROP TYPE "cms"."enum_videi_zahtevnost";
  DROP TYPE "cms"."enum_videi_status";
  DROP TYPE "cms"."enum__videi_v_version_vir";
  DROP TYPE "cms"."enum__videi_v_version_zahtevnost";
  DROP TYPE "cms"."enum__videi_v_version_status";
  DROP TYPE "cms"."enum_ucne_poti_status";
  DROP TYPE "cms"."enum__ucne_poti_v_version_status";
  DROP TYPE "cms"."enum_izdelki_zahtevnost_vgradnje";
  DROP TYPE "cms"."enum_izdelki_stanje";
  DROP TYPE "cms"."enum_izdelki_status";
  DROP TYPE "cms"."enum__izdelki_v_version_zahtevnost_vgradnje";
  DROP TYPE "cms"."enum__izdelki_v_version_stanje";
  DROP TYPE "cms"."enum__izdelki_v_version_status";
  DROP TYPE "cms"."enum_povprasevanja_vrsta";
  DROP TYPE "cms"."enum_povprasevanja_stanje";`)
}
