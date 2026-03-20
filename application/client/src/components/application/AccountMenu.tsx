import { useCallback, useRef } from "react";

import { getProfileImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  user: Models.User;
  onLogout: () => void;
}

export const AccountMenu = ({ user, onLogout }: Props) => {
  const checkboxRef = useRef<HTMLInputElement>(null);

  const handleLogout = useCallback(() => {
    if (checkboxRef.current) checkboxRef.current.checked = false;
    onLogout();
  }, [onLogout]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      if (checkboxRef.current) checkboxRef.current.checked = false;
    }
  }, []);

  return (
    <div
      className="relative hidden lg:block lg:w-full lg:pb-2"
      onBlur={handleBlur}
    >
      <input
        ref={checkboxRef}
        type="checkbox"
        id="ccss-account-menu"
        className="ccss-state-input"
      />
      <div className="account-menu-dropdown border-cax-border bg-cax-surface absolute bottom-full left-0 mb-2 w-full overflow-hidden rounded-xl border py-1 shadow-lg">
        <button
          className="text-cax-text hover:bg-cax-surface-subtle w-full px-4 py-3 text-left text-sm font-bold"
          onClick={handleLogout}
        >
          サインアウト
        </button>
      </div>
      <label
        aria-label="アカウントメニュー"
        htmlFor="ccss-account-menu"
        className="hover:bg-cax-surface-subtle flex w-full items-center gap-3 rounded-full p-2 transition-colors cursor-pointer"
        tabIndex={0}
      >
        <img
          alt={user.profileImage.alt}
          className="h-10 w-10 shrink-0 rounded-full object-cover"
          src={getProfileImagePath(user.profileImage.id)}
        />
        <div className="hidden min-w-0 flex-1 text-left lg:block">
          <div className="text-cax-text truncate text-sm font-bold">{user.name}</div>
          <div className="text-cax-text-muted truncate text-sm">@{user.username}</div>
        </div>
        <span className="text-cax-text-muted hidden lg:block">···</span>
      </label>
    </div>
  );
};
