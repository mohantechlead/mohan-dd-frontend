 "use client";

import { Form } from "@/components/form";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

interface CustomerFormValues {
  name: string;
  email: string;
  phone: string;
  address: string;
  tin_number: string;
  contact_person: string;
  comments: string;
}

const CUSTOMER_API_URL = "/api/partners/customers";

export default function HomePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const handleSubmit = async (values: CustomerFormValues) => {
    
    console.log("Form submitted:", values);
  
    // Transform values to match backend schema exactly
    const payload = {
      name: values.name,
      email: values.email || null,
      phone: values.phone || null,
      address: values.address || null,
      tin_number: values.tin_number || null,
      contact_person: values.contact_person?.trim() || null,
      comments: values.comments?.trim() || null,
      partner_type: "customer",
    };
  
    console.log("Payload sent to backend:", payload);
  
    try {
      const res = await fetch(CUSTOMER_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), // send raw object
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        console.error("Error creating Customer:", data);
        showToast({
          title: "Failed to create customer",
          description: (data as any)?.detail || "Please check the form and try again.",
          variant: "error",
        });
        return;
      }
  
      console.log("Customer created successfully:", data);
      showToast({
        title: "Customer created",
        description: "The customer has been created successfully.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error creating Customer:", error);
      showToast({
        title: "Failed to create customer",
        description: "Something went wrong. Please try again.",
        variant: "error",
      });
    }
  };

  
  
  return (
    
    <div className="max-w-xl mx-auto mt-4">
      <div className="flex justify-start mb-10">
      <Button onClick={() => router.push("/diredawa/partners/customers/display")}> Display Customer</Button>
      </div>
      
      <h1 className="text-2xl font-bold mb-6 text-center">Create Customer</h1>

      <Form<CustomerFormValues>
        fields={[
          { name: "name", label: "Customer Name", placeholder: "Enter Customer Name" },
          { name: "tin_number", label: "TIN Number", type: "text", placeholder: "Enter TIN Number" },
          { name: "email", label: "Email", placeholder: "Enter Email" },
          { name: "phone", label: "Phone No", placeholder: "Enter Phone No" },
          { name: "contact_person", label: "Contact Person", placeholder: "Primary contact name" },
          { name: "address", label: "Address", placeholder: "Enter Address" },
          { name: "comments", label: "Comments", type: "textarea", placeholder: "Internal notes or comments" },
        ]}
        onSubmit={handleSubmit}
        submitText="Submit Customer"
      >
      </Form>
    </div>
  );
}