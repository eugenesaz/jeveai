
import { Subscription } from "@/types/supabase";

export interface ActiveSubscriptionInfo extends Subscription {
  is_active: boolean;
}

export function isSubscriptionActive(subscription: Subscription | null): boolean {
  if (!subscription) return false;
  const now = new Date();
  return !!subscription.is_paid && (!subscription.end_date || new Date(subscription.end_date) > now);
}

export function getActiveSubscription(subscriptions: Subscription[]): ActiveSubscriptionInfo | null {
  if (!subscriptions || subscriptions.length === 0) return null;
  
  // Sort subscriptions by begin_date (newest first)
  const sortedSubs = [...subscriptions].sort(
    (a, b) => new Date(b.begin_date || "").getTime() - new Date(a.begin_date || "").getTime()
  );
  
  // Find active subscription
  const now = new Date();
  for (const sub of sortedSubs) {
    const isActive = sub.is_paid && (!sub.end_date || new Date(sub.end_date) > now);
    if (isActive) {
      return { ...sub, is_active: true };
    }
  }
  
  // Return the most recent subscription marked as inactive
  return sortedSubs.length > 0 ? { ...sortedSubs[0], is_active: false } : null;
}

export function formatDate(date: string | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString();
}
