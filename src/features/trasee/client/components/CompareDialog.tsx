import type { CourseDetail } from "../../shared/rank";
import { IconX } from "../icons";
import { useDialog } from "./CourseDrawer";

const ROWS: [string, (d: CourseDetail) => React.ReactNode][] = [
  ["Când", (d) => d.availability.label],
  ["Credite", (d) => d.credits ?? <span className="na">nepublicat</span>],
  ["Durată", (d) => d.hours ?? <span className="na">nepublicat</span>],
  ["Cost", (d) => d.price ?? <span className="na">nepublicat</span>],
  ["Format", (d) => d.format ?? <span className="na">nepublicat</span>],
  [
    "Pentru cine",
    (d) => d.course.audience ?? <span className="na">nepublicat</span>,
  ],
  [
    "Ce înveți",
    (d) =>
      d.course.competencyText.length ? (
        <ul className="mini">
          {d.course.competencyText.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      ) : (
        <span className="na">nepublicat</span>
      ),
  ],
  ["Fișă oficială", (d) => (d.course.evidence === "oficial" ? "Da" : "Nu")],
  [
    "Acreditare ANACEC",
    (d) => (d.course.accreditation === "anacec" ? "Declarată" : "Neconfirmată"),
  ],
  ["Ce lipsește", (d) => d.missing.join(", ") || "—"],
];

export function CompareDialog({
  items,
  onClose,
}: {
  items: CourseDetail[];
  onClose: () => void;
}) {
  const ref = useDialog(true, onClose);
  return (
    <div
      className="overlay overlay--center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cmp-title"
        tabIndex={-1}
        ref={ref}
      >
        <header className="drawer__head">
          <h2 id="cmp-title" className="drawer__title">
            Comparare
          </h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Închide"
          >
            <IconX />
          </button>
        </header>
        <div className="table-wrap">
          <table className="cmp">
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">Criteriu</span>
                </th>
                {items.map((d) => (
                  <th key={d.course.id} scope="col">
                    <span className="card__meta">{d.providerName}</span>
                    <br />
                    {d.course.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, f]) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  {items.map((d) => (
                    <td key={d.course.id}>{f(d)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
