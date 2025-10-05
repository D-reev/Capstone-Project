import React from 'react';
import { Menu, Bell, User } from 'lucide-react';
import logo from '../assets/images/logo.jpeg';
import '../css/TopBar.css';

export default function TopBar({
  title = 'Motohub',
  onToggle = () => {},
  notificationsCount = 0,
  onProfileClick = () => {},
  children = null
}) {
    return (
      <div className="customer-top-bar" style={{position: 'relative'}}>
        <div className="top-bar-left">
          <button
            className="sidebar-toggle"
            onClick={onToggle}
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
          <h1 className="brand-name">{title}</h1>
          {children}
        </div>

        <div style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          paddingRight: '0.5rem'
        }}>
          <div style={{
            width: '147px',
            height: '47px',
            background: `url(${logo}) center/contain no-repeat`,
            display: 'block'
          }} />
        </div>
      </div>
    );
}