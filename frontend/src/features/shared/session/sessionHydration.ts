import { useEffect, useState } from "react";
import { useWorkflowStore } from "../../../state/workflowStore";

export function useSessionHydration() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Zustand persist stores trigger hydration updates asynchronously
    const unsub = useWorkflowStore.persist.onHydrate(() => setIsHydrated(false));
    const unsubFinish = useWorkflowStore.persist.onFinishHydration(() => setIsHydrated(true));

    // Check if store is already hydrated
    if (useWorkflowStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    return () => {
      unsub();
      unsubFinish();
    };
  }, []);

  return isHydrated;
}
