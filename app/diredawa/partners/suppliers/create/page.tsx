 "use client";

import { Form } from "@/components/form";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

interface SupplierFormValues {
  name: string;
  email: string;
  phone: string;
  address: string;
  tin_number: string;
}

const SUPPLIER_API_URL = "/api/partners/suppliers";

export default function HomePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const handleSubmit = async (values: SupplierFormValues) => {
    
    console.log("Form submitted:", values);
  
    // Transform values to match backend schema exactly
    const payload = {
      name: values.name,
      email: values.email,
      phone: values.phone,
      address: values.address,
      tin_number: values.tin_number, 
      partner_type: "supplier",
    };
  
    console.log("Payload sent to backend:", payload);
  
    try {
      const res = await fetch(SUPPLIER_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), // send raw object
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        console.error("Error creating Supplier:", data);
        showToast({
          title: "Failed to create supplier",
          description: (data as any)?.detail || "Please check the form and try again.",
          variant: "error",
        });
        return;
      }
  
      console.log("Supplier created successfully:", data);
      showToast({
        title: "Supplier created",
        description: "The supplier has been created successfully.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error creating Supplier:", error);
      showToast({
        title: "Failed to create supplier",
        description: "Something went wrong. Please try again.",
        variant: "error",
      });
    }
  };

  
  
  return (
    
    <div className="max-w-xl mx-auto mt-4">
      <div className="flex justify-start mb-10">
      <Button onClick={() => router.push("/diredawa/partners/suppliers/display")}> Display Supplier</Button>
      </div>
      
      <h1 className="text-2xl font-bold mb-6 text-center">Create Supplier</h1>

      <Form<SupplierFormValues>
        fields={[
          { name: "name", label: "Supplier Name", placeholder: "Enter Supplier Name" },
          { name: "tin_number", label: "TIN Number", type: "text", placeholder: "Enter TIN Number" },
          { name: "email", label: "Email", placeholder: "Enter Email" },
          { name: "phone", label: "Phone No", placeholder: "Enter Phone No" },
          { name: "address", label: "Address", placeholder: "Enter Address" },
        ]}
        onSubmit={handleSubmit}
        submitText="Submit Supplier"
      >
      </Form>
    </div>
  );
}