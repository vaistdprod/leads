"use client";

import { Button } from "./button";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();

  return (
    <Button 
      variant="outline" 
      onClick={() => router.push('/dashboard')} 
      size="icon"
    >
      <ArrowLeft className="h-4 w-4" />
    </Button>
  );
}

export default BackButton;