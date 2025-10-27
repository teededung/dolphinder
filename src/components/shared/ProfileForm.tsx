import { useState, type FormEvent } from "react";
import { Button } from "./Button";
import type { Developer } from "../../lib/auth";

interface ProfileFormProps {
  developer: Developer;
}

export default function ProfileForm({ developer }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);

      const response = await fetch("/api/profile/update", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update profile");
      }

      setSuccess("Profile updated successfully!");

      // Reload page after 1 second to show updated profile
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error("Profile update error:", err);
      setError(err.message || "Failed to update profile");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium">
          Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          defaultValue={developer.name}
          required
          className="bg-background focus:ring-primary w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label htmlFor="bio" className="mb-2 block text-sm font-medium">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={developer.bio || ""}
          className="bg-background focus:ring-primary w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label htmlFor="entry" className="mb-2 block text-sm font-medium">
          Level/Role
        </label>
        <input
          type="text"
          id="entry"
          name="entry"
          defaultValue={developer.entry || ""}
          placeholder="e.g., Senior Developer, Newbie, etc."
          className="bg-background focus:ring-primary w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label htmlFor="github" className="mb-2 block text-sm font-medium">
          GitHub URL
        </label>
        <input
          type="url"
          id="github"
          name="github"
          defaultValue={developer.github || ""}
          placeholder="https://github.com/username"
          className="bg-background focus:ring-primary w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label htmlFor="linkedin" className="mb-2 block text-sm font-medium">
          LinkedIn URL
        </label>
        <input
          type="url"
          id="linkedin"
          name="linkedin"
          defaultValue={developer.linkedin || ""}
          placeholder="https://linkedin.com/in/username"
          className="bg-background focus:ring-primary w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label htmlFor="telegram" className="mb-2 block text-sm font-medium">
          Telegram
        </label>
        <input
          type="text"
          id="telegram"
          name="telegram"
          defaultValue={developer.telegram || ""}
          placeholder="https://t.me/username or @username"
          className="bg-background focus:ring-primary w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label htmlFor="website" className="mb-2 block text-sm font-medium">
          Website
        </label>
        <input
          type="url"
          id="website"
          name="website"
          defaultValue={developer.website || ""}
          placeholder="https://yourwebsite.com"
          className="bg-background focus:ring-primary w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label htmlFor="slush_wallet" className="mb-2 block text-sm font-medium">
          Sui Wallet Address
        </label>
        <input
          type="text"
          id="slush_wallet"
          name="slush_wallet"
          defaultValue={developer.slush_wallet || ""}
          placeholder="0x..."
          className="bg-background focus:ring-primary w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label htmlFor="avatar" className="mb-2 block text-sm font-medium">
          Avatar URL
        </label>
        <input
          type="url"
          id="avatar"
          name="avatar"
          defaultValue={developer.avatar || ""}
          placeholder="https://example.com/avatar.jpg"
          className="bg-background focus:ring-primary w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2"
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
          {success}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}

