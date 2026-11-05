-- VideoForge AI — storage buckets
--
-- Both buckets are private. No storage.objects policies are created for the
-- anon/authenticated roles on purpose, so direct access with a user JWT is denied.
-- The server (service role) creates:
--   * signed UPLOAD URLs for source images, at a path it chooses:
--       source-images/{organization_id}/{user_id}/{uuid}.jpg|png
--   * signed DOWNLOAD URLs for playback and MP4 download, after checking access:
--       videos/{organization_id}/{video_id}.mp4
-- Limits: source images up to 10 MB (Kling accepts up to 50 MB, but the browser
-- re-encodes and crops to <= 2048 px); videos up to 100 MB. A project-wide upload
-- limit lower than these (Storage settings) takes precedence.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('source-images', 'source-images', false, 10485760, array['image/jpeg', 'image/png']),
  ('videos', 'videos', false, 104857600, array['video/mp4'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
