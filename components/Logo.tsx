import React from "react";

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

export default function Logo({ className = "h-14 w-auto", ...props }: LogoProps) {
  return (
    <img
      src="/logo.png"
      alt="Scribt Logo"
      className={className}
      {...props}
    />
  );
}
