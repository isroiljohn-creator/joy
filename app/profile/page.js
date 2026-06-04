"use client";
import { useState } from "react";
import Link from "next/link";
import { Nav } from "@/components/ui";
import { listings } from "@/lib/data";

export default function Profile() {
  const [tab, setTab] = useState("Mening e'lonlarim");
  const mine = listings;
  return (
    <>
      <Nav />
      <div className="wrap">
        <div className="phead">
          <div className="bigav">AK</div>
          <div>
            <div className="hname display">Aziz Karimov <i className="ti ti-rosette-discount-check"></i></div>
            <div className="hmeta">
              <span><i className="ti ti-phone" style={{ fontSize: 15 }}></i> +998 90 123 45 67</span>
              <span><i className="ti ti-calendar" style={{ fontSize: 15 }}></i> 2024 yildan beri</span>
              <span><i className="ti ti-star" style={{ fontSize: 15 }}></i> 4.9 reyting</span>
            </div>
          </div>
          <button className="editp"><i className="ti ti-settings" style={{ fontSize: 15, verticalAlign: -2 }}></i> Sozlamalar</button>
        </div>

        <div className="pstats">
          <div className="pstat"><i className="ti ti-files"></i><div className="n">14</div><div className="l">Jami e'lon</div></div>
          <div className="pstat"><i className="ti ti-checkbox"></i><div className="n">11</div><div className="l">Faol</div></div>
          <div className="pstat"><i className="ti ti-eye"></i><div className="n">3 240</div><div className="l">Ko'rishlar</div></div>
          <div className="pstat"><i className="ti ti-heart"></i><div className="n">186</div><div className="l">Saqlangan</div></div>
        </div>

        <div className="ptabs">
          {["Mening e'lonlarim", "Saqlangan", "Xabarlar", "Sozlamalar"].map((t) => (
            <div key={t} className={"ptab" + (tab === t ? " on" : "")} onClick={() => setTab(t)}>{t}</div>
          ))}
        </div>

        <div className="grid" style={{ paddingBottom: 64 }}>
          {mine.map((l) => (
            <Link className="card" href={`/property/${l.id}`} key={l.id}>
              <div className="photo" style={{ height: 150, backgroundImage: `url('${l.photo}')`, backgroundColor: "#C9BDA8" }}>
                <span className={"status " + (l.status === "active" ? "active" : "pending")}>{l.status === "active" ? "Faol" : "Moderatsiyada"}</span>
              </div>
              <div className="cb">
                <div className="price" style={{ fontSize: 19 }}>{l.price}</div>
                <div className="ptype" style={{ fontSize: 14 }}>{l.type}</div>
                <div className="addr"><i className="ti ti-map-pin"></i> {l.addr}</div>
                <div className="pviews"><span><i className="ti ti-eye"></i> {l.views.toLocaleString()}</span><span><i className="ti ti-heart"></i> {l.saves}</span></div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
