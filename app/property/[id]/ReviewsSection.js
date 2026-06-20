"use client";
import { useState } from "react";
import ReviewModal from "@/components/ReviewModal";

export default function ReviewsSection({ reviews: initialReviews, avgRating, listingId, ownerId, ownerName, currentUserId }) {
  const [reviews, setReviews] = useState(initialReviews || []);
  const [showModal, setShowModal] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const canReview = currentUserId && currentUserId !== ownerId;
  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

  return (
    <div className="block reviews-block" style={{ marginTop: 32 }}>
      <div className="reviews-block-header">
        <div className="reviews-block-title">
          <h2 className="display">
            <i className="ti ti-star"></i> Sharhlar
          </h2>
          {avgRating && (
            <div className="avg-rating-pill">
              <i className="ti ti-star-filled" style={{ color: "#f59e0b" }}></i>
              <strong>{avgRating}</strong>
              <span>({reviews.length})</span>
            </div>
          )}
        </div>
        {canReview && (
          <button
            className="btn btn-secondary"
            onClick={() => setShowModal(true)}
            id="add-review-btn"
          >
            <i className="ti ti-pencil"></i> Sharh yozing
          </button>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="reviews-empty">
          <i className="ti ti-star-off"></i>
          <p>Hali sharhlar yo'q. Birinchi bo'ling!</p>
          {canReview && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
              <i className="ti ti-pencil"></i> Sharh qoldirish
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="reviews-list">
            {displayedReviews.map((r) => (
              <div key={r.id} className="review-card">
                <div className="review-header">
                  <div className="review-avatar">{r.reviewer_name?.[0]?.toUpperCase()}</div>
                  <div className="review-meta">
                    <div className="review-name">{r.reviewer_name}</div>
                    <div className="review-stars-row">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <i
                          key={i}
                          className={`ti ${i < r.rating ? "ti-star-filled" : "ti-star"}`}
                          style={{ color: i < r.rating ? "#f59e0b" : "#ddd", fontSize: 13 }}
                        ></i>
                      ))}
                    </div>
                  </div>
                  <div className="review-date">
                    {new Date(r.created_at).toLocaleDateString("uz-UZ", { day: "numeric", month: "short" })}
                  </div>
                </div>
                {r.comment && <p className="review-comment">{r.comment}</p>}
              </div>
            ))}
          </div>

          {reviews.length > 3 && (
            <button
              className="btn btn-ghost"
              onClick={() => setShowAll(!showAll)}
              style={{ marginTop: 12, width: "100%" }}
            >
              {showAll
                ? <><i className="ti ti-chevron-up"></i> Kamroq ko'rsatish</>
                : <><i className="ti ti-chevron-down"></i> Yana {reviews.length - 3} ta sharh ko'rish</>
              }
            </button>
          )}
        </>
      )}

      {showModal && (
        <ReviewModal
          listingId={listingId}
          ownerId={ownerId}
          ownerName={ownerName}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
