import { ArrowRight, BrainCircuit, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function Badge({
  children,
  tone = "lavender",
}: {
  children: ReactNode;
  tone?: "lavender" | "coral" | "green" | "neutral";
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Action({
  children,
  onClick,
  secondary = false,
  icon: Icon = ArrowRight,
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  secondary?: boolean;
  icon?: LucideIcon;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`button ${secondary ? "button-secondary" : "button-primary"}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
      <Icon size={17} aria-hidden="true" />
    </button>
  );
}

export function Heading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 tabIndex={-1} id="page-title">
          {title}
        </h1>
        <p className="page-description">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function MentorOrbitArt({ russian = false }: { russian?: boolean }) {
  return (
    <div className="mentor-orbit" aria-hidden="true">
      <div className="mentor-orbit-ring ring-outer" />
      <div className="mentor-orbit-ring ring-middle" />
      <div className="mentor-orbit-ring ring-inner" />
      <div className="mentor-orbit-core">
        <BrainCircuit size={39} strokeWidth={1.6} />
        <span>AI</span>
      </div>
      <span className="orbit-label orbit-label-practice">
        {russian ? "Практика" : "Practică"}
      </span>
      <span className="orbit-label orbit-label-mentor">
        {russian ? "Наставник" : "Mentorat"}
      </span>
      <span className="orbit-label orbit-label-reflection">
        {russian ? "Рефлексия" : "Reflecție"}
      </span>
    </div>
  );
}
