-- Run in SQL Editor only AFTER creating/signing up your own Auth account.
-- Replace the email below. The script requires exactly one matching account.
DO $$
DECLARE account_email text := 'REPLACE_WITH_YOUR_LOGIN_EMAIL'; account_id uuid; count_users integer;
BEGIN
  SELECT count(*), (array_agg(id))[1] INTO count_users,account_id FROM auth.users
  WHERE lower(email)=lower(account_email);
  IF count_users<>1 THEN RAISE EXCEPTION 'Expected one Auth user for this email. Create the account first and replace the placeholder.'; END IF;
  UPDATE public.profiles SET role='admin' WHERE id=account_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile missing. Check setup trigger.'; END IF;
END $$;
