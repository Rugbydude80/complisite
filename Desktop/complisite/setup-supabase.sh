#!/bin/bash

# Setup script for Supabase CLI with your project
# Run this script to link your local project to your Supabase instance

echo "🚀 Setting up Supabase CLI for CompliSite..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found: $(supabase --version)"

# Link to your Supabase project
echo "🔗 Linking to your Supabase project..."
echo "You'll need your project reference ID and service key."
echo ""

# Get project details from user
read -p "Enter your Supabase project reference ID (from dashboard URL): " PROJECT_REF
read -p "Enter your Supabase service key: " SERVICE_KEY

# Set environment variables
export SUPABASE_ACCESS_TOKEN=$SERVICE_KEY

# Link the project
echo "🔗 Linking project..."
supabase link --project-ref $PROJECT_REF

# Run migrations
echo "📦 Running database migrations..."
supabase db push

# Set up storage policies
echo "🗄️ Setting up storage policies..."
supabase db push --include-all

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Your database schema has been created"
echo "2. Storage policies are configured"
echo "3. You can now test image uploads in your app"
echo ""
echo "To verify everything is working:"
echo "- Go to your Supabase dashboard"
echo "- Check the 'Tables' section for your new tables"
echo "- Check the 'Storage' section for the evidence bucket"
echo "- Test uploading images in your app"
