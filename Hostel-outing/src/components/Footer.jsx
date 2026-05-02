import React from 'react'

export const Footer = () => {
  return (
    <div>
        <footer className="footer sm:footer-horizontal footer-center bg-base-300 text-base-content p-4">
        <aside>
            <p>Copyright © {new Date().getFullYear()} - MITE HOSTEL outing permission.</p>
        </aside>
        </footer>
    </div>
  )
}
