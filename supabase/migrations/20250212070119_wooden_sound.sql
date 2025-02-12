-- Function to send invitation email
CREATE OR REPLACE FUNCTION send_signup_invitation(
  user_email text,
  expiry_hours integer DEFAULT 24,
  app_url text DEFAULT current_setting('app.settings.url', true)
)
RETURNS json AS $$
DECLARE
  token_data json;
  signup_url text;
BEGIN
  -- Create signup token
  token_data := create_signup_token(user_email, expiry_hours);
  
  -- Construct signup URL
  signup_url := app_url || '/auth/register?signup_token=' || 
                (token_data->>'token') || 
                '&email=' || user_email;

  -- Send email using Supabase Edge Functions
  PERFORM net.http_post(
    url := current_setting('app.settings.edge_function_url') || '/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.edge_function_key')
    ),
    body := jsonb_build_object(
      'to', user_email,
      'subject', 'Pozvánka k registraci',
      'body', format(
        'Dobrý den,

        byli jste pozváni k vytvoření účtu v naší aplikaci.

        Pro dokončení registrace klikněte na následující odkaz:
        %s

        Tento odkaz je platný %s hodin.

        S pozdravem,
        Váš tým',
        signup_url,
        expiry_hours
      )
    )
  );

  RETURN json_build_object(
    'success', true,
    'email', user_email,
    'signup_url', signup_url,
    'expires_at', token_data->>'expires_at'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke a signup token
CREATE OR REPLACE FUNCTION revoke_signup_token(token_to_revoke text)
RETURNS boolean AS $$
DECLARE
  token_exists boolean;
BEGIN
  -- Check if token exists and is not used
  SELECT EXISTS (
    SELECT 1 
    FROM signup_tokens 
    WHERE token = token_to_revoke 
    AND NOT used
  ) INTO token_exists;

  IF NOT token_exists THEN
    RAISE EXCEPTION 'Token not found or already used';
  END IF;

  -- Update token to be expired
  UPDATE signup_tokens
  SET expires_at = now()
  WHERE token = token_to_revoke;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke all tokens for an email
CREATE OR REPLACE FUNCTION revoke_email_tokens(user_email text)
RETURNS integer AS $$
DECLARE
  affected_rows integer;
BEGIN
  UPDATE signup_tokens
  SET expires_at = now()
  WHERE email = user_email
  AND NOT used
  AND expires_at > now();

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens(days_to_keep integer DEFAULT 30)
RETURNS integer AS $$
DECLARE
  affected_rows integer;
BEGIN
  DELETE FROM signup_tokens
  WHERE (used AND used_at < now() - (days_to_keep || ' days')::interval)
     OR (NOT used AND expires_at < now() - '1 day'::interval);

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a cron job to cleanup expired tokens daily
SELECT cron.schedule(
  'cleanup-expired-tokens',
  '0 0 * * *', -- Run at midnight every day
  $$SELECT cleanup_expired_tokens(30)$$
);