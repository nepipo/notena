-- Erinnerungs-Präferenz: Array von Tagen (z.B. [1, 3] = 1 Tag und 3 Tage vorher)
ALTER TABLE public.nutzer_profil
  ADD COLUMN IF NOT EXISTS klausur_erinnerung_tage integer[]
    NOT NULL DEFAULT '{1,3}';

-- Hilfsfunktion für den Cron: liefert alle heutigen Erinnerungen
-- SECURITY DEFINER damit der service_role-Key cross-user abfragen kann
CREATE OR REPLACE FUNCTION public.klausur_erinnerungen_heute()
RETURNS TABLE(
  user_id          uuid,
  klausur_titel    text,
  fach_name        text,
  vorbereitung_prozent smallint,
  tage_bis         integer
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    np.id,
    sk.titel,
    COALESCE(sf.name, '')::text,
    sk.vorbereitung_prozent,
    (sk.datum::date - CURRENT_DATE)::integer
  FROM public.nutzer_profil np
  JOIN public.schule_klausur sk ON sk.user_id = np.id
  LEFT JOIN public.schule_fach sf ON sf.id = sk.fach_id
  WHERE
    np.klausur_erinnerung_tage IS NOT NULL
    AND cardinality(np.klausur_erinnerung_tage) > 0
    AND (sk.datum::date - CURRENT_DATE) = ANY(np.klausur_erinnerung_tage)
    AND sk.datum::date >= CURRENT_DATE
  ORDER BY np.id, sk.datum;
$$;
