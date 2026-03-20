import classNames from "classnames";
import { useLocation } from "react-router";

import { Link } from "@web-speed-hackathon-2026/client/src/components/foundation/Link";

interface Props {
  badge?: React.ReactNode;
  icon: React.ReactNode;
  text: string;
  href?: string;
  labelFor?: string;
  command?: string;
  commandfor?: string;
}

export const NavigationItem = ({ badge, href, icon, labelFor, command, commandfor, text }: Props) => {
  const location = useLocation();
  const isActive = location.pathname === href;

  const sharedClassName = classNames(
    "flex flex-col items-center justify-center w-12 h-12 hover:bg-cax-brand-soft rounded-full sm:px-2 sm:w-24 sm:h-auto sm:rounded-sm lg:flex-row lg:justify-start lg:px-4 lg:py-2 lg:w-auto lg:h-auto lg:rounded-full",
    { "text-cax-brand": isActive },
  );

  const content = (
    <>
      <span className="relative text-xl lg:pr-2 lg:text-3xl">
        {icon}
        {badge}
      </span>
      <span className="hidden sm:inline sm:text-sm lg:text-xl lg:font-bold">{text}</span>
    </>
  );

  return (
    <li>
      {href !== undefined ? (
        <Link className={sharedClassName} to={href}>
          {content}
        </Link>
      ) : labelFor !== undefined ? (
        <button
          className={sharedClassName}
          type="button"
          onClick={() => {
            const el = document.getElementById(labelFor) as HTMLInputElement | null;
            if (el) {
              el.checked = !el.checked;
              el.dispatchEvent(new Event("change", { bubbles: true }));
            }
          }}
        >
          {content}
        </button>
      ) : (
        <button
          className={classNames(
            "hover:bg-cax-brand-soft flex h-12 w-12 flex-col items-center justify-center rounded-full sm:h-auto sm:w-24 sm:rounded-sm sm:px-2 lg:h-auto lg:w-auto lg:flex-row lg:justify-start lg:rounded-full lg:px-4 lg:py-2",
          )}
          type="button"
          command={command}
          commandfor={commandfor}
        >
          {content}
        </button>
      )}
    </li>
  );
};
