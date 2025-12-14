import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'

const NavItem = ({ to, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `px-3 py-2 rounded-xl ${isActive ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'}`
    }
  >
    {children}
  </NavLink>
)

export default function AppLayout() {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Matching Simulator</h1>
        <nav className="flex gap-2">
          <NavItem to="/">대시보드</NavItem>
          <NavItem to="/sim">시뮬레이터</NavItem>
        </nav>
      </header>
      <main className="mt-6">
        <Outlet />
      </main>
    </div>
  )
}
