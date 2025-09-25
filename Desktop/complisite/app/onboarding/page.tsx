import { createClient } from '@/lib/supabase';
import OnboardingFlow from '@/components/onboarding-flow';
import { redirect } from 'next/navigation';

const supabase = createClient();

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // Get current user
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/login?redirect=/onboarding');
  }

  // Get organization ID from search params or find user's organization
  let organizationId = searchParams.organization_id as string;

  if (!organizationId) {
    // Try to find user's organization
    const { data: memberships } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1);

    if (memberships && memberships.length > 0) {
      organizationId = memberships[0].organization_id;
    }
  }

  if (!organizationId) {
    redirect('/pricing');
  }

  return (
    <div className="min-h-screen bg-background">
      <OnboardingFlow organizationId={organizationId} userId={user.id} />
    </div>
  );
}
