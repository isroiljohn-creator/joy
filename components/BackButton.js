"use client";
import { useRouter } from "next/navigation";

export default function BackButton({ fallback = "/listings", className = "mdbtn", children }) {
  const router = useRouter();
  
  const handleClick = (e) => {
    e.preventDefault();
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <a href={fallback} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
