/*
  # Adicionar método de pagamento aos registros

  1. Alterações
    - Adiciona coluna `payment_method` para armazenar o método de pagamento (boleto/cartão)
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'registrations' 
    AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE registrations ADD COLUMN payment_method text;
  END IF;
END $$;