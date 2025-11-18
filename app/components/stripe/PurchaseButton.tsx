'use client';

import { useState } from 'react';
import { useStripeCheckout } from '@/app/hooks/useStripeCheckout';
import { Button } from '@/app/components/ui/button';
import { Loader2, ShoppingCart } from 'lucide-react';

interface PurchaseButtonProps {
  testId: string;
  testTitle: string;
  price: number;
  currency?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary' | 'link';
  disabled?: boolean;
}

export function PurchaseButton({
  testId,
  testTitle,
  price,
  currency = 'USD',
  className,
  variant = 'default',
  disabled = false,
}: PurchaseButtonProps) {
  const { createCheckoutSession, loading, error } = useStripeCheckout();
  const [showError, setShowError] = useState(false);

  const handlePurchase = async () => {
    try {
      setShowError(false);
      await createCheckoutSession(testId);
    } catch (err) {
      setShowError(true);
      // Error is already handled in the hook
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handlePurchase}
        disabled={disabled || loading}
        variant={variant}
        className={className}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Purchase for {currency} ${price.toFixed(2)}
          </>
        )}
      </Button>

      {showError && error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
