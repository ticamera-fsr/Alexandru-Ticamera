
import React from 'react';

const LogoIcon: React.FC = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="#00B859" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 7L12 12" stroke="#00B859" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22 7L12 12" stroke="#00B859" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 22V12" stroke="#00B859" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20 9L4 15" stroke="#00B859" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4 9L20 15" stroke="#00B859" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);


const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 md:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
            <LogoIcon />
            <span className="text-xl font-bold text-gray-800">
              Printify <span className="text-printify-green">AI Studio</span>
            </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
