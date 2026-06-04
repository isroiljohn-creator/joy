"use client";
import { useState, useEffect } from "react";
import { incrementViewAction } from "@/app/actions";

export default function PropertyExtras({ priceNum, listingId }) {
  const [downPayment, setDownPayment] = useState(20);
  const [term, setTerm] = useState(25);
  const [rate, setRate] = useState(12);

  // View counter — bir marta ko'rishlar sonini oshirish
  useEffect(() => {
    incrementViewAction(listingId);
  }, [listingId]);

  // Ipoteka hisoblash
  const loanAmount = priceNum * (1 - downPayment / 100);
  const monthlyRate = rate / 100 / 12;
  const totalMonths = term * 12;
  const monthly = monthlyRate > 0 && totalMonths > 0
    ? Math.round((loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -totalMonths)))
    : Math.round(loanAmount / totalMonths);

  return (
    <div className="mort">
      <div
        style={{
          fontSize: 13,
          color: "var(--muted)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <i className="ti ti-calculator" style={{ fontSize: 16 }}></i>{" "}
        Ipoteka hisobi
      </div>
      <div className="mv">
        ≈ ${monthly.toLocaleString()}{" "}
        <span
          style={{
            fontSize: 14,
            fontWeight: 400,
            color: "var(--muted)",
          }}
        >
          /oy
        </span>
      </div>

      {/* Interaktiv sliderlar */}
      <div style={{ marginTop: 12 }}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>
            <span>Boshlang&apos;ich to&apos;lov</span>
            <span style={{ fontWeight: 600 }}>{downPayment}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="90"
            step="5"
            value={downPayment}
            onChange={(e) => setDownPayment(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--orange)" }}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>
            <span>Muddat</span>
            <span style={{ fontWeight: 600 }}>{term} yil</span>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            step="1"
            value={term}
            onChange={(e) => setTerm(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--orange)" }}
          />
        </div>

        <div style={{ marginBottom: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>
            <span>Foiz stavkasi</span>
            <span style={{ fontWeight: 600 }}>{rate}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            step="0.5"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--orange)" }}
          />
        </div>
      </div>

      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
        {downPayment}% boshlang&apos;ich · {term} yil · {rate}%
      </div>
    </div>
  );
}
