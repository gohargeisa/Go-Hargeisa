-- ============================================================================
-- Go Hargeisa — Activate the loyalty engine for Flormar Hargeisa ONLY.
--
-- NOT APPLIED YET (same standing rule as 20260908000001_loyalty_core.sql,
-- which this depends on — apply that first).
--
-- This is the ONE place a loyalty program is turned on. It:
--   1. creates a loyalty_programs row for Flormar's existing city_services
--      listing (slug 'flormar-hargeisa'), enabled = true;
--   2. seeds 4 configurable tiers (Member / Silver / Gold / Platinum);
--   3. seeds a starter set of rewards and offers — all fully editable in the
--      admin dashboard afterwards (nothing here is business logic, it is
--      seed configuration).
--
-- No other partner gets a program. No loyalty UI is attached to any other
-- listing. Future partners are activated by inserting their own
-- loyalty_programs row (enabled = true) + tiers/rewards via the admin
-- dashboard — no schema change, no code change.
--
-- Idempotent & safe to re-run: the program + tiers upsert in place on their
-- unique keys; the starter rewards/offers seed ONLY when the program has
-- none yet, so a re-run never disturbs admin edits or redemption history.
--
-- Fail-safe: if the Flormar `city_services` listing doesn't exist yet, this
-- migration logs a NOTICE and returns cleanly instead of raising — the
-- migration chain is never blocked. Re-run the file once the listing is in
-- place (through the admin UI) to activate.
-- ============================================================================

do $$
declare
  v_listing_id uuid;
  v_program_id uuid;
  v_member_tier  uuid;
  v_silver_tier  uuid;
  v_gold_tier    uuid;
  v_plat_tier    uuid;
begin
  -- ------------------------------------------------------------------------
  -- 0. Locate Flormar's existing, already-published city_services row.
  --    Fail-safe: if the listing isn't present yet (e.g. a fresh
  --    environment where the Flormar row hasn't been created — it's entered
  --    through the admin UI, not a migration), skip the Flormar-specific
  --    activation and let the rest of the migration chain continue. Re-run
  --    this migration file (it's fully idempotent) once the listing exists.
  -- ------------------------------------------------------------------------
  select id into v_listing_id from city_services where slug = 'flormar-hargeisa';
  if v_listing_id is null then
    raise notice 'loyalty: flormar-hargeisa city_services row not found — skipping Flormar activation (re-run this migration once the listing exists)';
    return;
  end if;

  -- ------------------------------------------------------------------------
  -- 1. Program (upsert on the unique (listing_type, listing_id)).
  --    Earning rule: 1 USD = 1 point (configurable — stored, not hardcoded).
  -- ------------------------------------------------------------------------
  insert into loyalty_programs (
    listing_type, listing_id, name, name_ar, name_so,
    description, description_ar, description_so,
    enabled, points_per_currency, currency,
    expiration_enabled, expiration_months, welcome_bonus_points, redemption_ttl_days
  ) values (
    'city_service', v_listing_id,
    'Flormar Rewards', 'مكافآت فلورمار', 'Abaalmarinta Flormar',
    'Earn points on every Flormar purchase and unlock exclusive beauty rewards.',
    'اكسبي نقاطًا مع كل عملية شراء من فلورمار واحصلي على مكافآت تجميل حصرية.',
    'Ku hel dhibco iibsi kasta oo Flormar ah, kana faa''iidayso abaalmarino gaar ah.',
    true, 1, 'USD',
    false, 12, 100, 30
  )
  on conflict (listing_type, listing_id) do update
    set name = excluded.name,
        name_ar = excluded.name_ar,
        name_so = excluded.name_so,
        description = excluded.description,
        description_ar = excluded.description_ar,
        description_so = excluded.description_so,
        enabled = true,
        updated_at = now()
  returning id into v_program_id;

  -- ------------------------------------------------------------------------
  -- 2. Tiers. Thresholds are DB config — adjust freely in admin later.
  --    Tier is driven by LIFETIME points (points ever earned).
  -- ------------------------------------------------------------------------
  insert into loyalty_tiers (program_id, key, name, name_ar, name_so, min_points, max_points, multiplier, sort_order, color, benefits)
  values (v_program_id, 'member', 'Member', 'عضو', 'Xubin', 0, 499, 1.0, 0, '#B98EA7',
          '[{"en":"Earn 1 point per $1 spent","ar":"اكسبي نقطة واحدة لكل دولار","so":"Ku hel 1 dhibic $1 kasta"},
            {"en":"Birthday surprise","ar":"مفاجأة عيد الميلاد","so":"Hadiyad dhalasho"}]'::jsonb)
  on conflict (program_id, key) do update set name = excluded.name, min_points = excluded.min_points,
    max_points = excluded.max_points, multiplier = excluded.multiplier, sort_order = excluded.sort_order,
    color = excluded.color, benefits = excluded.benefits, updated_at = now()
  returning id into v_member_tier;

  insert into loyalty_tiers (program_id, key, name, name_ar, name_so, min_points, max_points, multiplier, sort_order, color, benefits)
  values (v_program_id, 'silver', 'Silver', 'فضي', 'Silfar', 500, 1499, 1.25, 1, '#9CA3AF',
          '[{"en":"Earn 1.25 points per $1","ar":"اكسبي 1.25 نقطة لكل دولار","so":"Ku hel 1.25 dhibic $1 kasta"},
            {"en":"Early access to sales","ar":"وصول مبكر للتخفيضات","so":"Helitaan hore ee iibka"}]'::jsonb)
  on conflict (program_id, key) do update set name = excluded.name, min_points = excluded.min_points,
    max_points = excluded.max_points, multiplier = excluded.multiplier, sort_order = excluded.sort_order,
    color = excluded.color, benefits = excluded.benefits, updated_at = now()
  returning id into v_silver_tier;

  insert into loyalty_tiers (program_id, key, name, name_ar, name_so, min_points, max_points, multiplier, sort_order, color, benefits)
  values (v_program_id, 'gold', 'Gold', 'ذهبي', 'Dahab', 1500, 3999, 1.5, 2, '#D4AF37',
          '[{"en":"Earn 1.5 points per $1","ar":"اكسبي 1.5 نقطة لكل دولار","so":"Ku hel 1.5 dhibic $1 kasta"},
            {"en":"Free gift with every order","ar":"هدية مجانية مع كل طلب","so":"Hadiyad bilaash ah dalab kasta"},
            {"en":"Exclusive Gold rewards","ar":"مكافآت ذهبية حصرية","so":"Abaalmarino Dahabi gaar ah"}]'::jsonb)
  on conflict (program_id, key) do update set name = excluded.name, min_points = excluded.min_points,
    max_points = excluded.max_points, multiplier = excluded.multiplier, sort_order = excluded.sort_order,
    color = excluded.color, benefits = excluded.benefits, updated_at = now()
  returning id into v_gold_tier;

  insert into loyalty_tiers (program_id, key, name, name_ar, name_so, min_points, max_points, multiplier, sort_order, color, benefits)
  values (v_program_id, 'platinum', 'Platinum', 'بلاتيني', 'Balaatin', 4000, null, 2.0, 3, '#5B6472',
          '[{"en":"Earn 2 points per $1","ar":"اكسبي نقطتين لكل دولار","so":"Ku hel 2 dhibic $1 kasta"},
            {"en":"VIP events & previews","ar":"فعاليات ومعاينات حصرية","so":"Munaasabado VIP iyo horudhac"},
            {"en":"Personal beauty advisor","ar":"مستشارة تجميل شخصية","so":"Lataliye quruxda gaar ah"}]'::jsonb)
  on conflict (program_id, key) do update set name = excluded.name, min_points = excluded.min_points,
    max_points = excluded.max_points, multiplier = excluded.multiplier, sort_order = excluded.sort_order,
    color = excluded.color, benefits = excluded.benefits, updated_at = now()
  returning id into v_plat_tier;

  -- ------------------------------------------------------------------------
  -- 3. Starter rewards — seeded ONLY on first activation (when the program
  --    has no rewards yet). On any re-run this block is skipped entirely so
  --    admin edits / real redemption history are never disturbed. All of
  --    these are ordinary editable rows, not business logic — fully
  --    translated (en/ar/so) so nothing shows English on /ar or /so.
  -- ------------------------------------------------------------------------
  if not exists (select 1 from loyalty_rewards where program_id = v_program_id) then
  insert into loyalty_rewards
    (program_id, name, name_ar, name_so,
     description, description_ar, description_so,
     reward_type, points_required, discount_value,
     free_product_text, free_product_ar, free_product_so,
     active, per_member_limit, min_tier_id, sort_order)
  values
    (v_program_id, '$5 Off Your Purchase', 'خصم 5 دولار', 'Dhimis $5',
     'Redeem points for $5 off any in-store Flormar purchase.',
     'استبدلي نقاطك بخصم 5 دولار على أي عملية شراء من متجر فلورمار.',
     'Ku beddel dhibcahaaga $5 dhimis iibsi kasta oo dukaanka Flormar ah.',
     'discount_amount', 500, 5, null, null, null, true, 5, null, 0),

    (v_program_id, '15% Off Any Order', 'خصم 15% على أي طلب', 'Dhimis 15% Dalab kasta',
     'Take 15% off your next Flormar order.',
     'احصلي على خصم 15% على طلبك التالي من فلورمار.',
     'Ku hel dhimis 15% dalabkaaga xiga ee Flormar.',
     'discount_percent', 800, 15, null, null, null, true, 3, null, 1),

    (v_program_id, 'Free Lip Product', 'منتج شفاه مجاني', 'Alaab Bushimo Bilaash ah',
     'Choose any Flormar lipstick or lip gloss, on us.',
     'اختاري أي أحمر شفاه أو ملمع شفاه من فلورمار، على حسابنا.',
     'Dooro bushimo-midab ama bushimo-dhalaalis Flormar kasta, annaga ayaa bixinayna.',
     'free_product', 1200, null,
     'Any Flormar lipstick or lip gloss (up to $12 value)',
     'أي أحمر شفاه أو ملمع شفاه من فلورمار (بقيمة تصل إلى 12 دولار)',
     'Bushimo-midab ama bushimo-dhalaalis Flormar kasta (qiimo ilaa $12)',
     true, 2, v_silver_tier, 2),

    (v_program_id, 'Free Full-Size Mascara', 'ماسكارا مجانية بالحجم الكامل', 'Maskaro Bilaash ah oo Cabbir Buuxa',
     'A full-size Flormar mascara of your choice.',
     'ماسكارا فلورمار بالحجم الكامل من اختيارك.',
     'Maskaro Flormar ah oo cabbir buuxa oo aad dooratay.',
     'free_product', 2000, null,
     'Any full-size Flormar mascara',
     'أي ماسكارا فلورمار بالحجم الكامل',
     'Maskaro Flormar ah oo cabbir buuxa',
     true, 2, v_gold_tier, 3),

    (v_program_id, '$20 Off Your Purchase', 'خصم 20 دولار', 'Dhimis $20',
     'Redeem points for $20 off any in-store Flormar purchase.',
     'استبدلي نقاطك بخصم 20 دولار على أي عملية شراء من متجر فلورمار.',
     'Ku beddel dhibcahaaga $20 dhimis iibsi kasta oo dukaanka Flormar ah.',
     'discount_amount', 2500, 20, null, null, null, true, 3, v_gold_tier, 4);
  end if;

  -- ------------------------------------------------------------------------
  -- 4. Starter offers (display-only) — same first-activation-only guard,
  --    fully translated. badge_text ('2X' / '-20%' / '+250') is a
  --    language-neutral symbol, left as-is for every locale.
  -- ------------------------------------------------------------------------
  if not exists (select 1 from loyalty_offers where program_id = v_program_id) then
  insert into loyalty_offers
    (program_id, title, title_ar, title_so,
     description, description_ar, description_so, badge_text, active, sort_order)
  values
    (v_program_id, 'Double Points Weekend', 'نهاية أسبوع النقاط المضاعفة', 'Todobaadka Dhibcaha Labalaaban',
     'Earn 2x points on all purchases this weekend.',
     'اكسبي ضعف النقاط على جميع المشتريات في نهاية هذا الأسبوع.',
     'Ku hel dhibco laba-jibbaaran iibsiga oo dhan dhammaadka usbuucaan.',
     '2X', true, 0),
    (v_program_id, '20% Off New Collection', 'خصم 20% على المجموعة الجديدة', 'Dhimis 20% Uruurinta Cusub',
     'Members save 20% on the latest Flormar collection.',
     'يوفّر الأعضاء 20% على أحدث مجموعة من فلورمار.',
     'Xubnuhu waxay ku badbaadiyaan 20% uruurinta Flormar ee ugu dambaysay.',
     '-20%', true, 1),
    (v_program_id, 'Birthday Month Bonus', 'مكافأة شهر الميلاد', 'Abaalmarinta Bisha Dhalashada',
     'Get 250 bonus points during your birthday month.',
     'احصلي على 250 نقطة إضافية خلال شهر ميلادك.',
     'Ku hel 250 dhibic dheeraad ah inta lagu jiro bisha dhalashadaada.',
     '+250', true, 2);
  end if;

  raise notice 'Flormar Rewards activated: program %, listing %', v_program_id, v_listing_id;
end $$;

-- ============================================================================
-- END 20260908000002_loyalty_flormar_activation.sql
-- ============================================================================
