import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { ContactList } from "@/components/crm/ContactList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { useFetch } from "@/hooks/useFetch";
import { api } from "@/lib/api";
import { PageSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { Users } from "lucide-react";

export default function Contacts() {
  const navigate = useNavigate();
  const { data: contacts = [], loading, error } = useFetch(() => api.get("/contacts"), []);

  function handleSelect(contact) {
    navigate(ROUTES.CONTACT_DETAIL.replace(":id", contact.id));
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title="Contacts"
        breadcrumbs={[{ label: "Contacts" }]}
        actions={[
          <Button key="add" size="sm">
            <Plus size={15} /> Add Contact
          </Button>,
        ]}
      />

      {loading && <PageSpinner />}

      {!loading && error && (
        <EmptyState
          icon={<Users size={32} />}
          title="Could not load contacts"
          description={error}
        />
      )}

      {!loading && !error && (
        <ContactList contacts={contacts} onSelect={handleSelect} />
      )}
    </div>
  );
}
