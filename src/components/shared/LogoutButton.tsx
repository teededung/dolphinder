import { useState } from "react";
import { Button } from "./Button";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    
    try {
      // Call logout API
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        // Redirect to login page
        window.location.href = "/admin/login";
      } else {
        console.error("Logout failed");
        alert("Failed to logout. Please try again.");
      }
    } catch (err) {
      console.error("Logout error:", err);
      alert("Failed to logout. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleLogout}
      disabled={loading}
      className="bg-red-600 text-white hover:bg-red-700"
    >
      {loading ? "Logging out..." : "Logout"}
    </Button>
  );
}

