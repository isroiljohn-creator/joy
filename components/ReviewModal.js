"use client";
import { useState } from "react";
import { addReviewAction } from "@/app/actions";

export default function ReviewModal({ listingId, ownerId, ownerName, onClose }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setError("Iltimos, yulduz reytingini tanlang");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("reviewed_user_id", ownerId);
      formData.append("listing_id", listingId);
      formData.append("rating", rating);
      formData.append("comment", comment);

      const res = await addReviewAction(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch {
      setError("Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const ratingLabels = {
    1: "Juda yomon",
    2: "Yomon",
    3: "O'rtacha",
    4: "Yaxshi",
    5: "A'lo!"
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box review-modal">
        <div className="modal-header">
          <h2>
            <i className="ti ti-star"></i> Sharh qoldirish
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Yopish">
            <i className="ti ti-x"></i>
          </button>
        </div>

        {success ? (
          <div className="review-success">
            <i className="ti ti-circle-check"></i>
            <h3>Sharh muvaffaqiyatli qo'shildi!</h3>
            <p>Rahmat! Sizning fikringiz muhim.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="review-form">
            <p className="review-for">
              <i className="ti ti-user"></i> <strong>{ownerName}</strong> uchun sharh
            </p>

            {/* Star Rating */}
            <div className="review-stars-input">
              <div className="stars-row">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${(hovered || rating) >= star ? "active" : ""}`}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setRating(star)}
                    aria-label={`${star} yulduz`}
                  >
                    <i className="ti ti-star-filled"></i>
                  </button>
                ))}
              </div>
              {(hovered || rating) > 0 && (
                <div className="star-label">{ratingLabels[hovered || rating]}</div>
              )}
            </div>

            {/* Comment */}
            <div className="form-group">
              <label>Izoh (ixtiyoriy)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Bu uy egasi/makler haqida fikringizni yozing..."
                rows={4}
                maxLength={500}
              />
              <span className="char-count">{comment.length}/500</span>
            </div>

            {error && (
              <div className="form-error">
                <i className="ti ti-alert-circle"></i> {error}
              </div>
            )}

            <div className="review-form-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Bekor qilish
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading || !rating}>
                {loading ? (
                  <><i className="ti ti-loader-2 spin"></i> Yuborilmoqda...</>
                ) : (
                  <><i className="ti ti-send"></i> Sharh qoldirish</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
