# SnapCos: Premium Costume Rental SaaS Platform

## Overview
SnapCos (formerly CostumeStay) is a full-stack, multi-platform costume rental application that operates on a flat-fee subscription SaaS model. It connects costume vendors with renters through a unified, premium, and minimalist experience across web and mobile platforms.

## Design Philosophy
The platform embraces an editorial, utilitarian minimalist design system:
- **Color Palette:** Warm monochrome.
- **Typography:** Refined hierarchies using *Newsreader* and *DM Sans*.
- **UI Elements:** Crisp 1px borders, clean layouts, avoiding heavy shadows or cluttered aesthetics.
- **Focus:** High-end, seamless user journeys with strict visual consistency between the mobile app and the web frontend.

## Platform Architecture
SnapCos is built using a modern monorepo architecture, comprising three main pillars:

1. **Backend (Express / Node.js):** 
   - A robust RESTful API built with Express and TypeScript.
   - Database management using Sequelize ORM and MySQL.
   - Code-first, type-safe API documentation powered by Zod and OpenAPI (Swagger).
   - Handles subscription lifecycle management, role-based access control (Admin, Vendor, Customer), and multi-vendor logic.

2. **Web Frontend (Next.js):**
   - A responsive web platform utilizing the Next.js App Router and Tailwind CSS.
   - Features role-based navigation and specialized dashboards for managing rentals and subscriptions.

3. **Mobile App (React Native / Expo):**
   - A high-performance mobile application providing feature parity with the web platform.
   - Optimized for smooth font loading, intuitive tab navigation, and minimalist UI components.

## Core Features
- **SaaS Subscription Model:** Vendors access the platform via flat-fee subscriptions. The platform handles subscription lifecycle management including email and push notifications.
- **Multi-Vendor Capabilities:** Seamless costume listing, inventory management, and reservation handling for multiple independent vendors.
- **Role-Based Workflows:** Distinct, intuitive navigation paths and features tailored for Admins, Vendors, and Customers.
- **API-First Documentation:** Interactive Swagger UI generated automatically from backend Zod schemas, streamlining frontend and mobile integration.

## Recent Evolution
SnapCos recently evolved from a traditional multi-vendor marketplace into a specialized SaaS platform. This strategic pivot included:
- A global rebranding from "CostumeStay" to "SnapCos".
- A comprehensive overhaul of user flows and role-based navigation.
- The enforcement of subscription-based API access for vendors.
- A complete visual redesign enforcing a high-end, editorial minimalist aesthetic across both web and mobile frontends.
