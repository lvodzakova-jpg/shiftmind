"use client";

import { useTranslation } from "@/components/LanguageProvider";
import { TABLES } from "@/lib/db";
import { getCurrentEmployeeId } from "@/lib/current-user";
import { showLocalNotification } from "@/lib/push-client";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Message, Staff } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface MessagesPanelProps {
  staff: Staff[];
  messages: Message[];
}

export function MessagesPanel({ staff, messages: initial }: MessagesPanelProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [messages, setMessages] = useState(initial);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [selectedPeer, setSelectedPeer] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [broadcast, setBroadcast] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCurrentId(getCurrentEmployeeId() ?? staff[0]?.id ?? null);
  }, [staff]);

  const peers = useMemo(() => {
    if (!currentId) return [];
    const ids = new Set<string>();
    for (const m of messages) {
      if (m.sender_id === currentId && m.recipient_id) ids.add(m.recipient_id);
      if (m.recipient_id === currentId) ids.add(m.sender_id);
    }
    return staff.filter((s) => ids.has(s.id));
  }, [messages, currentId, staff]);

  const thread = useMemo(() => {
    if (!currentId || !selectedPeer) return [];
    return messages
      .filter(
        (m) =>
          (m.sender_id === currentId && m.recipient_id === selectedPeer) ||
          (m.sender_id === selectedPeer && m.recipient_id === currentId)
      )
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }, [messages, currentId, selectedPeer]);

  const broadcasts = useMemo(
    () => messages.filter((m) => m.recipient_id === null),
    [messages]
  );

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!currentId || !selectedPeer || !content.trim()) return;
    setLoading(true);
    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from(TABLES.messages)
      .insert({
        sender_id: currentId,
        recipient_id: selectedPeer,
        content: content.trim(),
      })
      .select()
      .single();
    setLoading(false);
    if (!error && data) {
      setMessages((prev) => [...prev, data as Message]);
      setContent("");
      showLocalNotification(t("messages.title"), content.trim());
      router.refresh();
    }
  }

  async function handleBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!currentId || !broadcast.trim()) return;
    setLoading(true);
    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from(TABLES.messages)
      .insert({
        sender_id: currentId,
        recipient_id: null,
        content: broadcast.trim(),
      })
      .select()
      .single();
    setLoading(false);
    if (!error && data) {
      setMessages((prev) => [...prev, data as Message]);
      setBroadcast("");
      router.refresh();
    }
  }

  async function markRead(peerId: string) {
    if (!currentId) return;
    const supabase = createBrowserClient();
    await supabase
      .from(TABLES.messages)
      .update({ read: true })
      .eq("recipient_id", currentId)
      .eq("sender_id", peerId)
      .eq("read", false);
    setMessages((prev) =>
      prev.map((m) =>
        m.recipient_id === currentId && m.sender_id === peerId
          ? { ...m, read: true }
          : m
      )
    );
  }

  const empName = (id: string) => staff.find((s) => s.id === id)?.name ?? id;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-2xl border border-default bg-surface p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">{t("messages.conversations")}</h2>
        <select
          value={currentId ?? ""}
          onChange={(e) => setCurrentId(e.target.value)}
          className="mb-3 w-full rounded-lg border border-default px-3 py-2 text-sm"
        >
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <ul className="space-y-1">
          {peers.map((peer) => (
            <li key={peer.id}>
              <button
                type="button"
                onClick={() => {
                  setSelectedPeer(peer.id);
                  markRead(peer.id);
                }}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                  selectedPeer === peer.id
                    ? "bg-subtle text-brand"
                    : "hover:bg-subtle"
                }`}
              >
                {peer.name}
              </button>
            </li>
          ))}
          {peers.length === 0 && (
            <p className="text-sm text-muted">{t("messages.empty")}</p>
          )}
        </ul>
      </div>

      <div className="lg:col-span-2 space-y-4">
        {broadcasts.length > 0 && (
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-sky-900">
              {t("messages.broadcast")}
            </h3>
            {broadcasts.slice(-3).map((m) => (
              <p key={m.id} className="text-sm text-sky-800">
                <strong>{empName(m.sender_id)}:</strong> {m.content}
              </p>
            ))}
          </div>
        )}

        <div className="flex h-80 flex-col rounded-2xl border border-default bg-surface shadow-sm">
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {selectedPeer ? (
              thread.length > 0 ? (
                thread.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                      m.sender_id === currentId
                        ? "ml-auto bg-brand text-on-brand"
                        : "bg-subtle text-foreground"
                    }`}
                  >
                    {m.content}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">{t("messages.empty")}</p>
              )
            ) : (
              <p className="text-sm text-muted">{t("messages.conversations")}</p>
            )}
          </div>
          {selectedPeer && (
            <form onSubmit={handleSend} className="border-t border-default p-3 flex gap-2">
              <input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("messages.placeholder")}
                className="flex-1 rounded-lg border border-default px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-50"
              >
                {t("messages.send")}
              </button>
            </form>
          )}
        </div>

        <form onSubmit={handleBroadcast} className="rounded-xl border border-default bg-surface p-4">
          <h3 className="mb-2 text-sm font-semibold">{t("messages.broadcast")}</h3>
          <textarea
            value={broadcast}
            onChange={(e) => setBroadcast(e.target.value)}
            placeholder={t("messages.broadcastPlaceholder")}
            className="mb-2 w-full rounded-lg border border-default px-3 py-2 text-sm"
            rows={2}
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-50"
          >
            {t("messages.send")}
          </button>
        </form>
      </div>
    </div>
  );
}
