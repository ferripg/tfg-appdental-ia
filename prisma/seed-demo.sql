-- =============================================================================
-- Dades de DEMO per a la clínica dental (versió IA)
-- NIFs/CIFs amb checksum REAL vàlid. Dades parcialment diferents del repo
-- manual a propòsit, per evidenciar que són dues bases de dades independents.
-- Executar:  Get-Content prisma\seed-demo.sql | docker exec -i dentaia-postgres psql -U appdental -d appdental
-- =============================================================================

BEGIN;

-- --- Tipus de despesa ---
INSERT INTO "TipusDespesa" (id, codi, descripcio, deduible, grup, concepte, "esAmortitzable", actiu, "createdAt", "updatedAt") VALUES
  ('demo-td-mat',   'MAT',   'Material dental fungible',  true, 6, 'Consumibles clínics',                false, true, NOW(), NOW()),
  ('demo-td-llog',  'LLOG',  'Lloguer del local',         true, 6, 'Lloguer mensual de la consulta',     false, true, NOW(), NOW()),
  ('demo-td-subm',  'SUBM',  'Subministraments',          true, 6, 'Llum, aigua, internet',              false, true, NOW(), NOW()),
  ('demo-td-equip', 'EQUIP', 'Equipament i mobiliari',    true, 2, 'Béns d''inversió amortitzables',     true,  true, NOW(), NOW()),
  ('demo-td-net',   'NET',   'Neteja i desinfecció',      true, 6, 'Productes de neteja',                false, true, NOW(), NOW()),
  ('demo-td-form',  'FORM',  'Formació i congressos',     true, 6, 'Cursos i formació continuada',       false, true, NOW(), NOW()),
  ('demo-td-asseg', 'ASSEG', 'Assegurances',              true, 6, 'Responsabilitat civil',              false, true, NOW(), NOW()),
  ('demo-td-gest',  'GEST',  'Serveis professionals',     true, 6, 'Gestoria i assessorament',           false, true, NOW(), NOW())
ON CONFLICT (codi) DO NOTHING;

-- --- Proveïdors (alguns compartits amb el manual + alguns propis) ---
INSERT INTO "Proveidor" (id, nif, nom, "codiBis", actiu, adreca, "codiPostal", poblacio, email, telefon, "personaContacte", iban, notes, "createdAt", "updatedAt") VALUES
  ('demo-prov-001', 'A23456783', 'Henry Schein España SA',  NULL, true, 'Av. Europa 12',    '28100', 'Madrid',     'info@henryschein.es',     '911234567', 'Carlos Ruiz', NULL, NULL, NOW(), NOW()),
  ('demo-prov-002', 'B99999997', 'Bertran Dental SL',       NULL, true, 'C/ Balmes 200',    '08006', 'Barcelona',  'info@bertrandental.cat',  '932001020', 'Laura Camps', NULL, NULL, NOW(), NOW()),
  ('demo-prov-003', 'A13579248', 'Ortodòncia Tècnica SA',   NULL, true, 'C/ València 88',    '46002', 'València',    'comandes@ortotec.es',     '963334455', NULL,          NULL, NULL, NOW(), NOW()),
  ('demo-prov-004', 'B58392127', 'Dental Ibérica SL',       NULL, true, 'C/ Indústria 45',  '08025', 'Barcelona',  'comandes@dentaliberica.es','934567890','Marta Solé',  NULL, NULL, NOW(), NOW()),
  ('demo-prov-005', '45678912S', 'Pere Gual (informàtica)', NULL, true, 'C/ Nou 14',        '17004', 'Girona',     'pere.gual@gmail.com',     '600998877', NULL,          NULL, NULL, NOW(), NOW())
ON CONFLICT (nif) DO NOTHING;

-- --- Despeses (imports i dates diferents del manual) ---
INSERT INTO "Despesa" (id, "dataFactura", "dataPagament", import, "numFactura", descripcio, "tipusDespesaId", "proveidorId", "userId", "createdAt", "updatedAt") VALUES
  ('demo-desp-01', '2025-01-08', '2025-01-12', 1100.00, 'LLOG-2025-01', 'Lloguer gener',                       'demo-td-llog',  NULL,            'ovW6kDPSR5eLodD2tby8dHvo0QAfLCeA', NOW(), NOW()),
  ('demo-desp-02', '2025-01-25', '2025-02-05',  528.60, 'HS-2025-0091', 'Material dental (compòsits, fresas)',  'demo-td-mat',   'demo-prov-001', 'ovW6kDPSR5eLodD2tby8dHvo0QAfLCeA', NOW(), NOW()),
  ('demo-desp-03', '2025-02-03', NULL,           198.40, 'IBERD-0203',   'Factura llum febrer',                 'demo-td-subm',  NULL,            'ovW6kDPSR5eLodD2tby8dHvo0QAfLCeA', NOW(), NOW()),
  ('demo-desp-04', '2025-02-14', '2025-02-14', 8900.00, 'BD-2025-0455', 'Equip raigs X panoràmic (amortitzable)','demo-td-equip','demo-prov-002', 'ovW6kDPSR5eLodD2tby8dHvo0QAfLCeA', NOW(), NOW()),
  ('demo-desp-05', '2025-03-02', '2025-03-10', 1100.00, 'LLOG-2025-03', 'Lloguer març',                        'demo-td-llog',  NULL,            'ovW6kDPSR5eLodD2tby8dHvo0QAfLCeA', NOW(), NOW()),
  ('demo-desp-06', '2025-03-18', '2025-03-18',  675.20, 'OT-2025-0312', 'Aparells ortodòncia',                 'demo-td-mat',   'demo-prov-003', 'ovW6kDPSR5eLodD2tby8dHvo0QAfLCeA', NOW(), NOW()),
  ('demo-desp-07', '2025-04-05', NULL,           420.00, 'PG-2025-0007', 'Manteniment informàtic + software',   'demo-td-gest',  'demo-prov-005', 'ovW6kDPSR5eLodD2tby8dHvo0QAfLCeA', NOW(), NOW()),
  ('demo-desp-08', '2025-04-22', '2025-05-01',  310.50, 'DI-2025-0501', 'Guants i esterilització',             'demo-td-net',   'demo-prov-004', 'ovW6kDPSR5eLodD2tby8dHvo0QAfLCeA', NOW(), NOW()),
  ('demo-desp-09', '2025-05-09', '2025-05-09',  750.00, 'SECPRE-2025',  'Congrés implantologia',               'demo-td-form',  NULL,            'ovW6kDPSR5eLodD2tby8dHvo0QAfLCeA', NOW(), NOW()),
  ('demo-desp-10', '2025-06-15', NULL,           905.00, 'AXA-2025-RC',  'Assegurança RC anual',                'demo-td-asseg', NULL,            'ovW6kDPSR5eLodD2tby8dHvo0QAfLCeA', NOW(), NOW()),
  ('demo-desp-11', '2025-09-20', '2025-09-28', 1100.00, 'LLOG-2025-09', 'Lloguer setembre',                    'demo-td-llog',  NULL,            'ovW6kDPSR5eLodD2tby8dHvo0QAfLCeA', NOW(), NOW()),
  ('demo-desp-12', '2026-01-10', '2026-01-15', 1150.00, 'LLOG-2026-01', 'Lloguer gener 2026',                  'demo-td-llog',  NULL,            'ovW6kDPSR5eLodD2tby8dHvo0QAfLCeA', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- --- Despeses de l'exercici EN CURS (2026), per donar activitat al tauler (IA-13) ---
INSERT INTO "Despesa" (id, "dataFactura", "dataPagament", import, "numFactura", descripcio, "tipusDespesaId", "proveidorId", "userId", "createdAt", "updatedAt") VALUES
  ('d2026-02', '2026-01-22', NULL, 612.40,  'HS-2026-0012', 'Material dental gener',       'demo-td-mat',   'demo-prov-001', 'ovW6kDPSR5eLodD2tby8dHvo0QAfLCeA', NOW(), NOW()),
  ('d2026-03', '2026-02-03', NULL, 1150.00, 'LLOG-2026-02', 'Lloguer febrer',              'demo-td-llog',  NULL,            'ovW6kDPSR5eLodD2tby8dHvo0QAfLCeA', NOW(), NOW()),
  ('d2026-04', '2026-02-17', NULL, 340.00,  'DI-2026-0044', 'Neteja i desinfecció febrer', 'demo-td-net',   'demo-prov-004', 'ovW6kDPSR5eLodD2tby8dHvo0QAfLCeA', NOW(), NOW()),
  ('d2026-05', '2026-02-26', NULL, 205.80,  'IBERD-2026-02','Factura llum febrer',         'demo-td-subm',  NULL,            'ovW6kDPSR5eLodD2tby8dHvo0QAfLCeA', NOW(), NOW()),
  ('d2026-06', '2026-03-05', NULL, 1150.00, 'LLOG-2026-03', 'Lloguer març',                'demo-td-llog',  NULL,            'ovW6kDPSR5eLodD2tby8dHvo0QAfLCeA', NOW(), NOW()),
  ('d2026-07', '2026-03-19', NULL, 880.50,  'OT-2026-0101', 'Aparells ortodòncia',         'demo-td-mat',   'demo-prov-003', 'ovW6kDPSR5eLodD2tby8dHvo0QAfLCeA', NOW(), NOW()),
  ('d2026-08', '2026-03-28', NULL, 420.00,  'PG-2026-0003', 'Manteniment informàtic',      'demo-td-gest',  'demo-prov-005', 'ovW6kDPSR5eLodD2tby8dHvo0QAfLCeA', NOW(), NOW()),
  ('d2026-09', '2026-04-02', NULL, 1150.00, 'LLOG-2026-04', 'Lloguer abril',               'demo-td-llog',  NULL,            'ovW6kDPSR5eLodD2tby8dHvo0QAfLCeA', NOW(), NOW()),
  ('d2026-10', '2026-04-15', NULL, 533.20,  'HS-2026-0031', 'Material dental abril',       'demo-td-mat',   'demo-prov-001', 'ovW6kDPSR5eLodD2tby8dHvo0QAfLCeA', NOW(), NOW()),
  ('d2026-11', '2026-04-22', NULL, 905.00,  'AXA-2026-RC',  'Assegurança RC anual',        'demo-td-asseg', NULL,            'ovW6kDPSR5eLodD2tby8dHvo0QAfLCeA', NOW(), NOW()),
  ('d2026-12', '2026-05-04', NULL, 1150.00, 'LLOG-2026-05', 'Lloguer maig',                'demo-td-llog',  NULL,            'ovW6kDPSR5eLodD2tby8dHvo0QAfLCeA', NOW(), NOW()),
  ('d2026-13', '2026-05-20', NULL, 600.00,  'SEPA-2026',    'Curs de formació',            'demo-td-form',  NULL,            'ovW6kDPSR5eLodD2tby8dHvo0QAfLCeA', NOW(), NOW()),
  ('d2026-14', '2026-06-03', NULL, 1150.00, 'LLOG-2026-06', 'Lloguer juny',                'demo-td-llog',  NULL,            'ovW6kDPSR5eLodD2tby8dHvo0QAfLCeA', NOW(), NOW()),
  ('d2026-15', '2026-06-16', NULL, 410.00,  'HS-2026-0050', 'Material dental juny',        'demo-td-mat',   'demo-prov-001', 'ovW6kDPSR5eLodD2tby8dHvo0QAfLCeA', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

COMMIT;

SELECT 'Proveidor' AS taula, COUNT(*) FROM "Proveidor"
UNION ALL SELECT 'TipusDespesa', COUNT(*) FROM "TipusDespesa"
UNION ALL SELECT 'Despesa', COUNT(*) FROM "Despesa";
