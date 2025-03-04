/*
  # Add Disputed Status to Payments

  1. Changes
    - Add 'disputed' to payment_status enum
*/

ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'disputed';