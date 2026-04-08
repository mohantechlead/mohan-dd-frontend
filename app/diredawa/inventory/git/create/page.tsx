"use client";

import { useRouter } from "next/navigation";
import { Form } from "@/components/form";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface GitFormValues {
  grn_no: string;
  purchase_no: string;
  item_name: string;
  code: string;
  purchase_quantity: number;
  received_quantity: number;
  variance_quantity: number;
  variance_type: string;
}

const GIT_API_URL = "/api/inventory/git";

export default function CreateGITPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const handleSubmit = async (values: GitFormValues) => {
    try {
      const res = await fetch(GIT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to create GIT",
          description: data?.detail || "Please try again.",
          variant: "error",
        });
        return;
      }
      showToast({ title: "GIT created", variant: "success" });
      router.push("/diredawa/inventory/git/display");
    } catch {
      showToast({
        title: "Failed to create GIT",
        description: "Something went wrong.",
        variant: "error",
      });
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-4">
      <div className="flex justify-start mb-10">
        <Button onClick={() => router.push("/diredawa/inventory/git/display")}>
          GIT
        </Button>
      </div>
      <h1 className="text-2xl font-bold mb-6 text-center">Create GIT</h1>
      <Form<GitFormValues>
        fields={[
          { name: "grn_no", label: "GRN No", required: true, placeholder: "Enter GRN No" },
          { name: "purchase_no", label: "Purchase No", required: true, placeholder: "Enter Purchase No" },
          { name: "item_name", label: "Item Name", required: true, placeholder: "Enter Item Name" },
          { name: "code", label: "Code", placeholder: "Enter Code" },
          { name: "purchase_quantity", label: "PO Quantity", required: true, type: "number", placeholder: "Enter PO Quantity" },
          { name: "received_quantity", label: "Received Quantity", required: true, type: "number", placeholder: "Enter Received Quantity" },
          { name: "variance_quantity", label: "Variance Quantity", required: true, type: "number", placeholder: "Enter Variance Quantity" },
          { name: "variance_type", label: "Variance Type", required: true, placeholder: "increased or decreased" },
        ]}
        onSubmit={handleSubmit}
        submitText="Create GIT"
      />
    </div>
  );
}

