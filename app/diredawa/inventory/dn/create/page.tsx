"use client";

import { Form } from "@/components/form";
import { ItemsForm } from "@/components/itemsform";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface DnFormValues {
  date: string;
  dn_no: string;
  customer_name: string;
  plate_no: string;
  sales_no: string;
  ECD_no: string;
  gatepass_no: string;
  invoice_no: string;
  despathcher_name: string;
  receiver_name: string;
  receiver_phone: string;
  authorized_by: string;
  items: {
    item_name: string;
    quantity: number;
    unit_measurement: string;
    internal_code: string;
    bags: number;
  }[];
}

const DN_API_URL = "/api/inventory/dn"

export default function DN() {
  const router = useRouter();
  const handleSubmit = async (values: DnFormValues) => {
    console.log("Form submitted:", values);
  
    // Transform values to match backend schema exactly
    const payload = {
      customer_name: values.customer_name,
      dn_no: values.dn_no,
      plate_no: values.plate_no,
      sales_no: values.sales_no,
      date: values.date, // ISO string is fine
      ECD_no: values.ECD_no, // ensure correct case
      gatepass_no: values.gatepass_no,
      invoice_no: values.invoice_no,
      despathcher_name: values.despathcher_name,
      receiver_name: values.receiver_name,
      authorized_by: values.authorized_by,
      items: values.items.map(item => ({
        item_name: item.item_name,
        quantity: Number(item.quantity), // convert string → int
        unit_measurement: String(item.unit_measurement),
        bags: Number(item.bags),
        internal_code: String(item.internal_code),
      })),
    };
  
    console.log("Payload sent to backend:", payload);
  
    try {
      const res = await fetch(DN_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), // send raw object
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        console.error("Error creating DN:", data);
        alert("Failed to submit");
        return;
      }
  
      console.log("DN created successfully:", data);
      alert("DN created successfully");
    } catch (error) {
      console.error("Error creating DN:", error);
      alert("Failed to submit");
    }
  };
  

  return (
    <div className="max-w-3xl mx-auto mt-10">

      <div>
        <Button onClick={() => router.push('/diredawa/inventory/dn/display')}>Display DN</Button>
      </div>

      <h1 className="text-2xl font-bold mb-6 text-center">Create DN</h1>

      <Form<DnFormValues>
        fields={[
          { name: "date", label: "Date", type: "date", placeholder: "Enter Date" },
          { name: "dn_no", label: "DN No", placeholder: "Enter DN No" },
          { name: "customer_name", label: "Customer Name", placeholder: "Enter Customer Name" },
          { name: "plate_no", label: "Plate No", placeholder: "Enter Plate No" },
          { name: "sales_no", label: "Order No", placeholder: "Enter Order No" },
          { name: "ECD_no", label: "ECD No", placeholder: "Enter ECD No" },
          { name: "gatepass_no", label: "Gate Pass Number", placeholder: "Enter Gate Pass Number" },
          { name: "invoice_no", label: "Invoice Number", placeholder: "Enter Invoice Number" },
          { name: "despathcher_name", label: "Despatcher Name", placeholder: "Enter Despatcher Name" },
          { name: "receiver_name", label: "Reciever Name", placeholder: "Enter Reciever Name" },
          { name: "authorized_by", label: "Authorized By", placeholder: "Enter Authorized By" },
        ]}
        onSubmit={handleSubmit}
        submitText="Submit DN"
      >
        <h2 className="text-center font-semibold mt-4">DN Items</h2>
        <ItemsForm />
      </Form>
    </div>
  );
}