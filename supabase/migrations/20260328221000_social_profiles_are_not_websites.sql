-- Treat social profile URLs as non-website in MVP lead model.

with social_candidates as (
  select
    id,
    website_url,
    case
      when website_url ilike '%instagram.com%' then 'instagram'
      when website_url ilike '%wa.me/%' or website_url ilike '%api.whatsapp.com/%' then 'whatsapp'
      else null
    end as signal
  from public.leads
  where website_url is not null
    and (
      website_url ilike '%instagram.com%'
      or website_url ilike '%facebook.com%'
      or website_url ilike '%m.facebook.com%'
      or website_url ilike '%wa.me/%'
      or website_url ilike '%api.whatsapp.com/%'
      or website_url ilike '%tiktok.com%'
      or website_url ilike '%x.com%'
      or website_url ilike '%twitter.com%'
      or website_url ilike '%youtube.com%'
      or website_url ilike '%youtu.be%'
    )
)
update public.leads as l
set
  has_website = false,
  website_url = null,
  instagram_url = case
    when sc.signal = 'instagram' and l.instagram_url is null then sc.website_url
    else l.instagram_url
  end,
  instagram_source = case
    when sc.signal = 'instagram' and l.instagram_url is null then 'candidate'::public.contact_verification
    else l.instagram_source
  end,
  whatsapp_url = case
    when sc.signal = 'whatsapp' and l.whatsapp_url is null then sc.website_url
    else l.whatsapp_url
  end,
  whatsapp_source = case
    when sc.signal = 'whatsapp' and l.whatsapp_url is null then 'candidate'::public.contact_verification
    else l.whatsapp_source
  end,
  updated_at = now()
from social_candidates sc
where l.id = sc.id;
