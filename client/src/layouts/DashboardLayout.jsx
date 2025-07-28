"use client"

import { useState } from "react"
import { Outlet } from "react-router-dom"
import { DashboardSidebar } from "../components/dashboard/sidebar"
import { DashboardHeader } from "../components/dashboard/header"

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
    // Add a class to the body to prevent scrolling when sidebar is open
    if (!sidebarOpen) {
      document.body.classList.add('sidebar-open')
    } else {
      document.body.classList.remove('sidebar-open')
    }
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Cyber Background Elements */}
      <div className="fixed inset-0 bg-cyber-grid opacity-20 pointer-events-none"></div>
      <div className="fixed inset-0 gradient-cyber opacity-5 pointer-events-none"></div>

      {/* Enhanced Cyber Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-lg transition-cyber animate-fade-in"
          onClick={() => toggleSidebar()}
        />
      )}

      {/* Fixed Sidebar for Desktop */}
      <div className="hidden md:block fixed inset-y-0 left-0 z-50 w-80">
        <DashboardSidebar />
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-80 transform transition-cyber md:hidden ${
          sidebarOpen ? 'translate-x-0 glow-primary' : '-translate-x-full'
        }`}
      >
        <DashboardSidebar />
      </div>

      {/* Fixed Navbar */}
      <div className="fixed top-0 right-0 z-40 md:left-80 left-0 w-full md:w-auto">
        <DashboardHeader sidebarOpen={sidebarOpen} onSidebarToggle={toggleSidebar} />
      </div>

      {/* Main Content Area */}
      <div className="md:ml-80 pt-18">
        <main className="main-content-scroll scrollbar-thin p-4 md:p-6 lg:p-10 pr-2 md:pr-4 lg:pr-6">
          <div className="max-w-8xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
