import React from "react";
import { cn } from "../../../lib/utils";

interface SkiperLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
  href?: string;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
}

const Skiper40 = () => {
  return (
    <section className="h-full snap-y snap-mandatory overflow-y-scroll">
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-5">
        <Link001 href="mailto:alumni@stcecilia.edu.ph">alumni@stcecilia.edu.ph</Link001>
        <Link002 href="#about">About St. Cecilia's</Link002>
        <Link003 href="#directory">Alumni Directory</Link003>
        <Link004 href="#events">Campus Reunions</Link004>
        <Link005 href="#contact">Institutional Office</Link005>
      </div>
    </section>
  );
};

export { Link000, Link001, Link002, Link003, Link004, Link005, Skiper40 };

const Link000 = ({
  children,
  href = "#",
  className,
  onClick,
  ...props
}: SkiperLinkProps) => {
  const Component = (onClick && (!href || href === "#") ? "button" : "a") as any;
  return (
    <Component
      type={Component === "button" ? "button" : undefined}
      href={Component === "a" ? href : undefined}
      onClick={onClick}
      className={cn(
        "group relative inline-flex items-center cursor-pointer transition-colors",
        className,
        "before:pointer-events-none before:absolute before:bottom-0 before:left-0 before:h-[0.08em] before:w-full before:bg-current before:content-['']",
        "before:origin-right before:scale-x-0 before:transition-transform before:duration-300 before:ease-[cubic-bezier(0.4,0,0.2,1)]",
        "hover:before:origin-left hover:before:scale-x-100",
      )}
      {...props}
    >
      {children}
    </Component>
  );
};

const Link001 = ({
  children,
  href = "#",
  className,
  onClick,
  ...props
}: SkiperLinkProps) => {
  const Component = (onClick && (!href || href === "#") ? "button" : "a") as any;
  return (
    <Component
      type={Component === "button" ? "button" : undefined}
      href={Component === "a" ? href : undefined}
      onClick={onClick}
      className={cn(
        "group relative inline-flex items-center cursor-pointer transition-colors",
        "before:pointer-events-none before:absolute before:left-0 before:bottom-0 before:h-[0.08em] before:w-full before:bg-current before:content-['']",
        "before:origin-right before:scale-x-0 before:transition-transform before:duration-300 before:ease-[cubic-bezier(0.4,0,0.2,1)]",
        "hover:before:origin-left hover:before:scale-x-100",
        className,
      )}
      {...props}
    >
      {children}
      <svg
        className="ml-[0.35em] size-[0.65em] translate-y-0.5 opacity-0 transition-all duration-300 [motion-reduce:transition-none] group-hover:translate-y-0 group-hover:opacity-100"
        fill="none"
        viewBox="0 0 10 10"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M1.004 9.166 9.337.833m0 0v8.333m0-8.333H1.004"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Component>
  );
};

const Link002 = ({
  children,
  href = "#",
  className,
  onClick,
  ...props
}: SkiperLinkProps) => {
  const Component = (onClick && (!href || href === "#") ? "button" : "a") as any;
  return (
    <Component
      type={Component === "button" ? "button" : undefined}
      href={Component === "a" ? href : undefined}
      onClick={onClick}
      className={cn(
        "group relative inline-flex items-center cursor-pointer transition-colors",
        className,
        "before:pointer-events-none before:absolute before:left-0 before:bottom-0 before:h-[0.08em] before:w-full before:bg-current before:content-['']",
        "before:origin-left before:scale-x-0 before:transition-transform before:duration-300 before:ease-[cubic-bezier(0.4,0,0.2,1)]",
        "hover:before:scale-x-100",
      )}
      {...props}
    >
      {children}
      <svg
        className="ml-[0.35em] size-[0.65em] translate-y-0.5 opacity-0 transition-all duration-300 [motion-reduce:transition-none] group-hover:translate-y-0 group-hover:opacity-100"
        fill="none"
        viewBox="0 0 10 10"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M1.004 9.166 9.337.833m0 0v8.333m0-8.333H1.004"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Component>
  );
};

const Link003 = ({
  children,
  href = "#",
  className,
  onClick,
  ...props
}: SkiperLinkProps) => {
  const Component = (onClick && (!href || href === "#") ? "button" : "a") as any;
  return (
    <Component
      type={Component === "button" ? "button" : undefined}
      href={Component === "a" ? href : undefined}
      onClick={onClick}
      className={cn(
        "group relative inline-flex items-center cursor-pointer transition-colors",
        className,
        "before:pointer-events-none before:absolute before:left-0 before:bottom-0 before:h-[0.08em] before:w-full before:bg-current before:content-['']",
        "before:origin-center before:scale-x-0 before:transition-transform before:duration-300 before:ease-[cubic-bezier(0.4,0,0.2,1)]",
        "hover:before:scale-x-100",
      )}
      {...props}
    >
      {children}
      <svg
        className="ml-[0.35em] size-[0.65em] translate-y-0.5 opacity-0 transition-all duration-300 [motion-reduce:transition-none] group-hover:translate-y-0 group-hover:opacity-100"
        fill="none"
        viewBox="0 0 10 10"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M1.004 9.166 9.337.833m0 0v8.333m0-8.333H1.004"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Component>
  );
};

const Link004 = ({
  children,
  href = "#",
  className,
  onClick,
  ...props
}: SkiperLinkProps) => {
  const Component = (onClick && (!href || href === "#") ? "button" : "a") as any;
  return (
    <Component
      type={Component === "button" ? "button" : undefined}
      href={Component === "a" ? href : undefined}
      onClick={onClick}
      className={cn(
        "group relative inline-flex items-center cursor-pointer transition-colors",
        className,
        "before:pointer-events-none before:absolute before:left-0 before:w-full before:bg-current before:content-['']",
        "before:origin-right before:scale-x-0 before:transition-all before:duration-300 before:ease-[cubic-bezier(0.4,0,0.2,1)]",
        "before:origin-center md:before:bottom-0",
        "before:z-0 px-2 py-0.5 before:h-0 before:scale-x-100 before:opacity-10 hover:before:h-[1.4em]",
      )}
      {...props}
    >
      <span className="relative z-10 flex items-center">
        {children}
        <svg
          className="ml-[0.4em] size-[0.65em] translate-y-0.5 opacity-0 transition-all duration-300 [motion-reduce:transition-none] group-hover:translate-y-0 group-hover:rotate-45 group-hover:opacity-100"
          fill="none"
          viewBox="0 0 10 10"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M1.004 9.166 9.337.833m0 0v8.333m0-8.333H1.004"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </Component>
  );
};

const Link005 = ({
  children,
  href = "#",
  className,
  onClick,
  ...props
}: SkiperLinkProps) => {
  const Component = (onClick && (!href || href === "#") ? "button" : "a") as any;
  return (
    <Component
      type={Component === "button" ? "button" : undefined}
      href={Component === "a" ? href : undefined}
      onClick={onClick}
      className={cn(
        "group relative inline-flex items-center cursor-pointer transition-colors",
        className,
        "before:pointer-events-none before:absolute before:left-0 before:w-full before:bg-current before:content-['']",
        "before:scale-x-1 before:transition-all before:duration-300 before:ease-[cubic-bezier(0.4,0,0.2,1)]",
        "before:origin-left md:before:top-0",
        "before:z-0 px-2 py-0.5 before:h-full before:scale-x-0 before:opacity-10 hover:before:scale-x-100",
      )}
      {...props}
    >
      <span className="relative z-10 flex items-center">
        {children}
        <svg
          className="ml-[0.4em] size-[0.65em] -translate-x-1 rotate-45 opacity-0 transition-all duration-300 [motion-reduce:transition-none] group-hover:translate-x-0 group-hover:opacity-100"
          fill="none"
          viewBox="0 0 10 10"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M1.004 9.166 9.337.833m0 0v8.333m0-8.333H1.004"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </Component>
  );
};

/**
 * Skiper 40 Animated Link — React
 * Inspired by and adapted from https://cursor.com/?from=home
 * We respect the original creators. This is an inspired rebuild with our own taste and does not claim any ownership.
 * These animations aren’t associated with the cursor.com . They’re independent recreations meant to study interaction design
 *
 * License & Usage:
 * - Free to use and modify in both personal and commercial projects.
 * - Attribution to Skiper UI is required when using the free version.
 * - No attribution required with Skiper UI Pro.
 *
 * Feedback and contributions are welcome.
 *
 * Author: @gurvinder-singh02
 * Website: https://gxuri.me
 * Twitter: https://x.com/Gur__vi
 */
