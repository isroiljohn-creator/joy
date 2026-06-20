"use client";

export default function PrintBtn({ btnClass = "ibtn" }) {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <button
      type="button"
      className={btnClass}
      onClick={handlePrint}
      style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
      title="Mulk pasporti (PDF)"
    >
      <i className="ti ti-printer"></i>
    </button>
  );
}
