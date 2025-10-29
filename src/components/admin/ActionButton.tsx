import { useState } from "react";
import { Button } from "../ui/button";

interface ActionButtonProps {
  action: "approve" | "reject" | "revoke";
  developerId: string;
  children: React.ReactNode;
  variant?: "default" | "destructive" | "ghost" | "outline" | "secondary" | "link";
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";
  className?: string;
}

export default function ActionButton({
  action,
  developerId,
  children,
  variant = "default",
  size = "sm",
  className = "",
}: ActionButtonProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleClick = async () => {
    const confirmed = confirm(
      `Are you sure you want to ${action} this developer?`
    );
    if (!confirmed) return;

    console.log('[ActionButton] Clicked:', { action, developerId });
    setLoading(true);

    try {
      console.log('[ActionButton] Sending request...');
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          developerId,
          action,
        }),
      });

      console.log('[ActionButton] Response status:', response.status);
      const result = await response.json();
      console.log('[ActionButton] Response data:', result);

      if (!response.ok) {
        console.error('[ActionButton] API returned error:', result);
        throw new Error(result.error || "Failed to update developer");
      }

      if (!result.success) {
        console.error('[ActionButton] API returned success=false:', result);
        throw new Error(result.error || "Update failed");
      }

      console.log('[ActionButton] ✅ Action completed successfully:', result.message);

      // Show success state
      setSuccess(true);
      
      // Reload page after 1 second to reflect changes (give DB time to update)
      setTimeout(() => {
        console.log('[ActionButton] Reloading page...');
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('[ActionButton] Error:', error);
      setLoading(false);
      alert(error.message || "Failed to update developer");
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={loading || success}
      variant={variant}
      size={size}
      className={className}
    >
      {success ? "Success!" : loading ? "Processing..." : children}
    </Button>
  );
}

