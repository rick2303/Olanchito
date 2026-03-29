"use client";

import { DeviceFrameset } from "react-device-frameset";
import "react-device-frameset/styles/marvel-devices.min.css";

// Marvel "MacBook Pro" renders at 1118 × 720 px.
// Heights = 720 × scale:  0.34→245  0.45→324  0.58→418

type LaptopMockupProps = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
};

function cx(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function LaptopMockup({
  src,
  alt,
  className,
  imageClassName,
}: LaptopMockupProps) {
  return (
    <div
      className={cx(
        "relative mx-auto flex w-full max-w-[640px] justify-center",
        className
      )}
      aria-label="Mockup MacBook Pro"
    >
      <div className="h-[245px] sm:h-[324px] lg:h-[418px]">
        <div className="macbook-m4-black origin-top scale-[0.34] sm:scale-[0.45] lg:scale-[0.58]">
          <DeviceFrameset device="MacBook Pro">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className={cx(
                "h-full w-full object-cover object-top",
                imageClassName
              )}
              loading="eager"
              decoding="sync"
            />
          </DeviceFrameset>
        </div>
      </div>
    </div>
  );
}
