#!/bin/bash
echo "Setting up environment variables for Impact Compass..."

if [ -f .env ]; then
  echo ".env file already exists. Skipping creation."
else
  echo "Creating .env file..."
  read -p "Enter your Supabase URL: " SUPABASE_URL
  read -p "Enter your Supabase Anon Key: " SUPABASE_ANON_KEY

  cat <<EOF > .env
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
EOF
  echo ".env file created successfully!"
fi
