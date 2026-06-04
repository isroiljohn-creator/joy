"use client";
import { useState, useEffect, useRef, useCallback } from "react";

export default function Gallery({ mainPhoto, top }) {
  const [isOpen, setIsOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Touch/swipe state
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const photos = [
    mainPhoto,
    "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?w=900&q=75", // Kitchen
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900&q=75", // Living room
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=900&q=75", // Bedroom
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=900&q=75", // Bathroom
  ];

  // Reset loaded state when index changes
  useEffect(() => {
    setImageLoaded(false);
    setZoomed(false);
  }, [index]);

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
  }, [isOpen, photos.length]);

  const openLightbox = (idx) => {
    setIndex(idx);
    setIsOpen(true);
    setZoomed(false);
  };

  const handleDoubleClick = useCallback(() => {
    setZoomed((prev) => !prev);
  }, []);

  // Touch handlers for swipe
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  }, []);

  const handleTouchMove = useCallback((e) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    const minSwipe = 50;
    if (Math.abs(diff) > minSwipe) {
      if (diff > 0) {
        // Swipe left → next
        setIndex((prev) => (prev + 1) % photos.length);
      } else {
        // Swipe right → prev
        setIndex((prev) => (prev - 1 + photos.length) % photos.length);
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  }, [photos.length]);

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
              zIndex: 10,
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
              height: "65vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
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

            {/* Image loading placeholder */}
            {!imageLoaded && (
              <div
                style={{
                  position: "absolute",
                  width: "80%",
                  height: "80%",
                  background: "var(--sand, #e8e0d8)",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--muted, #999)",
                  fontSize: 24,
                }}
              >
                <i className="ti ti-photo"></i>
              </div>
            )}

            <img
              src={photos[index]}
              alt={`Galereya rasm ${index + 1}`}
              onLoad={() => setImageLoaded(true)}
              onDoubleClick={handleDoubleClick}
              style={{
                maxHeight: "100%",
                maxWidth: "100%",
                objectFit: "contain",
                borderRadius: 12,
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                cursor: zoomed ? "zoom-out" : "zoom-in",
                transform: zoomed ? "scale(2)" : "scale(1)",
                transition: "transform 0.3s ease",
                opacity: imageLoaded ? 1 : 0,
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

          {/* Page count indicator */}
          <div
            style={{
              color: "#fff",
              marginTop: 12,
              fontSize: 15,
              fontWeight: 500,
            }}
          >
            {index + 1} / {photos.length}
          </div>

          {/* Thumbnail strip */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 12,
              overflowX: "auto",
              maxWidth: "90%",
              padding: "4px 0",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {photos.map((photo, i) => (
              <div
                key={i}
                onClick={() => { setIndex(i); setZoomed(false); }}
                style={{
                  width: 64,
                  height: 48,
                  minWidth: 64,
                  borderRadius: 8,
                  overflow: "hidden",
                  cursor: "pointer",
                  border: i === index ? "2px solid var(--orange, #f57c00)" : "2px solid transparent",
                  opacity: i === index ? 1 : 0.6,
                  transition: "all 0.2s ease",
                }}
              >
                <img
                  src={photo}
                  alt={`Thumbnail ${i + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
