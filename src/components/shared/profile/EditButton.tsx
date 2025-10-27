import { Pencil } from "lucide-react";

const EditButton = () => {
  return (
    <a
      href="/dashboard"
      className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium"
    >
      <Pencil className="size-4" />
      Edit Profile
    </a>
  );
};

export default EditButton;

