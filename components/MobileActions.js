"use client";
import { useState } from "react";
import MessageModal from "./MessageModal";

export default function MobileActions({ listingId, receiverOwner, ownerPhone }) {
  const [revealed, setRevealed] = useState(false);
  const cleanPhone = ownerPhone.replace(/\s/g, "");

  return (
    <div className="mdactions mobile-only">
      {!revealed ? (
        <>
          <MessageModal
            listingId={listingId}
            receiverOwner={receiverOwner}
            btnClass="mdabtn mgh"
            btnText="Yozish"
          />
          <button
            onClick={() => setRevealed(true)}
            className="mdabtn mpr"
          >
            <i className="ti ti-phone" style={{ fontSize: 17 }}></i> Qo&apos;ng&apos;iroq
          </button>
        </>
      ) : (
        <div style={{ display: "flex", gap: 8, width: "100%", alignItems: "center" }}>
          <button
            onClick={() => setRevealed(false)}
            className="mdabtn mgh"
            style={{ width: 44, padding: 0, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <i className="ti ti-chevron-left" style={{ fontSize: 20 }}></i>
          </button>
          <a
            href={`tel:${cleanPhone}`}
            className="mdabtn mpr"
            style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, flex: 2 }}
          >
            <i className="ti ti-phone"></i> Tel
          </a>
          <a
            href={`https://wa.me/${cleanPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mdabtn mgh"
            style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, flex: 1 }}
          >
            <i className="ti ti-brand-whatsapp"></i> WA
          </a>
          <a
            href={`https://t.me/${cleanPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mdabtn mgh"
            style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, flex: 1 }}
          >
            <i className="ti ti-brand-telegram"></i> TG
          </a>
        </div>
      )}
    </div>
  );
}
