"use client";

import { forwardRef, useState } from "react";
import ConfirmActionModal, {
  type ConfirmAction,
} from "@/components/ConfirmActionModal";

type UserAction = Extract<ConfirmAction, "remove" | "block">;

type UserActionMenuProps = {
  username: string;
  anchorPosition?: { top: number; left: number };
  menuPosition?: { top: number; left: number };
  onRemove?: () => void | Promise<void>;
  onBlock?: () => void | Promise<void>;
  onActionComplete?: (action: UserAction) => void;
  onConfirmOpenChange?: (open: boolean) => void;
};

const ACTION_LABELS: Record<UserAction, string> = {
  remove: "Remove friend",
  block: "Block",
};

const UserActionMenu = forwardRef<HTMLDivElement, UserActionMenuProps>(
  function UserActionMenu(
    {
      username,
      anchorPosition,
      menuPosition,
      onRemove,
      onBlock,
      onActionComplete,
      onConfirmOpenChange,
    },
    ref,
  ) {
    const [confirmAction, setConfirmAction] = useState<UserAction | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const actions: Array<{ action: UserAction; handler: () => void | Promise<void> }> = [];
    if (onRemove) actions.push({ action: "remove", handler: onRemove });
    if (onBlock) actions.push({ action: "block", handler: onBlock });

    if (actions.length === 0) return null;

    function openConfirm(action: UserAction) {
      setConfirmAction(action);
      onConfirmOpenChange?.(true);
    }

    function closeConfirm() {
      setConfirmAction(null);
      onConfirmOpenChange?.(false);
    }

    async function handleConfirm() {
      if (!confirmAction || isSubmitting) return;

      const action = confirmAction;
      const handler = action === "remove" ? onRemove : onBlock;
      if (!handler) return;

      setIsSubmitting(true);
      try {
        await handler();
        setIsSubmitting(false);
      } catch {
        setIsSubmitting(false);
        return;
      }

      closeConfirm();
      onActionComplete?.(action);
    }

    const position = menuPosition ?? {
      top: anchorPosition?.top ?? 0,
      left: (anchorPosition?.left ?? 0) + 248,
    };

    return (
      <>
        {!confirmAction && (
          <div
            ref={ref}
            className="fixed z-[1001] w-[220px] rounded-[10px] border border-white/[0.12] bg-[#0f0f0e] px-2 py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
            style={position}
          >
            {actions.map(({ action }) => (
              <button
                key={action}
                type="button"
                onClick={() => openConfirm(action)}
                className="flex w-full items-center gap-2 rounded-[5px] px-2 py-[7px] text-[12.5px] text-[#e84545] transition-colors hover:bg-[rgba(232,69,69,0.1)]"
              >
                {ACTION_LABELS[action]}
              </button>
            ))}
          </div>
        )}

        {confirmAction && (
          <ConfirmActionModal
            action={confirmAction}
            friendName={username}
            onCancel={closeConfirm}
            onConfirm={() => {
              void handleConfirm();
            }}
          />
        )}
      </>
    );
  },
);

export default UserActionMenu;
