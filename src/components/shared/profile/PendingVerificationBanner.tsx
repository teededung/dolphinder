import { Clock } from "lucide-react";

const PendingVerificationBanner = () => {
  return (
    <div className="mx-auto mb-6 max-w-2xl rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
      <h3 className="flex items-center gap-2 font-semibold">
        <Clock className="size-5" />
        Pending Verification
      </h3>
      <p className="mt-1 text-sm">
        Your profile is awaiting admin approval. You can edit your
        information below.
      </p>
    </div>
  );
};

export default PendingVerificationBanner;

