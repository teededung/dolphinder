import { PartyPopper } from "lucide-react";

const WelcomeBanner = () => {
  return (
    <div className="mx-auto mb-6 max-w-2xl rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
      <h3 className="flex items-center gap-2 font-semibold">
        <PartyPopper className="size-5" />
        Welcome to Dolphinder!
      </h3>
      <p className="mt-1 text-sm">
        Your profile has been created successfully! Complete your profile
        below to get verified by our team.
      </p>
    </div>
  );
};

export default WelcomeBanner;

