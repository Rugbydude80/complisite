'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2 } from 'lucide-react';
import { getSubscriptionPlans, createCheckoutUrl, PlanTier } from '@/lib/subscription-service';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PricingProps {
  userEmail?: string;
  organizationId?: string;
}

/**
 * Pricing component with three subscription tiers
 * Displays Lemon Squeezy subscription plans with checkout integration
 */
export default function Pricing({ userEmail, organizationId }: PricingProps) {
  const [plans, setPlans] = useState<PlanTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const subscriptionPlans = await getSubscriptionPlans();
      setPlans(subscriptionPlans);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (variantId: string, planName: string) => {
    if (!user && !userEmail) {
      // Redirect to login if not authenticated
      router.push('/auth/login?redirect=/pricing');
      return;
    }

    setCheckoutLoading(variantId);

    try {
      const email = user?.email || userEmail;
      if (!email) {
        throw new Error('No email available');
      }

      // Create checkout URL with Lemon Squeezy
      const checkoutUrl = await createCheckoutUrl(variantId, email, {
        organizationId: organizationId,
        planName: planName,
        userId: user?.id,
      });

      // Redirect to Lemon Squeezy checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Error creating checkout:', error);
      setCheckoutLoading(null);
      // You might want to show a toast notification here
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading plans...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Start your 14-day free trial today. No credit card required.
          Upgrade, downgrade, or cancel anytime.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative ${
              plan.popular ? 'border-primary shadow-lg scale-105' : 'border-border'
            }`}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                Most Popular
              </Badge>
            )}

            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">£{plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <CardDescription className="mt-2">
                Perfect for {plan.name.toLowerCase()} teams
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-0">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="pt-6">
              <Button
                className="w-full"
                variant={plan.popular ? 'default' : 'outline'}
                onClick={() => handleSubscribe(plan.variantId, plan.name)}
                disabled={checkoutLoading !== null}
              >
                {checkoutLoading === plan.variantId ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating checkout...
                  </>
                ) : (
                  <>
                    Start 14-day trial
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Trust indicators */}
      <div className="text-center mt-12 pt-8 border-t">
        <p className="text-sm text-muted-foreground mb-4">
          Trusted by thousands of construction professionals
        </p>
        <div className="flex justify-center items-center space-x-8 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Check className="h-4 w-4 mr-1" />
            14-day free trial
          </div>
          <div className="flex items-center">
            <Check className="h-4 w-4 mr-1" />
            Cancel anytime
          </div>
          <div className="flex items-center">
            <Check className="h-4 w-4 mr-1" />
            No setup fees
          </div>
          <div className="flex items-center">
            <Check className="h-4 w-4 mr-1" />
            UK/EU VAT included
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Simple pricing component for embedding in other pages
 */
export function PricingCard({
  plan,
  userEmail,
  onSubscribe
}: {
  plan: PlanTier;
  userEmail?: string;
  onSubscribe?: (variantId: string, planName: string) => void;
}) {
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleSubscribe = async () => {
    if (onSubscribe) {
      onSubscribe(plan.variantId, plan.name);
      return;
    }

    setCheckoutLoading(true);
    try {
      const email = userEmail;
      if (!email) {
        throw new Error('No email available');
      }

      const checkoutUrl = await createCheckoutUrl(plan.variantId, email, {
        planName: plan.name,
      });

      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Error creating checkout:', error);
      setCheckoutLoading(false);
    }
  };

  return (
    <Card className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
      {plan.popular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          Most Popular
        </Badge>
      )}

      <CardHeader className="text-center">
        <CardTitle>{plan.name}</CardTitle>
        <div className="mt-2">
          <span className="text-2xl font-bold">£{plan.price}</span>
          <span className="text-muted-foreground">/month</span>
        </div>
      </CardHeader>

      <CardContent>
        <ul className="space-y-2">
          {plan.features.slice(0, 4).map((feature, index) => (
            <li key={index} className="flex items-center text-sm">
              <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={plan.popular ? 'default' : 'outline'}
          onClick={handleSubscribe}
          disabled={checkoutLoading}
        >
          {checkoutLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading...
            </>
          ) : (
            'Start trial'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
