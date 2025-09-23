import React from 'react';
import { Menu, Bell, User } from 'lucide-react';

export default function TopBar({
  title = 'Motohub',
  onToggle = () => {},
  notificationsCount = 0,
  onProfileClick = () => {},
  children = null
}) {
  return (
    <div className="customer-top-bar">
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

      <div className="top-bar-right">
        <div className="notifications" title="Notifications">
          <Bell size={20} />
          {typeof notificationsCount === 'number' && (
            <span className="notification-badge">{notificationsCount}</span>
          )}
        </div>

        <button
          className="profile-toggle"
          title="Profile"
          onClick={onProfileClick}
          aria-label="Open profile"
        >
          <User size={20} />
        </button>
      </div>
    </div>
  );
}