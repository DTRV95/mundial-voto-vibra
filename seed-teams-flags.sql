-- Update team codes and flag emojis — exact names from DB
-- Run this in Supabase SQL Editor

UPDATE teams SET code = 'RSA', flag = '🇿🇦' WHERE name = 'África do Sul';
UPDATE teams SET code = 'GER', flag = '🇩🇪' WHERE name = 'Alemanha';
UPDATE teams SET code = 'KSA', flag = '🇸🇦' WHERE name = 'Arábia Saudita';
UPDATE teams SET code = 'ALG', flag = '🇩🇿' WHERE name = 'Argélia';
UPDATE teams SET code = 'ARG', flag = '🇦🇷' WHERE name = 'Argentina';
UPDATE teams SET code = 'AUS', flag = '🇦🇺' WHERE name = 'Austrália';
UPDATE teams SET code = 'AUT', flag = '🇦🇹' WHERE name = 'Áustria';
UPDATE teams SET code = 'BEL', flag = '🇧🇪' WHERE name = 'Bélgica';
UPDATE teams SET code = 'BIH', flag = '🇧🇦' WHERE name = 'Bósnia';
UPDATE teams SET code = 'BRA', flag = '🇧🇷' WHERE name = 'Brasil';
UPDATE teams SET code = 'CPV', flag = '🇨🇻' WHERE name = 'Cabo Verde';
UPDATE teams SET code = 'CAN', flag = '🇨🇦' WHERE name = 'Canadá';
UPDATE teams SET code = 'CZE', flag = '🇨🇿' WHERE name = 'Chéquia';
UPDATE teams SET code = 'COL', flag = '🇨🇴' WHERE name = 'Colômbia';
UPDATE teams SET code = 'KOR', flag = '🇰🇷' WHERE name = 'Coreia do Sul';
UPDATE teams SET code = 'CIV', flag = '🇨🇮' WHERE name = 'Costa do Marfim';
UPDATE teams SET code = 'CRO', flag = '🇭🇷' WHERE name = 'Croácia';
UPDATE teams SET code = 'CUR', flag = '🇨🇼' WHERE name = 'Curaçau';
UPDATE teams SET code = 'EGY', flag = '🇪🇬' WHERE name = 'Egito';
UPDATE teams SET code = 'ECU', flag = '🇪🇨' WHERE name = 'Equador';
UPDATE teams SET code = 'SCO', flag = '🏴󠁧󠁢󠁳󠁣󠁴󠁿' WHERE name = 'Escócia';
UPDATE teams SET code = 'ESP', flag = '🇪🇸' WHERE name = 'Espanha';
UPDATE teams SET code = 'USA', flag = '🇺🇸' WHERE name = 'EUA';
UPDATE teams SET code = 'FRA', flag = '🇫🇷' WHERE name = 'França';
UPDATE teams SET code = 'GHA', flag = '🇬🇭' WHERE name = 'Gana';
UPDATE teams SET code = 'HAI', flag = '🇭🇹' WHERE name = 'Haiti';
UPDATE teams SET code = 'NED', flag = '🇳🇱' WHERE name = 'Holanda';
UPDATE teams SET code = 'ENG', flag = '🏴󠁧󠁢󠁥󠁮󠁧󠁿' WHERE name = 'Inglaterra';
UPDATE teams SET code = 'IRN', flag = '🇮🇷' WHERE name = 'Irão';
UPDATE teams SET code = 'IRQ', flag = '🇮🇶' WHERE name = 'Iraque';
UPDATE teams SET code = 'JPN', flag = '🇯🇵' WHERE name = 'Japão';
UPDATE teams SET code = 'JOR', flag = '🇯🇴' WHERE name = 'Jordânia';
UPDATE teams SET code = 'MAR', flag = '🇲🇦' WHERE name = 'Marrocos';
UPDATE teams SET code = 'MEX', flag = '🇲🇽' WHERE name = 'México';
UPDATE teams SET code = 'NOR', flag = '🇳🇴' WHERE name = 'Noruega';
UPDATE teams SET code = 'NZL', flag = '🇳🇿' WHERE name = 'Nova Zelândia';
UPDATE teams SET code = 'PAN', flag = '🇵🇦' WHERE name = 'Panamá';
UPDATE teams SET code = 'PAR', flag = '🇵🇾' WHERE name = 'Paraguai';
UPDATE teams SET code = 'POR', flag = '🇵🇹' WHERE name = 'Portugal';
UPDATE teams SET code = 'QAT', flag = '🇶🇦' WHERE name = 'Qatar';
UPDATE teams SET code = 'COD', flag = '🇨🇩' WHERE name = 'Rd. Congo';
UPDATE teams SET code = 'SEN', flag = '🇸🇳' WHERE name = 'Senegal';
UPDATE teams SET code = 'SWE', flag = '🇸🇪' WHERE name = 'Suécia';
UPDATE teams SET code = 'SUI', flag = '🇨🇭' WHERE name = 'Suíça';
UPDATE teams SET code = 'TUN', flag = '🇹🇳' WHERE name = 'Tunísia';
UPDATE teams SET code = 'TUR', flag = '🇹🇷' WHERE name = 'Turquia';
UPDATE teams SET code = 'URU', flag = '🇺🇾' WHERE name = 'Uruguai';
UPDATE teams SET code = 'UZB', flag = '🇺🇿' WHERE name = 'Uzbequistão';

-- Verify
SELECT name, code, flag FROM teams ORDER BY name;
