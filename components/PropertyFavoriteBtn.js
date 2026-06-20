"use client";
import { useState, useEffect } from "react";
import { toggleFavoriteAction } from "@/app/actions";

export default function PropertyFavoriteBtn({ listingId, initialFavorite = false, btnClass = "ibtn" }) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);

  useEffect(() => {
    setIsFavorite(initialFavorite);
  }, [initialFavorite]);

  const handleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Check cookie
    const cookiesList = document.cookie.split(";").reduce((acc, c) => {
      const [key, val] = c.trim().split("=");
      if (key && val) {
        acc[key] = val;
      }
      return acc;
    }, {});

    if (cookiesList.is_logged_in !== "true") {
      window.location.href = "/login";
      return;
    }

    const prev = isFavorite;
    setIsFavorite(!prev);

    try {
      const res = await toggleFavoriteAction(listingId);
      if (res && res.error) {
        setIsFavorite(prev);
        if (res.error === "unauthorized") {
          document.cookie = "is_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
          window.location.href = "/login";
        }
      }
    } catch (err) {
      setIsFavorite(prev);
      console.error(err);
    }
  };

  return (
    <button
      type="button"
      className={btnClass}
      onClick={handleFavorite}
      style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
      title="Saqlanganlarga qo'shish"
    >
      <i
        className="ti ti-heart"
        style={{
          color: isFavorite ? "var(--orange)" : "inherit",
          fontWeight: isFavorite ? "bold" : "normal"
        }}
      ></i>
    </button>
  );
}
