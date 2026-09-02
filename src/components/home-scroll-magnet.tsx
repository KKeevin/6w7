"use client";

import { useEffect } from "react";
import { attachHomeScrollMagnet } from "@/lib/home-start-scroll";

/** 首頁手機捲動磁吸：區塊頂對 header、底對 footer */
export function HomeScrollMagnet() {
  useEffect(() => attachHomeScrollMagnet(), []);
  return null;
}
