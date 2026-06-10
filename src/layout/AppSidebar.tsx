"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  BoxCubeIcon,
  ChevronDownIcon,
  DollarLineIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PlugInIcon,
  ShootingStarIcon,
  TableIcon,
  KeyIcon,
  DownloadIcon,
} from "../icons/index";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
};

function DatabaseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="12" cy="6" rx="8" ry="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 6v4c0 1.657 3.582 3 8 3s8-1.343 8-3V6" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 10v4c0 1.657 3.582 3 8 3s8-1.343 8-3v-4" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 14v4c0 1.657 3.582 3 8 3s8-1.343 8-3v-4" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

const navItems: NavItem[] = [
  { icon: <GridIcon />, name: "Overview", path: "/" },
  { icon: <ShootingStarIcon />, name: "Scout", path: "/scout" },
  { icon: <ListIcon />, name: "Lister", path: "/lister" },
  { icon: <TableIcon />, name: "Market", path: "/market" },
  { icon: <DatabaseIcon />, name: "Medusa", path: "/medusa" },
  { icon: <DollarLineIcon />, name: "Stripe", path: "/stripe" },
  { icon: <BoxCubeIcon />, name: "Legion", path: "/legion" },
  { icon: <KeyIcon />, name: "Activation Codes", path: "/activation-codes" },
  { icon: <DownloadIcon />, name: "Downloads", path: "/downloads" },
  { icon: <PlugInIcon />, name: "Settings", path: "/settings" },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex  ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/">
          {(isExpanded || isHovered || isMobileOpen) ? (
            <span className="text-lg font-bold tracking-tight text-teal-500">
              Sentinel Dashboard
            </span>
          ) : (
            <span className="text-xl font-bold text-teal-500">S</span>
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div>
            <h2
              className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
              }`}
            >
              {isExpanded || isHovered || isMobileOpen ? (
                "Command Center"
              ) : (
                <HorizontaLDots />
              )}
            </h2>
            <ul className="flex flex-col gap-2">
              {navItems.map((nav) => (
                <li key={nav.name}>
                  <Link
                    href={nav.path}
                    className={`menu-item group ${
                      isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                    }`}
                  >
                    <span
                      className={`${
                        isActive(nav.path)
                          ? "menu-item-icon-active"
                          : "menu-item-icon-inactive"
                      }`}
                    >
                      {nav.icon}
                    </span>
                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className="menu-item-text">{nav.name}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
