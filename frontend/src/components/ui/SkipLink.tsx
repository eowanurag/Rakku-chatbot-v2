import React from "react";

export const SkipLink: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-blue-600 focus:text-white focus:p-3 focus:z-50 focus:rounded-lg"
    >
      Skip to main content
    </a>
  );
};
export default SkipLink;
