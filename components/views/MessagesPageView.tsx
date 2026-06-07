"use client";

import { MessagesPanel } from "@/components/MessagesPanel";
import { useTranslation } from "@/components/LanguageProvider";
import { PageHeader } from "@/components/PageHeader";
import type { Message, Staff } from "@/lib/types";

interface MessagesPageViewProps {
  staff: Staff[];
  messages: Message[];
}

export function MessagesPageView({ staff, messages }: MessagesPageViewProps) {
  const { t } = useTranslation();
  return (
    <div>
      <PageHeader title={t("messages.title")} description={t("messages.description")} />
      <MessagesPanel staff={staff} messages={messages} />
    </div>
  );
}
