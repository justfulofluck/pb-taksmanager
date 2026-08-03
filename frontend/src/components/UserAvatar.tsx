import React, { useState } from 'react';
import { TeamMember } from '../types';

interface UserAvatarProps {
  member?: TeamMember;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  member,
  size = 'md',
  className = '',
  showTooltip = true
}) => {
  const [imgError, setImgError] = useState(false);

  if (!member) return null;

  const sizeClasses = {
    xs: 'w-5 h-5 text-[9px]',
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-7 h-7 text-xs',
    lg: 'w-9 h-9 text-sm',
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;
  const initials = member.avatarChar || member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full shrink-0 font-bold overflow-hidden transition-transform duration-150 ${currentSize} ${className}`}
      title={showTooltip ? `${member.name} (${member.email})` : undefined}
    >
      {member.avatarUrl && !imgError ? (
        <img
          src={member.avatarUrl}
          alt={member.name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <span
          className={`w-full h-full flex items-center justify-center font-black text-white uppercase rounded-full ${member.color || 'bg-indigo-600'}`}
        >
          {initials}
        </span>
      )}
    </div>
  );
};

export default UserAvatar;
