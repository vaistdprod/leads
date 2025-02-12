-- Update the send_signup_invitation function to use Loops
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

  -- Send email using Loops
  PERFORM net.http_post(
    url := 'https://app.loops.so/api/v1/transactional',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', current_setting('app.settings.loops_api_key')
    ),
    body := jsonb_build_object(
      'transactionalId', 'cm71j84ve00avc60b81b6fvj9',
      'email', user_email,
      'dataVariables', jsonb_build_object(
        'ConfirmationURL', signup_url
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