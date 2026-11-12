DCIM – Data Center Infrastructure Management

A modern Data Center Infrastructure Management (DCIM) platform designed to monitor, manage, and optimize data center resources including assets, power, cooling, space, and network infrastructure.

This project provides a centralized dashboard for managing data center operations with real-time monitoring, asset lifecycle tracking, and infrastructure visualization.

Overview

DCIM (Data Center Infrastructure Management) is used to integrate IT equipment management with facility infrastructure.

This platform helps organizations:

Track data center assets

Monitor power and cooling systems

Visualize rack layouts

Manage device health and lifecycle

Optimize capacity and energy usage

Key Features
Asset Management

Track servers, storage, network devices

Asset lifecycle management

Asset location tracking (Room → Rack → Unit)

Infrastructure Monitoring

Power usage monitoring

Cooling system monitoring

Environmental sensors integration

Rack & Floor Visualization

Data center floor layout

Rack-level visualization

Device placement mapping

Device Management

Device onboarding and registration

Device health monitoring

Device connectivity status

Alerts & Notifications

Threshold-based alerts

Device failure notifications

Infrastructure warnings

Reporting & Analytics

Power consumption reports

Asset utilization analytics

Infrastructure performance insights

System Architecture
Frontend
   │
   ▼
React Dashboard UI
   │
   ▼
Backend API Layer
   │
   ▼
Database (Infrastructure & Asset Data)
Technology Stack

Frontend

React.js

JavaScript

HTML5 / CSS3

Bootstrap / Material UI

Backend

.NET API (Optional Integration)

Database

SQL Server / PostgreSQL

Visualization

Three.js (for rack simulation)

Charts / Dashboards

Version Control

Git

GitHub

Static data edition

This build runs completely on static data — there is no backend, no API call and no .env file.
Every screen that used to call an API now gets the same kind of response from the static data layer in src/staticData:

src/staticData/seed — the static records (area, companies, devices, racks, tickets, …)
src/staticData/services — answers each screen's requests from those records, in the browser
config.js — the data clients the screens import (axiosInstance, axiosdevice, axiosTicket), all wired to the static data layer

Add / edit / delete works on screen and is kept in memory until the page is reloaded.

Run it

npm install
npm run dev

Login: admin / admin
