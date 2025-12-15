"use client";

import { Form } from "@/components/form";
import { ItemsForm } from "@/components/itemsform";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface GrnFormValues {
  date: string;
  grn_no: string;
  supplier_name: string;
  plate_no: string;
  purchase_no: string;
  ECD_no: string;
  transporter_name: string;
  storekeeper_name: string;
  items: {
    item_name: string;
    quantity: number;
    unit_measurement: string;
    internal_code: string;
    bags: number;
  }[];
}

const GRN_API_URL = "/api/inventory/grn"

export default function HomePage() {
  const router = useRouter();
  const handleSubmit = async (values: GrnFormValues) => {
    
    console.log("Form submitted:", values);
  
    // Transform values to match backend schema exactly
    const payload = {
      supplier_name: values.supplier_name,
      grn_no: values.grn_no,
      plate_no: values.plate_no,
      purchase_no: values.purchase_no,
      date: values.date, // ISO string is fine
      ECD_no: values.ECD_no, // ensure correct case
      transporter_name: values.transporter_name,
      storekeeper_name: values.storekeeper_name,
      items: values.items.map(item => ({
        item_name: item.item_name,
        quantity: Number(item.quantity), // convert string → int
        unit_measurement: String(item.unit_measurement),
        bags: String(item.bags),
        internal_code: String(item.internal_code),
      })),
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
      <Button onClick={() => router.push("/diredawa/inventory/grn/display")}> Display GRN</Button>
      </div>
      
      <h1 className="text-2xl font-bold mb-6 text-center">Create GRN</h1>

      <Form<GrnFormValues>
        fields={[
          { name: "date", label: "Date", type: "date", placeholder: "Enter Date" },
          { name: "grn_no", label: "GRN No", placeholder: "Enter GRN No" },
          { name: "supplier_name", label: "Supplier Name", placeholder: "Enter Supplier Name" },
          { name: "plate_no", label: "Plate No", placeholder: "Enter Plate No" },
          { name: "purchase_no", label: "Purchase No", placeholder: "Enter Purchase No" },
          { name: "ECD_no", label: "ECD no", placeholder: "Enter ECD No" },
          { name: "transporter_name", label: "Transporter Name", placeholder: "Enter Transporter Name" },
          { name: "storekeeper_name", label: "Store Keeper Name", placeholder: "Enter Store Keeper Name" },
        ]}
        onSubmit={handleSubmit}
        submitText="Submit GRN"
      >
        <h2 className="text-center font-semibold mt-4">GRN Items</h2>
        <ItemsForm />
      </Form>
    </div>
  );
}