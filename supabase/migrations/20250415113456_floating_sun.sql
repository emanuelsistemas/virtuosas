/*
  # Adicionar número sequencial aos registros

  1. Alterações
    - Adiciona coluna `sequence_number` para armazenar o número sequencial
    - Preenche os números sequenciais para registros existentes baseado na ordem de criação
    - Adiciona trigger para automaticamente gerar números sequenciais para novos registros

  2. Detalhes
    - Números são atribuídos sequencialmente baseado na data de criação
    - Trigger garante que novos registros recebam o próximo número da sequência
*/

-- Adiciona a coluna sequence_number
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS sequence_number integer;

-- Cria uma sequence para gerenciar os números
CREATE SEQUENCE IF NOT EXISTS registrations_sequence_seq;

-- Atualiza registros existentes com números sequenciais baseado na ordem de criação
WITH numbered_rows AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_num
  FROM registrations
)
UPDATE registrations
SET sequence_number = numbered_rows.row_num
FROM numbered_rows
WHERE registrations.id = numbered_rows.id;

-- Atualiza a sequence para começar após o último número usado
SELECT setval('registrations_sequence_seq', COALESCE((SELECT MAX(sequence_number) FROM registrations), 0));

-- Cria função para gerar próximo número sequencial
CREATE OR REPLACE FUNCTION generate_registration_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.sequence_number := nextval('registrations_sequence_seq');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cria trigger para automaticamente gerar números para novos registros
DROP TRIGGER IF EXISTS set_registration_number ON registrations;
CREATE TRIGGER set_registration_number
  BEFORE INSERT ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION generate_registration_number();

-- Adiciona constraint para garantir que sequence_number seja único e não nulo
ALTER TABLE registrations 
  ALTER COLUMN sequence_number SET NOT NULL,
  ADD CONSTRAINT sequence_number_unique UNIQUE (sequence_number);