import React from 'react';

export default function ApplicationLogo({ className = 'h-10 w-auto', variant = 'full', ...props }) {
    const src = variant === 'mark' ? '/images/vpsdeploy-mark.png' : '/images/vpsdeploy-logo.png';

    return (
        <img
            src={src}
            alt="VPSDeploy - Manage • Deploy • Scale"
            className={`object-contain select-none ${className}`}
            {...props}
        />
    );
}
