"use client";

import { useRouter, usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const currentTab = pathname.split('/').pop() || 'general';

  const handleTabChange = (value: string) => {
    router.push(`/settings/${value}`);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-8">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="ai">AI Settings</TabsTrigger>
          <TabsTrigger value="email">Email Settings</TabsTrigger>
          <TabsTrigger value="seo">SEO Settings</TabsTrigger>
        </TabsList>
        {children}
      </Tabs>
    </div>
  );
}
