import { createClient } from '@/lib/supabase';
import Pricing from '@/components/pricing';

const supabase = createClient();

export default async function PricingPage() {
  // Get current user if available (server-side)
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background">
      <Pricing userEmail={user?.email} />
    </div>
  );
}
