import { ArrowRight, type LucideIcon } from "lucide-react";
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

export function AlgebraArt({ russian = false }: { russian?: boolean }) {
  return (
    <div className="algebra-art" aria-hidden="true">
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <span className="art-star art-star-one">✳</span>
      <span className="art-star art-star-two">+</span>
      <div className="equation-paper">
        <span className="paper-label">
          {russian ? "ИЗУЧАЙТЕ · ПРИМЕНЯЙТЕ" : "EXPLORĂ · APLICĂ"}
        </span>
        <div className="paper-equation">2x + 3 = 11</div>
        <div className="paper-rule" />
        <span className="paper-answer">
          x = 4 <span>✓</span>
        </span>
        <span className="paper-scribble">
          {russian ? "шаг к пониманию" : "un pas spre înțelegere"}
        </span>
      </div>
      <span className="art-mini">a + b</span>
      <span className="art-circle">=</span>
    </div>
  );
}
