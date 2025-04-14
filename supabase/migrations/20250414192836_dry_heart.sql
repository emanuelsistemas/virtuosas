/*
  # Add verification status

  1. Changes
    - Add `verified` column to registrations table with default value of false
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'registrations' 
    AND column_name = 'verified'
  ) THEN
    ALTER TABLE registrations ADD COLUMN verified boolean DEFAULT false;
  END IF;
END $$;