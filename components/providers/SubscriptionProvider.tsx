"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useSubscription, type TrialStatus } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/ui/UpgradeModal";

interface SubscriptionContextValue {
  isPro: boolean;
  plan: "free" | "pro";
  trialStatus: TrialStatus;
  startTrial: () => void;
  resetTrial: () => void;
  showUpgradeModal: boolean;
  setShowUpgradeModal: (show: boolean) => void;
  onUnlock: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

interface SubscriptionProviderProps {
  children: ReactNode;
  isGuest?: boolean;
  onRequestAuth?: () => void;
}

export function SubscriptionProvider({
  children,
  isGuest = false,
  onRequestAuth,
}: SubscriptionProviderProps) {
  const subscription = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const onUnlock = () => setShowUpgradeModal(true);

  const handleRequestAuth = () => {
    setShowUpgradeModal(false);
    onRequestAuth?.();
  };

  return (
    <SubscriptionContext.Provider
      value={{
        ...subscription,
        showUpgradeModal,
        setShowUpgradeModal,
        onUnlock,
      }}
    >
      {children}
      {showUpgradeModal && (
        <UpgradeModal
          trialStatus={subscription.trialStatus}
          isGuest={isGuest}
          onStartTrial={subscription.startTrial}
          onRequestAuth={handleRequestAuth}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error(
      "useSubscriptionContext must be used within a SubscriptionProvider"
    );
  }
  return ctx;
}
