"use client";

import React from "react";

export default function MedusaPage() {
  return (
    <div className="-m-4 md:-m-6 h-[calc(100vh-64px)]">
      <iframe
        src="http://136.118.148.167:9000/app"
        className="w-full h-full border-0"
        title="Medusa Admin"
        allow="same-origin"
      />
    </div>
  );
}
