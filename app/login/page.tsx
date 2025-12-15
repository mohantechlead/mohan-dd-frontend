"use client";

import React from "react";
import { cn } from "@/lib/utils"; // Adjust the path as necessary
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/authProvider";
import { useRouter } from "next/navigation";


const LOGIN_URL = "/api/login"

// -----------------------
// Login Page Wrapper
// -----------------------
export default function Login() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <LoginForm />
    </div>
  );
}

// -----------------------
// Login Form Component
// -----------------------
export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const auth = useAuth();

  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const dataObject = Object.fromEntries(formData);
    const jsonData = JSON.stringify(dataObject);

    const response = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: jsonData,
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch (error) {}

    if (response.ok) {
      console.log("Logged in");
      auth?.login(data?.username);
      router.push('/diredawa/inventory/grn/create');
    } else {
      console.log("Login failed", data);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your username below to login to your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">UserName</FieldLabel>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="username"
                  required
                />
              </Field>

              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                />
              </Field>

              <Field>
                <Button type="submit">Login</Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
