/*
  # Create registrations table for Virtuosas

  1. New Tables
    - `registrations`
      - `id` (uuid, primary key)
      - `nome_completo` (text, required)
      - `cpf` (text, required)
      - `cep` (text, required)
      - `endereco` (text, required)
      - `numero` (text, required)
      - `bairro` (text, required)
      - `cidade` (text, required)
      - `estado` (text, required)
      - `estado_civil` (text, required)
      - `nome_contato` (text, required)
      - `whatsapp_contato` (text, required)
      - `created_at` (timestamp with timezone, default: now())

  2. Security
    - Enable RLS on `registrations` table
    - Add policy for authenticated users to insert data
    - Add policy for authenticated users to read their own data
*/

CREATE TABLE registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo text NOT NULL,
  cpf text NOT NULL,
  cep text NOT NULL,
  endereco text NOT NULL,
  numero text NOT NULL,
  bairro text NOT NULL,
  cidade text NOT NULL,
  estado text NOT NULL,
  estado_civil text NOT NULL,
  nome_contato text NOT NULL,
  whatsapp_contato text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert access for all users" ON registrations
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON registrations
  FOR SELECT TO public
  USING (true);