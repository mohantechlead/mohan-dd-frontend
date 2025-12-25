"use client";

import { Form } from "@/components/form";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface ItemFormValues {
  item_name: string;
  hscode: string;
  internal_code: string;
}

const GRN_API_URL = "/api/inventory/items"

export default function HomePage() {
  const router = useRouter();
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
        console.error("Error creating GRN:", data);
        alert("Failed to submit");
        return;
      }
  
      console.log("GRN created successfully:", data);
      alert("GRN created successfully");
    } catch (error) {
      console.error("Error creating GRN:", error);
      alert("Failed to submit");
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