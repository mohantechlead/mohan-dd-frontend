 "use client";

import { Form } from "@/components/form";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

interface ItemFormValues {
  item_name: string;
  hscode: string;
  internal_code: string;
}

const GRN_API_URL = "/api/inventory/items"

export default function HomePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const handleSubmit = async (values: ItemFormValues) => {
    
    console.log("Form submitted:", values);
  
    // Transform values to match backend schema exactly
    const payload = {
      item_name: values.item_name,
      hscode: values.hscode,
      internal_code: values.internal_code,
    };
  
    console.log("Payload sent to backend:", payload);
  
    try {
      const res = await fetch(GRN_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), // send raw object
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        console.error("Error creating item:", data);
        showToast({
          title: "Failed to create item",
          description: (data as any)?.detail || "Please check the form and try again.",
          variant: "error",
        });
        return;
      }
  
      console.log("GRN created successfully:", data);
      showToast({
        title: "Item created",
        description: "The item has been created successfully.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error creating GRN:", error);
      showToast({
        title: "Failed to create item",
        description: "Something went wrong. Please try again.",
        variant: "error",
      });
    }
  };

  
  
  return (
    
    <div className="max-w-xl mx-auto mt-4">
      <div className="flex justify-start mb-10">
      <Button onClick={() => router.push("/diredawa/inventory/items/display")}> Display Items</Button>
      </div>
      
      <h1 className="text-2xl font-bold mb-6 text-center">Create Item</h1>

      <Form<ItemFormValues>
        fields={[
          { name: "item_name", label: "Item Name", type: "str", placeholder: "Enter Item Name"},
          { name: "hscode", label: "HS Code", type: "str", placeholder: "Enter HS Code"},
          { name: "internal_code", label: "Internal Code", type: "str", placeholder: "Enter Internal Code"},]}
        onSubmit={handleSubmit}
        submitText="Submit Item"
      >
      </Form>
    </div>
  );
}