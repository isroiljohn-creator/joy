"use client";
import { useState, useEffect } from "react";

export default function Gallery({ mainPhoto, top }) {
  const [isOpen, setIsOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const photos = [
    mainPhoto,
    "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?w=900&q=75", // Kitchen
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900&q=75", // Living room
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=900&q=75", // Bedroom
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=900&q=75", // Bathroom
  ];

  // Keypress event listener for navigation and closing
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
      if (e.key === "ArrowRight") setIndex((prev) => (prev + 1) % photos.length);
      if (e.key === "ArrowLeft") setIndex((prev) => (prev - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const openLightbox = (idx) => {
    setIndex(idx);
    setIsOpen(true);
  };

  return (
    <>
      <div className="gal">
        <div
          className="g main"
          style={{ backgroundImage: `url('${mainPhoto}')`, cursor: "pointer" }}
          onClick={() => openLightbox(0)}
        >
          <span className="badge">{top ? "TOP" : "YANGI"}</span>
        </div>
        <div
          className="g"
          style={{ backgroundImage: `url('${photos[1]}')`, cursor: "pointer" }}
          onClick={() => openLightbox(1)}
        ></div>
        <div
          className="g more"
          style={{ backgroundImage: `url('${photos[2]}')`, cursor: "pointer" }}
          onClick={() => openLightbox(2)}
        >
          <span>+{photos.length - 2} ta foto</span>
        </div>
      </div>

      {isOpen && (
        <div
          className="lightbox-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(26, 19, 14, 0.95)",
            zIndex: 999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setIsOpen(false)}
        >
          {/* Close button */}
          <button
            style={{
              position: "absolute",
              top: 24,
              right: 24,
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: 32,
              cursor: "pointer",
            }}
            onClick={() => setIsOpen(false)}
          >
            <i className="ti ti-x"></i>
          </button>

          {/* Photo container */}
          <div
            style={{
              position: "relative",
              width: "90%",
              maxWidth: 900,
              height: "70vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev button */}
            <button
              style={{
                position: "absolute",
                left: -20,
                background: "rgba(255,255,255,0.15)",
                border: "none",
                borderRadius: "50%",
                width: 48,
                height: 48,
                color: "#fff",
                fontSize: 24,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              }}
              onClick={() => setIndex((prev) => (prev - 1 + photos.length) % photos.length)}
            >
              <i className="ti ti-chevron-left"></i>
            </button>

            <img
              src={photos[index]}
              alt={`Galereya rasm ${index + 1}`}
              style={{
                maxHeight: "100%",
                maxWidth: "100%",
                objectFit: "contain",
                borderRadius: 12,
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              }}
            />

            {/* Next button */}
            <button
              style={{
                position: "absolute",
                right: -20,
                background: "rgba(255,255,255,0.15)",
                border: "none",
                borderRadius: "50%",
                width: 48,
                height: 48,
                color: "#fff",
                fontSize: 24,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              }}
              onClick={() => setIndex((prev) => (prev + 1) % photos.length)}
            >
              <i className="ti ti-chevron-right"></i>
            </button>
          </div>

          {/* Page count indicators */}
          <div
            style={{
              color: "#fff",
              marginTop: 16,
              fontSize: 15,
              fontWeight: 500,
            }}
          >
            {index + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}
