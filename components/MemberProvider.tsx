"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { WorkspaceRole } from "@/lib/roles";
import { isManagerRole } from "@/lib/roles";

interface MemberState {
  role: WorkspaceRole;
  isManager: boolean;
  loaded: boolean;
}

const MemberContext = createContext<MemberState>({
  role: "member",
  isManager: false,
  loaded: false,
});

export function MemberProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MemberState>({
    role: "member",
    isManager: false,
    loaded: false,
  });

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.role) {
          setState({
            role: data.role as WorkspaceRole,
            isManager: isManagerRole(data.role),
            loaded: true,
          });
        } else {
          setState((s) => ({ ...s, loaded: true }));
        }
      })
      .catch(() => setState((s) => ({ ...s, loaded: true })));
  }, []);

  return (
    <MemberContext.Provider value={state}>{children}</MemberContext.Provider>
  );
}

export function useMember() {
  return useContext(MemberContext);
}
